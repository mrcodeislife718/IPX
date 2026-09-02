# IPX

**Private intellectual-property infrastructure for provenance, protection workflows, verification, portfolio operations, and commercialization.**

IPX is a privately controlled technology company and platform being built to modernize the lifecycle surrounding patents, trademarks, copyrights, ownership records, evidence, examination workflows, verification, maintenance, licensing, commercialization, monitoring, and enforcement support.

IPX is designed as a modern private counterpart to fragmented intellectual-property workflows—not as a government authority. It does not impersonate or replace the USPTO, U.S. Copyright Office, WIPO, courts, registries, or any national authority. Statutory rights, registrations, patents, legal determinations, and government-issued protections remain subject to the competent jurisdiction and authorized professionals.

## Mission

IPX exists to make intellectual-property operations more accessible, verifiable, secure, interoperable, and commercially useful from the moment work is created through long-term ownership and monetization.

The system is intended to unify:

- provenance and creation evidence;
- identity, inventorship, authorship, contribution, and ownership records;
- prior-art and conflict research;
- patent, design, trademark, and copyright workflows;
- filing package preparation and government-facing workflow support;
- review, examination, response, amendment, and lifecycle records;
- certificates and independently verifiable private records;
- encrypted evidence preservation;
- assignments, licensing, diligence, transfers, and commercialization;
- monitoring, renewal, maintenance, disputes, and enforcement support;
- APIs and white-label infrastructure for professionals and enterprises.

## Product doctrine

IPX is built around five principles.

1. **Provenance before assertion.** Important claims should be tied to timestamps, immutable repository or record identifiers, evidence hashes, signatures, chain-of-custody history, and versioned policy.
2. **Private protection is not statutory protection.** IPX records and services must clearly distinguish private evidence and workflow services from rights issued or recognized by government authorities.
3. **Consequential authority stays explicit.** Automated systems may assist, search, organize, analyze, and prepare, but legal, ownership, examination, dispute, or professional decisions requiring authorized human judgment must remain attributable to the responsible actor.
4. **Evidence must fail closed.** A claim is not promoted from implemented to proven merely because code exists. Evidence gates must distinguish implementation, repository qualification, physical/operational validation, independent verification, and commercial proof.
5. **Commercialization belongs in the IP lifecycle.** Protection without licensing, diligence, transfer, financing readiness, monitoring, and monetization leaves substantial value unrealized.

## Intellectual-property lifecycle

```text
Create or acquire IP
    ↓
Establish identity, contribution, ownership, and provenance
    ↓
Search prior art, conflicts, and existing rights
    ↓
Select private and/or statutory protection path
    ↓
Prepare records and filing packages
    ↓
Submit to applicable authority where required
    ↓
Track review, examination, response, amendment, and status
    ↓
Preserve evidence and independently verifiable history
    ↓
Monitor conflicts, deadlines, misuse, and ownership changes
    ↓
Maintain, license, transfer, commercialize, finance, or enforce
```

## Target platform architecture

```text
User and professional surfaces
├── inventor / creator workspace
├── organization workspace
├── attorney / professional workspace
├── examiner / reviewer workspace
├── administrative control plane
├── public verification portal
└── developer / enterprise / white-label APIs
              │
              ▼
Identity, ownership, and authority
├── identity assurance
├── organization records
├── inventor / author / contributor / assignee records
├── role- and authority-based access
└── signatures, declarations, and delegations
              │
              ▼
Protection and filing workflows
├── invention intake
├── patent and design workflows
├── trademark workflows
├── copyright workflows
├── jurisdiction and international paths
└── deterministic filing package generation
              │
              ▼
Search, examination, and decision support
├── prior-art search
├── patentability / conflict analysis
├── formalities review
├── substantive-review workflows
├── office actions / amendments / responses
└── challenge, opposition, escalation, and dispute records
              │
              ▼
Records and verification
├── certificates and record identifiers
├── public / private / redacted records
├── deterministic document rendering
├── QR / URL / API / offline verification
├── cryptographic commitments and signatures
└── immutable lifecycle history
              │
              ▼
Portfolio and commercialization
├── deadlines / renewals / maintenance
├── assignments and ownership changes
├── licensing and transfers
├── diligence and transaction rooms
├── commercialization / capital readiness
└── monitoring and enforcement support
              │
              ▼
Trust infrastructure
├── encrypted evidence vaults
├── versioned policies and schemas
├── timestamps and external anchoring
├── audit and transparency records
├── payments and correspondence
└── preservation, export, backup, and recovery
```

## Intended service families

IPX is designed to support:

