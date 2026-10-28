import { inspectStrayNodeSvg, normalizeSvgGeometry } from "./strayNodeBrowserAdapter.js";
import { createStrayNodePreviewModel } from "./strayNodePreview.js";
import { planExactCoincidentNodeRepairs } from "./strayNodeRepairPlanner.js";

// Adapt an in-memory document to the existing analysis/preview APIs. No serialization.
export function inspectWorkingDocument(document) {
    const options = { DOMParser: class { parseFromString() { return document; } } };
    const inspection = inspectStrayNodeSvg("<svg/>", options);
    const previewModel = createStrayNodePreviewModel("<svg/>", options);
    return { inspection, previewModel };
}

function geometry(document) {
    return [...document.querySelectorAll("line,polyline,polygon,path")];
}

function planFor(document) {
    const { inspection } = inspectWorkingDocument(document);
    const normalized = geometry(document).map(normalizeSvgGeometry);
    return planExactCoincidentNodeRepairs(normalized.filter(({ supported }) => supported).map(({ element }) => element), inspection);
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

    return {
        get workingDocument() { return acceptedDocument?.cloneNode(true) || null; },
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
                // Reinspect before committing. The caller can also validate staged preview rendering.
                const view = inspectWorkingDocument(working);
                if (validateWorkingCopy(working, view) !== true) throw new Error("Working copy validation failed.");
                // Prove that every other attribute, element and unsupported subtree is untouched.
                const comparison = working.cloneNode(true);
                const comparisonGeometry = geometry(comparison);
                for (const { index, oldPoints, newPoints } of changed) {
                    if (comparisonGeometry[index]?.getAttribute("points") !== newPoints) throw new Error("Repair validation failed: repaired points changed.");
                    comparisonGeometry[index].setAttribute("points", oldPoints);
                }
                if (!comparison.isEqualNode(original)) throw new Error("Repair validation failed: unrelated SVG content changed.");
                completed = true;
                acceptedDocument = working;
                return { ok: true, executedCount: selected.length, skippedCount: 0, workingDocument: working, ...view };
            } catch (error) {
                return refused(error?.message || "Repair failed. The working copy was discarded.");
            }
        },
    };
}
