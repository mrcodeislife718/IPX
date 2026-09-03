import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidenceStoragePath, evidenceManifest, validateUploadMetadata } from '../src/evidence.js';

test('evidence storage paths are tenant and record scoped', () => {
  const path = buildEvidenceStoragePath({ organizationId:'org-1', recordId:'rec-1', evidenceId:'ev-1', filename:'secret plan?.pdf' });
  assert.equal(path, 'org-1/rec-1/ev-1/secret_plan_.pdf');
});

test('upload metadata enforces evidence size bounds', () => {
  assert.deepEqual(validateUploadMetadata({ filename:'a.pdf', mediaType:'application/pdf', byteSize:10 }), { filename:'a.pdf', mediaType:'application/pdf', byteSize:10 });
  assert.throws(() => validateUploadMetadata({ filename:'a.pdf', mediaType:'application/pdf', byteSize:0 }));
  assert.throws(() => validateUploadMetadata({ filename:'a.pdf', mediaType:'application/pdf', byteSize:100 * 1024 * 1024 + 1 }));
});

test('evidence manifests are deterministic for equivalent inputs', () => {
  const createdAt = new Date('2026-09-02T20:00:00.000Z');
  const input = { recordId:'rec', submittedBy:'user', contentHash:'a'.repeat(64), mediaType:'application/pdf', byteSize:42, storagePath:'org/rec/ev/a.pdf', metadata:{b:2,a:1}, createdAt };
  const first = evidenceManifest(input);
  const second = evidenceManifest(input);
  assert.equal(first.manifest_hash, second.manifest_hash);
  assert.equal(first.content_hash, 'a'.repeat(64));
});
