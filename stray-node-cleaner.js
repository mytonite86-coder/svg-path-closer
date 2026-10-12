import {
    inspectStrayNodeSvg,
    presentStrayNodeFinding,
    readLocalSvgFile,
} from "./modules/strayNodeBrowserAdapter.js";
import {
    createStrayNodePreviewModel,
    getFindingPreviewKey,
    renderStrayNodePreview,
    setPreviewHighlight,
} from "./modules/strayNodePreview.js";
import { planExactCoincidentNodeRepairs } from "./modules/strayNodeRepairPlanner.js";

const CATEGORY_LABELS = Object.freeze({
    "coincident-node": "Coincident nodes",
    "near-coincident-node": "Near-coincident nodes",
    "microscopic-segment": "Microscopic segments",
    "isolated-endpoints": "Open endpoints",
    "malformed-closure": "Possible malformed closures",
    "unsupported-geometry": "Unsupported geometry",
});

function formatNumber(value) {
    return Number.isFinite(value) ? Number(value.toPrecision(6)).toString() : null;
}

function formatPoint(point) {
    const x = formatNumber(point?.x);
    const y = formatNumber(point?.y);
    return x === null || y === null ? null : `(${x}, ${y})`;
}

export function describeFindingCertainty(finding) {
    if (finding.classification === "unsupported-geometry") {
        return { key: "unsupported", label: "Unsupported geometry — not analyzed" };
    }
    if (finding.confidence === "deterministic" && finding.ambiguity === false) {
        return { key: "definite", label: "Definite finding" };
    }
    return { key: "possible", label: "Possible finding — review required" };
}

export function describeFindingLocation(finding) {
    const measurements = finding.measurements || {};
    const details = [];

    if (Number.isInteger(measurements.segmentIndex)) {
        details.push(`Segment ${measurements.segmentIndex + 1}`);
    }
    const segmentLength = formatNumber(measurements.segmentLength);
    if (segmentLength !== null) details.push(`length ${segmentLength}`);
    const closureDistance = formatNumber(measurements.closureDistance);
    if (closureDistance !== null) details.push(`closure gap ${closureDistance}`);
    const start = formatPoint(measurements.start);
    const end = formatPoint(measurements.end);
    if (start && end) details.push(`endpoints ${start} to ${end}`);
    if (Number.isInteger(measurements.nodeCount)) {
        details.push(`${measurements.nodeCount} analysis node${measurements.nodeCount === 1 ? "" : "s"} available`);
    }

    return details.length ? details.join("; ") : "No additional location measurements are available.";
}

export function summarizeFindingCategories(findings) {
    const counts = new Map();
    for (const finding of findings) {
        counts.set(finding.classification, (counts.get(finding.classification) || 0) + 1);
    }
    return [...counts.entries()].map(([classification, count]) => ({
        classification,
        label: CATEGORY_LABELS[classification] || "Other review findings",
        count,
    }));
}

export function buildFindingPresentation(finding) {
    return {
        ...presentStrayNodeFinding(finding),
        certainty: describeFindingCertainty(finding),
        location: describeFindingLocation(finding),
    };
}

export function previewModelToPlannerElements(previewModel) {
    if (!Array.isArray(previewModel?.shapes)) return [];
    return previewModel.shapes.map((shape) => ({
        id: shape.elementId,
        type: shape.sourceType,
        closed: shape.shapeType === "polygon",
        nodes: shape.nodes.map(({ x, y }) => ({ x, y })),
    }));
}

export function buildRepairProposalPresentation(proposal) {
    return {
        id: proposal.id,
        geometry: `${proposal.elementRef.type} #${proposal.elementRef.id}`,
        location: `Segment ${proposal.sourceRef.segmentIndex + 1}; redundant node ${proposal.sourceRef.redundantNodeIndex + 1}`,
        coordinate: formatPoint(proposal.before.coordinate),
        before: proposal.before.description,
        after: proposal.after.description,
        beforeNodeCount: proposal.before.nodeCount,
        afterNodeCount: proposal.after.nodeCount,
        reviewLabel: "Requires customer review — this proposal has not been applied.",
        requiresReview: proposal.requiresReview === true,
        applied: false,
    };
}

