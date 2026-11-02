const SUPPORTED_ELEMENT_TYPES = new Set(["polyline", "polygon"]);

function finitePoint(point) {
    return Number.isFinite(point?.x) && Number.isFinite(point?.y);
}

function samePoint(first, second) {
    return finitePoint(first)
        && finitePoint(second)
        && first.x === second.x
        && first.y === second.y;
}

function pointKey({ x, y }) {
    return `${x},${y}`;
}

function rejection(finding, code, reason) {
    return {
        elementId: finding?.elementId ?? null,
        classification: finding?.classification ?? null,
        code,
        reason,
    };
}

function requiredDistinctNodes(element) {
    return element.type === "polygon" ? 3 : 2;
}

function validateElementBoundary(element) {
    if (!SUPPORTED_ELEMENT_TYPES.has(element.type)) {
        return ["unsupported_element_type", "Only polyline and polygon point lists are eligible for exact-node planning."];
    }
    if (element.transformed || element.hasTransform) {
        return ["transformed_geometry", "Transformed geometry requires coordinate-context review."];
    }
    if (element.curved || element.hasCurves) {
        return ["curved_geometry", "Curved geometry is outside the exact point-list repair boundary."];
    }
    if (element.topologySensitive) {
        return ["topology_sensitive", "The source marks this element as topology-sensitive."];
    }
    if (!Array.isArray(element.nodes) || !element.nodes.every(finitePoint)) {
        return ["unsupported_geometry", "The element does not provide finite normalized point-list nodes."];
    }
    if (element.type === "polygon" && element.closed !== true) {
        return ["inconsistent_topology", "Polygon closure could not be verified."];
    }
    if (element.type === "polyline" && element.closed === true) {
        return ["inconsistent_topology", "A closed polyline requires separate topology review."];
    }
    return null;
}

export function planExactCoincidentNodeRepairs(elements, analysis) {
    const sourceElements = Array.isArray(elements) ? elements : [];
    const findings = Array.isArray(analysis?.findings) ? analysis.findings : [];
    const elementsById = new Map();
    for (const element of sourceElements) {
        if (!element?.id) continue;
        const matches = elementsById.get(element.id) || [];
        matches.push(element);
        elementsById.set(element.id, matches);
    }

    const proposals = [];
    const rejections = [];
    const candidatesByElement = new Map();

    for (const finding of findings) {
        if (finding?.classification !== "coincident-node") {
            rejections.push(rejection(
                finding,
                "outside_exact_scope",
                "Only deterministic exact coincident-node findings are eligible."
            ));
            continue;
        }
        if (finding.confidence !== "deterministic" || finding.ambiguity !== false) {
            rejections.push(rejection(finding, "ambiguous_finding", "The finding is not deterministic."));
            continue;
        }
        const matches = finding.elementId ? elementsById.get(finding.elementId) || [] : [];
        if (matches.length !== 1) {
            rejections.push(rejection(
                finding,
                "ambiguous_source_reference",
                "The finding does not map to exactly one source element."
            ));
            continue;
        }
        const element = matches[0];
        if (element.type !== finding.elementType) {
            rejections.push(rejection(finding, "source_type_mismatch", "The finding and source element types differ."));
            continue;
        }
        const boundaryFailure = validateElementBoundary(element);
        if (boundaryFailure) {
            rejections.push(rejection(finding, boundaryFailure[0], boundaryFailure[1]));
            continue;
        }
        const segmentIndex = finding.measurements?.segmentIndex;
        const redundantNodeIndex = segmentIndex + 1;
        if (!Number.isInteger(segmentIndex)
            || segmentIndex < 0
            || redundantNodeIndex >= element.nodes.length
            || finding.measurements?.segmentLength !== 0
            || !samePoint(element.nodes[segmentIndex], element.nodes[redundantNodeIndex])) {
            rejections.push(rejection(
                finding,
                "stale_or_invalid_finding",
                "The source nodes no longer prove the analyzer's exact zero-length segment."
            ));
            continue;
        }
        const candidates = candidatesByElement.get(element.id) || { element, findings: [] };
        candidates.findings.push({ finding, segmentIndex, redundantNodeIndex });
        candidatesByElement.set(element.id, candidates);
    }

    for (const { element, findings: elementFindings } of candidatesByElement.values()) {
        const removalIndexes = new Set(elementFindings.map(({ redundantNodeIndex }) => redundantNodeIndex));
        const remainingNodes = element.nodes.filter((_node, index) => !removalIndexes.has(index));
        const minimum = requiredDistinctNodes(element);
        const distinctCount = new Set(remainingNodes.map(pointKey)).size;
        if (remainingNodes.length < minimum || distinctCount < minimum) {
            for (const { finding } of elementFindings) {
                rejections.push(rejection(
                    finding,
                    "insufficient_topology",
                    "Removing the redundant nodes would leave insufficient distinct geometry."
                ));
            }
            continue;
        }

        for (const { finding, segmentIndex, redundantNodeIndex } of elementFindings) {
            const coordinate = element.nodes[redundantNodeIndex];
            proposals.push({
                id: `remove-exact-coincident-node:${element.id}:${redundantNodeIndex}`,
                kind: "remove-exact-coincident-node",
                productId: finding.productId,
                elementRef: { id: element.id, type: element.type },
                sourceRef: {
                    segmentIndex,
                    previousNodeIndex: segmentIndex,
                    redundantNodeIndex,
                },
                before: {
                    nodeCount: element.nodes.length,
                    coordinate: { x: coordinate.x, y: coordinate.y },
                    description: `Nodes ${segmentIndex + 1} and ${redundantNodeIndex + 1} have identical coordinates.`,
                },
                after: {
                    nodeCount: element.nodes.length - 1,
                    description: `Remove redundant node ${redundantNodeIndex + 1}; retain the identical preceding coordinate.`,
                },
                confidence: "deterministic",
                preservesGeometry: true,
                requiresReview: true,
                safeToAutoApply: false,
            });
        }
    }

    return {
        productId: analysis?.productId ?? null,
        proposals,
        rejections,
        appliedRepairs: [],
    };
}
