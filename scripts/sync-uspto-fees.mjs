import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SOURCE = process.env.IPX_FEE_SOURCE_URL || 'https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
const db = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });

const response = await fetch(SOURCE, { headers:{ 'user-agent':'IPX-FeeVerifier/1.0 (+private modern patent office pricing verifier)' } });
if (!response.ok) throw new Error(`USPTO fee source returned ${response.status}`);
const html = await response.text();
const revisionMatch = html.match(/Last revised[^<]{0,80}(?:<[^>]+>)*\s*([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i) || html.match(/Last updated on:\s*([^<\n]+)/i);
const sourceRevision = revisionMatch?.[1]?.trim() || response.headers.get('last-modified') || null;
if (!sourceRevision) throw new Error('Could not determine fee source revision');
const sourceHash = createHash('sha256').update(html).digest('hex');

const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
const strip = (s) => s.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const money = (s) => {
  const v = strip(s).replace(/[$,]/g,'');
  if (!/^\d+(?:\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v)*100);
};
const codeLike = (s) => /^\d{3,4}(?:\/\d{3,4})*(?:\s*\/\s*\d{3,4})*$/.test(strip(s));
const rows = [];
let rm;
while ((rm = rowPattern.exec(html))) {
  const cells = [];
  let cm;
  cellPattern.lastIndex = 0;
  while ((cm = cellPattern.exec(rm[1]))) cells.push(strip(cm[1]));
  if (cells.length < 3) continue;
  const codeIndex = cells.findIndex(codeLike);
  if (codeIndex < 0) continue;
  const code = cells[codeIndex].replace(/\s+/g,'');
  const descriptionCandidates = cells.slice(codeIndex+1).filter((c) => c && money(c) === null && !/^\d+\.\d+/.test(c));
  const description = descriptionCandidates.sort((a,b) => b.length-a.length)[0];
  if (!description) continue;
  const monetary = cells.map((c,i) => ({ i, cents:money(c) })).filter((x) => x.cents !== null && x.i > codeIndex);
  if (!monetary.length) continue;
  const tiers = monetary.length >= 3 ? ['regular','small','micro'] : monetary.length === 1 ? ['not_applicable'] : ['regular','small'];
  for (let i=0; i<Math.min(tiers.length,monetary.length); i++) {
    rows.push({
      authority:'USPTO',
      service_code:code,
      description,
      entity_tier:tiers[i],
      amount_cents:monetary[i].cents,
      currency:'USD',
      source_url:SOURCE,
      source_revision:sourceRevision,
      effective_from:new Date().toISOString().slice(0,10),
      verified_at:new Date().toISOString()
    });
  }
}

const deduped = [...new Map(rows.map((r) => [`${r.service_code}|${r.entity_tier}`,r])).values()];
if (deduped.length < 100) throw new Error(`Fee parser produced only ${deduped.length} rows; refusing to replace catalog`);

const { data: sync, error: syncError } = await db.from('fee_sync_runs').insert({ authority:'USPTO', source_url:SOURCE, source_revision:sourceRevision, source_sha256:sourceHash, row_count:deduped.length, status:'staged' }).select().single();
if (syncError) throw syncError;

const { error: upsertError } = await db.from('fee_catalog').upsert(deduped, { onConflict:'authority,service_code,entity_tier,effective_from' });
if (upsertError) throw upsertError;
await db.from('fee_sync_runs').update({ status:'accepted', accepted_at:new Date().toISOString() }).eq('id',sync.id);
console.log(JSON.stringify({ ok:true, authority:'USPTO', source_revision:sourceRevision, source_sha256:sourceHash, rows:deduped.length, sync_id:sync.id }, null, 2));
