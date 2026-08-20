import { analyzeDuplicateGeometry, createDuplicateRemovalSvg } from "./modules/duplicateGeometry.js";

const fileInput = document.querySelector("#duplicate-file");
const results = document.querySelector("#duplicate-results");
const status = document.querySelector("#duplicate-status");
const summary = document.querySelector("#duplicate-summary");
const review = document.querySelector("#duplicate-review");
const proposalList = document.querySelector("#duplicate-list");
const selectionSummary = document.querySelector("#duplicate-selection");
const confirmButton = document.querySelector("#duplicate-confirm");
const downloadButton = document.querySelector("#duplicate-download");

let proposedSvg = "";
let sourceSvg = "";
let currentResult = null;
let originalFileName = "drawing.svg";

function formatGeometry(geometryKey) {
    const [start, end] = geometryKey.split("|");
    return `(${start}) to (${end})`;
}

function getSelectedIndexes() {
    return [...proposalList.querySelectorAll('input[type="checkbox"]:checked')]
        .map((checkbox) => Number(checkbox.dataset.duplicateIndex));
}

function updateSelection() {
    const selectedCount = getSelectedIndexes().length;
    const safeCount = currentResult?.removalIndexes.length ?? 0;

    selectionSummary.textContent = safeCount
        ? `${selectedCount} of ${safeCount} safe removal${safeCount === 1 ? "" : "s"} selected. Nothing changes until you confirm.`
        : "No safe removals are available.";
    confirmButton.disabled = selectedCount === 0;
    downloadButton.disabled = true;
    proposedSvg = "";
}

function renderProposals(result) {
    proposalList.replaceChildren();

    result.proposals.forEach((proposal) => {
        const option = document.createElement("label");
        option.className = "eco-card";
        const checkbox = document.createElement("input");
        const isSafe = proposal.recommendation === "remove";
        checkbox.type = "checkbox";
        checkbox.checked = isSafe;
        checkbox.disabled = !isSafe;
        checkbox.dataset.duplicateIndex = proposal.duplicateIndex;
        checkbox.addEventListener("change", updateSelection);

        const title = document.createElement("strong");
        title.textContent = isSafe
            ? `Keep line ${proposal.keptIndex + 1}; remove duplicate line ${proposal.duplicateIndex + 1}`
            : `Review lines ${proposal.keptIndex + 1} and ${proposal.duplicateIndex + 1}; leave unchanged`;
        const details = document.createElement("span");
        details.className = "eco-muted";
        details.textContent = ` Exact geometry: ${formatGeometry(proposal.geometryKey)}. ${proposal.reason}`;

        option.append(checkbox, " ", title, details);
        proposalList.append(option);
    });

    updateSelection();
}

fileInput.addEventListener("change", async () => {
    const [file] = fileInput.files;
    results.hidden = false;
    downloadButton.disabled = true;
    confirmButton.disabled = true;
    proposedSvg = "";
    sourceSvg = "";
    currentResult = null;
    proposalList.replaceChildren();

    if (!file) {
        status.textContent = "Choose an SVG file to scan.";
        summary.textContent = "";
        review.textContent = "";
        selectionSummary.textContent = "";
        return;
    }

    try {
        originalFileName = file.name;
        sourceSvg = await file.text();
        const result = analyzeDuplicateGeometry(sourceSvg);
        currentResult = result;
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
        renderProposals(result);
    } catch (error) {
        status.textContent = error.message;
        summary.textContent = "No changes were proposed.";
        review.textContent = "";
        selectionSummary.textContent = "";
    }
});

confirmButton.addEventListener("click", () => {
    if (!sourceSvg || !currentResult) {
        return;
    }

    const result = createDuplicateRemovalSvg(sourceSvg, getSelectedIndexes());
    proposedSvg = result.svgText;
    downloadButton.disabled = result.removedCount === 0;
    confirmButton.disabled = true;
    selectionSummary.textContent = `${result.removedCount} selected duplicate line${result.removedCount === 1 ? "" : "s"} prepared for removal. Review complete; the original file remains unchanged.`;
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
