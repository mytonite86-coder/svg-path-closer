# SVG Path Closer

SVG Path Closer is a browser-based CNC utility that detects and repairs open paths in SVG files.

It is the first standalone micro-tool in the SVG Micro Eco repair system.

## Tool 3 — Block 18 checkpoint (2026-10-28)

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
