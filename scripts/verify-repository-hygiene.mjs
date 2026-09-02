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
  'PORTFOLIO_GOVERNANCE.md',
  'PORTFOLIO_PROOF.md',
  'REPOSITORY_COMPLETION_STANDARD.json',
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

const governancePath = path.join(root, 'PORTFOLIO_GOVERNANCE.md');
if (fs.existsSync(governancePath)) {
  const governance = fs.readFileSync(governancePath, 'utf8');
  const governanceSignals = [
    'Governing operating rule',
    'Monetization discovery mandate',
    'Proactive-gap accountability',
    'Commercial completion gate',
    'Technical-superiority discipline',
    'Evidence ladder'
  ];
  for (const signal of governanceSignals) {
    if (!governance.includes(signal)) failures.push(`PORTFOLIO_GOVERNANCE.md missing required doctrine: ${signal}`);
  }
}

const completionPath = path.join(root, 'REPOSITORY_COMPLETION_STANDARD.json');
if (fs.existsSync(completionPath)) {
  try {
    const completion = JSON.parse(fs.readFileSync(completionPath, 'utf8'));
    if (completion.schema_version !== 1) failures.push('completion standard has unsupported schema_version');
    if (completion.governing_rule !== 'destination_driven_completion') failures.push('completion standard must enforce destination-driven completion');
    if (completion.canonical_branch !== 'main') failures.push('completion standard must identify main as canonical branch');

    const requiredOutcomes = [
      'production_readiness',
      'commercial_completion_when_monetizable',
      'technical_superiority_evidence',
      'ip_and_provenance_protection',
      'professional_repository_hygiene',
      'deployment_and_operability',
      'revenue_readiness'
    ];
    for (const outcome of requiredOutcomes) {
      if (!completion.required_outcomes?.includes(outcome)) failures.push(`completion standard missing required outcome: ${outcome}`);
    }

    const requiredGapDomains = [
      'security',
      'reliability',
      'deployment',
      'developer_experience',
      'user_experience',
      'data_portability',
      'documentation',
      'enterprise_requirements',
      'distribution',
      'retention',
      'expansion',
      'licensing',
      'provenance'
    ];
    for (const domain of requiredGapDomains) {
      if (!completion.proactive_gap_domains?.includes(domain)) failures.push(`completion standard missing proactive gap domain: ${domain}`);
    }

    const requiredMonetizationClasses = [
      'core_product_or_service',
      'recurring_subscription',
      'usage_based',
      'enterprise_contracts',
      'transaction_or_marketplace',
      'professional_services',
      'licensing',
      'oem',
      'white_label',
      'api_platform_infrastructure',
      'monitoring_assurance_governance',
      'maintenance_renewal_lifecycle',
      'partner_referral_distribution',
      'adjacent_products'
    ];
    for (const revenueClass of requiredMonetizationClasses) {
      if (!completion.monetization_classes_to_evaluate?.includes(revenueClass)) failures.push(`completion standard missing monetization class: ${revenueClass}`);
    }

    const expectedEvidenceStates = [
      'designed',
      'implemented',
      'repository_qualified',
      'integrated',
      'deployed_or_physically_qualified',
      'comparatively_proven',
      'independently_reproduced',
      'commercially_validated'
    ];
    if (JSON.stringify(completion.evidence_states) !== JSON.stringify(expectedEvidenceStates)) failures.push('completion standard evidence ladder changed or collapsed');

    if (completion.decision_boundary?.safe_reversible_necessary_work !== 'implement') failures.push('completion standard must implement safe reversible necessary work proactively');
    if (completion.decision_boundary?.unsupported_claim !== 'do_not_make') failures.push('completion standard must forbid unsupported claims');
  } catch (error) {
    failures.push(`invalid repository completion standard JSON: ${error.message}`);
  }
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

console.log('Repository hygiene and completion-governance gate PASSED');
