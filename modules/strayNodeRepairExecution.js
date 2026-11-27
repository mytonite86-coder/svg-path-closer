import { getStrayCircleGeometry, inspectStrayNodeSvg, normalizeSvgGeometry } from "./strayNodeBrowserAdapter.js";
import { createStrayNodePreviewModel } from "./strayNodePreview.js";
import { planExactCoincidentNodeRepairs } from "./strayNodeRepairPlanner.js";
import { parseSvg, serializeSvg, validateSvgText } from "./pathCloser.js";

// Adapt an in-memory document to the existing analysis/preview APIs. No serialization.
export function inspectWorkingDocument(document) {
    const options = { DOMParser: class { parseFromString() { return document; } } };
    const inspection = inspectStrayNodeSvg("<svg/>", options);
    let previewModel = null;
    try { previewModel = createStrayNodePreviewModel("<svg/>", options); }
    catch (error) {
        if (error.message !== "No safely renderable geometry is available for preview.") throw error;
    }
    return { inspection, previewModel };
}

function geometry(document) {
    return [...document.querySelectorAll("line,polyline,polygon,path")];
}

function planFor(document) {
    const { inspection } = inspectWorkingDocument(document);
    const normalized = geometry(document).map(normalizeSvgGeometry);
    const plan = planExactCoincidentNodeRepairs(normalized.filter(({ supported }) => supported).map(({ element }) => element), inspection);
    const marks = findMarkProposals(document, inspection);
    return {
        ...plan,
        proposals: [...plan.proposals, ...marks],
        rejections: plan.rejections.filter(({ classification, elementId }) =>
            classification !== "small-detached-mark" || !marks.some(({ elementRef }) => elementRef.id === elementId)),
    };
}

function findMarkProposals(document, inspection) {
    const all = [...document.querySelectorAll("*")];
    if (document.doctype || all.some((node) => ["style", "script", "use", "set", "animate", "animateTransform", "animateMotion", "foreignObject"].includes(node.localName)
        || [...(node.attributes ?? [])].some(({ name }) => /^(?:style|href|xlink:href|on)/i.test(name)))) return [];
    const circles = getStrayCircleGeometry(document);
    const linearNodes = geometry(document);
    const allowed = new Set(["cx", "cy", "r", "d", "points", "x1", "y1", "x2", "y2", "fill", "stroke", "stroke-width"]);
    return inspection.findings.filter(({ classification }) => classification === "small-detached-mark").flatMap((finding) => {
        const matching = finding.elementType === "circle"
            ? circles.filter(({ element }) => element.id === finding.elementId).map(({ node }) => node)
            : linearNodes.filter((node, index) =>
            (node.getAttribute("id") || `${node.localName}-${index + 1}`) === finding.elementId
            && node.localName === finding.elementType);
        const [node] = matching;
        if (matching.length !== 1 || node.children.length
            || [...node.attributes].some(({ name }) => !allowed.has(name))
            || node.closest("[transform], defs, symbol, clipPath, mask, pattern, marker, [clip-path], [mask], [filter]")) return [];
        const index = all.indexOf(node);
        if (index === -1) return [];
        return [{
            id: `remove-standalone-mark:${index}`,
            kind: "remove-standalone-mark",
            elementRef: { id: finding.elementId, type: finding.elementType },
            sourceRef: { index },
            before: { coordinate: finding.measurements.point ?? finding.measurements.start, description: "Small standalone geometry." },
            after: { description: "Remove this entire mark from the drawing." },
            requiresReview: true,
            safeToAutoApply: false,
        }];
    });
}

function restoreMarks(document, removals) {
    for (const { parentIndex, childIndex, sourceNode } of [...removals].reverse()) {
        const parent = document.querySelectorAll("*")[parentIndex];
        parent.insertBefore(sourceNode.cloneNode(true), parent.childNodes[childIndex] ?? null);
    }
}

function unchangedTrace(nodes) {
    // Removing repeated adjacent coordinates must preserve the ordered geometric trace.
    return nodes.filter((node, index) => index === 0 || node.x !== nodes[index - 1].x || node.y !== nodes[index - 1].y);
}

