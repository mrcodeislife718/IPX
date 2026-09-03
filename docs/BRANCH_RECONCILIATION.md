# IPX Branch Reconciliation Record

This document is the permanent branch-accountability record for the remote GitHub repository `mrcodeislife718/IPX`.

## Governing rule

PRESERVE → INVENTORY → COMPARE → UNDERSTAND → RECONCILE → FIX → INTEGRATE → TEST → QUALIFY → DOCUMENT → CANONICALIZE → CLEAN LAST.

No branch is deleted merely because it is old, behind `main`, or similarly named. Branch disposition is based on semantic capability accounting.

## Audit scope and limitation

- Repository: `mrcodeislife718/IPX`
- Canonical/default branch: `main`
- Canonical HEAD at the start of this record: `2f6473e1e8d16d697b3dfe5081d81b0ff659757c`
- Remote branches observed: 12
- Tags observed: none
- Releases observed: none
- Open pull requests after reconciliation: none
- Local-only branches, unpushed working-tree changes, local remotes, and local tracking state are not visible through the connected GitHub API. This record therefore proves remote GitHub reconciliation only and does not claim local-worktree forensics.

## Distinct branch lineages

Although 12 remote branch names exist, they resolve to three non-`main` semantic lineages:

1. `commercial/authoritative-stripe-fulfillment` at `66d401d36cb008d6f965ee9f0ff2ffb249f2acc4`.
2. `economic/watchdog-catalog-pricing` at `7c5ebbf0825e22f897fe47f6614f348ba517e793`.
3. Nine `ipx-*` branch names sharing the identical tip `de5ee7b5db89bcaa4957dae9a096fc9ff7d55f7d`.

Auditing identical tips once is not branch omission: each branch name is still mapped below to that audited semantic lineage and receives its own final disposition.

## Reconciliation findings

### `commercial/authoritative-stripe-fulfillment`

Relationship to `main` after PR #3 merge:

- ahead of `main`: 0 commits
- behind `main`: 1 commit
- merge base: `66d401d36cb008d6f965ee9f0ff2ffb249f2acc4`
- unique files after merge: none

Unique value originally carried by the branch:

- authoritative payment gating for one-time IPX service fulfillment
- Checkout used as provider linkage rather than unconditional entitlement authority
- authoritative `customer.subscription.*` state for Watchdog recurring access
- durable Stripe webhook event claiming using the existing `webhook_events` table
- failed-event retry path
- Stripe ownership linkage validation
- monotonic event-created markers to prevent stale state rollback

Action:

- integrated through PR #3
- Trust and Production Gates passed on the exact qualified branch head before merge
- merged to `main` as canonical merge `2f6473e1e8d16d697b3dfe5081d81b0ff659757c`

Classification: **A — FULLY REPRESENTED IN MAIN**.

### `economic/watchdog-catalog-pricing`

Relationship to the reconciled `main`:

- ahead of `main`: 5 ancestry commits
- behind `main`: 4 commits
- merge base observed before semantic reconciliation: `db62063a42f286a1eb38674658a18f6bb17c1003`

Five branch commits reviewed by intent:

1. `b3df81e41f99aa5a903ee8ed2b371ff227c60cf4` — Use catalog-backed recurring commercial plans.
2. `21fe252596e6e8fde0230339335907c351c387fa` — Drive Watchdog checkout from service catalog pricing.
3. `733efe288cb194bd8a9c54b10b55759d63bae70e` — Enforce recurring catalog runtime for Watchdog.
4. `4a44fabb29b6dbf70f86bf57dc3d9f14ea120794` — Test catalog-backed recurring Watchdog plans.
5. `7c5ebbf0825e22f897fe47f6614f348ba517e793` — Qualify catalog-backed Watchdog commercialization.

Artifacts changed by the branch were reviewed semantically:

- `src/commercial.js`: branch and `main` are byte-identical at blob `a1e0fccad7f200c38391eafd1426580875555372`.
- `supabase/migrations/009_watchdog_catalog_runtime.sql`: branch and `main` are byte-identical at blob `d3ddd1cb065cd2eea111eb71c7158d9f08cc03ec`.
- `test/commercial.test.js`: branch and `main` are byte-identical at blob `70b5e372269ecf885f563db4324a53d619fa16b1`.
- `scripts/qualify-production.mjs`: branch and `main` are byte-identical at blob `1627b4ba03752df019ddb39e8500ea86c3e4801d`.
- `src/server.js`: the branch contains the earlier catalog-backed Watchdog server behavior, but reconciled `main` preserves that catalog behavior while adding stronger payment/subscription authority, durable webhook processing, stale-event protection, and ownership validation. Canonical `main` server blob after reconciliation is `dea723bf391d76794a6323c179f8584d73ef4a2b`.

