# IPX Portfolio Governance Standard

This document defines the minimum completion standard for technology repositories controlled within the IPX portfolio.

## Governing operating rule

The destination governs the work, not the literal wording of the latest task.

When a repository is being moved toward production readiness, commercial completion, technical superiority, defensible IP ownership, professional-grade operation, deployment, or revenue, all material requirements necessary to reach that destination are in scope even when they were not explicitly enumerated in the request that initiated the work.

Repository work must therefore include proactive gap discovery. Do not stop at the supplied checklist and hand undiscovered requirements back as optional suggestions when they are necessary to the stated destination. If a missing control, implementation, integration, revenue path, operational capability, developer/user requirement, evidence requirement, or protection mechanism is necessary and implementable, it belongs in the completion scope.

The standing review question is:

> What material omission would be costly, embarrassing, unsafe, commercially limiting, difficult to retrofit, or damaging to technical/IP credibility six months from now?

Those omissions must be identified early and either implemented, explicitly blocked by a real external dependency, or recorded as a verified unresolved gap with owner, evidence, and closure condition.

This rule does not authorize false claims or irreversible business/legal choices without evidence. Where a decision would materially change ownership, liability, pricing rights, licensing rights, regulatory posture, or other consequential business terms, implement the safest reversible infrastructure and surface the decision boundary rather than inventing consent.

## Canonical repository rule

Every active project must have one authoritative integration branch: `main` unless a repository has a documented reason otherwise.

Historical branches may remain for provenance, but unique production work must not remain stranded outside the canonical branch. Before consolidation, each branch must be compared against `main` for unique commits, files, tests, documentation, architecture, migrations, and evidence. Obsolete or conflicting work must be preserved historically but not blindly merged.

## Production-only completion standard

A revenue-capable project is not complete because it has a demo, mock, placeholder, prototype path, architecture document, or passing unit tests. Commercial completion requires the actual production path to be implemented, qualified, operable, supportable, and deployable.

Production paths must not silently depend on mocks, fake providers, placeholder data, disabled validation, simulated persistence, hard-coded credentials, or unimplemented integrations.

## Engineering closure gate

Applicable repositories must proactively close gaps across:

- architecture and cross-component integration;
- API and UI behavior;
- persistence, migrations, schema evolution, backup, restore, rollback, disaster recovery, and continuity;
- authentication, authorization, tenant isolation, SSO where economically justified, entitlements, and billing;
- reliability, retries, idempotency, concurrency, deadlines, cancellation, degradation, failover, and recovery;
- security, privacy, secrets, key rotation, abuse controls, fraud controls, threat modeling, and supply-chain risk;
- observability, telemetry, logs, metrics, traces, health, alerting, incident response, and post-incident learning;
- deployment, CI/CD, environment configuration, release automation, rollback, reproducibility, and infrastructure ownership;
- performance, memory, compute, latency, throughput, scale, capacity, energy/resource use, and cost;
- accessibility, internationalization/localization where justified, user experience, developer experience, onboarding, and self-service operation;
- data portability, import/export, deletion, retention, ownership, interoperability, and lifecycle management;
- documentation, production examples, operations, troubleshooting, support, and migration guidance;
- automated tests, integration tests, adversarial tests, qualification, benchmarks, production verification, and regression gates;
- enterprise requirements such as auditability, RBAC, SSO/SAML/OIDC, policy controls, SLAs, exportability, procurement evidence, and support tiers where appropriate;
- supportability, customer-success instrumentation, reliability objectives, service-level indicators/objectives, escalation, and operational ownership.

The absence of an item from a user-provided checklist does not remove it from scope when it is materially required by the product's destination.

## Technical-superiority discipline

Each project must identify the strongest relevant competitors, open-source systems, research architectures, commercial products, and infrastructure patterns in its vertical.

For competitor strengths, determine whether IPX technology preserves or exceeds them. For weaknesses, prefer structural elimination over patching.

Superiority claims must be measured. Architecture, code volume, feature count, or internal tests alone do not prove superiority. Comparative evidence should measure the dimensions material to the vertical, including applicable latency, throughput, memory, compute efficiency, reliability, recovery, determinism, scalability, interoperability, usability, extensibility, security, operational complexity, and total cost.

Technical-superiority work must distinguish:

- architectural advantage hypothesis;
- implemented mechanism;
- repository qualification;
- controlled comparative evidence;
- independent reproduction;
- production/customer outcome.

No higher claim may be inferred from a lower state.

## Commercial completion gate

A repository with credible revenue potential must have, where applicable:

- a defined buyer and user;
- production pricing and packaging hypothesis;
- account lifecycle and entitlements;
- secure payment/billing integration or a documented enterprise contracting path;
- onboarding, activation, retention, expansion, cancellation, and reactivation flows;
- usable product surface and developer experience;
- support, SLA/support-tier strategy, and incident process;
- privacy and data lifecycle controls;
- terms/licensing boundary appropriate to the product;
- deployment and rollback path;
- telemetry for activation, use, reliability, cost, retention, value, conversion, expansion, churn, and customer outcomes;
- evidence that the product solves a real problem;
- a path from technical proof to paid adoption;
- distribution, acquisition, partnerships, integration, and channel strategy where relevant;
- a defined path to unit-economics measurement and margin improvement;
- commercial risk controls including refunds, disputes, fraud, abuse, taxes where applicable, and billing reconciliation.

