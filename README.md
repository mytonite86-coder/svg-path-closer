# SVG Path Closer

SVG Path Closer is a browser-based CNC utility that detects and repairs open paths in SVG files.

It is the first standalone micro-tool in the SVG Micro Eco repair system.

## One-time lifetime purchases - Block 30 (2026-10-30)

**Local lifetime purchase integration COMPLETE; purchasing remains disabled.**
Owner-approved Block 30 terms supersede every monthly SVG pricing/discount
checkpoint below. Frontend base `8af47b8`, branch `work/block30-lifetime-checkout`;
completion commit is the local commit adding this checkpoint (`git log -1` on
that branch). Required shared-backend companion in existing `mab-authoritative`:
branch `work/block30-svg-lifetime-checkout`, commit `589414c`, base `dc66f14`.
Backend pre-existing untracked `.test-venv/` is untouched. No production changes.

| One-time lifetime purchase | USD | Verified Stripe Price |
| --- | --- | --- |
| PathSeal | $9.99 | `price_1UWR05GcjYPS3asvfYYyOfNb` |
| Duplicate Line Remover | $9.99 | `price_1UWR0DGcjYPS3asvaIMuvUjo` |
| Stray Node Cleaner | $9.99 | `price_1UWR0EGcjYPS3asvvzGDU6eH` |
| Overlapping Shape Repair | $9.99 | `price_1UWR0GGcjYPS3asvGXEkZ9LB` |
| Curve Repair | $9.99 | `price_1UWR0IGcjYPS3asvPdIxw729` |
| Complete Five-Tool Bundle | $34.99 | `price_1UWR0KGcjYPS3asvWLg8MvVb` |

The five tool IDs/entitlements remain `pathseal`, `duplicate_geometry`,
`stray_node_cleaner`, `overlapping_shape_repair`, `curve_repair`. The bundle's
commerce-only ID `svg_complete_bundle` expands to exactly those five entitlements.
It never grants `all_products_lifetime`, MAB S1, premium status or unrelated access.
Selecting all five tool IDs uses the single $34.99 bundle Price; smaller selections
sum individual one-time Prices without recurring discounts or Coupons.

`modules/productManifest.js` now records the six approved Prices, amounts and
payment/lifetime contracts. The five-tool workflow manifest stays five tools.
Existing shared Checkout uses `mode=payment`, no `subscription_data` or Coupon,
and package `svg_micro_eco_lifetime`. Existing route/function names containing
`svg-subscription` remain compatibility names only; new SVG orders are one-time.
PathSeal's purchase action delegates to that shared lifetime route. New-sale
`pathseal_monthly` is removed from the backend package catalog, while legacy
subscription reconciliation remains available to preserve existing customers.
MAB pricing, package and billing behavior remain unchanged.

Signed completed/async-success events fulfill only paid, complete, payment-mode
sessions matching the locally recorded session, metadata/owner, amount and USD
currency. Polling a paid-looking session, invalid signatures, failed, incomplete,
unpaid, wrong-owner, wrong-amount or wrong-mode events cannot grant access.
Existing set-based updates make repeated delivery idempotent. Lifetime SVG grants
are recorded in the existing tool entitlement list and `svg_lifetime_entitlements`;
legacy cancellation cannot remove those separately purchased permanent grants.
Fresh server-side verification remains required for repair/download. A lifetime
marker without its current direct entitlement cannot unlock a tool. There is no
requirement for an active subscription on these new lifetime grants.

Active quote/purchase text now says one-time/lifetime; no monthly discount flow
remains. Free Upload -> Scan -> Preview/Review and all repair geometry are
unchanged. Classic Tool 3-5 entries were synchronized for shared manifest/access
changes only. No repair engine was rebuilt or modified.

Backend configuration uses the five keys
`STRIPE_PRICE_PATHSEAL_LIFETIME`, `STRIPE_PRICE_DUPLICATE_GEOMETRY_LIFETIME`,
`STRIPE_PRICE_STRAY_NODE_CLEANER_LIFETIME`,
`STRIPE_PRICE_OVERLAPPING_SHAPE_REPAIR_LIFETIME`,
`STRIPE_PRICE_CURVE_REPAIR_LIFETIME`, plus
`STRIPE_PRICE_SVG_COMPLETE_BUNDLE_LIFETIME`; the updated example contains the
approved IDs above. No monthly Price/Coupon environment variables participate in
new SVG checkout. Integration identifier stays `svg_micro_eco_checkout_kvhrmtps`.
Existing API/signature secrets and shared MAB/SVG Render backend are reused.

**Verification: 46 focused backend tests passed, zero failed; 11 focused Node
checks passed, zero failed.** Covers all six one-time configurations, individual
and bundle grants, exact MAB package preservation/mock checkout, invalid or
unsigned payment denial, duplicate delivery, legacy reconciliation, permanent
access despite legacy expiry/cancellation, revoked/offline denial, disabled
purchase controls and source/generated packaging. Monthly-only tests were
replaced with the lifetime contract; relevant legacy protection tests remain.
Syntax/whitespace checks passed. No live Stripe requests/payment tests, production
transactions, existing customer-data changes or owner-led QA occurred. No broad
suite or repair-engine tests were run.

SESSION HANDOFF: Block 30 local integration COMPLETE; no local implementation
blocker identified. Real deployment/payment-delivery acceptance remains
unverified and purchasing is OFF (`SVG_SUBSCRIPTION_CHECKOUT_ENABLED=0`, existing
false frontend release flag and false Tools 2-5 purchase flags). Before release,
reconcile the companion backend patch with the selected current MAB release;
then obtain separate deployment and real delivery-verification authorization,
retaining existing recovery/access safeguards. Single next release action:
authorize current shared-backend release reconciliation. No activation, push,
merge, deployment, new Stripe records or subscriptions. Stop after local commits.

## Stripe configuration readiness - Block 29 (2026-10-30)

**Configuration plan ready; real Stripe test delivery BLOCKED. Purchasing OFF.**
Verified frontend base `62baaaf`, backend base `6ff8252`. Frontend branch
`work/block29-commercial-configuration`; completion commit is the local commit
adding this checkpoint (`git log -1` on this branch). Backend companion:
`work/block29-isolated-delivery`, commit `dc66f14` in existing `mab-authoritative`.
Backend pre-existing untracked `.test-venv/` remains untouched. No runtime code,
checkout route, webhook handler, repair engine, hub, deployed setting or live
Stripe record was changed. This checkpoint supersedes configuration readiness
wording below; historical evidence is preserved.

### Exact catalog mapping to prepare

One shared Kreepy Productions account, separate SVG Products and entitlements.
Every Price must be active, USD **999 cents**, recurring **month** (interval count
1), quantity 1, associated with its own matching SVG Product. Record each actual
`prod_` and `price_` ID after separate authorized creation; IDs remain **uncreated
and unconfigured** here. No MAB, Blueprint Ai or Belly Dump ID may be substituted.

| Stripe Product name | Stable product / entitlement | Price environment variable |
| --- | --- | --- |
| PathSeal | `pathseal` | `STRIPE_PRICE_PATHSEAL_MONTHLY` |
| Duplicate Line Remover | `duplicate_geometry` | `STRIPE_PRICE_DUPLICATE_GEOMETRY_MONTHLY` |
| Stray Node Cleaner | `stray_node_cleaner` | `STRIPE_PRICE_STRAY_NODE_CLEANER_MONTHLY` |
| Overlapping Shape Repair | `overlapping_shape_repair` | `STRIPE_PRICE_OVERLAPPING_SHAPE_REPAIR_MONTHLY` |
| Curve Repair | `curve_repair` | `STRIPE_PRICE_CURVE_REPAIR_MONTHLY` |

