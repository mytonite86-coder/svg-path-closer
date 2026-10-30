# SVG Path Closer

SVG Path Closer is a browser-based CNC utility that detects and repairs open paths in SVG files.

It is the first standalone micro-tool in the SVG Micro Eco repair system.

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