Commercial completion must not stop at the first obvious revenue stream.

## Monetization discovery mandate

Every monetizable repository must be evaluated for all economically plausible revenue classes, including when they were not explicitly requested.

At minimum, evaluate applicability of:

- core product/service revenue;
- recurring subscription revenue;
- usage-based or consumption revenue;
- enterprise contracts and premium support;
- transaction or marketplace revenue;
- professional and implementation services;
- licensing, OEM, embedded, and white-label revenue;
- API, platform, developer, or infrastructure revenue;
- premium monitoring, assurance, compliance, security, or governance services;
- storage, preservation, backup, archival, or continuity services;
- maintenance, renewal, upgrade, and lifecycle-management revenue;
- data/value-added intelligence services that are lawful, ethical, privacy-preserving, and contractually permitted;
- partner, referral, integration, distribution, and channel economics;
- certification/verification/qualification services where the project legitimately supports them and the claims are evidence-backed;
- transaction rooms, diligence, escrow-like workflows where legally appropriate, licensing, assignment, transfer, or commercialization economics;
- adjacent products that reuse existing infrastructure without diluting the core product;
- expansion revenue from higher limits, additional users, organizations, regions, environments, integrations, automation, retention periods, SLAs, or controls.

Revenue pathways must be evaluated against buyer value, willingness to pay, gross margin, operating cost, support burden, legal/compliance constraints, cannibalization, retention, defensibility, and strategic fit. Do not add monetization merely because charging is technically possible.

For each accepted pathway, the repository should define the implementation boundary, entitlement model, pricing/packaging hypothesis, metering requirement if applicable, evidence needed to validate value, and conditions for launch.

## IP and provenance gate

Every repository must preserve:

- owner copyright notice;
- repository-appropriate license;
- Git history and material architecture decisions;
- third-party dependency and license boundaries;
- timestamps, release tags, commit SHAs, and evidence hashes where appropriate;
- contributor authority and IP-assignment requirements before accepting external proprietary contributions;
- a clear distinction between original IPX materials and third-party code, standards, models, data, or services.

AI-assisted development tools may be used as instruments in the development process. Human ownership and responsibility must remain documented through repository provenance and review.

## Professional repository hygiene

Active repositories should contain an accurate README, license, provenance record, security policy, contribution policy, evidence/completion status, release/deployment instructions where applicable, and automated hygiene checks.

README statements must describe repository truth. Unverified marketing claims, stale screenshots, dead links, fake badges, outdated setup instructions, unfinished placeholders, and unsupported compatibility claims must be removed or corrected.

Professional hygiene also includes, where applicable, dependency/lockfile integrity, SBOM or dependency inventory, secret scanning, vulnerability review, reproducible installation/build instructions, release/version policy, changelog/release notes, ownership boundaries, environment templates without secrets, code-of-conduct/community rules where relevant, issue/PR templates, operational runbooks, and archival/deprecation policy.

## Compliance and assurance

Repositories should map relevant controls to recognized standards when economically and operationally justified, but must never claim certification, regulatory approval, legal status, or independent validation that has not actually been obtained.

Compliance readiness, certification, authorization, statutory authority, technical superiority, production readiness, deployment, and commercial validation are separate evidence states and must remain separately represented.

## Evidence ladder

Use the following statuses separately:

1. designed;
2. implemented;
3. repository-qualified;
4. integrated;
5. deployed/physically qualified;
6. comparatively proven;
7. independently reproduced;
8. commercially validated.

A higher status must never be inferred from a lower one.

For claims involving compliance, certification, statutory authority, legal rights, market leadership, or competitive superiority, record the specific external evidence required in addition to the technical evidence ladder.

## Proactive-gap accountability

For every material repository completion effort:

1. infer the destination from the product and stated goal;
2. inspect repository truth before planning changes;
3. discover missing requirements beyond the explicit request;
4. implement the requirements that are necessary and safely reversible;
5. surface consequential irreversible decision boundaries rather than silently choosing them;
6. verify the implementation through tests, qualification, deployment, or evidence appropriate to the claim;
7. update README, provenance, commercial documentation, runbooks, and evidence ledgers so documentation matches reality;
8. re-audit for what remains missing after implementation;
9. do not mark completion while a material known gap remains hidden.

A completion report should explain what was closed, what evidence proves it, what remains externally blocked, and what still requires market/user evidence. It should not turn necessary unfinished work into a casual recommendation list.

## Definition of done

For a revenue-capable repository, the target sequence is:

```text
working implementation
→ production completeness
→ canonical main
→ qualified release
→ deployed product
→ real users
→ paid users / contracts
→ measured retention and value
→ scalable commercial operation
```

For commercial repositories, monetization discovery and gap discovery continue throughout this sequence. A repository can be technically complete while still commercially unvalidated; it cannot be commercially complete if necessary production, reliability, security, operational, user, developer, licensing, provenance, distribution, or revenue infrastructure is knowingly absent.

The portfolio goal is not the largest number of repositories. It is a portfolio of professionally governed, defensible, production-grade technology assets whose technical and economic value can be independently understood, verified, purchased, operated, and expanded.
