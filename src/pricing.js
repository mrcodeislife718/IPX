import { sha256, stableJson } from './security.js';

export const USPTO_FEE_SOURCE = 'https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule';
export const FEE_FRESHNESS_DAYS = 45;

export function assertReferenceFeeFresh(row, now = new Date()) {
  if (!row?.verified_at || !row?.source_url || !row?.source_revision) throw new Error('Reference fee entry lacks source provenance');
  const ageMs = now.getTime() - new Date(row.verified_at).getTime();
  if (!Number.isFinite(ageMs) || ageMs > FEE_FRESHNESS_DAYS * 86400000) throw Object.assign(new Error('Reference fee catalog requires reverification before quoting'), { statusCode: 503 });
  return true;
}

export function buildParityQuote({ referenceFee, organizationId, userId, serviceCode, entityTier, includedValue = [], optionalAddOns = [], now = new Date() }) {
  assertReferenceFeeFresh(referenceFee, now);
  if (referenceFee.service_code !== serviceCode) throw new Error('Reference fee service mismatch');
  if (referenceFee.entity_tier !== entityTier) throw new Error('Reference fee entity-tier mismatch');
  const baseFeeCents = Number(referenceFee.amount_cents);
  if (!Number.isSafeInteger(baseFeeCents) || baseFeeCents < 0) throw new Error('Invalid reference fee');
  const addOns = optionalAddOns.map((item) => ({ code:String(item.code), description:String(item.description), amount_cents:Number(item.amount_cents) }));
  for (const item of addOns) if (!Number.isSafeInteger(item.amount_cents) || item.amount_cents < 0) throw new Error('Invalid add-on amount');
  const addOnCents = addOns.reduce((sum,item)=>sum+item.amount_cents,0);
  const expiresAt = new Date(now.getTime()+24*60*60*1000);
  const quoteCore = { organization_id:organizationId, user_id:userId, service_code:serviceCode, entity_tier:entityTier, pricing_model:'ipx-private-service-parity', base_fee_cents:baseFeeCents, optional_add_on_cents:addOnCents, total_cents:baseFeeCents+addOnCents, currency:referenceFee.currency||'USD', reference_authority:referenceFee.authority, reference_source_url:referenceFee.source_url, reference_source_revision:referenceFee.source_revision, reference_effective_from:referenceFee.effective_from, included_value:includedValue, optional_add_ons:addOns, government_fee_included:false, government_filing_included:false, expires_at:expiresAt.toISOString() };
  return { ...quoteCore, quote_hash:sha256(stableJson(quoteCore)) };
}

export const PRICING_BASES = Object.freeze(new Set(['reference_parity','fixed','recurring','usage','seat','storage','transaction','enterprise_quote','custom_quote']));

export function resolveCatalogPrice({ service, price, referenceFee=null, quantity=1 }) {
  if (!service?.active) throw new Error('Service is not active');
  if (!PRICING_BASES.has(service.pricing_basis)) throw new Error('Unsupported pricing basis');
  if (service.pricing_basis === 'reference_parity') {
    assertReferenceFeeFresh(referenceFee);
    if (service.reference_authority !== referenceFee.authority || service.reference_service_code !== referenceFee.service_code) throw new Error('Reference mapping mismatch');
    return { amount_cents:Number(referenceFee.amount_cents)*quantity, currency:referenceFee.currency||'USD', pricing_basis:'reference_parity', reference_fee_id:referenceFee.id };
  }
  if (['enterprise_quote','custom_quote'].includes(service.pricing_basis) && price?.amount_cents == null) return { requires_quote:true, pricing_basis:service.pricing_basis };
  const amount=Number(price?.amount_cents);
  if (!Number.isSafeInteger(amount) || amount<0) throw new Error('Configured service price required');
  return { amount_cents:amount*quantity, currency:price.currency||'USD', pricing_basis:service.pricing_basis, service_price_id:price.id };
}
