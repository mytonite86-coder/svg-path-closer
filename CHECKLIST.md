# SVG Path Closer Build Checklist

## Tool 3 — Block 17 proposal selection

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
