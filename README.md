# IPX

**The new modern patent office.**

> **A private, independent, digital-first intellectual-property office designed to offer the functional scope people expect from a patent office—and go beyond the legacy model with provenance, privacy, automation, verification, lifecycle management, APIs, and commercialization built in.**

IPX is a privately operated intellectual-property office and technology company built to modernize the complete lifecycle of patents, trademarks, copyrights, ownership records, examination, protection, verification, maintenance, licensing, commercialization, monitoring, and enforcement support.

IPX is not merely an evidence registry, certificate generator, encrypted vault, portfolio tracker, marketplace, or blockchain application. Those are supporting systems inside a larger product: a complete private modern patent-office platform for inventors, creators, developers, researchers, businesses, attorneys, professionals, and intellectual-property owners.

IPX is designed to be **better than the legacy patent-office experience as a technology and service platform**: faster, more accessible, continuous rather than filing-event-only, privacy-aware, API-native, cryptographically verifiable, commercially connected, and built around the entire IP lifecycle rather than a collection of disconnected forms and databases. Comparative superiority remains subject to measured evidence; the product direction itself is explicit.

> **Independent-office disclosure:** IPX is not a government agency and does not impersonate the USPTO, U.S. Copyright Office, WIPO, courts, registries, or any national or international authority. Where a statutory right must be issued or recognized by a government authority, that legal effect remains subject to the relevant jurisdiction. IPX provides its own private protection, filing, examination, evidence, certificate, monitoring, commercial, and professional-service infrastructure while supporting government-facing workflows where applicable.

## Mission

IPX exists to replace fragmented, expensive, slow, inaccessible, and discontinuous intellectual-property workflows with one modern private office that can help protect, examine, document, verify, preserve, maintain, commercialize, and monitor intellectual property from creation through long-term ownership.

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

## Why a private modern patent office

Traditional patent and intellectual-property systems are primarily optimized around statutory filing, examination, registration, and public-record functions. IPX is designed around the broader problem an inventor or creator actually has: establishing provenance, preserving confidential evidence, determining protection strategy, preparing filings, managing professional review, tracking rights across jurisdictions, proving lifecycle history, monitoring risk, maintaining records, and turning protected work into economic value.

The private-office model therefore does not depend on pretending to possess sovereign authority. Its advantage is that it can provide capabilities government offices generally are not designed to provide as one continuous product experience, while routing statutory acts to the proper authority when required.

## Product doctrine

IPX is built around five principles.

1. **Provenance before assertion.** Important claims should be tied to timestamps, immutable repository or record identifiers, evidence hashes, signatures, chain-of-custody history, and versioned policy.
2. **Private protection and statutory protection are different layers.** IPX can provide private evidence, examination, workflow, verification, monitoring, and commercial infrastructure while statutory grants remain with competent authorities.
3. **Consequential authority stays explicit.** Automated systems may assist, search, organize, analyze, and prepare, but legal, ownership, examination, dispute, or professional decisions requiring authorized human judgment remain attributable to the responsible actor.
4. **Evidence must fail closed.** A claim is not promoted from implemented to proven merely because code exists. Evidence gates distinguish implementation, repository qualification, operational validation, independent verification, and commercial proof.
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

IPX is designed to support invention and design protection workflows; patentability and prior-art research; trademark search, filing support, monitoring, renewal, assignment, and licensing; copyright authorship, ownership, contributor, work-for-hire, preservation, registration-support, and licensing workflows; jurisdiction and international portfolio tracking; ownership and assignment records; certificates and evidence manifests; encrypted vaulting; defensive publication and freedom-to-operate support; licensing and diligence; commercialization; monitoring; dispute and enforcement-support records; and professional, enterprise, API, and white-label infrastructure.

## Verification and evidence model

High-integrity IPX records are intended to support unique record or certificate identifiers; claimant, inventor, author, contributor, assignee, and organization records; canonical commitments; protected source hashes; timestamp/provider information; signatures; external anchors; chain-of-custody history; lifecycle and examination status; policy, schema, algorithm, and key versions; amendment, correction, supersession, challenge, dispute, and revocation history; machine-readable manifests; and independently checkable verification instructions.

## Evidence status

This repository uses an explicit proof contract in [`PORTFOLIO_PROOF.md`](PORTFOLIO_PROOF.md) and machine-checked claims in [`evidence/claims.json`](evidence/claims.json).

The central end-to-end product claim is currently **UNPROVEN** in the repository evidence ledger. That is intentional. IPX does not convert architecture or documentation into a claim of production proof. Promotion requires the controlled registration/evidence/conflict/verification/revocation/audit experiment and adversarial coverage specified in the evidence record.

```text
architecture / specification
    ≠ implementation
    ≠ repository qualification
    ≠ deployed production operation
    ≠ independently verified result
    ≠ commercial market proof
```

## Security and privacy

IPX treats ownership claims, identity, evidence, cryptographic material, access authority, legal-workflow information, and customer records as security-sensitive. Production services must implement applicable controls for authentication, authorization, tenant isolation, encryption, key management, replay protection, idempotency, tamper evidence, auditability, secure file handling, rate limiting, secrets management, supply-chain security, backup/restore, incident response, and privacy-aware retention/export/deletion.

See [`SECURITY.md`](SECURITY.md).

## Compliance posture

IPX is designed for auditable control maturity, but this repository does not claim certifications or government authorization that have not been independently obtained. Where commercially justified, production controls should map to relevant SOC 2 Trust Services Criteria, ISO/IEC 27001, NIST CSF, OWASP guidance, applicable privacy law, consumer-protection requirements, records requirements, electronic-signature requirements, and jurisdiction-specific intellectual-property practice requirements.

Alignment is not certification. See [`COMPLIANCE.md`](COMPLIANCE.md).

## Commercial model

Potential revenue surfaces include private evidence/provenance records; protected storage and preservation; search and review services; filing/examination workflow services; portfolio subscriptions; monitoring and renewal services; professional-supported workflows; enterprise plans; APIs and white-label infrastructure; licensing, transfer, diligence, and transaction services; international/jurisdiction workflow services; and commercialization/capital-readiness services.

## Repository boundary

This repository is the controlled public architecture, trust, evidence, and product-documentation surface for IPX. Proprietary production source, security-sensitive internals, operating procedures, provider configurations, customer evidence, credentials, unpublished inventions, and confidential commercial material belong in access-controlled repositories and production systems.

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