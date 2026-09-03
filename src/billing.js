import { sha256, stableJson } from './security.js';

export const PAYMENT_PROCESSOR = 'stripe';

export function invoiceNumber(sequence, year = new Date().getUTCFullYear()) {
  const n = Number(sequence);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error('Invalid invoice sequence');
  return `IPX-${year}-${String(n).padStart(8,'0')}`;
}

export function buildInvoice({ number, organizationId, userId, currency='USD', lines, taxCents=0, creditCents=0, dueAt=null, metadata={} }) {
  if (!Array.isArray(lines) || !lines.length) throw new Error('Invoice requires line items');
  const normalized = lines.map((line) => {
    const quantity = Number(line.quantity ?? 1);
    const unit = Number(line.unit_amount_cents);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(unit) || unit < 0) throw new Error('Invalid invoice line');
    return { code:String(line.code), description:String(line.description), quantity, unit_amount_cents:unit, amount_cents:quantity*unit };
  });
  const subtotal = normalized.reduce((sum,x)=>sum+x.amount_cents,0);
  const tax = Number(taxCents); const credit = Number(creditCents);
  if (![tax,credit].every(Number.isSafeInteger) || tax < 0 || credit < 0) throw new Error('Invalid invoice adjustment');
  const total = Math.max(0, subtotal + tax - credit);
  const core = { invoice_number:number, organization_id:organizationId, user_id:userId, currency, lines:normalized, subtotal_cents:subtotal, tax_cents:tax, credit_cents:credit, total_cents:total, due_at:dueAt, metadata };
  return { ...core, invoice_hash:sha256(stableJson(core)) };
}

export function paymentIntentSpec({ invoice, customerId=null, paymentMethodTypes=null }) {
  const spec = {
    amount: invoice.total_cents,
    currency: invoice.currency.toLowerCase(),
    customer: customerId || undefined,
    automatic_payment_methods: paymentMethodTypes ? undefined : { enabled:true },
    payment_method_types: paymentMethodTypes || undefined,
    metadata: { ipx_invoice_number:invoice.invoice_number, ipx_invoice_hash:invoice.invoice_hash }
  };
  return Object.fromEntries(Object.entries(spec).filter(([,v])=>v!==undefined));
}

export function processorReference({ provider=PAYMENT_PROCESSOR, objectType, objectId }) {
  if (!objectType || !objectId) throw new Error('Processor reference requires object type and id');
  return { provider, object_type:String(objectType), object_id:String(objectId) };
}