No Product-ID environment variables are required by the recovered route: each
configured Price supplies its Product association. The resulting Product IDs
must also be recorded to constrain Coupon applicability. Shared package remains
`svg_micro_eco_selection`; never map another tool to `pathseal_monthly`.
Universal entitlement remains `all_products_lifetime`, not a new purchasable SKU.

| Selected tool count | Coupon configuration variable | Percent off | Monthly total before tax |
| --- | --- | --- | --- |
| 1 | None | 0% | $9.99 |
| 2 | `STRIPE_COUPON_SVG_TWO_TOOLS` | 5% | $18.98 |
| 3 | `STRIPE_COUPON_SVG_THREE_TOOLS` | 10% | $26.97 |
| 4 | `STRIPE_COUPON_SVG_FOUR_TOOLS` | 15% | $33.97 |
| 5 | `STRIPE_COUPON_SVG_FIVE_TOOLS` | 20% | $39.96 |

Use percentage Coupons with recurring duration `forever`, preserving the existing
two-tool recurring contract and approved monthly ladder. Restrict `applies_to`
to the five actual SVG Product IDs, excluding MAB and unrelated products; the
existing count-based builder chooses one Coupon for a selected bundle. Do not
stack extra discounts, introduce promotions or change commercial terms. No
additional price decision is needed. The four actual Coupon IDs are still absent.

### Environment and webhook requirements

The updated backend `.env.svg-subscription.example` retains empty Price/Coupon
values and `SVG_SUBSCRIPTION_CHECKOUT_ENABLED=0`. Prepared non-secret label:
`STRIPE_SVG_INTEGRATION_IDENTIFIER=svg_micro_eco_checkout_kvhrmtps`. A focused
fixture confirms the eight-letter suffix and exact session-parameter pass-through;
Stripe API acceptance and deployed configuration remain unverified. This label
is not a Stripe record ID and has not been applied externally.

Existing correct-environment `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` must
come from the existing secret store; never put values in Git or chat. For isolated
verification, use only test-mode credentials, matching test Price/Coupon IDs,
an authorized isolated receiver and nonproduction database. `STRIPE_TEST_API_KEY`
is an optional historical test harness input, not the server's runtime key name.
Retain existing shared `MONGO_URL`, `DB_NAME`, `JWT_SECRET` and approved
`CHECKOUT_ALLOWED_ORIGINS`; isolated tests must never use the production database.
Frontend `RELEASE_FLAGS.svgSubscriptionCheckout` remains false and Tools 2-5
`productionEnabled` remains false; all public purchase handlers remain blocked.

