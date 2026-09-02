import { sha256, stableJson } from './security.js';

export const ANCHOR_TYPES = new Set(['rfc3161_timestamp','bitcoin','ethereum','public_transparency_log','ipfs','other']);

export function buildAnchorPayload({ recordHash, certificateHash = null, manifestHash = null, previousAnchorHash = null, createdAt = new Date() }) {
  if (!recordHash) throw new Error('recordHash is required');
  const payload = {
    version:1,
    record_hash:recordHash,
    certificate_hash:certificateHash,
    manifest_hash:manifestHash,
    previous_anchor_hash:previousAnchorHash,
    created_at:createdAt.toISOString()
  };
  return { payload, anchor_payload_hash:sha256(stableJson(payload)) };
}

export function normalizeAnchorReceipt(input) {
  if (!ANCHOR_TYPES.has(input.anchor_type)) throw new Error('Unsupported anchor type');
  if (!input.provider || !input.receipt) throw new Error('Anchor provider and receipt are required');
  const normalized = {
    anchor_type:input.anchor_type,
    provider:String(input.provider),
    network:input.network ? String(input.network) : null,
    transaction_or_receipt_id:String(input.transaction_or_receipt_id || ''),
    anchored_hash:String(input.anchored_hash || '').toLowerCase(),
    observed_at:new Date(input.observed_at || Date.now()).toISOString(),
    receipt:input.receipt
  };
  if (!/^[0-9a-f]{64}$/i.test(normalized.anchored_hash)) throw new Error('anchored_hash must be SHA-256 hex');
  return { ...normalized, receipt_hash:sha256(stableJson(normalized)) };
}

export function evaluateAnchorQuorum(receipts, requiredIndependentProviders = 2) {
  const providers = new Set(receipts.map((r) => `${r.anchor_type}:${r.provider}`));
  const valid = receipts.every((r) => r.receipt_hash && r.anchored_hash);
  return {
    valid,
    independent_provider_count:providers.size,
    quorum_met:valid && providers.size >= requiredIndependentProviders
  };
}
