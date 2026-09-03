# IPX Capability Ledger

This ledger records what the reconciled `main` actually contains. A product or architecture claim is not promoted merely because it appears in a README or design document.

Status vocabulary:

- **SPECIFIED** — documented architecture or intended behavior exists.
- **IMPLEMENTED** — executable implementation exists.
- **INTEGRATED** — implementation is wired into the canonical runtime/product path.
- **TESTED** — repository tests exercise the capability.
- **QUALIFIED** — applicable repository qualification passed with the capability present.
- **PRODUCTION-READY** — reserved for capabilities whose production dependencies and operating evidence support that claim.
- **EXTERNALLY-BLOCKED** — implementation depends on external provider, legal, deployment, credential, or authority conditions.
- **DEPRECATED** — intentionally no longer canonical.
- **SUPERSEDED** — replaced by a stronger canonical implementation.

## Canonical capability matrix

| Capability | Canonical implementation | Status | Tests / proof | Production integration | Security / persistence / recovery | Economic relevance | Unresolved gaps |
|---|---|---|---|---|---|---|---|
| Supabase-backed user authentication | `src/server.js`, `src/security.js` | QUALIFIED | repository production qualification | canonical HTTP boundary | bearer auth; Supabase Auth; required env fails closed | customer/account access | requires configured Supabase deployment and credentials |
| Organization creation and membership authority | `src/server.js`, Supabase migrations | QUALIFIED | production qualification and schema controls | canonical API | organization membership checks + RLS-backed schema | team/professional/enterprise account model | broader admin/member-management surfaces are not all exposed in the inspected server |
| IP record creation and canonical hashing | `src/core.js`, `src/server.js`, `ip_records`, `ip_events` | QUALIFIED | core tests + production qualification | `/v1/ip-records` | canonical record hash, actor attribution, audit event | core private-office record product | broad lifecycle mutation APIs remain more extensive in schema/workflow model than current HTTP surface |
| Evidence upload authorization | `src/evidence.js`, `src/server.js`, storage + `evidence_upload_sessions` | QUALIFIED | evidence tests + production qualification | `/v1/evidence/uploads` | signed upload URL, tenant membership, size/type validation, expiry | provenance/evidence service | external Supabase Storage configuration required |
| Evidence finalization and manifest integrity | `src/evidence.js`, `src/evidence-integrity.js`, `src/server.js` | QUALIFIED | evidence tests + production qualification | `/v1/evidence/finalize` | SHA-256 content hash, manifest hash, one-way pending→finalized state, audit trail | evidence/provenance trust product | independent external timestamp/anchor strength depends on configured providers |
| Reference-fee catalog and parity quotes | `src/pricing.js`, `src/server.js`, `fee_catalog`, `price_quotes` | QUALIFIED | commercial tests + qualification | `/v1/quotes` | quote hash, effective-date lookup, organization authority | transaction revenue / office-equivalent private services | live fee freshness depends on configured sync/operations |
| Catalog-backed recurring Watchdog pricing | `src/commercial.js`, service catalog/prices, migration `009` | QUALIFIED | `test/commercial.test.js`, production qualification | Watchdog checkout path | fails closed when recurring price is absent; no invented source price | recurring monitoring revenue | commercial operators must intentionally configure active prices |
| One-time Stripe Checkout collection | `src/server.js` | QUALIFIED | Trust and Production Gates | `/v1/checkout` + Stripe webhook | quote ownership, idempotent Checkout key, metadata linkage | direct service revenue | external Stripe configuration required |
| Authoritative one-time service fulfillment | `src/server.js`, `orders`, `service_entitlements`, `webhook_events`, migration `010` | QUALIFIED | Trust and Production Gates passed before canonical merge | Stripe webhook → paid fulfillment | Checkout linkage alone does not grant service; paid/asynchronous payment authority, durable event claim, retryable failure, stale-event protection | prevents unpaid service delivery and duplicate economic side effects | refund/dispute lifecycle should remain under continuing operational qualification |
| Watchdog recurring subscription authority | `src/server.js`, `watchdog_subscriptions`, service catalog/prices, migration `010` | QUALIFIED | Trust and Production Gates | Watchdog subscription API + Stripe subscription webhooks | Checkout links provider identity; `customer.subscription.*` controls active/past-due/cancelled state; ownership and stale-event protection | recurring revenue + retention | external Stripe subscription lifecycle and production monitoring required |
| Watchdog asset enrollment | `src/server.js`, `watchdog_assets` | QUALIFIED | production qualification | `/v1/watchdog/assets` | active-subscription requirement, org consistency, asset quota enforcement | plan differentiation by asset capacity | source coverage breadth remains provider/config dependent |
| Watchdog authenticated observation ingestion | `src/watchdog.js`, `src/server.js`, Watchdog tables | QUALIFIED | Watchdog tests/qualification | `/v1/watchdog/observations` | subscription authority, evidence hash, dedupe/upsert, audit, alert thresholding | monitoring product value | automated findings remain signals, not legal determinations |
| Search scoring and family deduplication | `src/search-engine.js` | TESTED | commercial tests | library/domain capability; supporting schemas exist | bounded/explainable score behavior | prior-art/conflict research foundation | complete external search-provider orchestration is broader than the inspected HTTP product surface |
| Office workflow definitions | `src/workflows.js` | TESTED | commercial tests | deterministic workflow library | deterministic step definitions and deadline-state helper | service operations foundation across patents/trademarks/copyright/etc. | definitions do not by themselves prove every workflow has a complete live customer UI/API |
| Docket/deadline model | migrations + `src/workflows.js` | QUALIFIED | production qualification checks schema presence | persistence/domain foundation | deadline urgency calculation; durable schema | renewal/maintenance/professional service potential | full notification/operations delivery requires deployed job/communications infrastructure |
| Ownership-chain model | migrations | QUALIFIED | production qualification checks schema presence | persistence foundation | durable ownership records | diligence/assignment/transaction value | full end-user lifecycle surface is broader than current inspected routes |
| Custom IPX invoice identity and invoice construction | `src/billing.js`, `src/commercial.js`, invoice schema | TESTED | `test/commercial.test.js` | implemented module + durable schema | deterministic IPX invoice number/hash and processor metadata | allows IPX-owned billing UX while Stripe remains collection rail | current inspected HTTP server does not expose the full custom-invoice module as a dedicated customer route; treat as implemented, not fully integrated |
| PaymentIntent orchestration for IPX invoices | `src/commercial.js`, `src/billing.js`, payment transaction schema | IMPLEMENTED | helper behavior partly covered through billing tests | module exists outside the inspected main checkout route | idempotency key, provider-object ledger model | custom invoice collection / enterprise services | full route-level integration and end-to-end provider qualification still required before calling this canonical customer flow |
| Revenue-event and unit-economics schema | migrations | IMPLEMENTED | schema included by qualification | durable data model | service-code-level revenue/cost model | margin measurement and portfolio economics | measured customer/unit-economic data is external/commercial proof, not repository proof |
| Audit logging | `src/server.js`, `audit_log` | QUALIFIED | production qualification | used across key mutations | request/user/org/action attribution | enterprise trust, support, incident evidence | centralized production log retention/alerting is deployment dependent |
| Rate limiting | `src/server.js` | IMPLEMENTED | syntax/production qualification | canonical HTTP boundary | per-process request budget | abuse/cost protection | current in-memory limiter is not a distributed cross-instance quota system |
| Docker/runtime packaging | `Dockerfile`, `package.json` | QUALIFIED | repository qualification | deployment artifact exists | required environment validation | deployability | real deployment smoke evidence depends on target environment |
| Portfolio proof contract | `PORTFOLIO_PROOF.md`, `evidence/claims.json`, workflow | QUALIFIED | Portfolio Proof workflow | repository governance | explicit evidence maturity | buyer diligence / anti-hype discipline | central end-to-end superiority/product claim remains UNPROVEN until its specified external evidence gate passes |
| Private modern patent-office product boundary | `README.md`, `COMMERCIALIZATION.md`, `COMPLIANCE.md`, implementation | INTEGRATED | legal/product boundary present in docs and runtime product descriptions | canonical product definition | explicitly not a government authority; statutory acts remain with competent authorities | differentiating vertical operating system / service platform | legal/professional/regulatory dependencies remain external where applicable |

## Capability interpretation rules

1. A database table or workflow definition is not automatically a complete customer-facing product surface.
2. A tested helper is not automatically an integrated production workflow.
3. A qualified repository is not automatically proof of deployed production operation or customer demand.
4. External government, legal-professional, payment-provider, storage-provider, and deployment dependencies must remain explicit.
5. IPX's private-office positioning must never be presented as sovereign/statutory authority.

## Branch provenance

See [`BRANCH_RECONCILIATION.md`](BRANCH_RECONCILIATION.md) for the permanent mapping of historical branch capabilities into canonical `main`.