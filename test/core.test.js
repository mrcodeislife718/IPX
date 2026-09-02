import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTransition, recordHash, eventHash, certificateId } from '../src/core.js';
import { buildParityQuote } from '../src/pricing.js';
import { scorePotentialMisuse, normalizeObservation, shouldAlert, buildEvidenceSnapshot } from '../src/watchdog.js';

test('lifecycle rejects invalid terminal transition', () => {
  assert.throws(() => assertTransition('revoked','maintained'), /Invalid lifecycle transition/);
});

test('canonical record hashing is deterministic', () => {
  const a = recordHash({ asset_type:'patent', title:'A', parties:[{name:'B'},{name:'A'}] });
  const b = recordHash({ asset_type:'patent', title:'A', parties:[{name:'A'},{name:'B'}] });
  assert.equal(a,b);
});

test('event chain hashes include prior event', () => {
  const base = { recordId:'r', kind:'created', payload:{}, actorUserId:'u', authority:'ipx-private', createdAt:'2026-09-02T00:00:00.000Z' };
  const first = eventHash({ ...base, previousEventHash:null });
  const second = eventHash({ ...base, previousEventHash:first });
  assert.notEqual(first, second);
  assert.match(certificateId('12345678-1234-1234-1234-123456789abc', second), /^IPX-/);
});

test('price parity uses reference fee as IPX base price without treating it as government remittance', () => {
  const now = new Date('2026-09-02T00:00:00Z');
  const quote = buildParityQuote({
    referenceFee:{ service_code:'tm-base', entity_tier:'not_applicable', amount_cents:35000, currency:'USD', authority:'USPTO', source_url:'https://example.invalid/reference', source_revision:'2026-08-14', effective_from:'2026-08-14', verified_at:'2026-09-01T00:00:00Z' },
    organizationId:'o', userId:'u', serviceCode:'tm-base', entityTier:'not_applicable', includedValue:['provenance','vault'], optionalAddOns:[], now
  });
  assert.equal(quote.base_fee_cents,35000);
  assert.equal(quote.total_cents,35000);
  assert.equal(quote.government_fee_included,false);
  assert.equal(quote.government_filing_included,false);
});

test('Watchdog produces bounded score and sealed evidence snapshot', () => {
  const score = scorePotentialMisuse({ semantic:.92, provenance:.9, marketOverlap:.8, sourceReliability:.9 });
  assert.equal(shouldAlert(score), true);
  assert.ok(score.confidence_score <= 1 && score.confidence_score >= 0);
  const observation = normalizeObservation({ source_kind:'web', source_url:'https://example.com', title:'Possible copy', source_payload:{x:1}, observed_at:'2026-09-02T00:00:00Z' });
  const snap = buildEvidenceSnapshot({ observation, score, assetRecordHash:'abc', discoveredAt:new Date('2026-09-02T00:00:01Z') });
  assert.equal(snap.evidence_hash.length,64);
});