Reuse the existing shared `/api/webhook/stripe` endpoint and existing account;
no second billing service is needed. Required handled events are
`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, and
`customer.subscription.created`, `.updated`, `.deleted`, `.paused`, `.resumed`
(the latter abbreviations share the `customer.subscription` prefix). Configure
the correct environment's signature secret and retain existing MAB event handling;
do not replace the production endpoint or its subscriptions during local work.

### Verification and actual blockers

- **9 new focused local tests passed, 0 failed** in
  `tests/test_svg_delivery_denials.py`. Real SDK signature verification with local
  fixture signatures and in-memory collections proves failed/asynchronous-failed,
  unpaid, incomplete/incomplete-expired, canceled and unrelated events add no SVG
  grants. A valid single-tool event adds only `stray_node_cleaner`; duplicate
  delivery adds it once. Existing MAB subscription/permanent/founder/complimentary
  entitlements and premium state remain unchanged. Integration label pass-through
  is checked. Block 28's all-five successful mappings, full bundle and replay
  results are retained without rerunning passed suites.
- Syntax, configuration-name/manifest mapping and whitespace checks passed.
  No frontend/runtime changes required repeated browser or repair tests.
- **External Stripe test-mode checkout/webhook: NOT RUN / BLOCKED.** Account
  discovery exposes only live `acct_1T3w8HGcjYPS3asv`. Process test/API/signing
  settings and isolated DB target are absent. Existing Stripe CLI was located,
  but the OS denied starting `stripe whoami --format json`; no escalation,
  secret extraction or tooling changes were attempted. Historical Credential
  Manager storage does not establish a usable authorized receiver/test setup.
  No substitute live purchase or live webhook was attempted.

Exact blockers to activation: actual five live Product/Price mappings and four
Coupon IDs; correct environment credentials/signature/identifier configuration;
authorized isolated test catalog/credential/receiver/database with real
Stripe-originated checkout delivery; reconciliation of the isolated backend
patch with the selected current shared MAB release; existing recovery/access
safeguards and separate activation/deployment approval. Production secret presence
was not queried and must not be described as missing.

**A separately authorized live catalog-only creation task can safely use these
approved mappings; it must not activate purchasing.** Successful record creation
would not prove delivery. No live record was created or modified in this block.

SESSION HANDOFF: Block 29 local mapping/negative-delivery proof COMPLETE;
external delivery verification BLOCKED at environment availability. Next single
action: provide/authorize the existing isolated Stripe test environment and
receiver configuration. Stop after local companion commits; no activation,
push, merge, deployment, publication or owner-led manual test.

## Restored shared checkout foundation - Block 28 (2026-10-30)

**Local foundation recovered and verified; public purchasing remains disabled.**
Frontend branch: `work/block28-restore-shared-checkout`, clean base `0fc0304`.
Frontend completion commit is the commit adding this checkpoint (`git log -1`
on that branch). Required backend companion in the existing `mab-authoritative`
working directory: `work/block28-restore-svg-checkout`, commit `6ff8252`, based
on its isolated `c4a6bcb` checkout. These are two separate repositories; neither
commit alone is the complete recovery. No push, merge, deployment or live change.
The backend's pre-existing untracked `.test-venv/` remains untouched.

### Recovery provenance and files

The supplied historical `a86e63d`/`feature/svg-subscription-checkout-wiring`
reference was not in either local object store. Targeted remote lookups could
not connect to GitHub. Applicable implementations were found locally instead:
frontend `05bc5f9`; backend through `33e1642`, including signature proof
`66e1828`. This is selective recovery, not a historical branch merge.

- `modules/auth.js`: recovered `startSvgSubscriptionCheckout` and
  `confirmSvgSubscriptionCheckout`; selection allowlist now derives from the
  five implemented manifest IDs. Authenticated requests, Stripe-only redirects,
  owner-scoped status and authoritative session refresh are reused. Checkout
  return never invents an entitlement from a URL or paid-status flag.
- `ecosystem.js` / `index.html`: existing quote surface now has the recovered
  checkout/return connection. Its button is hidden/disabled behind the existing
  false release flag; changed quote/account/selection invalidates readiness.
  Tools 2-5 remain non-purchasable in the manifest. No hub redesign.
- `app.js` / `pathseal.html`: the local PathSeal purchase button also remains
  disabled and its handler refuses checkout while that flag is false, as
  required by this block. Existing server PathSeal package behavior and paid
  repair gates are preserved. Production is unchanged.
- Generated Tool 3/4/5 classic entries were synchronized only to include the
  recovered shared auth exports. Engine, geometry, preview and fixture source
  files were not changed; generated/source equality checks pass.
- Backend `server.py`: restored the gated shared session route, shared
  `sync_product_subscription` branch, SDK-client calls and SDK metadata
  conversion. Existing owner-scoped status route and signed `stripe_webhook`
  boundary are reused. `models.py`, `svg_subscription.py`, `checkout_origins.py`
  restore the request/parameter/selection/return contracts for all five tools.
  `.env.svg-subscription.example` provides empty configuration placeholders,
  not fabricated Stripe IDs. Existing backend foundation notes were updated.

Recovery fixes remove a duplicated session query in the success URL, reject
owner/subscription/pending-selection mismatches, and preserve independent direct
PathSeal access during shared cancellation. Lifetime and other active bundle
protections are retained. Duplicate deliveries have idempotent effects using the
existing transaction and set-based entitlement updates; no new billing system
or general event-ordering ledger was added. Analytics recovery was excluded.

### Focused acceptance

- **43 backend tests plus 19 subtests passed; zero failed.** Includes all five
  individual tools and full-bundle mocked Checkout -> locally signed completion
  -> signed subscription delivery -> correct selected entitlements. Repeated
  completion/subscription delivery produces one transaction and no duplicate
  entitlements. Invalid/missing signatures, missing configuration, unpaid/pending
  checkout, unknown IDs, owner/selection mismatches, owner-only status,
  cancellation, lifetime/other-bundle/independent access protection pass.
  Two checks cover unchanged legacy PathSeal/MAB package checkout/status using
  the recovered SDK client. Collections are in-memory; Stripe sessions are mocks.
- **12 focused Node checks passed; zero failed:** client contracts, fresh return,
  safe redirect/selection/auth denial, current manifest/access gates and generated
  packaging. **4 focused Chrome checks passed:** all shared purchase controls
  and the PathSeal purchase button stay disabled; paid/pending returns display
  only freshly reported access. Zero live browser requests.
- Syntax and whitespace checks passed. Original Block 26 repair-engine evidence
  is retained. No repair-engine or unrelated full suite was repeated. Initial
  backend test collection needed the existing backend working directory; after
  correcting that invocation, the checks above all passed. No dependency install.

Reproduce the new frontend scope with
`node --test tests/svg-checkout-client.test.mjs tests/auth.test.mjs tests/suite-integration.test.mjs`.
Use `SVG_SUITE_CASE_FILTER=^Shared checkout:` with the existing browser harness
and existing Playwright/owner-fixture arguments. Backend tests are the recovered
`test_svg_subscription`, `test_svg_checkout_session`,
`test_svg_subscription_reconciliation`, `test_stripe_webhook_boundary`,
`test_svg_route_source`, new `test_svg_commercial_integration`, and existing
`test_checkout_origin_policy`; run from `Blueprint-Clean/backend` using the
existing test runtime, fixture-only JWT, unused loopback Mongo URL, blank Stripe
API key and in-memory collection fixtures. Do not run against a live database.

### Exact remaining commercial configuration

No approved-price decision is missing: USD **$9.99/month per tool**, discounts
**0/5/10/15/20%** for 1/2/3/4/5 tools, totals
**$9.99/$18.98/$26.97/$33.97/$39.96** before tax. Tax/pricing policy unchanged.
The five entitlement IDs and Price environment keys are listed in Block 27 below.
The correct live account still needs its own five SVG Products with matching
recurring Prices; none of the three unrelated existing products may be reused.
Four matching Coupons must populate `STRIPE_COUPON_SVG_TWO_TOOLS`,
`STRIPE_COUPON_SVG_THREE_TOOLS`, `STRIPE_COUPON_SVG_FOUR_TOOLS`,
`STRIPE_COUPON_SVG_FIVE_TOOLS`; also configure
`STRIPE_SVG_INTEGRATION_IDENTIFIER` and the existing correct-environment
`STRIPE_API_KEY`/`STRIPE_WEBHOOK_SECRET` through secret management. No secret
was read or created, and deployed secret presence was not assessed.

**Commercial catalog/configuration setup can proceed without another checkout
foundation build.** It is not deployment approval: the companion backend patch
must be reconciled with the selected current MAB release before promotion, and
real isolated Stripe-originated webhook delivery plus existing recovery/access
safeguards remain release gates. Local cryptographic fixture proof is not actual
Stripe delivery. Keep frontend/server switches off and Tools 2-5 purchase flags
false until valid mappings and separate activation approval exist.

SESSION HANDOFF: Block 28 local recovery COMPLETE. Next single action: separately
authorize the five-product Stripe catalog/configuration setup. No commercial
activation, live purchase, customer-data write, publication or deployment occurred.
Stop after the local companion commits.

## Commercial access checkpoint - Block 27 (2026-10-30)

**BLOCKED: commercial completion is not established.** Verified clean base
`37d7f1c`; local branch `work/block27-commercial-access`. Completion record:
the local commit adding this checkpoint (`git log -1` on that branch).
Only README/checklist changed. Existing repair engines, free inspection,
fresh entitlement gates, PathSeal purchase flow and disabled shared purchase
controls remain unchanged. Block 26 software evidence is retained.

### Established contracts

Authority: `SVG-MICRO-ECO-MASTER-2026-10-11.2`, section 3;
`SKALD-KREEPY-MASTER-2026-10-24.1`; continuity
`SKP-WORK-CONTINUITY-2026-09-01.1`.

All five tools have approved USD 999 cents/month standalone terms. Discounts
for 1/2/3/4/5 tools are 0/5/10/15/20 percent; pre-tax monthly totals are
999/1898/2697/3397/3996 cents. No terms were changed.

| Tool | Product / entitlement ID | Shared backend Price configuration key |
| --- | --- | --- |
| PathSeal | `pathseal` | `STRIPE_PRICE_PATHSEAL_MONTHLY` |
| Duplicate Line Remover | `duplicate_geometry` | `STRIPE_PRICE_DUPLICATE_GEOMETRY_MONTHLY` |
| Stray Node Cleaner | `stray_node_cleaner` | `STRIPE_PRICE_STRAY_NODE_CLEANER_MONTHLY` |
| Overlapping Shape Repair | `overlapping_shape_repair` | `STRIPE_PRICE_OVERLAPPING_SHAPE_REPAIR_MONTHLY` |
| Curve Repair | `curve_repair` | `STRIPE_PRICE_CURVE_REPAIR_MONTHLY` |

Universal access remains `all_products_lifetime`. The shared checkout package
is `svg_micro_eco_selection`; individual PathSeal checkout uses the existing
`pathseal_monthly` package and inline `price_data`, so a missing named catalog
Price alone does not prove its existing checkout is broken. Do not route other
tools through that PathSeal-only package.

### Exact unresolved dependencies

1. No verified existing SVG Stripe Product/Price mapping was available for shared
   checkout. Read-only account discovery exposed only Kreepy Productions live
   account `acct_1T3w8HGcjYPS3asv`. Its complete returned Price list
   (`has_more: false`) contained three unrelated products (MAB S1, Blueprint Ai,
   Belly Dump); none identified the five SVG offers. This does not prove that
   another account or archived Sandbox lacks them. The correct existing account,
   environment and five `price_`/`prod_` mappings must be supplied/verified.
   No unrelated ID was substituted; no catalog objects were created.
2. The 2/3/4/5-tool configuration names are `STRIPE_COUPON_SVG_TWO_TOOLS`,
   `STRIPE_COUPON_SVG_THREE_TOOLS`, `STRIPE_COUPON_SVG_FOUR_TOOLS`,
   `STRIPE_COUPON_SVG_FIVE_TOOLS`. Approved discount percentages exist, but their
   matching deployment-ready Coupon IDs were not established here.
3. Source reconciliation is required. The inspected existing MAB worktree
   `mab-authoritative` is clean except its pre-existing untracked `.test-venv/`,
   at `c4a6bcb` (`fix/mab-production-login`), backend root `Blueprint-Clean/backend`.
   It has quote/planning code but no shared checkout session route. Preserved
   local commit `33e1642` contains `/payments/svg-subscription/checkout/session`,
   `SVG_SUBSCRIPTION_CHECKOUT_ENABLED` and the webhook/reconciler. Its catalog
   still marks Tools 3-5 unavailable. The SVG frontend has only the shared quote
   client; the recovered historical checkout client is not in this working tree.
   No backend checkout was replaced or historical implementation bulk-merged.
4. No isolated Stripe account was exposed. The approved isolated signed-webhook
   receiver/database and its `STRIPE_WEBHOOK_SECRET` binding are unverified;
   deployed secret presence was not inspected and must not be called missing.
   No live secret, webhook, subscription or customer was read or changed.
   Purchase-to-entitlement delivery and repeat-event database idempotency for
   all five products remain unverified. Historical signed Tool 2 proof is not
   relabelled current five-tool end-to-end acceptance.

### Bounded evidence and handoff

Ran the existing pure backend `test_svg_subscription.py`: **10 passed, 0 failed**.
It verifies the approved price ladder, separate mocked Price line items, discount
mapping, missing-configuration denial, invalid/unavailable selection rejection,
bounded product metadata, grant/revoke planning and uncertain-status hold.
It does not execute Checkout, verify webhook signatures, or prove database
idempotency. No repair/browser tests repeated because runtime code did not change.
Whitespace checks passed. Stripe inspection used GET-only account/catalog calls;
no purchase, event submission, API-key access or production mutation occurred.

SESSION HANDOFF: Block 27 BLOCKED. Correct IDs/configuration and an identified
reconciled backend target are required before purchase wiring can proceed.
Next single action: resolve the existing Stripe account/catalog and isolated
webhook/backend contract above. Preserve all controls disabled until resolved.
The suite is locally software-ready per Block 26 but **not ready for commercial
production deployment**. Nothing pushed, merged, deployed, published or activated.
Stop after this local blocked-checkpoint commit.

## Targeted software release repairs � Block 26 (2026-10-30)

**Local software blockers resolved.** Clean base: `0ab3919`; branch:
`work/block26-targeted-release-fixes`. The completion commit is the local commit
adding this checkpoint (`git log -1` on that branch). The Block 25 assessment
below is historical; its five failed checks are now passing.

- PathSeal repair and download each refresh authoritative session access before
  acting. Revoked, expired, unavailable, malformed and signed-out responses deny
  paid work; cached grants cannot authorize it. Direct PathSeal and universal
  lifetime grants remain supported; free scan/preview needs no authorization.
- PathSeal review synchronizes preselected repairs after all checkboxes are
  appended. Safe defaults are immediately repair-ready. Geometry algorithms and
  safety thresholds are unchanged. Upload/selection/account guards prevent a
  delayed access response from acting on changed state.
- Tool 2 clears prior approval/output/selection controls on every upload, binds
  confirmation to captured upload/selection/source, and ignores stale responses.
  Newly scanned safe defaults retain their established behavior but require new
  confirmation. Pending downloads cannot reuse approval for another file.

Verification: reproduced all five Block 25 failures before changes. After fixes,
**19 focused Chrome checks passed, zero failed**, including all five previously
failed checks, signed-out/unentitled/direct/lifetime workflows for PathSeal and
Tool 2, expired/canceled grants, selection races and upload/download races.
Actual valid SVG downloads and unchanged uploaded originals were checked.
**10 focused Node access tests passed, zero failed**. Syntax and whitespace
checks passed. Browser sessions used synthetic responses: zero live requests.
Tools 3�5, shared hub/account code, geometry engines, manifests, fixtures and
commercial configuration were not changed. Their Block 25 passing evidence is
retained; no unrelated suites were repeated.

Reproduce only this scope:
`node --test tests/pathseal-access.test.mjs tests/duplicate-geometry-access.test.mjs`.
For the existing browser harness, set `SVG_SUITE_CASE_FILTER` to
`(^PathSeal:)|(^Duplicate Line Remover:)|(^Tool 2:)`, then use the existing
Playwright module and owner fixture arguments documented below.

No known remaining local software release blocker from Block 25. All five tools
are locally software-release-ready within their approved scopes. Target-host
checks and separate owner deployment approval remain required. Commercial gates
and live checkout/webhook-to-entitlement proof below remain unchanged and
unverified. No push, merge, deployment or commercial activation. Stop at Block 26.

## Five-tool release checkpoint — Block 25 (2026-10-30)

**Audit complete; full-suite release BLOCKED.** Repository:
`mytonite86-coder/svg-path-closer`. Verified clean start at
`43125c6dc0b297b6bb9c651205ffa275dbb959fa`; branch
`work/block25-suite-release-readiness`. Completion commit is the local commit
adding this checkpoint (`git log -1` on this branch). Deployment: UNKNOWN and
unchanged. Nothing was pushed, merged, published, deployed or commercially activated.

All five manifest routes are implemented and accessible through the existing
HTTP(S) hub: `pathseal`, `duplicate_geometry`, `stray_node_cleaner`,
`overlapping_shape_repair`, `curve_repair`. Account return destinations match;
shared login, persisted lifetime session and logout were verified with synthetic
responses. Free upload/scan/review works without payment across all five tools.
The normal workflows, with an explicit selection action, passed for matching
entitlements and universal lifetime access, including actual SVG downloads,
valid XML and unchanged uploaded files. Signed-out and unentitled normal repair
attempts are blocked. Tool 2 uses textual proposal review rather than an SVG
preview; that established interface was preserved.

**Only recent integration defect fixed:** generated Tool 3/4 classic entries
embedded three stale Tool 4/5 manifest records after Blocks 22/24. Those records
alone were synchronized to the current source manifest; in-memory generator
comparison now matches all three bundles exactly. No completed engine was rebuilt,
redesigned or edited, and no account behavior was changed. Focused checks found
no new Tools 3–5 workflow/access regression introduced by Blocks 21–24.

### Confirmed software release blockers — pre-existing; not fixed in this scope

1. **PathSeal cached authority:** `app.js:960` and `app.js:1019` use cached
   `hasEntitlement("pathseal")` for repair/download. Browser checks showed repair
   after server-side revocation, a real download after revocation, and repair
   while the authoritative session endpoint was unavailable. No fresh authority
   check occurs at those actions. These are three failed release checks.
2. **PathSeal preselection readiness:** `app.js:942` updates selected repairs
   before `app.js:954` appends the checkbox. With the existing single-gap fixture,
   the review shows a checked proposal but Repair stays disabled until toggled.
   This is one failed check; explicit toggle/select allows the normal workflow.
3. **Tool 2 upload/approval race:** `duplicate-geometry.js:133` awaits access,
   then `duplicate-geometry.js:135` reads mutable `sourceSvg`/checkbox state. A
   new upload during the pending check received repaired output from the old
   approval, without a new confirmation. This is one failed release check.

Narrow provenance verification: both controllers are byte-identical between
Block 20 `1e2642c` and Block 24 `43125c6` (app blob `df9d9529a08cd4712908c18f8a5fea21aee41481`,
Tool 2 blob `9753b11725e01a6bb9e0f3be55d1466184af38fe`). These defects predate
Blocks 21–24. This block authorizes fixing only recent integration regressions,
so protected-tool fixes require a separate work order; they are not silently waived.
Tools 2–5 passed fresh-access/revoked-download checks; Tools 3–5's prior bounded
upload/selection invalidation protections remain in place.

### Commercial release gates — unchanged

- Tool 2–5 `productionEnabled` values remain false; only PathSeal is production-
  selectable. The shared hub has no enabled purchase flow for the new tools.
- `RELEASE_FLAGS.svgSubscriptionCheckout` and `duplicateGeometryAnalytics` remain
  false. No checkout, price, payment, entitlement or customer configuration changed.
- Owner-approved commercial configuration and live checkout/webhook → correct
  product entitlement → gated download proof remain unverified. Local mocked
  session tests do not establish live billing, target-host account/CORS, production
  recovery/rollback readiness, or the existence/absence of particular Stripe objects.
  Existing historical commercial prerequisites were not re-audited or relabeled passed.

### Focused evidence and continuation

14 Node hub/account/packaging integration tests passed. The final set of 30 unique
Chrome checks has **25 passed / 5 failed**, reflecting the blockers above. Passed
cases were retained; targeted PathSeal checks exercised explicit selection and
isolated the default-preselection defect. No full engine suites or unrelated
regressions were repeated. Existing fixtures were reused, including the owner
Tool 3 file at `C:\Users\Kreepy\Desktop\tool3-stray-node-manual-test.svg`.
All external app requests were intercepted; account/payment/customer data stayed
untouched. No live service request, new dependency or owner-led manual QA was needed.

Reproducible checks:
`node --test tests/suite-integration.test.mjs tests/access-foundation.test.mjs tests/auth.test.mjs`;
`node tests/suite-browser-check.mjs <existing-Playwright-module-path> <existing-Tool-3-fixture-path>`.
The browser command intentionally exits nonzero while release blockers remain;
`SVG_SUITE_CASE_FILTER` can target a check without repeating passed cases.
Syntax/whitespace checks and protected-source/fixture comparisons passed.

SESSION HANDOFF — Block 25 COMPLETE (readiness assessment); RELEASE BLOCKED.
All five tools are built locally in their approved scopes, but the suite is not
fully release-ready. A deployment-ready approval cannot be asserted until the
software blockers are resolved and target-host release checks pass. Deployment
requires separate owner approval afterward; commercial activation remains a
separate gate. Resume at the three confirmed controller anchors and focused
integration checks above under a new bounded work order. Continuity remains
`SKP-WORK-CONTINUITY-2026-09-01.1` and linked restart rules. STOP after the local
commit; no further repair, configuration, publishing or deployment is authorized.

## Historical Tool 5 — Block 24 checkpoint (2026-10-30)

VERIFIED: `mytonite86-coder/svg-path-closer`, clean Block 23 base
`4b8a796871140fb2715d3ade94559d78fc8ce5a1`. Branch:
`work/block24-tool5-repair-access`. Completion commit is the local commit adding
this checkpoint (`git log -1` on this branch). Deployment: UNKNOWN; local only,
with no push, merge, deployment, pricing or commercial configuration changes.

Curve Repair now completes Upload → Scan → Preview/Review → Select → Repair →
Validate → Download within Block 23's exact collapsed-cubic scope. Before any
execution, it re-inspects the original source and matches every selected proposal
including its source command/text range. It refuses unknown/manual/stale IDs,
repeated or overlapping ranges and all geometry outside the existing detector's
safety proof. Selected ranges are removed from private copies in descending
source-offset order; all remaining source characters are retained verbatim.

Validation checks the actual removal count, exact decimal geometry of every
retained command/control/endpoint, command identity, subpaths and closure. The
entire SVG must also match a baseline copy changed only at the selected `d`
attributes. Unselected paths, unselected defects, styles, IDs, references,
grouping and unrelated SVG content remain exact. Preview and XML serialization/
reparse checks are part of the transaction; any failure discards the whole
attempt and keeps the previous valid state. Returned documents cannot modify
the private accepted copy. One successful batch per upload prevents repeats.

After success, findings/warnings, preview, repair counts and selection state
update. Download repeats geometry/content/XML checks and verifies the private
successful-repair record before using the existing cleaned-filename/Blob helper.
The original uploaded SVG is never edited. Every new upload clears all prior
repair/download availability, including stale in-flight access results.

The existing hub opens Tool 5 through the manifest route `curve-repair.html`;
the confirmed entitlement identifier is `curve_repair`. Upload, scan, preview
and review are free and browser-local. Repair and download each require a fresh
shared `auth.js` session check granting `curve_repair` or `all_products_lifetime`.
Signed-out, unentitled, expired, malformed and unavailable authority states deny
protected work; revocation is checked again before download. The account return
route and access-state derivation reuse the existing framework. Tool 5 purchase
controls remain disabled (`productionEnabled: false`). Account handoff uses a
common HTTP(S) origin; direct-file free inspection continues to work.

SESSION HANDOFF — Block 24 COMPLETE. Verified: 33 focused Tool 5 tests plus 7
affected hub/access tests (40 passed, zero failed), syntax/whitespace and generated
entry checks. Automated Chrome with mocked session responses verified all four
access states, actual absolute/relative downloads and filenames, exact retained
content, original/control preservation, native path length and sampled-point
equivalence, rollback/retry, revoked download denial, repeat prevention and stale
upload/selection/download checks. All three unchanged Block 23 fixtures still
scan directly from file. Browser navigation checks wait for DOM readiness before
choosing a file. No live account/customer/entitlement or payment requests were made.
Tools 1–4, hub implementation and existing account/commerce behavior are unchanged;
only Tool 5's manifest record is integrated. No new categories, smoothing,
reconstruction, dependencies, clones, broad tests or owner-led manual QA.
Actual blockers: none for local completion. Live commercial configuration and
production access remain separately gated and unverified. Resume anchors:
`modules/curveRepair.js`, `modules/curveAccess.js`, `curve-repair.js`,
`curve-repair-entry.js`, `tests/curve-repair.test.mjs`. Regenerate only Tool 5's
classic entry with `node scripts/build-tool5-local.mjs`. Continuity remains
`SKP-WORK-CONTINUITY-2026-09-01.1` and linked restart rules. Tool 5 is locally
complete within the approved narrow scope. STOP after Block 24; await the next
work order and do not begin another block automatically.

## Historical Tool 5 — Block 23 checkpoint (2026-10-30)

VERIFIED: `mytonite86-coder/svg-path-closer`, clean Block 22 base
`afd916a7a8c09b9fe3e3db8791ec58ff434e5ab8`. Branch:
`work/block23-tool5-curve-review`. Completion commit is the local commit adding
this checkpoint (`git log -1` on this branch). Deployment: UNKNOWN. Local only;
no push, merge, deployment or commercial changes.

Open `curve-repair.html` directly in Chrome for Upload → Scan → Preview → Select.
It reuses the shared visual chassis, local file reader and classic-entry builder.
Regenerate only Tool 5 with `node scripts/build-tool5-local.mjs`. Tools 1–4 and
the hub/manifest/auth remain unchanged. Tool 5 is not yet connected to hub/access.

The narrow safe proposal is removal of an explicit interior `C`/`c` whose two
control points and endpoint exactly equal its start. Both neighbors must be
explicit nonconstant cubic segments, on one open subpath with no `S`/`s` or close
commands. Such a cubic is a constant point already retained by its neighbors;
its removal preserves the geometric trace and leaves subsequent explicit
controls/current point unchanged. Only plain opaque filled, explicitly unstroked
paths without IDs/references, marker/dash/path-length settings, transforms, child
metadata, active content or uncertain presentation can receive selectable proposals.
All other collapsed cases remain manual review. No correction is executed here.

The parser recognizes `M/m`, `L/l`, `H/h`, `V/v`, `C/c`, `S/s`, `Z/z`, repeated
parameter groups, moveto's implicit lineto, exponents and relative coordinates.
`S/s` preview controls follow SVG's defined reflection, never guessed smoothing;
paths containing them cannot receive removal proposals. Endpoint-returning cubics
with nonconstant controls are real loops, not zero-length segments. Quadratic/arc
commands, malformed syntax and unsupported numeric ranges reject the entire path
from proposal/preview parsing instead of accepting a potentially misleading prefix.

Exact fixed-decimal arithmetic (up to 30 decimal places, resolved magnitude at
most 1e12) proves coincidence without floating-point false equality. Unsupported
precision/ranges are warnings. Limits: 200 paths, 200,000 characters/12,000 tokens
per path, 1,000,000 path-data characters total, 500 findings plus a limit warning.
Truncation is explicit manual review, never an implicit clean result.

Numbered findings and point markers locate even invisible constant-point cubics.
Highlight controls emphasize the actual path/segment location. The numeric-only
schematic preview omits source styles and unsupported/transformed paths. Safe
proposals start unselected, have individual controls and a live selection count.
Uploads/errors reset state; stale file reads cannot restore an older selection.
Original path data, IDs, grouping, styles, references and unrelated SVG are untouched.
There is no smoothing, automatic closing, repair execution, repaired-output
validation, download or paid-access wiring in Block 23.

Fixtures in `tests/fixtures/`:
- `tool5-safe-redundant-cubic.svg`: one safe interior constant-point cubic proposal.
- `tool5-manual-review-curve.svg`: a real loop and unsupported quadratic; two warnings,
  no selectable proposals. The loop can be highlighted; the quadratic is text-only.
- `tool5-unaffected-valid-curve.svg`: valid absolute/relative curved path; no findings.

SESSION HANDOFF — Block 23 COMPLETE. Verified: 13 new focused tests; syntax,
whitespace and source/bundle checks; automated Chrome direct-file checks of all
three fixtures, absolute/relative proposals, point highlighting, selection counts,
upload/error/stale reset, original-file preservation, no HTTP requests and zero
page errors. No owner-led QA required; Tools 1–4 tests were not repeated.
Protected runtime, hub, auth and fixtures were checked unchanged against `afd916a`.
Cross-project discoveries: none. Actual blockers: none. Resume anchors:
`modules/curveAnalyzer.js`, `modules/curvePreview.js`, `curve-repair.js`,
`tests/curve-review.test.mjs`. Continuity remains `SKP-WORK-CONTINUITY-2026-09-01.1`
and linked restart rules. Block 24 is ready for a separately authorized bounded
next step within this scope. STOP after Block 23; no Block 24 work is authorized.

## Historical Tool 4 — Block 22 checkpoint (2026-10-30)

VERIFIED: `mytonite86-coder/svg-path-closer`, clean Block 21 base
`511e8eb07c4b0ee16846dbd41069c33d7a0acbb3`. Branch:
`work/block22-tool4-repair-access`. Completion commit is the local commit adding
this checkpoint (`git log -1` on this branch). Deployment: UNKNOWN; local only,
no push, merge, deployment or commercial configuration changes.

Tool 4 now completes Upload → Scan → Preview/Review → Select → Repair → Validate
→ Download within Block 21's existing conservative safe-rectangle scope. Its
detector rechecks source/proposal identities and safety immediately before
execution. Repeated/unknown/stale/conflicting selections and all manual-review
findings are refused. Selected duplicates are removed only from deep working
copies. The original and all three Block 21 fixtures remain untouched.

Validation confirms the exact approved removals, removal count and equality of
all retained SVG content against an independently prepared expected copy, then
serializes/reparses using existing shared SVG utilities. Comparison normalizes
private clones so adjacent whitespace text nodes merged by XML round-tripping
do not cause false failures; no text or geometry is discarded. Preview and XML
validation are transactional: any failure discards the candidate, retaining the
previous valid copy. A successful batch updates findings/preview/counts and locks
repeat execution for that upload. Download validates the private accepted copy
and successful repair record again, using the existing cleaned-filename/Blob
download helper. New uploads invalidate all prior repair/download state.

The existing hub opens Tool 4 through the manifest's implemented route
`overlapping-shape-repair.html`; `productionEnabled` remains false. Account return
navigation reuses the existing hub. Upload/scan/review remain free and local.
Both repair and download require separate fresh shared-session checks for the
manifest identifier `overlapping_shape_repair` or `all_products_lifetime`.
Signed-out, unentitled, expired, malformed and unavailable authority states deny
protected work. Revocation before download is rechecked. In-flight checks cannot
apply to new uploads, changed selections or repeated concurrent clicks.
Shared account handoff uses a common HTTP(S) origin; direct-file free review
continues to work. No live account/entitlement request or purchase was made.

SESSION HANDOFF — Block 22 COMPLETE. Verified: 26 focused Tool 4 tests,
syntax/whitespace/source-bundle checks; automated Chrome hub integration with
mocked session responses for signed-out, unentitled, Tool 4 and lifetime states,
actual completed downloads with preserved retained content, access revocation,
transactional XML-failure rollback/retry, whitespace round-trip regression,
all three original fixtures, direct-file free review and stale-action checks.
No owner-led QA required for this block. Tools 1–3, hub implementation, auth,
billing and release flags remain unchanged; only Tool 4's manifest record changes.
No partial-overlap execution, new repair categories, dependencies, clones or
unrelated test suites. Actual blockers: none for local completion. Live commercial
configuration/production access remains separately gated and unverified.
Resume anchors: `modules/overlappingShapeRepair.js`,
`modules/overlappingShapeAccess.js`, `overlapping-shape-repair.js`,
`overlapping-shape-repair-entry.js` and `tests/overlapping-repair.test.mjs`.
Regenerate only Tool 4's classic entry with `node scripts/build-tool4-local.mjs`.
Continuity remains `SKP-WORK-CONTINUITY-2026-09-01.1` and linked restart rules.
Tool 4 is locally complete within its approved scope. Block 23 may begin only
after the next work order; STOP here and do not begin Tool 5 automatically.

## Historical Tool 4 — Block 21 checkpoint (2026-10-30)

VERIFIED: repository `mytonite86-coder/svg-path-closer`, clean base
`1e2642c85a97c50fb30973666e5cb92f4cebdc07`. Branch:
`work/block21-tool4-detection-review`. Completion commit is the local commit
adding this checkpoint (`git log -1` on this branch). Deployment: UNKNOWN;
all Block 21 work remains local and unpushed.

Open `overlapping-shape-repair.html` directly in Chrome for
Upload → Scan → Preview/Review → Select. It uses existing shared chassis styles,
the local file reader, and the existing classic-bundle generation approach.
Tools 1–3 and hub runtime/manifest remain unchanged. The build helper now exposes
its existing bundling function for Tool 4 reuse; no Tool 3 bundle was rebuilt.
Regenerate only Tool 4 with `node scripts/build-tool4-local.mjs` after its source
changes. Source modules remain authoritative; do not edit the generated file.

Detection recognizes source-identical, finite unitless unrounded rectangles,
circles and ellipses. Only adjacent, same-parent rectangles with identical source
attributes, explicit opaque solid fills, `stroke="none"`, `shape-rendering="crispEdges"`
and full opacity can receive removal proposals. IDs/references, styles, inherited
effects, transforms, child metadata, different grouping/stacking and document
CSS/active content block selection. Curved duplicates remain review-only.
Lexical numeric identity avoids treating rounded floating-point values as exact.

Partial bounds intersections/containment are labeled POSSIBLE overlaps, not
proven shape intersections or safe removals. Paths, polygons, text, images,
rounded rectangles, transforms, nested viewports/definitions, unsupported units
and other uncertain geometry are manual-review findings. This block inspects
up to 300 shapes and bounds pair reporting; any truncation is explicitly flagged.
There is no claim of general path/curve intersection analysis.

Numbered findings identify source shapes. The schematic numeric-only preview
highlights affected pairs without copying active source markup or styles.
Eligible proposals start unselected; each can be selected/deselected and updates
the proposed count. New uploads, errors and stale reads clear/protect selection.
No original SVG is mutated or serialized. No repair, output, download, account,
checkout or hub integration was added for Tool 4 in this block.

Manual fixtures in `tests/fixtures/`:
- `tool4-safe-exact-overlap.svg`: one exact finding / one selectable proposal;
  the ID-bearing control rectangle stays unrelated.
- `tool4-ambiguous-partial-overlap.svg`: partial overlap / no selectable proposals.
- `tool4-unaffected-geometry.svg`: three separated supported shapes / no findings.

SESSION HANDOFF — Block 21 COMPLETE. Verified: 11 new focused tests, syntax and
whitespace checks; Chrome direct-file acceptance of all three fixtures, numbered
findings, highlighting, selection/deselection, reset/error/stale-read handling,
no source changes/network calls/repair/download, zero page errors. Existing
Tool 1–3 engine tests were not repeated. Protected runtime files were checked
unchanged against `1e2642c`; no new dependencies, clone, deployment, merge or push.
Cross-project discoveries: none. Actual blockers: none. Resume in
`modules/overlappingShapes.js`, `modules/overlappingShapePreview.js`,
`overlapping-shape-repair.js` and `tests/overlapping-shapes.test.mjs`.
Continuity remains `SKP-WORK-CONTINUITY-2026-09-01.1` and the linked shared restart
rules below. Block 22 is ready for a separately authorized, bounded next step
using this conservative proposal scope. STOP after Block 21; do not begin it.

## Historical Tool 3 — Block 20 checkpoint (2026-10-28)

VERIFIED: `mytonite86-coder/svg-path-closer`, branch
`work/block20-tool3-hub-access`. Started clean at `93fd0e6`, preserving the QA001
local-file fix after requested Block 19 base `52a3130`. Completion commit is the
local commit adding this checkpoint (`git log -1` on this branch). Deployment:
UNKNOWN; no push, merge or deployment. The owner accepted the completed Tool 3
repair workflow before this integration; its repair engine was not changed.

Tool 3 is now an implemented workspace in the existing product manifest, with
the shared hub's Open Stray Node Cleaner link and registered account return route.
`productionEnabled` stays false: no Tool 3 purchase selection or checkout is
enabled. Upload, scan, preview, review and selection stay free and browser-local.

Repair Selected and Download each require a fresh shared `auth.js` session check.
The Tool 3 adapter reuses shared access-state/manifest components and accepts
`stray_node_cleaner` or `all_products_lifetime`. Signed-out, unentitled, expired,
malformed and unavailable authority states fail closed. Universal lifetime access
is preserved. A prior repair grant cannot authorize a later download. In-flight
checks cannot apply to a newer upload or a changed selection; repeated clicks
cannot execute concurrent batches. The validated engine and one-batch rule remain
unchanged, as do PathSeal, Tool 2, auth, billing and release flags.

`stray-node-cleaner-entry.js` supplies the existing session component to the page.
Regenerate the committed classic entry with `node scripts/build-tool3-local.mjs`
after changing its sources. Direct `file://` opening still supports free review.
Shared sign-in/return navigation uses the existing hub on a common HTTP(S)
origin; the existing hub's ES modules do not support direct-file account handoff.

