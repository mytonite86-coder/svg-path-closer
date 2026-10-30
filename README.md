# SVG Path Closer

SVG Path Closer is a browser-based CNC utility that detects and repairs open paths in SVG files.

It is the first standalone micro-tool in the SVG Micro Eco repair system.

## Tool 4 — Block 22 checkpoint (2026-10-30)

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
