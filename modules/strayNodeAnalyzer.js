export const STRAY_NODE_CLEANER_PRODUCT_ID = "stray_node_cleaner";

const DEFAULTS = Object.freeze({
    connectionTolerance: 0.01,
    microscopicRatio: 0.001,
});

function distance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
}

function finitePoint(point) {
    return Number.isFinite(point?.x) && Number.isFinite(point?.y);
}

function issue(element, classification, reason, measurements, confidence) {
    return {
        productId: STRAY_NODE_CLEANER_PRODUCT_ID,
        elementId: element.id ?? null,
        elementType: element.type,
        classification,
        reason,
        measurements,
        confidence,
        ambiguity: confidence !== "deterministic",
        safeToAutoRepair: false,
    };
}

export function parsePointsAttribute(value) {
    const numbers = String(value ?? "").match(
        /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g
    ) ?? [];

    if (numbers.length === 0 || numbers.length % 2 !== 0) {
        return null;
    }

    const points = [];
    for (let index = 0; index < numbers.length; index += 2) {
        const point = {
            x: Number(numbers[index]),
            y: Number(numbers[index + 1]),
        };
        if (!finitePoint(point)) {
            return null;
        }
        points.push(point);
    }
    return points;
}

export function parseLinearPathData(pathData) {
    const tokens = String(pathData ?? "").match(
        /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g
    ) ?? [];
    const points = [];
    let command = null;
    let cursor = { x: 0, y: 0 };
    let closed = false;

    for (let index = 0; index < tokens.length;) {
        if (/^[a-zA-Z]$/.test(tokens[index])) {
            command = tokens[index++];
            if (/^[zZ]$/.test(command)) {
                closed = true;
                command = null;
                continue;
            }
        }

        if (!command || !/^[mMlLhHvV]$/.test(command)) {
            return { supported: false, points: [], closed: false };
        }

        const relative = command === command.toLowerCase();
        let next;
        if (/^[hH]$/.test(command)) {
            const x = Number(tokens[index++]);
            next = { x: relative ? cursor.x + x : x, y: cursor.y };
        } else if (/^[vV]$/.test(command)) {
            const y = Number(tokens[index++]);
            next = { x: cursor.x, y: relative ? cursor.y + y : y };
        } else {
            const x = Number(tokens[index++]);
            const y = Number(tokens[index++]);
            next = {
                x: relative ? cursor.x + x : x,
                y: relative ? cursor.y + y : y,
            };
        }

        if (!finitePoint(next)) {
            return { supported: false, points: [], closed: false };
        }
        points.push(next);
        cursor = next;
        if (/^[mM]$/.test(command)) {
            command = relative ? "l" : "L";
        }
    }

    return { supported: points.length > 0, points, closed };
}

function drawingReferenceLength(elements) {
    const points = elements.flatMap((element) => element.nodes ?? []).filter(finitePoint);
    if (points.length < 2) return 1;
    const xs = points.map(({ x }) => x);
    const ys = points.map(({ y }) => y);
    return Math.max(Math.hypot(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys)
    ), 1);
}

export function analyzeStrayNodes(elements, options = {}) {
    const settings = { ...DEFAULTS, ...options };
    const referenceLength = drawingReferenceLength(elements);
    const microscopicThreshold = referenceLength * settings.microscopicRatio;
    const findings = [];

    for (const element of elements) {
        const nodes = element.nodes ?? [];
        if (!nodes.every(finitePoint) || nodes.length < 2) {
            findings.push(issue(
                element,
                "unsupported-geometry",
                "The element does not provide at least two finite analysis nodes.",
                { nodeCount: nodes.length },
                "deterministic"
            ));
            continue;
        }

        for (let index = 1; index < nodes.length; index += 1) {
            const segmentLength = distance(nodes[index - 1], nodes[index]);
            const measurements = { segmentIndex: index - 1, segmentLength, microscopicThreshold };
            if (segmentLength === 0) {
                findings.push(issue(
                    element,
                    "coincident-node",
                    "Consecutive nodes have exactly the same coordinates, creating a zero-length segment.",
                    measurements,
                    "deterministic"
                ));
            } else if (segmentLength <= settings.connectionTolerance) {
                findings.push(issue(
                    element,
                    "near-coincident-node",
                    "Consecutive nodes fall within the configured connection tolerance.",
                    { ...measurements, connectionTolerance: settings.connectionTolerance },
                    "tolerance-based"
                ));
            } else if (segmentLength <= microscopicThreshold) {
                findings.push(issue(
                    element,
                    "microscopic-segment",
                    "The segment is microscopic relative to the drawing bounds.",
                    measurements,
                    "tolerance-based"
                ));
            }
        }

        if (!element.closed) {
            findings.push(issue(
                element,
                "isolated-endpoints",
                "The element is open; its endpoints may be intentional and require topology/context review.",
                { start: nodes[0], end: nodes.at(-1) },
                "ambiguous"
            ));
            const closureDistance = distance(nodes[0], nodes.at(-1));
            if (closureDistance > 0 && closureDistance <= settings.connectionTolerance) {
                findings.push(issue(
                    element,
                    "malformed-closure",
                    "Open geometry ends near its start but is not explicitly closed.",
                    { closureDistance, connectionTolerance: settings.connectionTolerance },
                    "tolerance-based"
                ));
            }
        }
    }

    return {
        productId: STRAY_NODE_CLEANER_PRODUCT_ID,
        elementCount: elements.length,
        referenceLength,
        settings,
        findings,
        repairProposals: [],
    };
}