SESSION HANDOFF — Block 20 COMPLETE. Verified: 26 focused hub/access/controller
tests; syntax, generated-entry/source consistency and whitespace checks. Chrome
integration with mocked shared-session responses passed all four access states,
authorized actual downloads, denial/revocation checks, preserved manual-fixture
control geometry/original file, and direct-file free review. No live account,
customer, checkout or entitlement requests were made. No repair-engine suites
or unrelated audits were repeated; no dependencies/clones/large temporary files.
Actual blockers: none for local integration. Live commercial configuration is
separately gated, not verified by these tests. Resume in `modules/strayNodeAccess.js`,
`stray-node-cleaner-entry.js`, `stray-node-cleaner.js`, and the focused access tests.
Next single action: owner acceptance of the shared-hub Tool 3 access flow.
STOP after Block 20; no follow-on development or activation is authorized.

## Historical Tool 3 — Block 19 checkpoint (2026-10-28)

VERIFIED: `mytonite86-coder/svg-path-closer`, clean Block 18 base
`7b338db99369babbf5a1978b11d70d1d47ef56d6`. Development branch:
`work/block19-tool3-validation-download`. Completion commit: the local commit
adding this checkpoint (`git log -1` on that branch). Deployment: UNKNOWN.
Continuity remains `SKP-WORK-CONTINUITY-2026-09-01.1`, with the shared v1.1
restart note linked in the historical Block 17 entry below.

