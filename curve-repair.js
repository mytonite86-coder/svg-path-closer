import { inspectCurveSvg } from "./modules/curveAnalyzer.js";
import { renderCurvePreview, highlightCurveFinding } from "./modules/curvePreview.js";
import { readLocalSvgFile } from "./modules/strayNodeBrowserAdapter.js";

export function initializeCurvePage() {
    const file = document.querySelector("#curve-file"), results = document.querySelector("#curve-results");
    const status = document.querySelector("#curve-status"), summary = document.querySelector("#curve-summary");
    const preview = document.querySelector("#curve-preview"), previewStatus = document.querySelector("#curve-preview-status");
    const list = document.querySelector("#curve-findings"), selection = document.querySelector("#curve-selection");
    let version = 0, eligible = new Set();
    function updateSelection() {
        const ids = new Set([...list.querySelectorAll('input[type="checkbox"]:checked')]
            .filter((input) => !input.disabled && eligible.has(input.dataset.proposalId)).map((input) => input.dataset.proposalId));
        selection.textContent = `${ids.size} of ${eligible.size} geometry-preserving proposals selected. No repair is executed in this block.`;
    }
    function reset() {
        eligible = new Set(); list.replaceChildren(); preview.replaceChildren(); summary.textContent = "";
        previewStatus.textContent = "Use a numbered finding to highlight its location. Unsupported paths remain text-only.";
        updateSelection();
    }
    file.addEventListener("change", async () => {
        const current = ++version;
        reset(); results.dataset.state = "loading"; results.setAttribute("aria-busy", "true");
        status.textContent = "Inspecting local curve geometry…";
        try {
            const source = await readLocalSvgFile(file.files?.[0]);
            if (current !== version) return;
            const inspection = inspectCurveSvg(source);
            const rendered = renderCurvePreview(preview, inspection.paths, inspection.findings);
            eligible = new Set(inspection.proposals.map(({ id }) => id));
            list.replaceChildren(...inspection.findings.map((finding) => {
                const card = document.createElement("article"); card.className = "eco-card"; card.dataset.findingId = finding.id;
                const title = document.createElement("h3"); title.className = "eco-heading";
                title.textContent = `Finding ${finding.number}: ${finding.proposalId ? "Geometry-preserving cubic proposal" : "Manual review warning"}`;
                const location = document.createElement("p");
                location.textContent = `${inspection.paths[finding.pathIndex]?.label || "Additional paths"}${finding.segmentIndex === null ? "" : `; command ${finding.segmentIndex + 1}`}`;
                const reason = document.createElement("p"); reason.textContent = finding.reason;
                card.append(title, location, reason);
                if (finding.proposalId && eligible.has(finding.proposalId)) {
                    const option = document.createElement("label"), input = document.createElement("input");
                    input.type = "checkbox"; input.checked = false; input.dataset.proposalId = finding.proposalId;
                    input.addEventListener("change", updateSelection);
                    option.append(input, ` Select proposed redundant segment removal for finding ${finding.number}.`); card.append(option);
                } else {
                    const note = document.createElement("p"); note.className = "eco-muted";
                    note.textContent = "Manual review only — excluded from repair selection."; card.append(note);
                }
                if (rendered.markers.has(finding.id)) {
                    const action = document.createElement("button"); action.type = "button"; action.className = "eco-button eco-button--secondary";
                    action.textContent = `Highlight location for finding ${finding.number}`;
                    action.addEventListener("click", () => { highlightCurveFinding(rendered, finding); previewStatus.textContent = `Finding ${finding.number} highlighted. Source path data is unchanged.`; });
                    card.append(action);
                }
                return card;
            }));
            updateSelection(); results.dataset.state = "complete";
            status.textContent = inspection.findings.length ? `${inspection.findings.length} numbered curve findings available for review.` : "Inspection complete. No supported curve defects detected.";
            summary.textContent = `${inspection.paths.length} of ${inspection.pathCount} paths inspected; ${inspection.proposals.length} eligible proposals. Original SVG unchanged; no curves smoothed, closed or repaired.`;
        } catch (error) {
            if (current !== version) return;
            reset(); results.dataset.state = "error"; status.textContent = error.message || "The SVG could not be inspected.";
        } finally {
            if (current === version) results.setAttribute("aria-busy", "false");
        }
    });
}

if (typeof document !== "undefined") initializeCurvePage();
