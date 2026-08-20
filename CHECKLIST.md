# SVG Path Closer Build Checklist

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
- [ ] Connect Tool 2 proposals to the shared review interface
- [ ] Add transformed and path-command geometry behind explicit review rules
