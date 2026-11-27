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

export function analyzePathNodeCommands(element, commands, settings, referenceLength) {
    const findings = [];
    let moveIndex = null;
    let drawn = false;
    const microscopicThreshold = referenceLength * settings.microscopicRatio;

    function reportLoneMove() {
        if (moveIndex !== null && !drawn) {
            findings.push(issue(element, "isolated-node", "This moveto has no drawing segment in its subpath.",
                { segmentIndex: moveIndex, point: commands[moveIndex].end }, "deterministic"));
        }
    }

    commands.forEach((command, segmentIndex) => {
        if (command.type === "M") {
            if (moveIndex !== 0 || command.sourceCommand !== "m") reportLoneMove();
            moveIndex = segmentIndex;
            drawn = false;
            return;
        }
        if (command.type === "Z") return;
        drawn = true;
        const segmentLength = distance(command.start, command.end);
        const measurements = { segmentIndex, segmentLength, microscopicThreshold, start: command.start, end: command.end };
        if (command.collapsed || (command.type === "L" && command.closedEnd)) {
            findings.push(issue(element, "coincident-node", "This path command creates a zero-length segment.",
                measurements, "deterministic"));
        } else if (command.type === "L" && segmentLength <= settings.connectionTolerance) {
            findings.push(issue(element, "near-coincident-node", "Consecutive path nodes fall within the configured connection tolerance.",
                { ...measurements, connectionTolerance: settings.connectionTolerance }, "tolerance-based"));
        } else if (command.type === "L" && segmentLength <= microscopicThreshold) {
            findings.push(issue(element, "microscopic-segment", "This straight segment is microscopic relative to the drawing bounds.",
                measurements, "tolerance-based"));
        }
    });
    reportLoneMove();
    return findings;
}

export function inspectSmallDetachedMarks(elements, circles, referenceLength) {
    const maximumSize = referenceLength * 0.0075;
    const candidates = [];
    for (const element of elements) {
        if (element.closed || element.nodes.length !== 2 || !["line", "path", "polyline"].includes(element.type)) continue;
        const [start, end] = element.nodes;
        const size = distance(start, end);
        if (size > 0 && size <= maximumSize) candidates.push({ element, size, start, end });
    }
    for (const { element, center, radius } of circles) {
        if (radius > 0 && radius * 2 <= maximumSize) candidates.push({ element, size: radius * 2, point: center });
    }
    return candidates.map(({ element, size, ...location }) =>
        issue(element, "small-detached-mark",
            "This standalone mark is tiny relative to the drawing. Check whether it is an orphan speck or an intended detail.",
            { segmentLength: size, ...location }, "ambiguous"));
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

export function drawingReferenceLength(elements) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const { nodes = [] } of elements) {
        for (const point of nodes) {
            if (!finitePoint(point)) continue;
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
    }
    if (!Number.isFinite(minX)) return 1;
    return Math.max(Math.hypot(
        maxX - minX,
        maxY - minY
    ), 1);
}

export function analyzeStrayNodes(elements, options = {}) {
    const { referenceLength = drawingReferenceLength(elements), ...overrides } = options;
    const settings = { ...DEFAULTS, ...overrides };
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
