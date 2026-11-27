import {
    analyzeDuplicateGeometry,
    createDuplicateRemovalSvg,
} from "./modules/duplicateGeometry.js?v=path-segments-1";
import { refreshSession } from "./modules/auth.js";
import { runWithFreshDuplicateGeometryAccess } from "./modules/duplicateGeometryAccess.js";

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
let uploadVersion = 0;
let selectionVersion = 0;
let pending = false;
let approval = null;

function hasCurrentApproval() {
    return Boolean(proposedSvg && approval?.upload === uploadVersion && approval?.selection === selectionVersion);
}

function updateActions() {
    confirmButton.disabled = pending || !currentResult || !getSelectedIndexes().length || hasCurrentApproval();
    downloadButton.disabled = pending || !hasCurrentApproval();
}

function formatGeometry(geometryKey, outline) {
    if (outline) return `${outline.type} centered at (${outline.center.join(", ")}) with radius ${outline.radii.join(" × ")}`;
    const [start, end] = geometryKey.split("|");
    return `(${start}) to (${end})`;
}

function getSelectedIndexes() {
    return [...proposalList.querySelectorAll('input[type="checkbox"]:checked')]
        .map((checkbox) => Number(checkbox.dataset.duplicateIndex));
}

function updateSelection() {
    selectionVersion += 1;
    approval = null;
    const selectedCount = getSelectedIndexes().length;
    const safeCount = currentResult?.removalIndexes.length ?? 0;

    selectionSummary.textContent = safeCount
        ? `${selectedCount} of ${safeCount} safe removal${safeCount === 1 ? "" : "s"} selected. Nothing changes until you confirm.`
        : "No safe removals are available.";
    proposedSvg = "";
    updateActions();
}

function denyProtectedAction(error) {
    proposedSvg = "";
    downloadButton.disabled = true;
    approval = null;
    updateActions();
    selectionSummary.textContent = error?.message
        || "Tool access could not be verified. Sign in and try again.";
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
        const location = (element, index, segment) =>
            `${element.tagName} ${index + 1}${segment === undefined ? "" : `, command ${segment + 1}`}`;
        const kept = location(proposal.keptElement, proposal.keptIndex, proposal.keptSegmentIndex);
        const duplicate = location(proposal.duplicateElement, proposal.duplicateIndex, proposal.duplicateSegmentIndex);
        title.textContent = isSafe
            ? `Keep ${kept}. Remove duplicate ${duplicate}.`
            : `Review ${kept} and ${duplicate}.`;
        const details = document.createElement("span");
        details.className = "eco-muted";
        details.textContent = ` Exact geometry: ${formatGeometry(proposal.geometryKey, proposal.outline)}. ${proposal.reason}`;

        option.append(checkbox, " ", title, details);
        proposalList.append(option);
    });

    updateSelection();
}

fileInput.addEventListener("change", async () => {
    const version = ++uploadVersion;
    selectionVersion += 1;
    pending = false;
    approval = null;
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
        const text = await file.text();
        if (version !== uploadVersion) return;
        originalFileName = file.name;
        sourceSvg = text;
        const result = analyzeDuplicateGeometry(sourceSvg);
        currentResult = result;
        const duplicateCount = result.removalIndexes.length;
        const reviewCount = result.proposals.filter(
            (proposal) => proposal.recommendation === "review"
        ).length;

        status.textContent = result.proposals.length
            ? `${result.proposals.length} matching cuts found. ${duplicateCount} eligible for removal.`
            : "No matching cuts were found in the scanned geometry.";
        summary.textContent = `${result.scannedSegmentCount} segments or outlines scanned. ${result.unsupported.length} elements supplied no supported geometry.`;
        review.textContent = reviewCount
            ? `${reviewCount} match(es) need manual review. Each finding describes why.`
            : "No questionable exact matches require review.";
        renderProposals(result);
    } catch (error) {
        if (version !== uploadVersion) return;
        status.textContent = error.message;
        summary.textContent = "No changes were proposed.";
        review.textContent = "";
        selectionSummary.textContent = "";
    }
});

confirmButton.addEventListener("click", async () => {
    if (!sourceSvg || !currentResult || pending || hasCurrentApproval()) return;
    const version = uploadVersion, selection = selectionVersion, source = sourceSvg;
    const indexes = getSelectedIndexes();
    if (!indexes.length) return;
    pending = true;
    updateActions();
    try {
        const result = await runWithFreshDuplicateGeometryAccess(refreshSession, () => {
            if (version !== uploadVersion) return null;
            if (selection !== selectionVersion || source !== sourceSvg) throw new Error("Selections changed. Review and confirm again.");
            return createDuplicateRemovalSvg(source, indexes);
        });
        if (version !== uploadVersion || !result) return;
        proposedSvg = result.svgText;
        approval = result.removedCount ? { upload: version, selection } : null;
        selectionSummary.textContent = `${result.removedCount} selected duplicate line${result.removedCount === 1 ? "" : "s"} prepared for removal. Review complete; the original file remains unchanged.`;
    } catch (error) {
        if (version === uploadVersion) denyProtectedAction(error);
    } finally {
        if (version === uploadVersion) { pending = false; updateActions(); }
    }
});

downloadButton.addEventListener("click", async () => {
    if (!hasCurrentApproval() || pending) return;
    const version = uploadVersion, selection = selectionVersion, output = proposedSvg, name = originalFileName;
    pending = true;
    updateActions();
    try {
        await runWithFreshDuplicateGeometryAccess(refreshSession, () => {
            if (version !== uploadVersion) return;
            if (selection !== selectionVersion || !hasCurrentApproval() || output !== proposedSvg) throw new Error("Approval changed. Review and confirm again.");
            const url = URL.createObjectURL(new Blob([output], { type: "image/svg+xml" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = name.replace(/\.svg$/i, "-duplicates-removed.svg");
            link.click();
            URL.revokeObjectURL(url);
        });
    } catch (error) {
        if (version === uploadVersion) denyProtectedAction(error);
    } finally {
        if (version === uploadVersion) { pending = false; updateActions(); }
    }
});