export function createStrayNodeRepairSession(source, { DOMParser: Parser = globalThis.DOMParser } = {}) {
    const original = new Parser().parseFromString(source, "image/svg+xml");
    // Validate input using the same browser adapter as inspection.
    const initialPlan = planFor(original);
    let completed = false;
    let acceptedDocument = null;
    let successfulRepairs = [];
    let acceptedChanges = [];
    let acceptedRemovals = [];

    function validateRecordedRepairs(document, recordedCount) {
        if (!completed || !acceptedDocument || !Number.isInteger(recordedCount)
            || recordedCount < 1 || recordedCount !== successfulRepairs.length
            || new Set(successfulRepairs).size !== recordedCount) {
            throw new Error("Final validation failed: successful repair count does not match the repair record.");
        }
        inspectWorkingDocument(document);
        const expected = original.cloneNode(true);
        const nodes = geometry(expected);
        const originalNodes = geometry(original);
        let actualCount = acceptedRemovals.length;
        for (const { index, newPoints } of acceptedChanges) {
            nodes[index].setAttribute("points", newPoints);
            actualCount += normalizeSvgGeometry(originalNodes[index], index).element.nodes.length
                - normalizeSvgGeometry(nodes[index], index).element.nodes.length;
        }
        const elements = [...expected.querySelectorAll("*")];
        for (const { sourceIndex } of acceptedRemovals) elements[sourceIndex].remove();
        expected.normalize?.();
        const comparison = document.cloneNode(true);
        comparison.normalize?.();
        if (actualCount !== recordedCount || !comparison.isEqualNode(expected)) {
            throw new Error("Final validation failed: repair count or unchanged geometry differs.");
        }
    }

    return {
        get plan() { return structuredClone(initialPlan); },
        get workingDocument() { return acceptedDocument?.cloneNode(true) || null; },
        prepareDownload(recordedCount) {
            validateRecordedRepairs(acceptedDocument, recordedCount);
            const svgText = serializeSvg(acceptedDocument.cloneNode(true));
            const validation = validateSvgText(svgText);
            if (!validation.isValid) throw new Error(validation.message || "Final SVG validation failed.");
            const roundTrip = parseSvg(svgText);
            validateRecordedRepairs(roundTrip, recordedCount);
            if (!roundTrip.isEqualNode(acceptedDocument)) throw new Error("Final validation failed: serialization changed SVG content.");
            return { svgText, executedCount: successfulRepairs.length };
        },
        execute(selectedIds, validateWorkingCopy = () => true) {
            const ids = Array.isArray(selectedIds) ? selectedIds : [];
            const refused = (reason) => ({ ok: false, executedCount: 0, skippedCount: ids.length, reason });
            if (completed) return refused("This review has already been repaired. Upload an SVG to start a new review.");
            if (!ids.length) return refused("Select at least one eligible repair proposal.");
            try {
                if (new Set(ids).size !== ids.length) throw new Error("Conflicting duplicate repair selections.");
                const currentPlan = planFor(original);
                const approved = new Map(currentPlan.proposals.map((proposal) => [proposal.id, proposal]));
                const initial = new Map(initialPlan.proposals.map((proposal) => [proposal.id, proposal]));
                const selected = ids.map((id) => {
                    const proposal = approved.get(id);
                    if (!proposal || JSON.stringify(proposal) !== JSON.stringify(initial.get(id))) {
                        throw new Error("An ineligible or stale repair was selected. No repairs were applied.");
                    }
                    return proposal;
                });
                const working = original.cloneNode(true);
                const originalGeometry = geometry(original);
                const workingGeometry = geometry(working);
                const groups = new Map();
                for (const proposal of selected) {
                    if (proposal.kind === "remove-standalone-mark") continue;
                    const index = originalGeometry.findIndex((node, position) => normalizeSvgGeometry(node, position).element.id === proposal.elementRef.id);
                    const group = groups.get(index) || [];
                    group.push(proposal);
                    groups.set(index, group);
                }
                const changed = [];
                for (const [index, proposals] of groups) {
                    const node = workingGeometry[index];
                    // A transformed ancestor is outside the planner's local coordinate context.
                    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
                        if (ancestor.hasAttribute("transform")) throw new Error("Transformed parent geometry requires review.");
                    }
                    const removals = new Set(proposals.map(({ sourceRef }) => sourceRef.redundantNodeIndex));
                    if (removals.size !== proposals.length || proposals.some(({ sourceRef }) => removals.has(sourceRef.previousNodeIndex))) {
                        throw new Error("Conflicting repairs share a node. Select them in separate reviews.");
                    }
                    const before = normalizeSvgGeometry(node, index).element;
                    const after = before.nodes.filter((_point, position) => !removals.has(position));
                    const minimum = before.type === "polygon" ? 3 : 2;
                    if (after.length < minimum || new Set(after.map(({ x, y }) => `${x},${y}`)).size < minimum
                        || JSON.stringify(unchangedTrace(before.nodes)) !== JSON.stringify(unchangedTrace(after))) {
                        throw new Error("Repair validation failed: geometry would change.");
                    }
                    const oldPoints = node.getAttribute("points");
                    const numberPattern = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
                    const tokens = oldPoints.match(numberPattern) || [];
                    if (oldPoints.replace(numberPattern, "").replace(/[\s,]/g, "") || tokens.length !== before.nodes.length * 2) {
                        throw new Error("Repair validation failed: unsupported point-list syntax.");
                    }
                    // Keep surviving numeric text exact; Number rounding must never erase
                    // a real, very small segment or rewrite other coordinates.
                    const pairs = before.nodes.map((_point, position) => tokens.slice(position * 2, position * 2 + 2));
                    for (const { sourceRef } of proposals) {
                        if (JSON.stringify(pairs[sourceRef.previousNodeIndex]) !== JSON.stringify(pairs[sourceRef.redundantNodeIndex])) {
                            throw new Error("Exact source coordinate text differs; precision review is required.");
                        }
                    }
                    const newPoints = pairs.filter((_pair, position) => !removals.has(position)).map((pair) => pair.join(",")).join(" ");
                    node.setAttribute("points", newPoints);
                    const verified = normalizeSvgGeometry(node, index);
                    if (!verified.supported || JSON.stringify(verified.element.nodes) !== JSON.stringify(after)) {
                        throw new Error("Repair validation failed: invalid point list.");
                    }
                    changed.push({ index, oldPoints, newPoints });
                }
                const all = [...working.querySelectorAll("*")];
                const removals = [];
                for (const { sourceRef } of selected.filter(({ kind }) => kind === "remove-standalone-mark")) {
                    const node = all[sourceRef.index];
                    const parent = node.parentElement;
                    removals.push({
                        sourceIndex: sourceRef.index,
                        parentIndex: [...working.querySelectorAll("*")].indexOf(parent),
                        childIndex: [...parent.childNodes].indexOf(node),
                        sourceNode: node.cloneNode(true),
                    });
                    node.remove();
                }
                // Reinspect before committing. The caller can also validate staged preview rendering.
                const view = inspectWorkingDocument(working);
                if (validateWorkingCopy(working, view) !== true) throw new Error("Working copy validation failed.");
                // Prove that every other attribute, element and unsupported subtree is untouched.
                const comparison = working.cloneNode(true);
                restoreMarks(comparison, removals);
                const comparisonGeometry = geometry(comparison);
                for (const { index, oldPoints, newPoints } of changed) {
                    if (comparisonGeometry[index]?.getAttribute("points") !== newPoints) throw new Error("Repair validation failed: repaired points changed.");
                    comparisonGeometry[index].setAttribute("points", oldPoints);
                }
                if (!comparison.isEqualNode(original)) throw new Error("Repair validation failed: unrelated SVG content changed.");
                completed = true;
                acceptedDocument = working.cloneNode(true);
                if (removals.length) acceptedDocument.normalize();
                successfulRepairs = selected.map(({ id }) => id);
                acceptedChanges = changed;
                acceptedRemovals = removals;
                return { ok: true, executedCount: selected.length, skippedCount: 0, workingDocument: working, ...view };
            } catch (error) {
                return refused(error?.message || "Repair failed. The working copy was discarded.");
            }
        },
    };
}
