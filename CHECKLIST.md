# SVG Path Closer Build Checklist

## Tool 5 — Block 23 curve detection and review

Last checked: 2026-10-30. Branch: `work/block23-tool5-curve-review`.
Clean base: `afd916a`. README contains the current checkpoint, completion commit
locator, safety contract, fixture expectations and resume anchors.

- [x] New local Curve Repair page using existing chassis/file reader/bundle builder
- [x] Exact constant-point interior cubic detection with explicit neighboring cubics
- [x] Absolute/relative coordinates, repeated command groups and SVG shorthand state
- [x] Exact decimal proof; no float-rounded false coincidences
- [x] Real loops, unsupported syntax/precision, closure and shorthand dependencies warn
- [x] IDs, references, styles, transforms, strokes and uncertain contexts remain manual-only
- [x] Numbered findings, point markers, location highlighting and safe numeric preview
- [x] Individual unselected proposals, select/deselect and live selection counts
- [x] Upload/error/stale-read reset; original source and unrelated geometry untouched
- [x] Three lightweight manual SVG fixtures in `tests/fixtures/` (see README)
- [x] 13 focused tests passed; syntax/whitespace/generated-entry checks passed
- [x] Automated Chrome direct-file fixture/relative/selection/highlight/reset checks passed
- [x] No curve reconstruction, smoothing, contour closing, execution or download
- [x] No access, commercial, hub or Tools 1–4 changes; no broad tests or owner-led QA
- [x] Local commit only; no push, merge, deployment or new dependencies

Actual blockers: none. Block 24 is ready within the documented narrow scope,
subject to the next work order. STOP after Block 23; do not begin Block 24.

## Tool 4 — Block 22 safe execution, validation, download and hub access

Last checked: 2026-10-30. Branch: `work/block22-tool4-repair-access`.
Clean base: `511e8eb`. README holds the current checkpoint, completion commit
locator, approved scope and resume anchors.

- [x] Recheck selected proposal IDs, source identity and Block 21 safety rules
- [x] Refuse unknown, stale, repeated/conflicting and review-only selections
- [x] Remove only selected safe duplicate rectangles on isolated copies
- [x] Preserve original, retained IDs/references/styles/groups and unrelated content
- [x] Validate count, exact retained content, SVG structure and serialization round trip
- [x] Handle XML whitespace-node merging on private comparison clones
- [x] Discard failed candidates; retain previous valid working copy; permit clean retry
- [x] Update remaining findings, preview and counts; lock one successful batch per upload
- [x] Validated cleaned SVG download; revalidate every click; reset on upload
- [x] Manifest-only hub integration; Tool 4 purchases remain disabled
- [x] Shared account return; fresh `overlapping_shape_repair`/lifetime check at both actions
- [x] Denied/expired/unavailable access and revoked download grants fail closed
- [x] Ignore stale upload/selection checks and concurrent repeated clicks
- [x] Preserve all three Block 21 fixtures and existing detection/review/highlighting
- [x] 26 focused Tool 4 tests passed; syntax, whitespace and generated-bundle checks
- [x] Automated Chrome access-state, completed download, preservation, rollback/retry,
  whitespace, direct-file fixture and stale-action verification passed
- [x] Tools 1–3/hub/auth/billing sources and release flags unchanged
- [x] No owner-led QA, new dependencies, broad tests, push, merge or deployment

Tool 4 locally complete within the approved exact-rectangle scope. Blockers:
none for local completion. Block 23 is ready only on the next work order.
STOP after this local commit; no Tool 5 work is authorized here.

## Tool 4 — Block 21 detection and selection

Last checked: 2026-10-30. Branch: `work/block21-tool4-detection-review`.
Clean base: `1e2642c` (Block 20). README contains the current checkpoint,
completion commit locator, conservative safety contract and resume anchors.

- [x] Standalone local page using existing shared visual chassis and file reader
- [x] Exact primitive duplicate detection; conservative rectangle-only proposals
- [x] Opaque/no-stroke/crisp-edge, adjacent/same-parent/identical-attribute safety checks
- [x] IDs, references, CSS, active content, styles, transforms and stacking risks excluded
- [x] Possible partial/bounds overlap and unsupported geometry clearly manual-only
- [x] Numbered findings and safe numeric-only schematic preview with pair highlighting
- [x] Individual proposal selection/deselection; live selected/eligible count
- [x] Unselected defaults and upload/error/stale-read resets
- [x] Three lightweight SVG fixtures in `tests/fixtures/` (see README expectations)
- [x] 11 new focused tests passed; syntax and whitespace checks passed
- [x] Chrome file:// fixture/selection/highlight/reset acceptance, zero page errors
- [x] Original source unchanged; no network, repair execution, serialization or download
- [x] Tools 1–3/hub runtime, auth, billing and release flags unchanged
- [x] Local commit only; no push, merge, deployment or new dependencies

