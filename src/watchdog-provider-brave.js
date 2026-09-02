import { normalizeObservation } from './watchdog.js';

const ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

export async function braveSearch(query, { apiKey = process.env.BRAVE_SEARCH_API_KEY, count = Number(process.env.IPX_WATCHDOG_SEARCH_COUNT || 20), country = 'US', searchLang = 'en' } = {}) {
  if (!apiKey) throw new Error('BRAVE_SEARCH_API_KEY is required');
  if (typeof query !== 'string' || !query.trim() || query.length > 400) throw new Error('Invalid search query');
  const url = new URL(ENDPOINT);
  url.searchParams.set('q', query.trim());
  url.searchParams.set('count', String(Math.max(1, Math.min(20, count))));
  url.searchParams.set('country', country);
  url.searchParams.set('search_lang', searchLang);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(url, { headers: { accept: 'application/json', 'x-subscription-token': apiKey }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`Brave Search API failed with ${response.status}`);
  const body = await response.json();
  const results = body?.web?.results ?? [];
  return results.map((r) => normalizeObservation({
    source_kind: 'web',
    source_url: r.url,
    title: r.title ?? null,
    excerpt: r.description ?? null,
    observed_at: new Date().toISOString(),
    source_payload: { profile: r.profile ?? null, language: r.language ?? null, age: r.age ?? null }
  }));
}

export function buildWatchQueries({ title, watchTerms = [], knownDomains = [] }) {
  const raw = [title, ...watchTerms]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter((v) => v.length >= 3);
  const unique = [...new Set(raw)];
  const max = Math.max(1, Math.min(12, Number(process.env.IPX_WATCHDOG_MAX_QUERIES_PER_ASSET || 12)));
  const domainExclusions = knownDomains.filter(Boolean).slice(0, 8).map((d) => `-site:${String(d).replace(/^https?:\/\//,'').split('/')[0]}`).join(' ');
  return unique.slice(0, max).map((q) => `"${q.replaceAll('"','')}" ${domainExclusions}`.trim());
}
