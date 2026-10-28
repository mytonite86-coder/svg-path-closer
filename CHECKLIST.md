# SVG Path Closer Build Checklist

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
