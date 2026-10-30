import { inspectOverlappingSvg } from "./modules/overlappingShapes.js";
import { renderOverlappingPreview, highlightOverlappingFinding } from "./modules/overlappingShapePreview.js";
import { readLocalSvgFile } from "./modules/strayNodeBrowserAdapter.js";

export function initializeOverlappingShapePage() {
    const file = document.querySelector("#overlap-file");
    const results = document.querySelector("#overlap-results");
    const status = document.querySelector("#overlap-status");
    const summary = document.querySelector("#overlap-summary");
    const preview = document.querySelector("#overlap-preview");
    const previewStatus = document.querySelector("#overlap-preview-status");
    const list = document.querySelector("#overlap-findings");
    const selection = document.querySelector("#overlap-selection");
    let version = 0;
    let eligible = new Set();

    function updateSelection() {
        const selected = new Set([...list.querySelectorAll('input[type="checkbox"]:checked')]
            .filter((input) => !input.disabled && eligible.has(input.dataset.proposalId)).map((input) => input.dataset.proposalId));
        selection.textContent = `${selected.size} of ${eligible.size} eligible removal proposals selected. No repairs are performed in this block.`;
    }
    function reset() {
        eligible = new Set();
        list.replaceChildren();
        preview.replaceChildren();
        summary.textContent = "";
        previewStatus.textContent = "Use a finding's Highlight geometry button. Numbers identify source shapes.";
        updateSelection();
    }

    file.addEventListener("change", async () => {
        const current = ++version;
        reset();
        results.dataset.state = "loading";
        results.setAttribute("aria-busy", "true");
        status.textContent = "Inspecting the local SVG…";
        try {
            const source = await readLocalSvgFile(file.files?.[0]);
            if (current !== version) return;
            const inspection = inspectOverlappingSvg(source);
            const rendered = renderOverlappingPreview(preview, inspection.shapes);
            eligible = new Set(inspection.proposals.map(({ id }) => id));
            const labels = { "exact-duplicate": "Exact duplicate geometry", "possible-overlap": "Possible overlap — manual review", "unsupported-geometry": "Unsupported geometry — manual review" };
            list.replaceChildren(...inspection.findings.map((finding) => {
                const card = document.createElement("article");
                card.className = "eco-card";
                card.dataset.findingId = finding.id;
                const title = document.createElement("h3");
                title.className = "eco-heading";
                title.textContent = `Finding ${finding.number}: ${labels[finding.kind]}`;
                const geometry = document.createElement("p");
                geometry.textContent = finding.indexes.map((index) => inspection.shapes[index]?.label).filter(Boolean).join(" and ") || "Additional geometry outside the inspection limit";
                const reason = document.createElement("p");
                reason.textContent = finding.reason;
                card.append(title, geometry, reason);
                if (finding.proposalId && eligible.has(finding.proposalId)) {
                    const option = document.createElement("label");
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = false;
                    checkbox.dataset.proposalId = finding.proposalId;
                    checkbox.addEventListener("change", updateSelection);
                    option.append(checkbox, ` Select removal proposal for finding ${finding.number} (keep the first shape).`);
                    card.append(option);
                } else {
                    const note = document.createElement("p");
                    note.className = "eco-muted";
                    note.textContent = "Manual review only — excluded from repair selection.";
                    card.append(note);
                }
                const mapped = finding.indexes.filter((index) => rendered.has(index));
                if (mapped.length) {
                    const highlight = document.createElement("button");
                    highlight.type = "button";
                    highlight.className = "eco-button eco-button--secondary";
                    highlight.textContent = `Highlight geometry for finding ${finding.number}`;
                    highlight.addEventListener("click", () => {
                        highlightOverlappingFinding(rendered, mapped);
                        previewStatus.textContent = `Finding ${finding.number}: highlighted source shapes ${mapped.map((index) => index + 1).join(", ")}. The original SVG is unchanged.`;
                    });
                    card.append(highlight);
                }
                return card;
            }));
            updateSelection();
            status.textContent = inspection.findings.length ? `${inspection.findings.length} numbered findings available for review.` : "Inspection complete. No overlap findings in the supported scope.";
            summary.textContent = `${inspection.inspectedCount} of ${inspection.shapeCount} shapes inspected; ${inspection.proposals.length} eligible removal proposals. Unsupported geometry remains unchanged. No repairs were executed.`;
            results.dataset.state = "complete";
        } catch (error) {
            if (current !== version) return;
            reset();
            results.dataset.state = "error";
            status.textContent = error.message || "The SVG could not be inspected.";
        } finally {
            if (current === version) results.setAttribute("aria-busy", "false");
        }
    });
}

if (typeof document !== "undefined") initializeOverlappingShapePage();
