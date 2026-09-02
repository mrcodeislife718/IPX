# IPX Portfolio Governance Standard

This document defines the minimum completion standard for technology repositories controlled within the IPX portfolio.

## Canonical repository rule

Every active project must have one authoritative integration branch: `main` unless a repository has a documented reason otherwise.

Historical branches may remain for provenance, but unique production work must not remain stranded outside the canonical branch. Before consolidation, each branch must be compared against `main` for unique commits, files, tests, documentation, architecture, migrations, and evidence. Obsolete or conflicting work must be preserved historically but not blindly merged.

## Production-only completion standard

A revenue-capable project is not complete because it has a demo, mock, placeholder, prototype path, architecture document, or passing unit tests. Commercial completion requires the actual production path to be implemented, qualified, operable, supportable, and deployable.

Production paths must not silently depend on mocks, fake providers, placeholder data, disabled validation, simulated persistence, hard-coded credentials, or unimplemented integrations.

## Engineering closure gate

Applicable repositories must close gaps across:

- architecture and cross-component integration;
- API and UI behavior;
- persistence, migrations, schema evolution, backup, restore, and rollback;
- authentication, authorization, tenant isolation, entitlements, and billing;
- reliability, retries, idempotency, concurrency, deadlines, cancellation, and recovery;
- security, privacy, secrets, abuse controls, and supply-chain risk;
- observability, telemetry, logs, metrics, traces, health, and alerting;
- deployment, CI/CD, environment configuration, release automation, and rollback;
- performance, memory, compute, latency, throughput, scale, and cost;
- accessibility and user/developer experience where applicable;
- documentation, examples that exercise real production paths, operations, and support;
- automated tests, integration tests, adversarial tests, qualification, benchmarks, and production verification.

## Technical-superiority discipline

Each project must identify the strongest relevant competitors, open-source systems, research architectures, commercial products, and infrastructure patterns in its vertical.

For competitor strengths, determine whether IPX technology preserves or exceeds them. For weaknesses, prefer structural elimination over patching.

Superiority claims must be measured. Architecture, code volume, feature count, or internal tests alone do not prove superiority. Comparative evidence should measure the dimensions material to the vertical, including applicable latency, throughput, memory, compute efficiency, reliability, recovery, determinism, scalability, interoperability, usability, extensibility, security, operational complexity, and total cost.

## Commercial completion gate

A repository with credible revenue potential must have, where applicable:

- a defined buyer and user;
- production pricing and packaging hypothesis;
- account lifecycle and entitlements;
- secure payment/billing integration or a documented enterprise contracting path;
- onboarding and activation;
- usable product surface and developer experience;
- support and incident process;
- privacy and data lifecycle controls;
- terms/licensing boundary appropriate to the product;
- deployment and rollback path;
- telemetry for activation, use, reliability, cost, retention, and value;
- evidence that the product solves a real problem;
- a path from technical proof to paid adoption.

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

## Compliance and assurance

Repositories should map relevant controls to recognized standards when economically and operationally justified, but must never claim certification, regulatory approval, legal status, or independent validation that has not actually been obtained.

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

The portfolio goal is not the largest number of repositories. It is a portfolio of professionally governed, defensible, production-grade technology assets whose technical and economic value can be independently understood.