No economic capability from this branch remains stranded outside `main`. The divergent ancestry is therefore not evidence of missing product functionality.

Classification: **D — SUPERSEDED BY STRONGER MAIN IMPLEMENTATION**.

### Shared historical `ipx-*` lineage

The following branches all point to the identical tip `de5ee7b5db89bcaa4957dae9a096fc9ff7d55f7d`:

- `ipx-all`
- `ipx-completion`
- `ipx-completion-backup`
- `ipx-completion-v2`
- `ipx-dominance`
- `ipx-economic-production`
- `ipx-full-implementation`
- `ipx-main-snapshot`
- `ipx-production-completion`

The shared tip is a strict ancestor of reconciled `main`:

- ahead of `main`: 0 commits
- behind `main`: 18 commits at the time of audit
- merge base: the branch tip itself
- unique file diff against `main`: none

Because the branches are exact-name aliases of one already-integrated historical tree, there is no branch-only executable, test, configuration, infrastructure, security, economic, or documentation value outside `main` at this lineage tip.

Classification for each named branch: **A — FULLY REPRESENTED IN MAIN**, with historical provenance value only.

## Per-branch disposition ledger

| Branch | Relationship / unique value | Action | Canonical destination | Validation | Final disposition |
|---|---|---|---|---|---|
| `main` | canonical product | preserve | `main` | Trust and Production Gates | KEEP ACTIVE |
| `commercial/authoritative-stripe-fulfillment` | authoritative Stripe fulfillment and recurring entitlement authority | merged via PR #3 | `src/server.js`, migration `010`, existing billing/entitlement schema | qualified before merge | DELETE ONLY AFTER FULL PORTFOLIO CLEANUP REVIEW |
| `economic/watchdog-catalog-pricing` | catalog-backed Watchdog pricing/runtime/tests/qualification | semantically preserved; weaker server superseded | `src/commercial.js`, `src/server.js`, migration `009`, tests, qualification | byte comparison + stronger-main review | DELETE ONLY AFTER FULL PORTFOLIO CLEANUP REVIEW |
| `ipx-all` | shared historical ancestor; no unique semantic value | none required | already in `main` history/tree | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-completion` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-completion-backup` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-completion-v2` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-dominance` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-economic-production` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-full-implementation` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-main-snapshot` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |
| `ipx-production-completion` | same shared ancestor | none required | already in `main` | ancestry + zero unique diff | ARCHIVE/DELETE CANDIDATE AFTER FINAL CLEANUP GATE |

## Canonical capability destinations

- IP evidence records and lifecycle: `src/core.js`, `src/evidence.js`, `src/evidence-integrity.js`, Supabase schema/migrations.
- Security and request authority: `src/security.js`, `src/server.js`, RLS/migration controls.
- Office/commercial workflows: `src/workflows.js`, `src/commercial.js`, service catalog and pricing migrations.
- IPX-owned invoicing/payment orchestration: `src/billing.js`, `src/commercial.js`, invoice/payment/revenue tables.
- Stripe collection authority: `src/server.js` plus `webhook_events` and event-order persistence.
- Watchdog: `src/watchdog.js`, `src/watchdog-provider-brave.js`, `src/server.js`, Watchdog schema/migrations.
- Search: `src/search-engine.js` and search schema.
- Qualification: `scripts/qualify-production.mjs`, repository tests, Portfolio Proof workflow.
- Economic role: private modern patent-office product boundary with IPX-owned product/invoice UI and external regulated/government boundaries explicitly separated.

## Cleanup safety conclusion

No reviewed remote branch currently contains a known capability that is absent from `main`.

However, **no branch is deleted by this reconciliation commit**. Final branch deletion remains a Phase 14 action and should occur only after:

1. the repository documentation consolidation is complete,
2. canonical qualification remains green,
3. local-only/unpushed work has been checked from an actual clone if one exists,
4. the portfolio-level final cleanup gate is reached.

Until then, every non-`main` branch remains preserved.