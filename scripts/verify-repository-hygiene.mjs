import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const required = [
  'README.md',
  'LICENSE',
  'PROVENANCE.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'COMPLIANCE.md',
  'PORTFOLIO_PROOF.md',
  'evidence/claims.json',
  '.github/CODEOWNERS'
];

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) failures.push(`missing required repository control: ${file}`);
  else if (fs.statSync(full).isFile() && fs.statSync(full).size === 0) failures.push(`empty required file: ${file}`);
}

const readmePath = path.join(root, 'README.md');
if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8');
  const requiredReadmeSignals = [
    'Evidence status',
    'Repository boundary',
    'Ownership, provenance, and licensing',
    'Legal boundary'
  ];
  for (const signal of requiredReadmeSignals) {
    if (!readme.includes(signal)) failures.push(`README missing required section: ${signal}`);
  }
}

const licensePath = path.join(root, 'LICENSE');
if (fs.existsSync(licensePath)) {
  const license = fs.readFileSync(licensePath, 'utf8');
  if (!license.includes('Copyright (c) 2026 Charles Castillo')) failures.push('LICENSE missing owner copyright notice');
  if (!license.includes('Third-party')) failures.push('LICENSE missing third-party rights boundary');
}

const provenancePath = path.join(root, 'PROVENANCE.md');
if (fs.existsSync(provenancePath)) {
  const provenance = fs.readFileSync(provenancePath, 'utf8');
  if (!provenance.includes('No false provenance')) failures.push('PROVENANCE.md must preserve timestamp/legal-right distinction');
  if (!provenance.includes('AI-assisted')) failures.push('PROVENANCE.md must document development-tool boundary');
}

const claimsPath = path.join(root, 'evidence/claims.json');
if (fs.existsSync(claimsPath)) {
  try {
    const claims = JSON.parse(fs.readFileSync(claimsPath, 'utf8'));
    if (!Array.isArray(claims.claims) || claims.claims.length === 0) failures.push('evidence claims ledger is empty');
  } catch (error) {
    failures.push(`invalid evidence claims JSON: ${error.message}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Repository hygiene gate PASSED');