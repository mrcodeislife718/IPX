import { sha256, stableJson } from './security.js';

export const ASSET_TYPES = new Set(['patent','design','trademark','copyright','trade_secret','research','software','other']);
export const EVENT_TYPES = new Set(['created','evidence_added','ownership_asserted','ownership_changed','reviewed','filed','status_changed','office_action','response','amended','certificate_issued','verified','challenged','revoked','renewed','licensed','transferred','commercialized']);

const transitions = new Map([
  ['draft', new Set(['evidence_locked','under_review','filed','abandoned'])],
  ['evidence_locked', new Set(['under_review','filed','abandoned'])],
  ['under_review', new Set(['filed','pending','abandoned'])],
  ['filed', new Set(['pending','issued','registered','abandoned'])],
  ['pending', new Set(['issued','registered','challenged','abandoned'])],
  ['issued', new Set(['maintained','challenged','revoked','expired','transferred'])],
  ['registered', new Set(['maintained','challenged','revoked','expired','transferred'])],
  ['maintained', new Set(['challenged','revoked','expired','transferred'])],
  ['challenged', new Set(['maintained','revoked','expired'])],
  ['transferred', new Set(['maintained','challenged','revoked','expired'])],
  ['revoked', new Set([])],
  ['expired', new Set([])],
  ['abandoned', new Set([])]
]);

export function assertTransition(from, to) {
  if (from === to) return true;
  if (!transitions.get(from)?.has(to)) throw Object.assign(new Error(`Invalid lifecycle transition ${from} -> ${to}`), { statusCode: 409 });
  return true;
}

export function canonicalRecord(input) {
  return {
    asset_type: input.asset_type,
    title: input.title,
    description: input.description ?? null,
    jurisdiction: input.jurisdiction ?? 'US',
    parties: Array.isArray(input.parties) ? [...input.parties].sort((a,b) => stableJson(a).localeCompare(stableJson(b))) : []
  };
}

export function recordHash(input) {
  return sha256(stableJson(canonicalRecord(input)));
}

export function eventHash({ recordId, kind, payload, previousEventHash, actorUserId, authority, createdAt }) {
  return sha256(stableJson({
    recordId,
    kind,
    payload: payload ?? {},
    previousEventHash: previousEventHash ?? null,
    actorUserId: actorUserId ?? null,
    authority: authority ?? 'ipx-private',
    createdAt
  }));
}

export function certificateId(recordId, certificateHash) {
  return `IPX-${recordId.replaceAll('-','').slice(0,12).toUpperCase()}-${certificateHash.slice(0,12).toUpperCase()}`;
}

export function verificationProjection({ certificate, record }) {
  return {
    cert_id: certificate.cert_id,
    status: certificate.status,
    issued_at: certificate.issued_at,
    policy_version: certificate.policy_version,
    asset_type: record.asset_type,
    title: record.title,
    jurisdiction: record.jurisdiction,
    lifecycle_status: record.status,
    canonical_hash: record.canonical_hash,
    record_version: record.record_version
  };
}
