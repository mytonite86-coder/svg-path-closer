import { analyzeDuplicateGeometry } from "./modules/duplicateGeometry.js";

const fileInput = document.querySelector("#duplicate-file");
const results = document.querySelector("#duplicate-results");
const status = document.querySelector("#duplicate-status");
const summary = document.querySelector("#duplicate-summary");
const review = document.querySelector("#duplicate-review");
const downloadButton = document.querySelector("#duplicate-download");

let proposedSvg = "";
let originalFileName = "drawing.svg";

fileInput.addEventListener("change", async () => {
    const [file] = fileInput.files;
    results.hidden = false;
    downloadButton.disabled = true;
    proposedSvg = "";

    if (!file) {
        status.textContent = "Choose an SVG file to scan.";
        summary.textContent = "";
        review.textContent = "";
        return;
    }

    try {
        originalFileName = file.name;
        const result = analyzeDuplicateGeometry(await file.text());
        proposedSvg = result.proposedSvg;
        const duplicateCount = result.removalIndexes.length;
        const reviewCount = result.proposals.filter(
            (proposal) => proposal.recommendation === "review"
        ).length;

        status.textContent = duplicateCount
            ? `Proposed removal: ${duplicateCount} exact duplicate line${duplicateCount === 1 ? "" : "s"}.`
            : "No exact duplicate lines were found.";
        summary.textContent = `${result.lineCount} line elements scanned; ${result.unsupported.length} conservatively skipped.`;
        review.textContent = reviewCount
            ? `${reviewCount} exact geometric match${reviewCount === 1 ? " needs" : "es need"} customer review because presentation, grouping, metadata, or references differ. ${reviewCount === 1 ? "It was" : "They were"} left unchanged.`
            : "No questionable exact matches require review.";
        downloadButton.disabled = duplicateCount === 0;
    } catch (error) {
        status.textContent = error.message;
        summary.textContent = "No changes were proposed.";
        review.textContent = "";
    }
});

downloadButton.addEventListener("click", () => {
    if (!proposedSvg) {
        return;
    }

    const url = URL.createObjectURL(
        new Blob([proposedSvg], { type: "image/svg+xml" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = originalFileName.replace(/\.svg$/i, "-duplicates-removed.svg");
    link.click();
    URL.revokeObjectURL(url);
});
