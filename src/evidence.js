import { sha256, stableJson } from './security.js';

export function buildEvidenceStoragePath({ organizationId, recordId, evidenceId, filename }) {
  const safeName = String(filename || 'evidence.bin').replace(/[^A-Za-z0-9._-]/g,'_').slice(0,180);
  return `${organizationId}/${recordId}/${evidenceId}/${safeName}`;
}

export function evidenceManifest({ recordId, submittedBy, contentHash, mediaType, byteSize, storagePath, timestampProvider = null, timestampReceipt = null, metadata = {}, createdAt = new Date() }) {
  if (!/^[0-9a-f]{64}$/i.test(String(contentHash))) throw new Error('content_hash must be SHA-256 hex');
  if (!Number.isSafeInteger(Number(byteSize)) || Number(byteSize) < 0) throw new Error('Invalid byte_size');
  const manifest = {
    version:1,
    record_id:recordId,
    submitted_by:submittedBy,
    content_hash:String(contentHash).toLowerCase(),
    media_type:String(mediaType),
    byte_size:Number(byteSize),
    storage_path:storagePath,
    timestamp_provider:timestampProvider,
    timestamp_receipt:timestampReceipt,
    metadata,
    created_at:createdAt.toISOString()
  };
  return { ...manifest, manifest_hash:sha256(stableJson(manifest)) };
}

export function validateUploadMetadata({ filename, mediaType, byteSize }) {
  if (typeof filename !== 'string' || filename.length < 1 || filename.length > 255) throw new Error('Invalid filename');
  if (typeof mediaType !== 'string' || mediaType.length < 3 || mediaType.length > 200) throw new Error('Invalid media type');
  const size = Number(byteSize);
  if (!Number.isSafeInteger(size) || size < 1 || size > 100 * 1024 * 1024) throw new Error('Evidence file must be between 1 byte and 100 MiB');
  return { filename, mediaType, byteSize:size };
}