export function summarizeRepairRejections(rejections) {
    const groups = new Map();
    for (const item of Array.isArray(rejections) ? rejections : []) {
        const key = `${item.code}\u0000${item.reason}`;
        const existing = groups.get(key);
        groups.set(key, existing
            ? { ...existing, count: existing.count + 1 }
            : { code: item.code, reason: item.reason, count: 1 });
    }
    return [...groups.values()];
}

if (typeof document !== "undefined") {
    const fileInput = document.querySelector("#stray-node-file");
    const results = document.querySelector("#stray-node-results");
    const status = document.querySelector("#stray-node-status");
    const summary = document.querySelector("#stray-node-summary");
    const categories = document.querySelector("#stray-node-categories");
    const categoryList = document.querySelector("#stray-node-category-list");
    const previewPanel = document.querySelector("#stray-node-preview-panel");
    const previewStatus = document.querySelector("#stray-node-preview-status");
    const previewSvg = document.querySelector("#stray-node-preview");
    const repairReview = document.querySelector("#stray-node-repair-review");
    const repairStatus = document.querySelector("#stray-node-repair-status");
    const repairProposals = document.querySelector("#stray-node-repair-proposals");
    const repairRejections = document.querySelector("#stray-node-repair-rejections");
    const repairRejectionList = document.querySelector("#stray-node-repair-rejection-list");
    const findings = document.querySelector("#stray-node-findings");

    function setReviewState(state, message) {
        results.dataset.state = state;
        results.setAttribute("aria-busy", state === "loading" ? "true" : "false");
        status.textContent = message;
    }

    function renderFinding(finding, previewModel, renderedGeometry) {
        const presentation = buildFindingPresentation(finding);
        const card = document.createElement("article");
        card.className = "eco-card";
        card.dataset.certainty = presentation.certainty.key;
        const title = document.createElement("h4");
        title.className = "eco-heading";
        title.textContent = presentation.title;
        const certainty = document.createElement("p");
        certainty.className = "eco-status";
        certainty.textContent = presentation.certainty.label;
        const geometry = document.createElement("p");
        geometry.textContent = `Affected geometry: ${presentation.geometry}`;
        const location = document.createElement("p");
        location.textContent = `Available location details: ${presentation.location}`;
        const reason = document.createElement("p");
        reason.textContent = presentation.reason;
        const confidence = document.createElement("p");
        confidence.className = "eco-muted";
        confidence.textContent = `Analyzer confidence: ${presentation.confidence}. Review only; no automatic repair.`;
        const mappingKey = previewModel ? getFindingPreviewKey(finding, previewModel) : null;
        const previewAction = document.createElement(mappingKey ? "button" : "p");
        if (mappingKey) {
            previewAction.type = "button";
            previewAction.className = "eco-button eco-button--secondary";
            previewAction.textContent = "Highlight affected geometry";
            previewAction.addEventListener("click", () => {
                setPreviewHighlight(renderedGeometry, mappingKey);
                previewStatus.textContent = `Highlighted ${presentation.geometry}. The preview remains read-only.`;
            });
        } else {
            previewAction.className = "eco-muted";
            previewAction.textContent = "Preview mapping: text-only because no unique supported geometry mapping is available.";
        }
        card.append(title, certainty, geometry, location, reason, confidence, previewAction);
        return card;
    }

    function renderCategories(items) {
        categoryList.replaceChildren(...items.map(({ label, count }) => {
            const item = document.createElement("li");
            item.textContent = `${label}: ${count}`;
            return item;
        }));
        categories.hidden = items.length === 0;
    }

    function renderRepairProposal(proposal) {
        const presentation = buildRepairProposalPresentation(proposal);
        const card = document.createElement("article");
        card.className = "eco-card";
        card.dataset.proposalId = presentation.id;
        const title = document.createElement("h4");
        title.className = "eco-heading";
        title.textContent = "Proposed exact coincident-node cleanup";
        const review = document.createElement("p");
        review.className = "eco-status eco-status--accent";
        review.textContent = presentation.reviewLabel;
        const geometry = document.createElement("p");
        geometry.textContent = `Affected geometry: ${presentation.geometry}`;
        const location = document.createElement("p");
        location.textContent = `Source location: ${presentation.location}; coordinate ${presentation.coordinate}.`;
        const before = document.createElement("p");
        before.textContent = `Before (${presentation.beforeNodeCount} nodes): ${presentation.before}`;
        const after = document.createElement("p");
        after.textContent = `Proposed result (${presentation.afterNodeCount} nodes): ${presentation.after}`;
        card.append(title, review, geometry, location, before, after);
        return card;
    }

    function clearRepairReview() {
        repairProposals.replaceChildren();
        repairRejectionList.replaceChildren();
        repairRejections.hidden = true;
        repairReview.hidden = true;
        repairStatus.textContent = "";
    }

    function renderRepairPlan(plan) {
        repairReview.hidden = false;
        repairProposals.replaceChildren(...plan.proposals.map(renderRepairProposal));
        repairStatus.textContent = plan.proposals.length
            ? `${plan.proposals.length} planner-approved proposal${plan.proposals.length === 1 ? "" : "s"} available for customer review. Nothing has been applied.`
            : "No eligible exact coincident-node repair proposals are available. Nothing has been applied.";
        const rejectionGroups = summarizeRepairRejections(plan.rejections);
        repairRejectionList.replaceChildren(...rejectionGroups.map(({ reason, count }) => {
            const item = document.createElement("li");
            item.textContent = `${reason} (${count} finding${count === 1 ? "" : "s"})`;
            return item;
        }));
        repairRejections.hidden = rejectionGroups.length === 0;
    }

    fileInput.addEventListener("change", async () => {
        findings.replaceChildren();
        renderCategories([]);
        previewSvg.replaceChildren();
        previewPanel.hidden = true;
        previewStatus.textContent = "Select a mapped finding to highlight its geometry.";
        clearRepairReview();
        summary.textContent = "";
        setReviewState("loading", "Inspecting the local SVG…");

        try {
            const source = await readLocalSvgFile(fileInput.files?.[0]);
            const inspection = inspectStrayNodeSvg(source);
            let previewModel = null;
            let renderedGeometry = new Map();
            try {
                previewModel = createStrayNodePreviewModel(source);
                renderedGeometry = renderStrayNodePreview(previewSvg, previewModel);
                previewPanel.hidden = false;
            } catch {
                previewStatus.textContent = "No safely renderable geometry is available. Findings remain text-only.";
            }
            const repairPlan = planExactCoincidentNodeRepairs(
                previewModelToPlannerElements(previewModel),
                inspection
            );
            renderCategories(summarizeFindingCategories(inspection.findings));
            renderRepairPlan(repairPlan);
            findings.replaceChildren(...inspection.findings.map((finding) =>
                renderFinding(finding, previewModel, renderedGeometry)
            ));
            setReviewState(
                "complete",
                inspection.findings.length
                    ? `${inspection.findings.length} review finding${inspection.findings.length === 1 ? "" : "s"} detected. Definite and possible findings are labeled separately.`
                    : "Inspection complete. No supported stray-node findings were detected."
            );
            summary.textContent = `${inspection.elementCount} supported or reviewable element${inspection.elementCount === 1 ? "" : "s"} inspected; ${inspection.unsupported.length} unsupported element${inspection.unsupported.length === 1 ? "" : "s"} flagged for review. No geometry was changed.`;
        } catch (error) {
            findings.replaceChildren();
            renderCategories([]);
            clearRepairReview();
            setReviewState("error", error?.message || "The SVG could not be inspected.");
            summary.textContent = "Inspection stopped safely. No geometry was changed.";
        }
    });
}