Ready for Block 22 within the documented narrow proposal scope, subject to its
separate authorization. Actual blockers: none. STOP after Block 21.

## Tool 3 — Block 20 shared hub and access integration

Last checked: 2026-10-28. Branch: `work/block20-tool3-hub-access`.
Clean starting point: QA001 `93fd0e6` after Block 19 `52a3130`; preserve both.
README holds the current checkpoint, completion commit locator and resume anchors.

- [x] Existing hub opens implemented Tool 3 workspace; purchases remain disabled
- [x] Existing account hub accepts the registered Tool 3 return route
- [x] Free local upload, scan, review, preview and selection
- [x] Fresh shared session check before both Repair Selected and Download
- [x] Require `stray_node_cleaner` or `all_products_lifetime` grants
- [x] Deny signed-out, unentitled, expired, malformed and unavailable states
- [x] Preserve lifetime access; recheck revocation before download
- [x] Ignore stale checks after upload/selection changes; prevent concurrent actions
- [x] Retain validated engine, original SVG protection and one-batch rule
- [x] Regenerate classic bundle; preserve QA001 direct-file free inspection
- [x] 26 focused integration/controller/hub tests passed; syntax/whitespace checks
- [x] Chrome mocked-session integration passed all four access states, actual
  authorized downloads, revocation denial, fixture preservation and file:// review
- [x] Engine/auth/Tool 1/Tool 2 sources and commercial release flags unchanged
- [x] No production calls, checkout changes, dependencies, clones, push or deployment

Shared account handoff requires the existing hub on the same HTTP(S) origin;
the existing hub does not load ES modules via file://. No hosting change made.
Blockers: none for local integration. Next single action: owner acceptance of
the shared-hub Tool 3 access flow. STOP after Block 20.

## Tool 3 — QA Bug Report 001: direct local-file upload

Verified 2026-10-28 on `work/block19-tool3-validation-download`, base `52a3130`.
Root cause: opening the HTML as `file://` in Chrome blocks the external ES
module with an origin-null CORS error, so its upload handler never registers.
Prior Block 19 browser checks used HTTP and did not cover direct-file launch.

- [x] Reproduce unchanged initial status with the exact owner-supplied fixture:
  `C:\Users\Kreepy\Desktop\tool3-stray-node-manual-test.svg`
- [x] Load a generated classic script (`stray-node-cleaner.local.js`) for both
  direct-file and hosted use; existing source modules remain authoritative
- [x] Add deterministic generator: `node scripts/build-tool3-local.mjs`
  (regenerate after changing Tool 3 or its imported source dependencies)
- [x] Regression checks classic entry, current bundle/source equality, syntax,
  and runtime registration of the upload change handler
- [x] 30 relevant entry/review/selection/preview tests passed; generator and
  generated bundle syntax checks and whitespace checks passed
- [x] Chrome direct `file://` acceptance passed with the supplied SVG: two
  findings, one eligible proposal, repair, final validation, completed download,
  exact retained coordinates, both rectangles unchanged, original file unchanged,
  and upload reset; zero browser errors
- [x] No repair engine/shared chassis source, billing, deployment, push or merge changes

Status: fixed locally. Completion commit is the commit adding this QA entry.
Stop after QA001; next single action is owner recheck by opening the existing
`stray-node-cleaner.html` directly in Chrome and choosing the same fixture.

## Tool 3 — Block 19 final validation and download

Last checked: 2026-10-28. Branch: `work/block19-tool3-validation-download`.
Verified clean base: `7b338db` (Block 18). README contains the current handoff,
completion commit locator, continuity pointer and resume anchors.

- [x] Download disabled until successful repair and final validation
- [x] Compare recorded successful repairs with actual removed-node count
- [x] Recheck repaired coordinates and all unselected/unsupported document content
- [x] Reuse shared SVG validation, serialization and parsing utilities
- [x] Validate serialized SVG and round-trip document equality
- [x] Repeat validation on each download; block failed/stale results
- [x] Reset session/count/download state immediately on every upload
- [x] Download original basename plus `-cleaned.svg`, with SVG MIME type
- [x] Preserve original upload, preview, selection count and one-batch rule
- [x] 56 focused Tool 3 tests passed; syntax and whitespace checks passed
- [x] Actual Edge download completed and contents/filename inspected
- [x] Browser verified invalid serialization, stale/new/invalid upload blocking
- [x] No PathSeal/Tool 2, repair algorithms, commerce, push, merge or deployment changes

Block 19 COMPLETE. Blockers: none. Next single action: owner acceptance testing
of the completed Tool 3 workflow. STOP; no subsequent development authorized.

