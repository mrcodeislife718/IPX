import { sha256, stableJson } from './security.js';

export const MATCH_THRESHOLDS = Object.freeze({
  alert: 0.62,
  priority: 0.78,
  critical: 0.9
});

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function scorePotentialMisuse({ semantic = 0, visual = 0, code = 0, mark = 0, provenance = 0, marketOverlap = 0, sourceReliability = 0.5 }) {
  const similarity = Math.max(clamp01(semantic), clamp01(visual), clamp01(code), clamp01(mark));
  const provenanceScore = clamp01(provenance);
  const overlap = clamp01(marketOverlap);
  const source = clamp01(sourceReliability);

  const confidence = clamp01(similarity * 0.48 + provenanceScore * 0.2 + overlap * 0.2 + source * 0.12);
  const legalRisk = clamp01(similarity * 0.4 + overlap * 0.35 + provenanceScore * 0.15 + source * 0.1);
  const severity = confidence >= MATCH_THRESHOLDS.critical ? 'critical' : confidence >= MATCH_THRESHOLDS.priority ? 'priority' : confidence >= MATCH_THRESHOLDS.alert ? 'alert' : 'observe';

  return { similarity_score: similarity, provenance_score: provenanceScore, legal_risk_score: legalRisk, confidence_score: confidence, severity };
}

export function normalizeObservation(input) {
  const observedAt = input.observed_at ? new Date(input.observed_at) : new Date();
  if (Number.isNaN(observedAt.getTime())) throw new Error('Invalid observed_at');
  const normalized = {
    source_kind: String(input.source_kind),
    source_url: String(input.source_url),
    title: input.title ? String(input.title).slice(0, 1000) : null,
    excerpt: input.excerpt ? String(input.excerpt).slice(0, 8000) : null,
    observed_at: observedAt.toISOString(),
    source_payload_hash: sha256(stableJson(input.source_payload ?? {}))
  };
  normalized.content_hash = sha256(stableJson(normalized));
  return normalized;
}

export function shouldAlert(score) {
  return score.confidence_score >= MATCH_THRESHOLDS.alert;
}

export function buildEvidenceSnapshot({ observation, score, assetRecordHash, discoveredAt = new Date() }) {
  const payload = {
    type: 'ipx-watchdog-observation',
    discovered_at: discoveredAt.toISOString(),
    asset_record_hash: assetRecordHash,
    observation,
    score,
    disclaimer: 'Automated detection of possible IP misuse. Not a legal determination of infringement.'
  };
  return { payload, evidence_hash: sha256(stableJson(payload)) };
}
