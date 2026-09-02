import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const required = [
  'LICENSE','PROVENANCE.md','SECURITY.md','COMPLIANCE.md','CONTRIBUTING.md','README.md',
  'package.json','.env.example','src/server.js','src/security.js','src/core.js','src/pricing.js','src/watchdog.js',
  'supabase/migrations/001_ipx_production.sql','supabase/migrations/002_watchdog.sql','test/core.test.js'
];
const errors = required.filter((p) => !fs.existsSync(p)).map((p) => `missing:${p}`);
const forbidden = ['TODO','FIXME','PLACEHOLDER','MOCK_ONLY','DEMO_ONLY'];
for (const p of required.filter((p) => fs.existsSync(p) && /\.(js|mjs|sql|md|json)$/.test(p))) {
  const text = fs.readFileSync(p,'utf8');
  for (const token of forbidden) if (text.includes(token)) errors.push(`${p}:contains:${token}`);
}
try { execFileSync(process.execPath, ['--test','test/core.test.js'], { stdio:'inherit' }); } catch { errors.push('tests:failed'); }
for (const p of ['src/server.js','src/security.js','src/core.js','src/pricing.js','src/watchdog.js']) {
  try { execFileSync(process.execPath, ['--check',p], { stdio:'inherit' }); } catch { errors.push(`${p}:syntax`); }
}
if (errors.length) {
  console.error(JSON.stringify({ ok:false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok:true, checks:['required-files','no-placeholders','unit-tests','syntax','governance-docs','security-docs','provenance-docs'] }, null, 2));