Tool 3 now completes Upload → Scan → Review → Select → Repair → Validate →
Download locally. Download Cleaned SVG starts disabled. After a successful
repair, final validation verifies the count against private successful proposal
records, the actual removed-node count, exact repaired coordinates, and equality
of all other document content with the original. The existing shared
`serializeSvg`, `validateSvgText`, and `parseSvg` utilities serialize/reparse the
accepted working copy; round-trip content must match before download is enabled.
No PathSeal or Tool 2 implementation was changed.

Each download click repeats final validation; no serialized result is cached
across uploads. A failure blocks download. New uploads immediately clear the
session, repair count, and download availability, including invalid uploads.
Files use the original basename plus `-cleaned.svg` and SVG MIME type. The Blob
URL is released after the browser starts consuming it. The original source is
never edited; preview, selection counts and one successful batch per upload
remain intact. Repair algorithms and supported geometry are unchanged.

SESSION HANDOFF — Block 19 COMPLETE. Completed: final validation, serialization,
and cleaned SVG download. Verified: 56 focused Tool 3 tests, syntax and whitespace
checks; actual Edge download completed with filename and file-content inspection,
original/unselected/unsupported-content preservation, invalid serialization
blocking, stale/new-upload/invalid-upload blocking, one-batch safety and zero
page errors. Current state: local-only complete Tool 3 workflow. Cross-project
discoveries: none. Genuine blockers: none. No push, merge, deployment or commerce
changes. Resume anchors: `modules/strayNodeRepairExecution.js`,
`modules/strayNodeDownload.js`, `stray-node-cleaner.js`, and Tool 3 focused tests.
Do not repeat passed checks or historical audits without relevant changes.
Next single action: owner acceptance testing of the completed Tool 3 workflow.
STOP after Block 19; no next development block is authorized.

