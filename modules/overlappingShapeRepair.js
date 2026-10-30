import { getOverlappingSourceElements, inspectOverlappingDocument } from "./overlappingShapes.js";
import { parseSvg, serializeSvg, validateSvgText } from "./pathCloser.js";

export function createOverlappingRepairSession(source, { DOMParser: Parser = globalThis.DOMParser } = {}) {
    const original = new Parser().parseFromString(source, "image/svg+xml");
    const initial = inspectOverlappingDocument(original);
    const baseline = original.cloneNode(true);
    let accepted = null;
    let expectation = null;
    let successfulIds = [];

    function sameContent(first, second) {
        // Removing an element can leave adjacent text nodes. XML round-tripping
        // merges them; normalize private clones without changing any text content.
        const a = first.cloneNode(true), b = second.cloneNode(true);
        a.normalize();
        b.normalize();
        return a.isEqualNode(b);
    }

    function validateCopy(document, expected, count) {
        if (!original.isEqualNode(baseline)) throw new Error("The source changed; start a new review.");
        const inspection = inspectOverlappingDocument(document);
        if (initial.shapeCount - inspection.shapeCount !== count || !sameContent(document, expected)) {
            throw new Error("Validation failed: selected removals or unrelated SVG content differ.");
        }
        return inspection;
    }
    function validatedText(document, expected, count) {
        validateCopy(document, expected, count);
        const svgText = serializeSvg(document.cloneNode(true));
        const validation = validateSvgText(svgText);
        if (!validation.isValid) throw new Error(validation.message || "Invalid repaired SVG.");
        validateCopy(parseSvg(svgText), expected, count);
        return svgText;
    }

    return {
        get workingDocument() { return accepted?.cloneNode(true) || null; },
        execute(selectedIds, validatePreview = () => true) {
            const ids = Array.isArray(selectedIds) ? selectedIds : [];
            const refused = (reason) => ({ ok: false, executedCount: 0, skippedCount: ids.length, reason });
            if (accepted) return refused("This review already has a completed repair batch. Upload an SVG for another review.");
            try {
                if (!ids.length || !ids.every((id) => typeof id === "string")) throw new Error("Select eligible removal proposals first.");
                if (new Set(ids).size !== ids.length) throw new Error("Conflicting repeated repair selections.");
                if (!original.isEqualNode(baseline)) throw new Error("The source changed; selections are stale.");
                const fresh = inspectOverlappingDocument(original);
                const approved = new Map(fresh.proposals.map((proposal) => [proposal.id, proposal]));
                const initialProposals = new Map(initial.proposals.map((proposal) => [proposal.id, proposal]));
                const selected = ids.map((id) => {
                    const proposal = approved.get(id);
                    if (!proposal || JSON.stringify(proposal) !== JSON.stringify(initialProposals.get(id))) {
                        throw new Error("An unsafe, stale or unknown removal proposal was selected.");
                    }
                    return proposal;
                });
                const removals = new Set(selected.map(({ duplicateIndex }) => duplicateIndex));
                if (removals.size !== selected.length || selected.some(({ keptIndex }) => removals.has(keptIndex))) {
                    throw new Error("Conflicting removals would delete a shape another proposal retains.");
                }
                const working = original.cloneNode(true);
                const expected = baseline.cloneNode(true);
                // Both copies start at original indexes. Only approved duplicate nodes
                // are removed; retained/unselected nodes and their entire subtrees stay exact.
                for (const copy of [working, expected]) {
                    const elements = getOverlappingSourceElements(copy);
                    for (const index of [...removals].sort((a, b) => b - a)) {
                        const node = elements[index];
                        if (!node || node.localName !== "rect") throw new Error("Stale rectangle source mapping.");
                        node.parentNode.removeChild(node);
                    }
                }
                const inspection = validateCopy(working, expected, ids.length);
                if (validatePreview(working, inspection) !== true) throw new Error("Working preview validation failed.");
                // Serialization and round-trip validation are part of the transaction.
                // Any failure discards the candidate and leaves the previous valid copy.
                validatedText(working, expected, ids.length);
                accepted = working.cloneNode(true);
                expectation = expected;
                successfulIds = [...ids];
                return { ok: true, executedCount: ids.length, skippedCount: 0, workingDocument: working, inspection };
            } catch (error) {
                return refused(error?.message || "Repair failed; the candidate was discarded.");
            }
        },
        prepareDownload(recordedCount) {
            if (!accepted || !Number.isInteger(recordedCount) || recordedCount < 1
                || recordedCount !== successfulIds.length || new Set(successfulIds).size !== recordedCount) {
                throw new Error("Download blocked: no matching successful repair record.");
            }
            return { svgText: validatedText(accepted, expectation, recordedCount), executedCount: successfulIds.length };
        },
    };
}
