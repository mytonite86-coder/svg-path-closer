# SVG Path Closer

SVG Path Closer is a browser-based CNC utility that detects and repairs open paths in SVG files.

It is the first standalone micro-tool in the SVG Micro Eco repair system.

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