- invention and design protection workflows;
- patentability and prior-art research;
- trademark search, filing support, monitoring, renewal, assignment, and licensing;
- copyright authorship, ownership, contributor, work-for-hire, preservation, registration-support, and licensing workflows;
- jurisdiction and international portfolio tracking;
- ownership, assignment, contributor, and organization records;
- certificates, verification records, evidence manifests, and chain-of-custody history;
- encrypted vaulting and selective disclosure;
- renewal and deadline management;
- defensive publication and freedom-to-operate support;
- licensing, diligence, transactions, commercialization, and capital-readiness workflows;
- monitoring, dispute, and enforcement-support records;
- professional, enterprise, API, and white-label infrastructure.

## Verification and evidence model

High-integrity IPX records are intended to support fields such as:

- unique record or certificate identifier;
- claimant, inventor, author, contributor, assignee, and organization records;
- canonical public commitment;
- protected source hash;
- timestamp and timestamp-provider information;
- applicable signatures;
- external anchor and transparency receipts;
- chain-of-custody history;
- lifecycle and examination status;
- policy, rule, schema, algorithm, and key versions;
- amendment, correction, supersession, challenge, dispute, and revocation history;
- machine-readable manifests;
- independently checkable verification instructions.

## Evidence status

This repository uses an explicit proof contract in [`PORTFOLIO_PROOF.md`](PORTFOLIO_PROOF.md) and machine-checked claims in [`evidence/claims.json`](evidence/claims.json).

The central end-to-end product claim is currently **UNPROVEN** in the repository evidence ledger. That is intentional. IPX does not convert architecture or documentation into a claim of production proof. Promotion requires the controlled registration/evidence/conflict/verification/revocation/audit experiment and adversarial coverage specified in the evidence record.

This repository therefore distinguishes:

```text
architecture / specification
    ≠ implementation
    ≠ repository qualification
    ≠ deployed production operation
    ≠ independently verified result
    ≠ commercial market proof
```

## Security and privacy

IPX treats ownership claims, identity, evidence, cryptographic material, access authority, legal-workflow information, and customer records as security-sensitive.

Production services must implement applicable controls for authentication, authorization, tenant isolation, encryption, key management, replay protection, idempotency, tamper evidence, auditability, secure file handling, rate limiting, secrets management, supply-chain security, backup/restore, incident response, and privacy-aware retention/export/deletion.

See [`SECURITY.md`](SECURITY.md).

## Compliance posture

IPX is designed for auditable control maturity, but this repository does not claim certifications or government authorization that have not been independently obtained.

Where commercially justified, production controls should map to relevant SOC 2 Trust Services Criteria, ISO/IEC 27001, NIST CSF, OWASP guidance, applicable privacy law, consumer-protection requirements, records requirements, electronic-signature requirements, and jurisdiction-specific intellectual-property practice requirements.

Alignment is not certification. See [`COMPLIANCE.md`](COMPLIANCE.md).

## Commercial model

Potential revenue surfaces include:

- private evidence/provenance records;
- protected storage and preservation;
- search and review services;
- portfolio subscriptions;
- monitoring and renewal services;
- professional-supported workflows;
- enterprise and organization plans;
- APIs and white-label infrastructure;
- licensing, transfer, diligence, and transaction services;
- international/jurisdiction workflow services;
- commercialization and capital-readiness services.

Pricing and regulated/professional-service boundaries must be validated against the actual product, jurisdiction, operating cost, professional requirements, and customer evidence before public launch.

## Repository boundary

This repository is the controlled public architecture, trust, evidence, and product-documentation surface for IPX.

It is **not** a claim that every production capability described above is implemented in this public repository. Proprietary production source, security-sensitive internals, operating procedures, provider configurations, customer evidence, credentials, and confidential commercial material should remain in access-controlled repositories and production systems.

The canonical branch for this repository is `main`.

## Ownership, provenance, and licensing

IPX is independently conceived, architected, directed, and developed by **Charles Castillo**.

The original IPX architecture, source, documentation, specifications, workflows, product design, and other original repository materials are proprietary unless a file expressly states otherwise. Third-party libraries, standards, APIs, packages, datasets, models, tools, and other external materials retain their respective ownership and licenses.

Development tools—including AI-assisted coding and reasoning tools—may be used as instruments in the engineering process. Tool assistance does not itself create a transfer of ownership. Git history, specifications, evidence artifacts, release records, timestamps, hashes, and other repository records form part of the technical provenance trail.

See [`LICENSE`](LICENSE) and [`PROVENANCE.md`](PROVENANCE.md).

## Contribution policy

IPX is privately controlled and does not accept unsolicited code contributions by default. External proprietary contributions require explicit authorization and appropriate IP/confidentiality terms before acceptance.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Legal boundary

Nothing in this repository constitutes legal advice, a government filing, a patent or trademark grant, copyright registration, a judicial determination, or a guarantee of ownership, validity, enforceability, non-infringement, or freedom to operate.

When a workflow requires a licensed attorney, registered patent practitioner, government authority, qualified examiner, or other authorized professional, IPX must expose that boundary rather than silently substituting automation.