## Historical Tool 3 — Block 18 checkpoint (2026-10-28)

VERIFIED: `mytonite86-coder/svg-path-closer`, Block 17 base
`a07e1b8cd03e7efc4065671ece5ae0ae192ea33b`, clean at startup.
Branch: `work/block18-tool3-execute-selected`. Completion commit: the local
commit adding this checkpoint (`git log -1` on that branch). Deployment: UNKNOWN;
no push, merge, deployment, commerce, PathSeal, or Tool 2 changes.
Continuity: existing shared restart note v1.1 linked below and
`operations/work-block-continuity-protocol.md` (`SKP-WORK-CONTINUITY-2026-09-01.1`).

Repair Selected uses the existing checked proposal IDs. Execution replans against
the retained original document, then edits only a deep working copy. Only the
planner's exact coincident-node removals for polyline/polygon point lists are
supported. Unknown/stale IDs, repeated selections, overlapping node removals,
transformed ancestors, and coordinate text requiring precision review refuse
the whole batch. Surviving coordinate text retains its precision. Unsupported
and unselected subtrees and attributes are checked for equality with the original.

Validation checks point lists, distinct topology, ordered geometric trace,
reinspection, staged preview rendering, and unrelated document preservation.
Failure discards the copy, reports zero executed/all requested skipped, and
permits retry. Success retains the validated working document in the session,
updates preview/findings/counts, clears selections, and locks the review against
double execution. One successful batch per upload; upload again for another review.
The original upload is never edited. No serialization, final export, or download.

