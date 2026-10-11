import {
    inspectStrayNodeSvg,
    presentStrayNodeFinding,
    readLocalSvgFile,
} from "./modules/strayNodeBrowserAdapter.js";

const fileInput = document.querySelector("#stray-node-file");
const results = document.querySelector("#stray-node-results");
const status = document.querySelector("#stray-node-status");
const summary = document.querySelector("#stray-node-summary");
const findings = document.querySelector("#stray-node-findings");

function renderFinding(finding) {
    const presentation = presentStrayNodeFinding(finding);
    const card = document.createElement("article");
    card.className = "eco-card";
    const title = document.createElement("h3");
    title.className = "eco-heading";
    title.textContent = presentation.title;
    const geometry = document.createElement("p");
    geometry.textContent = `Affected geometry: ${presentation.geometry}`;
    const reason = document.createElement("p");
    reason.textContent = presentation.reason;
    const confidence = document.createElement("p");
    confidence.className = "eco-muted";
    confidence.textContent = `Confidence: ${presentation.confidence}. Review only; no automatic repair.`;
    card.append(title, geometry, reason, confidence);
    return card;
}

fileInput.addEventListener("change", async () => {
    results.hidden = false;
    findings.replaceChildren();
    status.textContent = "Inspecting the local SVG…";
    summary.textContent = "";

    try {
        const source = await readLocalSvgFile(fileInput.files?.[0]);
        const inspection = inspectStrayNodeSvg(source);
        status.textContent = inspection.findings.length
            ? `${inspection.findings.length} review finding${inspection.findings.length === 1 ? "" : "s"} detected.`
            : "No supported stray-node findings were detected.";
        summary.textContent = `${inspection.elementCount} supported or reviewable element${inspection.elementCount === 1 ? "" : "s"} inspected; ${inspection.unsupported.length} unsupported element${inspection.unsupported.length === 1 ? "" : "s"} flagged for review. No geometry was changed.`;
        findings.replaceChildren(...inspection.findings.map(renderFinding));
    } catch (error) {
        status.textContent = error?.message || "The SVG could not be inspected.";
        summary.textContent = "No geometry was changed.";
    }
});
