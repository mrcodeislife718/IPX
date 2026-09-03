import { buildParityQuote, resolveCatalogPrice } from './pricing.js';
import { buildInvoice, invoiceNumber, paymentIntentSpec } from './billing.js';

export async function loadCurrentService(admin, serviceCode, today=new Date().toISOString().slice(0,10)) {
  const {data,error}=await admin.from('service_catalog').select('*').eq('service_code',serviceCode).eq('active',true).lte('effective_from',today).or(`effective_to.is.null,effective_to.gte.${today}`).order('version',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error; if(!data)throw Object.assign(new Error('IPX service unavailable'),{statusCode:404}); return data;
}

export function resolveRecurringOffering({service,price}) {
  if (!service?.active) throw Object.assign(new Error('IPX service unavailable'), { statusCode: 404 });
  if (service.pricing_basis !== 'recurring') throw Object.assign(new Error('Service is not recurring'), { statusCode: 409 });
  if (!['month','year'].includes(service.recurring_interval)) throw Object.assign(new Error('Recurring interval is not configured'), { statusCode: 503 });
  const amount = Number(price?.amount_cents);
  if (!Number.isSafeInteger(amount) || amount < 0) throw Object.assign(new Error('Recurring service price is not configured'), { statusCode: 503 });
  const maxAssetsRaw = price?.metadata?.max_assets ?? service?.commercial_rules?.max_assets ?? null;
  const scanIntervalRaw = price?.metadata?.scan_interval_minutes ?? service?.commercial_rules?.scan_interval_minutes ?? null;
  const maxAssets = maxAssetsRaw == null ? null : Number(maxAssetsRaw);
  const scanIntervalMinutes = scanIntervalRaw == null ? null : Number(scanIntervalRaw);
  if (maxAssets != null && (!Number.isSafeInteger(maxAssets) || maxAssets < 1)) throw Object.assign(new Error('Recurring plan max_assets is invalid'), { statusCode: 503 });
  if (scanIntervalMinutes != null && (!Number.isSafeInteger(scanIntervalMinutes) || scanIntervalMinutes < 1)) throw Object.assign(new Error('Recurring plan scan_interval_minutes is invalid'), { statusCode: 503 });
  return {
    service_catalog_id: service.id,
    service_price_id: price.id,
    service_code: service.service_code,
    plan_key: price.entity_tier || 'not_applicable',
    display_name: price?.metadata?.display_name || service.name,
    amount_cents: amount,
    currency: (price.currency || 'USD').toUpperCase(),
    recurring_interval: service.recurring_interval,
    max_assets: maxAssets,
    scan_interval_minutes: scanIntervalMinutes,
    commercial_terms: {
      ...(service.commercial_rules || {}),
      ...(price.metadata || {}),
      service_price_id: price.id,
      pricing_basis: service.pricing_basis,
      recurring_interval: service.recurring_interval
    }
  };
}

export async function loadRecurringOffering(admin, serviceCode, planKey='not_applicable', today=new Date().toISOString().slice(0,10)) {
  const service = await loadCurrentService(admin, serviceCode, today);
  const {data:price,error}=await admin.from('service_prices').select('*').eq('service_catalog_id',service.id).eq('entity_tier',planKey).lte('effective_from',today).or(`effective_to.is.null,effective_to.gte.${today}`).order('effective_from',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  if(!price)throw Object.assign(new Error('Recurring service plan is not configured'),{statusCode:404});
  return resolveRecurringOffering({service,price});
}

export async function createCatalogQuote({admin,organizationId,userId,serviceCode,entityTier='not_applicable',quantity=1,includedValue=[],optionalAddOns=[]}) {
  const service=await loadCurrentService(admin,serviceCode);
  if(service.pricing_basis==='reference_parity'){
    const today=new Date().toISOString().slice(0,10);
    const {data:fee,error}=await admin.from('fee_catalog').select('*').eq('authority',service.reference_authority).eq('service_code',service.reference_service_code).eq('entity_tier',entityTier).lte('effective_from',today).or(`effective_to.is.null,effective_to.gte.${today}`).order('effective_from',{ascending:false}).limit(1).maybeSingle();
    if(error)throw error; if(!fee)throw Object.assign(new Error('Current reference fee unavailable'),{statusCode:503});
    const built=buildParityQuote({referenceFee:fee,organizationId,userId,serviceCode:fee.service_code,entityTier,includedValue,optionalAddOns});
    return {...built,ipx_service_code:serviceCode,service_catalog_id:service.id,quantity};
  }
  const today=new Date().toISOString().slice(0,10);
  const {data:price,error}=await admin.from('service_prices').select('*').eq('service_catalog_id',service.id).eq('entity_tier',entityTier).lte('effective_from',today).or(`effective_to.is.null,effective_to.gte.${today}`).order('effective_from',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  const resolved=resolveCatalogPrice({service,price,quantity});
  return {...resolved,organization_id:organizationId,user_id:userId,ipx_service_code:serviceCode,service_catalog_id:service.id,entity_tier:entityTier,included_value:includedValue,optional_add_ons:optionalAddOns};
}

export async function createIPXInvoice({admin,organizationId,userId,billingCustomerId=null,quoteId=null,currency='USD',lines,taxCents=0,creditCents=0,dueAt=null,metadata={}}){
  const {data:seq,error:seqError}=await admin.rpc('next_ipx_invoice_number'); if(seqError)throw seqError;
  const number=invoiceNumber(Number(seq.sequence),Number(seq.year));
  const built=buildInvoice({number,organizationId,userId,currency,lines,taxCents,creditCents,dueAt,metadata});
  const {data:invoice,error}=await admin.from('invoices').insert({invoice_number:number,organization_id:organizationId,user_id:userId,billing_customer_id:billingCustomerId,quote_id:quoteId,status:'open',currency:built.currency,subtotal_cents:built.subtotal_cents,tax_cents:built.tax_cents,credit_cents:built.credit_cents,total_cents:built.total_cents,invoice_hash:built.invoice_hash,issued_at:new Date().toISOString(),due_at:dueAt,metadata}).select().single();
  if(error)throw error;
  const {error:lineError}=await admin.from('invoice_lines').insert(built.lines.map(line=>({invoice_id:invoice.id,service_code:line.code,description:line.description,quantity:line.quantity,unit_amount_cents:line.unit_amount_cents,amount_cents:line.amount_cents})));
  if(lineError)throw lineError; return {...invoice,lines:built.lines};
}

export async function createPaymentIntent({stripe,admin,invoice,customerId=null}){
  const spec=paymentIntentSpec({invoice}); if(customerId)spec.customer=customerId;
  const intent=await stripe.paymentIntents.create(spec,{idempotencyKey:`ipx-invoice-${invoice.invoice_hash}`});
  const {error}=await admin.from('payment_transactions').insert({organization_id:invoice.organization_id,invoice_id:invoice.id,provider:'stripe',provider_object_type:'payment_intent',provider_object_id:intent.id,kind:'authorization',status:intent.status,amount_cents:intent.amount,currency:intent.currency.toUpperCase(),metadata:{ipx_invoice_number:invoice.invoice_number}});
  if(error&&error.code!=='23505')throw error;
  return {payment_intent_id:intent.id,client_secret:intent.client_secret,status:intent.status};
}

export async function claimWebhook(admin,event){
  const {error}=await admin.from('webhook_events').insert({provider:'stripe',event_id:event.id,event_type:event.type,status:'processing'});
  if(!error)return {claimed:true};
  if(error.code!=='23505')throw error;
  const {data:existing,error:readError}=await admin.from('webhook_events').select('*').eq('provider','stripe').eq('event_id',event.id).single();
  if(readError)throw readError; return {claimed:false,status:existing.status};
}

export async function finishWebhook(admin,eventId,error=null){
  const now=new Date().toISOString();
  const {error:updateError}=await admin.from('webhook_events').update({status:error?'failed':'processed',processed_at:error?null:now,last_error:error?String(error.message||error).slice(0,2000):null}).eq('provider','stripe').eq('event_id',eventId);
  if(updateError)throw updateError;
}

export async function recordPaymentSucceeded({admin,intent}){
  const invoiceNumberValue=intent.metadata?.ipx_invoice_number; if(!invoiceNumberValue)return;
  const {data:invoice,error}=await admin.from('invoices').select('*').eq('invoice_number',invoiceNumberValue).single(); if(error)throw error;
  const now=new Date().toISOString();
  const {error:txError}=await admin.from('payment_transactions').upsert({organization_id:invoice.organization_id,invoice_id:invoice.id,provider:'stripe',provider_object_type:'payment_intent',provider_object_id:intent.id,kind:'payment',status:'succeeded',amount_cents:intent.amount_received||intent.amount,currency:intent.currency.toUpperCase(),occurred_at:now,metadata:{}},{onConflict:'provider,provider_object_type,provider_object_id,kind'}); if(txError)throw txError;
  const {error:invoiceError}=await admin.from('invoices').update({status:'paid',paid_at:now,updated_at:now}).eq('id',invoice.id).neq('status','paid'); if(invoiceError)throw invoiceError;
  const {data:lines,error:lineError}=await admin.from('invoice_lines').select('*').eq('invoice_id',invoice.id); if(lineError)throw lineError;
  for(const line of lines||[]){await admin.from('revenue_events').insert({organization_id:invoice.organization_id,invoice_id:invoice.id,service_code:line.service_code,event_kind:'collected',gross_amount_cents:line.amount_cents,currency:invoice.currency,occurred_at:now,metadata:{processor:'stripe',payment_intent_id:intent.id}});}
}
