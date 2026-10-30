import { inspectCurveSvg } from "./modules/curveAnalyzer.js";
import { renderCurvePreview, highlightCurveFinding } from "./modules/curvePreview.js";
import { readLocalSvgFile } from "./modules/strayNodeBrowserAdapter.js";
import { createCurveRepairSession } from "./modules/curveRepair.js";
import { runWithFreshCurveAccess } from "./modules/curveAccess.js";
import { downloadCleanedSvg } from "./modules/strayNodeDownload.js";

export function initializeCurvePage({ refreshSession } = {}) {
    const file = document.querySelector("#curve-file"), results = document.querySelector("#curve-results");
    const status = document.querySelector("#curve-status"), summary = document.querySelector("#curve-summary");
    const preview = document.querySelector("#curve-preview"), previewStatus = document.querySelector("#curve-preview-status");
    const list = document.querySelector("#curve-findings"), selection = document.querySelector("#curve-selection");
    const repairButton = document.querySelector("#curve-repair"), downloadButton = document.querySelector("#curve-download");
    const execution = document.querySelector("#curve-execution"), access = document.querySelector("#curve-access"), validation = document.querySelector("#curve-validation");
    let version = 0, eligible = new Set();
    let session = null, completed = false, pending = false, downloadReady = false, executedCount = 0, filename = "drawing.svg";
    function selectedIds() {
        return [...new Set([...list.querySelectorAll('input[type="checkbox"]:checked')]
            .filter((input) => !input.disabled && eligible.has(input.dataset.proposalId)).map((input) => input.dataset.proposalId))];
    }
    function updateSelection() {
        const ids = selectedIds();
        repairButton.disabled = pending || completed || !session || ids.length === 0;
        downloadButton.disabled = pending || !downloadReady;
        selection.textContent = completed ? "0 proposals selected. This batch is complete; upload an SVG to begin a new review."
            : `${ids.length} of ${eligible.size} geometry-preserving proposals selected. Nothing changes before authorized repair.`;
    }
    function reset() {
        session = null; completed = false; pending = false; downloadReady = false; executedCount = 0;
        execution.textContent = ""; validation.textContent = "Download requires a successful validated repair.";
        access.textContent = "Upload, scan and review are free. Repair and download require verified Curve Repair or universal lifetime access.";
        eligible = new Set(); list.replaceChildren(); preview.replaceChildren(); summary.textContent = "";
        previewStatus.textContent = "Use a numbered finding to highlight its location. Unsupported paths remain text-only.";
        updateSelection();
    }
    function renderInspection(inspection) {
        const rendered = renderCurvePreview(preview, inspection.paths, inspection.findings);
        eligible = new Set(completed ? [] : inspection.proposals.map(({ id }) => id));
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
                note.textContent = completed && finding.proposalId ? "Not included in the completed batch. Upload an SVG to begin another review."
                    : "Manual review only — excluded from repair selection."; card.append(note);
            }
            if (rendered.markers.has(finding.id)) {
                const action = document.createElement("button"); action.type = "button"; action.className = "eco-button eco-button--secondary";
                action.textContent = `Highlight location for finding ${finding.number}`;
                action.addEventListener("click", () => { highlightCurveFinding(rendered, finding); previewStatus.textContent = `Finding ${finding.number} highlighted. ${completed ? "Validated working copy; original upload preserved." : "Source path data is unchanged."}`; });
                card.append(action);
            }
            return card;
        }));
        updateSelection();
    }

    async function withAccess(action) {
        if (pending || !session) return;
        const current = version, currentSession = session;
        pending = true; access.textContent = "Checking shared account access…"; updateSelection();
        try {
            await runWithFreshCurveAccess(refreshSession, () => {
                if (current !== version || currentSession !== session) return;
                access.textContent = "Curve Repair access verified.";
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
                renderCurvePreview(staged, inspection.paths, inspection.findings);
                return true;
            });
            execution.textContent = `${outcome.executedCount} repairs executed; ${outcome.skippedCount} skipped. ${outcome.ok ? "Original upload preserved." : `${outcome.reason} Attempted batch discarded; previous valid state preserved.`}`;
            if (!outcome.ok) return;
            completed = true; executedCount = outcome.executedCount; downloadReady = true;
            renderInspection(outcome.inspection);
            previewStatus.textContent = "Validated repaired working copy. Remaining warnings can still be highlighted.";
            results.dataset.state = "repaired";
            status.textContent = "Selected redundant cubic segments removed and validated.";
            summary.textContent = `${outcome.executedCount} repairs executed; ${outcome.skippedCount} skipped; ${outcome.inspection.findings.length} findings remain. Retained path data and unrelated geometry preserved.`;
            validation.textContent = "SVG, exact retained geometry, removal count and serialization round-trip validation passed. Download is ready.";
        });
    });

    downloadButton.addEventListener("click", () => {
        if (pending || !completed || !session || !downloadReady) return;
        return withAccess(() => {
            try {
                const { svgText } = session.prepareDownload(executedCount);
                downloadCleanedSvg(svgText, filename);
                validation.textContent = "Final validation passed. Cleaned SVG download started; original upload preserved.";
            } catch (error) {
                downloadReady = false; validation.textContent = `Download blocked: ${error.message}`;
            }
        });
    });

    file.addEventListener("change", async () => {
        const current = ++version;
        reset(); results.dataset.state = "loading"; results.setAttribute("aria-busy", "true");
        filename = file.files?.[0]?.name || "drawing.svg";
        status.textContent = "Inspecting local curve geometry…";
        try {
            const source = await readLocalSvgFile(file.files?.[0]);
            if (current !== version) return;
            const inspection = inspectCurveSvg(source);
            session = inspection.proposals.length ? createCurveRepairSession(source) : null;
            renderInspection(inspection);
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
