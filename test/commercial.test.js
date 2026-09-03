import test from 'node:test';
import assert from 'node:assert/strict';
import { invoiceNumber, buildInvoice, paymentIntentSpec } from '../src/billing.js';
import { workflowFor, deadlineState } from '../src/workflows.js';
import { combinedSearchScore, dedupeSearchResults } from '../src/search-engine.js';

test('IPX owns invoice identity and Stripe receives processor spec',()=>{
  assert.equal(invoiceNumber(42,2026),'IPX-2026-00000042');
  const invoice=buildInvoice({ number:'IPX-2026-00000042', organizationId:'org', userId:'user', lines:[{code:'ipx-patent-utility',description:'IPX Utility Protection Service',quantity:1,unit_amount_cents:35000}] });
  assert.equal(invoice.total_cents,35000);
  const spec=paymentIntentSpec({invoice});
  assert.equal(spec.amount,35000);
  assert.equal(spec.metadata.ipx_invoice_number,'IPX-2026-00000042');
});

test('office workflows are deterministic and Watchdog is capability not invented tier',()=>{
  assert.ok(workflowFor('ipx-patent-utility').length>=8);
  assert.deepEqual(workflowFor('ipx-watchdog').map(x=>x.task_code).slice(0,3),['enroll','fingerprint','source-plan']);
});

test('deadline urgency is deterministic',()=>{
  const state=deadlineState('2026-09-03T00:00:00Z',new Date('2026-09-02T12:00:00Z'));
  assert.equal(state.urgency,'critical');
});

test('search ranking is bounded, explainable and family-deduplicated',()=>{
  const ranked=combinedSearchScore({lexical:1,semantic:.8,citation:.5,jurisdiction:1,recency:.2});
  assert.ok(ranked.score>=0 && ranked.score<=1);
  assert.match(ranked.explanation,/not a legal conclusion/);
  assert.equal(dedupeSearchResults([{family_id:'A',source_identifier:'1'},{family_id:'A',source_identifier:'2'},{family_id:'B',source_identifier:'3'}]).length,2);
});
