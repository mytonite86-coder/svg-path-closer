import { inspectOverlappingSvg } from "./modules/overlappingShapes.js";
import { renderOverlappingPreview, highlightOverlappingFinding } from "./modules/overlappingShapePreview.js";
import { readLocalSvgFile } from "./modules/strayNodeBrowserAdapter.js";
import { createOverlappingRepairSession } from "./modules/overlappingShapeRepair.js";
import { runWithFreshOverlappingAccess } from "./modules/overlappingShapeAccess.js";
import { downloadCleanedSvg } from "./modules/strayNodeDownload.js";

export function initializeOverlappingShapePage({ refreshSession } = {}) {
    const file = document.querySelector("#overlap-file");
    const results = document.querySelector("#overlap-results");
    const status = document.querySelector("#overlap-status");
    const summary = document.querySelector("#overlap-summary");
    const preview = document.querySelector("#overlap-preview");
    const previewStatus = document.querySelector("#overlap-preview-status");
    const list = document.querySelector("#overlap-findings");
    const selection = document.querySelector("#overlap-selection");
    const repairButton = document.querySelector("#overlap-repair");
    const downloadButton = document.querySelector("#overlap-download");
    const execution = document.querySelector("#overlap-execution");
    const access = document.querySelector("#overlap-access");
    const validation = document.querySelector("#overlap-validation");
    let version = 0;
    let eligible = new Set();
    let session = null;
    let completed = false;
    let pending = false;
    let downloadReady = false;
    let executedCount = 0;
    let filename = "drawing.svg";

    function selectedIds() {
        return [...new Set([...list.querySelectorAll('input[type="checkbox"]:checked')]
            .filter((input) => !input.disabled && eligible.has(input.dataset.proposalId)).map((input) => input.dataset.proposalId))];
    }
    function updateSelection() {
        const selected = selectedIds();
        repairButton.disabled = pending || completed || !session || selected.length === 0;
        downloadButton.disabled = pending || !downloadReady;
        selection.textContent = completed
            ? "0 proposals selected. This repair batch is complete; upload an SVG to begin another review."
            : `${selected.length} of ${eligible.size} eligible removal proposals selected. Nothing changes before an authorized repair.`;
    }
    function reset() {
        session = null;
        completed = false;
        pending = false;
        downloadReady = false;
        executedCount = 0;
        execution.textContent = "";
        validation.textContent = "Download requires a successful validated repair.";
        access.textContent = "Upload, scan and review are free. Repair and download require verified Tool 4 or universal lifetime access.";
        eligible = new Set();
        list.replaceChildren();
        preview.replaceChildren();
        summary.textContent = "";
        previewStatus.textContent = "Use a finding's Highlight geometry button. Numbers identify source shapes.";
        updateSelection();
    }

    function renderInspection(inspection) {
        const rendered = renderOverlappingPreview(preview, inspection.shapes);
        eligible = new Set(completed ? [] : inspection.proposals.map(({ id }) => id));
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
                note.textContent = completed && finding.proposalId
                    ? "Not included in the completed batch. Upload an SVG to start another review."
                    : "Manual review only — excluded from repair selection.";
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
    }

    async function withAccess(action) {
        if (pending || !session) return;
        const current = version;
        const currentSession = session;
        pending = true;
        access.textContent = "Checking shared account access…";
        updateSelection();
        try {
            await runWithFreshOverlappingAccess(refreshSession, () => {
                if (current !== version || currentSession !== session) return;
                access.textContent = "Overlapping Shape Repair access verified.";
                return action();
            });
        } catch (error) {
            if (current === version && currentSession === session) access.textContent = error.message;
        } finally {
            if (current === version && currentSession === session) { pending = false; updateSelection(); }
        }
    }

    repairButton.addEventListener("click", () => {
        if (pending || completed || !session) return;
        const ids = selectedIds();
        if (!ids.length) return;
        return withAccess(() => {
            if (JSON.stringify(ids) !== JSON.stringify(selectedIds())) throw new Error("Selections changed during access verification. Review and try again.");
            const outcome = session.execute(ids, (_working, inspection) => {
                const staged = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                renderOverlappingPreview(staged, inspection.shapes);
                return true;
            });
            execution.textContent = `${outcome.executedCount} repairs executed; ${outcome.skippedCount} skipped. ${outcome.ok ? "Original upload preserved." : `${outcome.reason} Candidate discarded; previous valid copy preserved.`}`;
            if (!outcome.ok) return;
            completed = true;
            executedCount = outcome.executedCount;
            downloadReady = true;
            renderInspection(outcome.inspection);
            previewStatus.textContent = "Validated repaired working copy. Remaining findings can still be highlighted.";
            results.dataset.state = "repaired";
            status.textContent = "Selected safe rectangle removals completed and validated.";
            summary.textContent = `${outcome.executedCount} repairs executed; ${outcome.skippedCount} skipped; ${outcome.inspection.findings.length} findings remain. Unselected and unsupported geometry preserved.`;
            validation.textContent = "SVG, removal count, unchanged content and serialization round-trip validation passed. Download is ready.";
        });
    });

    downloadButton.addEventListener("click", () => {
        if (pending || !downloadReady || !completed || !session) return;
        return withAccess(() => {
            try {
                const { svgText } = session.prepareDownload(executedCount);
                downloadCleanedSvg(svgText, filename);
                validation.textContent = "Final validation passed. Cleaned SVG download started; original upload preserved.";
            } catch (error) {
                downloadReady = false;
                validation.textContent = `Download blocked: ${error.message}`;
            }
        });
    });

    file.addEventListener("change", async () => {
        const current = ++version;
        reset();
        filename = file.files?.[0]?.name || "drawing.svg";
        results.dataset.state = "loading";
        results.setAttribute("aria-busy", "true");
        status.textContent = "Inspecting the local SVG…";
        try {
            const source = await readLocalSvgFile(file.files?.[0]);
            if (current !== version) return;
            const inspection = inspectOverlappingSvg(source);
            session = inspection.proposals.length ? createOverlappingRepairSession(source) : null;
            renderInspection(inspection);
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
