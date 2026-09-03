import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const required = [
  'LICENSE','PROVENANCE.md','SECURITY.md','COMPLIANCE.md','CONTRIBUTING.md','README.md','COMMERCIALIZATION.md','TECHNICAL_SUPERIORITY.md','REPOSITORY_COMPLETION_STANDARD.json',
  'package.json','.env.example','Dockerfile',
  'src/server.js','src/security.js','src/core.js','src/pricing.js','src/evidence.js','src/anchoring.js','src/watchdog.js','src/watchdog-provider-brave.js','src/billing.js','src/commercial.js','src/workflows.js','src/search-engine.js',
  'supabase/migrations/001_ipx_production.sql','supabase/migrations/002_watchdog.sql','supabase/migrations/003_fee_sync_and_commercial.sql','supabase/migrations/004_entitlements_and_evidence_uploads.sql','supabase/migrations/005_idempotent_fulfillment.sql','supabase/migrations/006_service_catalog_and_watchdog_pricing.sql','supabase/migrations/007_billing_workflows_and_office_operations.sql','supabase/migrations/008_invoice_numbering_and_commercial_integrity.sql','supabase/migrations/009_watchdog_catalog_runtime.sql',
  'test/core.test.js','test/evidence.test.js','test/commercial.test.js'
];
const errors=required.filter(p=>!fs.existsSync(p)).map(p=>`missing:${p}`);
const forbidden=['TODO','FIXME','PLACEHOLDER','MOCK_ONLY','DEMO_ONLY'];
for(const p of required.filter(p=>fs.existsSync(p)&&/\.(js|mjs|sql|md|json)$/.test(p))){const text=fs.readFileSync(p,'utf8');for(const token of forbidden)if(text.includes(token))errors.push(`${p}:contains:${token}`);}
try{execFileSync(process.execPath,['--test','test/*.test.js'],{stdio:'inherit',shell:true});}catch{errors.push('tests:failed');}
for(const p of ['src/server.js','src/security.js','src/core.js','src/pricing.js','src/evidence.js','src/anchoring.js','src/watchdog.js','src/watchdog-provider-brave.js','src/billing.js','src/commercial.js','src/workflows.js','src/search-engine.js']){try{execFileSync(process.execPath,['--check',p],{stdio:'inherit'});}catch{errors.push(`${p}:syntax`);}}
const server=fs.existsSync('src/server.js')?fs.readFileSync('src/server.js','utf8'):'';
for(const route of ['/v1/evidence/uploads','/v1/evidence/finalize','/v1/quotes','/v1/checkout','/v1/watchdog/subscriptions','/v1/watchdog/assets','/v1/watchdog/observations','/webhooks/stripe'])if(!server.includes(route))errors.push(`server:missing-route:${route}`);
if(/WATCHDOG_TIERS|amount:\s*1900|amount:\s*7900|amount:\s*29900/.test(server))errors.push('server:legacy-watchdog-hardcoded-pricing');
if(!server.includes("loadRecurringOffering(admin, 'ipx-watchdog'"))errors.push('server:watchdog-not-catalog-backed');
const allSql=required.filter(p=>p.endsWith('.sql')&&fs.existsSync(p)).map(p=>fs.readFileSync(p,'utf8')).join('\n');
for(const schema of ['evidence_upload_sessions','service_entitlements','webhook_events','watchdog_subscriptions','fee_catalog','service_catalog','service_prices','invoices','invoice_lines','payment_transactions','revenue_events','service_cases','case_tasks','docket_deadlines','ownership_chain','search_jobs','search_results','audit_log'])if(!allSql.includes(schema))errors.push(`schema:missing:${schema}`);
const pricing=fs.existsSync('src/pricing.js')?fs.readFileSync('src/pricing.js','utf8'):'';
if(/1900|7900|29900|watchdog-individual|watchdog-professional|watchdog-enterprise/.test(pricing))errors.push('pricing:starter-watchdog-assumption-remains');
const commercial=fs.existsSync('src/commercial.js')?fs.readFileSync('src/commercial.js','utf8'):'';
if(!commercial.includes('resolveRecurringOffering')||!commercial.includes('service_prices'))errors.push('commercial:recurring-catalog-resolution-missing');
if(errors.length){console.error(JSON.stringify({ok:false,errors},null,2));process.exit(1);}
console.log(JSON.stringify({ok:true,checks:['required-files','no-placeholders','unit-tests','syntax','evidence-flow','billing-ledger','service-catalog','catalog-backed-watchdog-pricing','office-workflows','docketing','ownership-chain','search-foundation','watchdog-flow','schema-controls','governance-docs','security-docs','provenance-docs']},null,2));
