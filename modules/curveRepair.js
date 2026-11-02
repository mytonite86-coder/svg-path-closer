import { inspectCurveDocument, parseCurvePathData } from "./curveAnalyzer.js";
import { parseSvg, serializeSvg, validateSvgText } from "./pathCloser.js";

function geometrySignature(command) {
    return { type: command.type, sourceCommand: command.sourceCommand, explicit: command.explicit, exactGeometry: command.exactGeometry };
}

export function createCurveRepairSession(source, { DOMParser: Parser = globalThis.DOMParser } = {}) {
    const original = new Parser().parseFromString(source, "image/svg+xml");
    const initial = inspectCurveDocument(original);
    const baseline = original.cloneNode(true);
    let accepted = null, expected = null, successfulIds = [], changes = [];

    function sameContent(first, second) {
        const a = first.cloneNode(true), b = second.cloneNode(true);
        a.normalize(); b.normalize();
        return a.isEqualNode(b);
    }
    function validateCopy(document, expectation, records, count) {
        if (!original.isEqualNode(baseline)) throw new Error("The original source changed; selections are stale.");
        const inspection = inspectCurveDocument(document);
        const nodes = [...document.querySelectorAll("path")];
        if (nodes.length !== initial.pathCount || !sameContent(document, expectation)) throw new Error("Validation failed: unrelated SVG content or path data changed.");
        let removedCount = 0;
        for (const record of records) {
            if (nodes[record.pathIndex]?.getAttribute("d") !== record.after) throw new Error("Validation failed: repaired source text differs.");
            const before = parseCurvePathData(record.before), after = parseCurvePathData(record.after);
            if (!before.supported || !after.supported || before.subpathCount !== after.subpathCount || before.hasClose !== after.hasClose) {
                throw new Error("Validation failed: path syntax, subpaths or closure changed.");
            }
            const removed = new Set(record.segmentIndexes);
            const retained = before.commands.filter((_command, index) => !removed.has(index));
            if (JSON.stringify(retained.map(geometrySignature)) !== JSON.stringify(after.commands.map(geometrySignature))) {
                throw new Error("Validation failed: retained commands, exact endpoints or control points changed.");
            }
            removedCount += before.commands.length - after.commands.length;
        }
        if (removedCount !== count) throw new Error("Validation failed: removed segment count differs from the repair record.");
        return inspection;
    }
    function validatedText(document, expectation, records, count) {
        validateCopy(document, expectation, records, count);
        const svgText = serializeSvg(document.cloneNode(true));
        const validation = validateSvgText(svgText);
        if (!validation.isValid) throw new Error(validation.message || "Invalid repaired SVG.");
        validateCopy(parseSvg(svgText), expectation, records, count);
        return svgText;
    }

    return {
        get workingDocument() { return accepted?.cloneNode(true) || null; },
        execute(selectedIds, validatePreview = () => true) {
            const ids = Array.isArray(selectedIds) ? selectedIds : [];
            const refused = (reason) => ({ ok: false, executedCount: 0, skippedCount: ids.length, reason });
            if (accepted) return refused("This upload already has a completed repair batch. Upload an SVG for a new review.");
            try {
                if (!ids.length || !ids.every((id) => typeof id === "string")) throw new Error("Select eligible curve proposals first.");
                if (new Set(ids).size !== ids.length) throw new Error("Conflicting repeated repair selections.");
                if (!original.isEqualNode(baseline)) throw new Error("Source changed after review; selections are stale.");
                const fresh = inspectCurveDocument(original);
                const approved = new Map(fresh.proposals.map((proposal) => [proposal.id, proposal]));
                const reviewed = new Map(initial.proposals.map((proposal) => [proposal.id, proposal]));
                const groups = new Map();
                for (const id of ids) {
                    const proposal = approved.get(id);
                    if (!proposal || JSON.stringify(proposal) !== JSON.stringify(reviewed.get(id))) throw new Error("Unsafe, stale, unsupported or unknown curve proposal.");
                    const group = groups.get(proposal.pathIndex) || [];
                    group.push(proposal); groups.set(proposal.pathIndex, group);
                }
                const originalPaths = [...original.querySelectorAll("path")];
                const records = [];
                for (const [pathIndex, proposals] of groups) {
                    const before = originalPaths[pathIndex].getAttribute("d");
                    const ordered = [...proposals].sort((a, b) => a.sourceRef.start - b.sourceRef.start);
                    if (new Set(ordered.map(({ segmentIndex }) => segmentIndex)).size !== ordered.length) throw new Error("Conflicting segment selections.");
                    for (let index = 0; index < ordered.length; index++) {
                        const { sourceRef, segmentIndex } = ordered[index];
                        const segment = fresh.paths[pathIndex].parsed.commands[segmentIndex];
                        if (!Number.isInteger(sourceRef.start) || !Number.isInteger(sourceRef.end) || sourceRef.start < 0 || sourceRef.end <= sourceRef.start
                            || sourceRef.end > before.length || before.slice(sourceRef.start, sourceRef.end) !== sourceRef.text
                            || !segment.collapsed || !segment.explicit || segment.sourceCommand.toUpperCase() !== "C") throw new Error("Stale or invalid cubic source mapping.");
                        if (index && ordered[index - 1].sourceRef.end > sourceRef.start) throw new Error("Conflicting overlapping source ranges.");
                    }
                    let after = before;
                    for (const { sourceRef } of [...ordered].reverse()) after = after.slice(0, sourceRef.start) + after.slice(sourceRef.end);
                    records.push({ pathIndex, before, after, segmentIndexes: ordered.map(({ segmentIndex }) => segmentIndex) });
                }
                const working = original.cloneNode(true), expectation = baseline.cloneNode(true);
                for (const document of [working, expectation]) {
                    const paths = [...document.querySelectorAll("path")];
                    for (const { pathIndex, after } of records) paths[pathIndex].setAttribute("d", after);
                }
                const inspection = validateCopy(working, expectation, records, ids.length);
                if (validatePreview(working, inspection) !== true) throw new Error("Working preview validation failed.");
                validatedText(working, expectation, records, ids.length);
                accepted = working.cloneNode(true); expected = expectation; changes = records; successfulIds = [...ids];
                return { ok: true, executedCount: ids.length, skippedCount: 0, workingDocument: working, inspection };
            } catch (error) {
                return refused(error?.message || "Repair failed; the attempted batch was discarded.");
            }
        },
        prepareDownload(recordedCount) {
            if (!accepted || !Number.isInteger(recordedCount) || recordedCount < 1 || successfulIds.length !== recordedCount
                || new Set(successfulIds).size !== recordedCount) throw new Error("Download blocked: no matching successful repair record.");
            return { svgText: validatedText(accepted, expected, changes, recordedCount), executedCount: successfulIds.length };
        },
    };
}
