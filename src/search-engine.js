import { sha256, stableJson } from './security.js';

function bounded(value) { const n=Number(value??0); return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0; }

export function combinedSearchScore({ lexical=0, semantic=0, citation=0, jurisdiction=0, recency=0 }, weights={ lexical:.24, semantic:.34, citation:.18, jurisdiction:.14, recency:.10 }) {
  const entries=Object.entries(weights); const total=entries.reduce((s,[,v])=>s+Number(v),0);
  if (!(total>0)) throw new Error('Search weights must be positive');
  const signals={ lexical:bounded(lexical), semantic:bounded(semantic), citation:bounded(citation), jurisdiction:bounded(jurisdiction), recency:bounded(recency) };
  const score=entries.reduce((s,[k,w])=>s+signals[k]*Number(w),0)/total;
  return { score:Number(score.toFixed(6)), signals, weights, explanation:'Weighted evidence ranking; score is retrieval relevance, not a legal conclusion.' };
}

export function searchFingerprint(spec) { return sha256(stableJson(spec)); }

export function dedupeSearchResults(results) {
  const seen=new Set(); const out=[];
  for (const result of results) {
    const key=result.family_id || result.canonical_id || result.source_identifier || result.source_url;
    if (!key || seen.has(key)) continue;
    seen.add(key); out.push(result);
  }
  return out;
}

export function legalBoundary(kind) {
  return { kind, determination:false, statement:'IPX provides evidence-backed search and analysis. Search scores and risk indicators are not legal determinations.' };
}