## Historical Tool 3 — Block 18 selected repair execution

Last checked: 2026-10-28. Branch: `work/block18-tool3-execute-selected`.
Verified clean base: `a07e1b8` (Block 17). See README for current handoff,
commit locator, continuity pointer, resume anchors and single next action.

- [x] Repair Selected reads existing checked eligible proposal IDs
- [x] Replan and execute only existing exact point-list node removals
- [x] Clone original document; retain accepted working copy separately
- [x] Preserve all unselected/unsupported content and exact surviving numeric text
- [x] Refuse unsafe/stale selections, overlapping repairs and precision ambiguity
- [x] Validate point lists, topology, trace, preview and unchanged document content
- [x] Roll back the entire batch on failure, with executed/skipped counts
- [x] Lock a successful review against repeat execution; reset on upload
- [x] Update working-copy preview, findings and selected count
- [x] 49 focused Tool 3 tests; controller/executor syntax and whitespace checks
- [x] Edge actual XML DOM and UI smoke, zero page errors
- [x] No final export/download, push, merge, deploy, Tool 1/2 or commerce changes

Next single action: define the separately authorized Tool 3 final-validation
and download block. STOP after Block 18.

## Historical Tool 3 — Block 17 proposal selection

Last checked: 2026-10-28. Branch: `work/block17-tool3-proposal-selection`.
Base: Block 16 `eea5760fd23130c6b917af6403f74d7a94cced98`.
See the existing README checkpoint for source precedence, shared restart link,
resume anchors, and the local completion commit locator. Deployed version UNKNOWN.

- [x] Individual labeled checkboxes on existing planner-approved proposal cards
- [x] Select/deselect independently with a live selected/eligible count
- [x] Keep unsafe and review-only findings outside selection
- [x] Start unselected and reset on every upload, including failed/cancelled input
- [x] Ignore stale upload reads to preserve the current review
- [x] Preserve before/after descriptions, findings, highlighting and preview
- [x] Leave original geometry unchanged; no repair/output/download
- [x] Focused Tool 3 verification: 39 passed, 0 failed (five new selection tests)
- [x] JavaScript syntax check passed; Windows-aware diff whitespace check passed

Verification uses all seven Tool 3 suites, including existing review/preview
safety guards. Unrelated project-wide tests were not repeated. Source changes
are limited to the Tool 3 controller/page, focused tests, and these existing docs.

Next single development action: define a separately authorized bounded repair-
execution block. STOP after Block 17; no Block 18 implementation is authorized.

## Project Setup

* [x] Create project folder
* [x] Create `index.html`
* [x] Create `README.md`
* [x] Create `CHECKLIST.md`
* [x] Create `styles.css`
* [x] Create `app.js`
* [x] Create repair module

## MVP Features

* [x] Upload SVG
* [x] Read SVG file
* [x] Detect open paths
* [x] Measure endpoint gaps
* [x] Repair gaps and micro-gaps
* [x] Validate repaired SVG
* [x] Display repair summary
* [x] Download cleaned SVG
- [x] Preserve the original filename in the cleaned download

## Testing

* [x] Test already-closed paths
* [x] Test micro-gaps
* [x] Test larger gaps
* [x] Test multiple paths
* [x] Test malformed SVG files

## SignalDrift Attribution

- [x] Capture first-touch UTM source, medium, and campaign
- [x] Assign and preserve an anonymous visitor ID
- [x] Classify untagged visits as direct traffic
- [x] Test attribution persistence without exposing an ingestion key
- [x] Send visit attribution through the trusted shared backend
- [ ] Add signup, upload, and checkout-start funnel events
- [ ] Carry attribution through signup and checkout
- [ ] Confirm subscription conversions from the Stripe webhook


## Approval Preview

- [x] Show scanned SVG when the user opens the review
- [x] Number every repair candidate
- [x] Draw dotted endpoint bridges
- [x] Preselect safe gaps
- [x] List questionable gaps for manual selection
- [x] Allow individual candidate selection
- [x] Preview selected repairs before committing
- [x] Allow selections to be changed before repair
- [x] Show repaired SVG before download
- [x] Repair and download after final approval

## Duplicate Line Remover foundation

- [x] Preserve the PathSeal engine and production workflow
- [x] Detect exact duplicate `<line>` geometry in either direction
- [x] Recommend removal only when parent, presentation, metadata, and reference safety match
- [x] Surface questionable exact matches for review
- [x] Prevent the removal helper from applying review-only proposals
- [x] Add focused automated tests
- [x] Show keep/remove pairs and safety reasons before repair
- [x] Allow each safe removal proposal to be deselected
- [x] Require confirmation before generating cleaned output
- [x] Keep questionable matches visible and unchanged
- [ ] Add transformed and path-command geometry behind explicit review rules