SESSION HANDOFF — Block 18 COMPLETE. Completed: selected execution and rollback.
Verified: 49 Tool 3 tests, syntax/whitespace checks, actual Edge XML DOM/UI smoke
(selected/unselected geometry, curve preservation, rollback, repeated execution,
upload reset; zero page errors). Current state: local-only validated working-copy
repair. Cross-project discoveries: none. Unresolved/blockers: none.
Do not repeat historical audits or unrelated suites. Resume anchors:
`modules/strayNodeRepairExecution.js`, `stray-node-cleaner.js`,
`tests/stray-node-execution.test.mjs`, `tests/stray-node-selection.test.mjs`.
Next single action: define a separately authorized Tool 3 final-validation and
download work block. STOP; no Block 19 implementation authorized.

## Historical Tool 3 — Block 17 checkpoint (2026-10-28)

Repository: `mytonite86-coder/svg-path-closer`. Verified Block 16 base:
`work/block16-tool3-repair-review` at `eea5760fd23130c6b917af6403f74d7a94cced98`.
Block 17 branch: `work/block17-tool3-proposal-selection`; its local completion
commit is the commit adding this checkpoint (`git log -1` on that branch).
Shared restart rules: [SVG current status and next action, v1.1](https://drive.google.com/file/d/1wPirXUwHGBeV1OfBiLLTLyQmuHx9PMYP/view).
Local authority read: `SVG-MICRO-ECO-MASTER-2026-10-11.2`; implementation facts
here were verified against the Block 16 source on 2026-10-28. Deployment: UNKNOWN.

`stray-node-cleaner.html` now lets customers select and deselect each existing
planner-approved exact coincident-node proposal. All proposals start unselected.
The live count reports selected versus eligible repairs. Rejected, unsupported,
and review-only findings remain outside selection. Proposal details and finding
highlighting remain available. Every upload clears the previous selection;
late reads from an older upload cannot replace the current review.
Selection changes only checkbox state: no repair, source geometry change,
serialization, output generation, or download is performed.

Resume in `stray-node-cleaner.js` and `tests/stray-node-selection.test.mjs`.
Block 17 stops after focused verification and a local commit; no push or deployment.
Actual blockers: none identified. Next single action: define the bounded Tool 3
repair-execution work block for the selected eligible proposals; implementation
requires separate authorization. Tools 1/2 and commerce remain protected.

## MVP Goals

* Upload an SVG file
* Detect open paths
* Repair gaps and micro-gaps
* Export a cleaned SVG
* Display a repair summary

## Planned Workflow

Upload → Scan → Fix → Validate → Download
## Project Structure

- `index.html` — page structure and user controls
- `styles.css` — visual layout and styling
- `app.js` — connects the interface to the repair module
- `modules/pathCloser.js` — reusable SVG scanning and repair logic
- `test-open-path.svg` — repairable micro-gap test
- `test-closed-path.svg` — already-closed path test
- `test-large-gap.svg` — intentional open-path test
- `test-multiple-paths.svg` — mixed geometry test
- `test-broken.svg` — malformed SVG test

## Current Repair Logic

1. Read the uploaded SVG as text.
2. Parse the SVG into an editable document.
3. Extract every `<path>` element.
4. Determine whether each path ends with `Z`.
5. Measure the distance between each path’s endpoints.
6. Compare the gap against that path’s total length.
7. Classify the opening as a micro-gap, gap, or large gap.
8. Automatically close safe gaps by appending `Z`.
9. Skip large gaps that may be intentional geometry.
10. Validate and serialize the repaired SVG.
11. Offer the cleaned SVG for download.

## MVP Safety Rules

- Micro-gap: endpoint distance is at most 0.5% of path length
- Repairable gap: endpoint distance is at most 2% of path length
- Large gap: greater than 2% and skipped automatically
- Already-closed paths are left unchanged
- Invalid SVG files are rejected without crashing the app

## Current Workflow

1. Upload an SVG file.
2. Scan all path elements.
3. Review the scan summary.
4. Open the detected-path review.
5. Inspect numbered repair candidates.
6. Select or deselect proposed closures.
7. Preview highlighted paths and dotted closure bridges.
8. Repair the selected paths.
9. Preview and validate the repaired SVG.
10. Download the cleaned SVG.

## Tool 2 foundation: Duplicate Line Remover

`duplicate-geometry.html` is the minimal shared-chassis entry point for the
reserved `duplicate_geometry` engine. It scans SVG `<line>` elements and
produces safe-removal proposals that retain the first canonical instance,
including when a matching line's endpoints are reversed.

The foundation is deliberately conservative. Coordinates must be finite,
unitless SVG numbers. Lines must share the same parent and have identical
non-coordinate attributes and have no direct reference attributes. Exact
geometry with different styling, nesting, metadata, or IDs is reported for
customer review and is not removed. Paths and curves, near matches, partial
overlaps, and tolerance-based matches are left untouched. Unsupported line
coordinates are reported as skipped. This is not
an entitlement, checkout, package, or live-product activation.

The review screen identifies the line retained, the duplicate proposed for
removal, its exact endpoints, and the safety reason. Safe proposals are
individually selectable. Questionable matches are visible but disabled and
remain unchanged. Output is generated only after explicit confirmation.

Later tools may add their own engines beside `modules/duplicateGeometry.js`.
They must not broaden this exact-match contract into stray-node, overlap, or
curve repair, and must not alter PathSeal's review-before-repair behavior.
