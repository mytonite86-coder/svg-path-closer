import { parseCurvePathData } from "./curveAnalyzer.js";

export function parseSvg(svgText) {
    const parser = new DOMParser();

    const svgDocument = parser.parseFromString(
        svgText,
        "image/svg+xml"
    );

    const parseError = svgDocument.querySelector("parsererror");

    if (parseError) {
        throw new Error("The selected file is not a valid SVG.");
    }

    return svgDocument;
}

export function getPathElements(svgDocument) {
    return [...svgDocument.querySelectorAll("path, line, polyline")].filter((element) =>
        !element.closest("defs, symbol, clipPath, mask, pattern, marker, foreignObject"));
}
export function getPathData(pathElement) {
    if (pathElement.tagName.toLowerCase() === "line") {
        const x1 = pathElement.getAttribute("x1");
        const y1 = pathElement.getAttribute("y1");
        const x2 = pathElement.getAttribute("x2");
        const y2 = pathElement.getAttribute("y2");

        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    const pathData = pathElement.getAttribute("d");

    if (!pathData) {
        return "";
    }

    return pathData.trim();
}


export function isPathExplicitlyClosed(pathData) {
    return /[zZ]\s*$/.test(pathData);
}
export function tokenizePathData(pathData) {
    const tokenPattern =
        /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

    return pathData.match(tokenPattern) ?? [];
}
function measurePathElement(pathElement, measurement) {
    const measurementSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    measurementSvg.setAttribute("width", "1");
    measurementSvg.setAttribute("height", "1");
    measurementSvg.style.position = "absolute";
    measurementSvg.style.left = "-10000px";
    measurementSvg.style.top = "-10000px";
    measurementSvg.style.visibility = "hidden";
    measurementSvg.style.overflow = "visible";

    const measurementElement =
        pathElement.cloneNode(true);

    measurementSvg.appendChild(measurementElement);
    document.body.appendChild(measurementSvg);

    try {
        return measurement(measurementElement);
    } finally {
        measurementSvg.remove();
    }
}

export function getPathEndpoints(pathElement) {
    return measurePathElement(
        pathElement,
        (measurementElement) => {
            const totalLength =
                measurementElement.getTotalLength();

            const startPoint =
                measurementElement.getPointAtLength(0);
            const endPoint =
                measurementElement.getPointAtLength(
                    totalLength
                );

            return {
                start: {
                    x: startPoint.x,
                    y: startPoint.y,
                },
                end: {
                    x: endPoint.x,
                    y: endPoint.y,
                },
            };
        }
    );
}

export function splitPathData(pathData) {
    const parsed = parseCurvePathData(pathData, { extended: true });
    if (!parsed.supported || parsed.subpathCount < 2) return [pathData];

    const subpaths = [];
    for (const command of parsed.commands) {
        if (command.type === "M") subpaths.push([]);
        const points = [...(command.controls ?? []), command.end].flatMap(({ x, y }) => [x, y]);
        const argumentsList = command.type === "Z" ? [] : [...(command.arc ?? []), ...points];
        subpaths.at(-1).push([command.type, ...argumentsList].join(" "));
    }

    return subpaths.filter((subpath) => subpath.length > 1).map((subpath) => subpath.join(" "));
}

function getDocumentPathEndpoints(pathElements) {
    if (pathElements.length === 0) {
        return new Map();
    }

    const sourceRoot =
        pathElements[0].ownerDocument.documentElement;
    const measurementRoot = sourceRoot.cloneNode(true);

    measurementRoot
        .querySelectorAll("script, foreignObject")
        .forEach((element) => element.remove());

    [
        measurementRoot,
        ...measurementRoot.querySelectorAll("*"),
    ].forEach((element) => {
        [...element.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();

            if (name.startsWith("on")) {
                element.removeAttribute(attribute.name);
            }

            if (
                (name === "href" || name === "xlink:href") &&
                !value.startsWith("#")
            ) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    measurementRoot.setAttribute("width", "1");
    measurementRoot.setAttribute("height", "1");
    measurementRoot.style.position = "absolute";
    measurementRoot.style.left = "-10000px";
    measurementRoot.style.top = "-10000px";
    measurementRoot.style.visibility = "hidden";
    measurementRoot.style.overflow = "visible";

    document.body.appendChild(measurementRoot);

    try {
        const measurementElements = getPathElements(measurementRoot);
        const rootMatrix = measurementRoot.getCTM();

        if (!rootMatrix) {
            return new Map(
                pathElements.map((pathElement) => [
                    pathElement,
                    [getPathEndpoints(pathElement)],
                ])
            );
        }

        const screenToRoot = rootMatrix.inverse();

        return new Map(
            pathElements.map((pathElement, index) => {
                const measurementElement =
                    measurementElements[index];
                const elementMatrix =
                    measurementElement?.getCTM();

                if (!measurementElement || !elementMatrix) {
                    return [
                        pathElement,
                        [getPathEndpoints(pathElement)],
                    ];
                }

                const pathData = measurementElement.getAttribute("d");
                const subpaths = pathData ? splitPathData(pathData) : [null];
                const contours = subpaths.map((subpath) => {
                    if (subpath !== null && subpath !== pathData) {
                        measurementElement.setAttribute("d", subpath);
                    }
                    const length = measurementElement.getTotalLength();
                    const pointAt = (offset) => measurementElement
                        .getPointAtLength(offset)
                        .matrixTransform(elementMatrix)
                        .matrixTransform(screenToRoot);
                    const scale = Math.max(
                        Math.hypot(elementMatrix.a, elementMatrix.b) / Math.hypot(rootMatrix.a, rootMatrix.b),
                        Math.hypot(elementMatrix.c, elementMatrix.d) / Math.hypot(rootMatrix.c, rootMatrix.d)
                    );
                    return { start: pointAt(0), end: pointAt(length), length: length * scale };
                });
                return [pathElement, contours];
            })
        );
    } finally {
        measurementRoot.remove();
    }
}

export function getEndpointDistance(endpoints) {
    const horizontalDistance =
        endpoints.end.x - endpoints.start.x;
    const verticalDistance =
        endpoints.end.y - endpoints.start.y;

    return Math.hypot(
        horizontalDistance,
        verticalDistance
    );
}

export function getPathReferenceLength(pathElement) {
    const pathLength = measurePathElement(
        pathElement,
        (measurementElement) =>
            measurementElement.getTotalLength()
    );

    return pathLength > 0 ? pathLength : 1;
}
export function getDrawingReferenceLength(pathElements) {
    const points = pathElements.flatMap((pathElement) => {
        const endpoints = getPathEndpoints(pathElement);

        return [
            endpoints.start,
            endpoints.end,
        ];
    });

    if (points.length === 0) {
        return 1;
    }

    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);

    const drawingWidth =
        Math.max(...xValues) - Math.min(...xValues);

    const drawingHeight =
        Math.max(...yValues) - Math.min(...yValues);

    const referenceLength =
        Math.hypot(drawingWidth, drawingHeight);

    return referenceLength > 0
        ? referenceLength
        : 1;
}

export function pointsAreNear(
    firstPoint,
    secondPoint,
    tolerance
) {
    const horizontalDistance =
        secondPoint.x - firstPoint.x;

    const verticalDistance =
        secondPoint.y - firstPoint.y;

    return Math.hypot(
        horizontalDistance,
        verticalDistance
    ) <= tolerance;
}

export function getConnectionTolerance() {
    // Keep visible gaps in the graph. This epsilon only absorbs rounding in
    // native SVG position measurements, not discrepancies in the drawing.
    return 0.0000001;
}

function findNearbyNode(nodes, point, tolerance) {
    return nodes.find((node) =>
        pointsAreNear(
            node.point,
            point,
            tolerance
        )
    );
}

function getOrCreateNode(nodes, point, tolerance) {
    const nearbyNode =
        findNearbyNode(nodes, point, tolerance);

    if (nearbyNode) {
        return nearbyNode;
    }

    const node = {
        point: {
            x: point.x,
            y: point.y,
        },
        edges: [],
    };

    nodes.push(node);

    return node;
}

export function buildEndpointGraph(pathElements) {
    const tolerance = getConnectionTolerance();

    const endpointsByElement =
        getDocumentPathEndpoints(pathElements);

    const nodes = [];

    const edges = pathElements.flatMap((pathElement) => endpointsByElement.get(pathElement).map((endpoints) => {

        const startNode = getOrCreateNode(
            nodes,
            endpoints.start,
            tolerance
        );

        const endNode = getOrCreateNode(
            nodes,
            endpoints.end,
            tolerance
        );

        const edge = {
            pathElement,
            referenceLength: endpoints.length,
            startNode,
            endNode,
        };

        startNode.edges.push(edge);
        endNode.edges.push(edge);

        return edge;
    }));

    return {
        nodes,
        edges,
        tolerance,
    };
}

export function getConnectedEdgeComponents(graph) {
    const unvisitedEdges =
        new Set(graph.edges);

    const components = [];

    while (unvisitedEdges.size > 0) {
        const firstEdge =
            unvisitedEdges.values().next().value;

        const pendingEdges = [firstEdge];
        const componentEdges = [];
        const componentNodes = new Set();

        while (pendingEdges.length > 0) {
            const edge = pendingEdges.pop();

            if (!unvisitedEdges.has(edge)) {
                continue;
            }

            unvisitedEdges.delete(edge);
            componentEdges.push(edge);

            const edgeNodes = [
                edge.startNode,
                edge.endNode,
            ];

            edgeNodes.forEach((node) => {
                componentNodes.add(node);

                node.edges.forEach((connectedEdge) => {
                    if (unvisitedEdges.has(connectedEdge)) {
                        pendingEdges.push(connectedEdge);
                    }
                });
            });
        }

        components.push({
            edges: componentEdges,
            nodes: [...componentNodes],
        });
    }

    return components;
}

export function getComponentTerminalNodes(component) {
    return component.nodes.filter(
        (node) => node.edges.length === 1
    );
}

export function getComponentReferenceLength(component) {
    const referenceLength = component.edges.reduce(
        (totalLength, edge) =>
            totalLength + (edge.referenceLength ?? getPathReferenceLength(edge.pathElement)),
        0
    );

    return referenceLength > 0
        ? referenceLength
        : 1;
}

export function analyzeComponent(component) {
    const terminalNodes =
        getComponentTerminalNodes(component);

    const referenceLength =
        getComponentReferenceLength(component);

    const isClosed = terminalNodes.length === 0;

    const hasSingleOpenGap =
        terminalNodes.length === 2;

    let endpoints = null;
    let gapDistance = 0;
    let gapType = isClosed
        ? "closed"
        : "complex";

    if (hasSingleOpenGap) {
        endpoints = {
            start: terminalNodes[0].point,
            end: terminalNodes[1].point,
        };

        gapDistance =
            getEndpointDistance(endpoints);

        gapType = classifyGap(
            gapDistance,
            referenceLength
        );
    }

    return {
        component,
        terminalNodes,
        endpoints,
        isClosed,
        hasSingleOpenGap,
        gapDistance,
        referenceLength,
        gapType,
    };
}

function getTerminalEntries(components) {
    return components.flatMap((component) =>
        getComponentTerminalNodes(component).map((node) => ({
            component,
            node,
        }))
    );
}

function getPointDistance(firstPoint, secondPoint) {
    return Math.hypot(
        secondPoint.x - firstPoint.x,
        secondPoint.y - firstPoint.y
    );
}

function findNearestTerminal(entry, terminalEntries) {
    let nearestEntry = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    terminalEntries.forEach((candidate) => {
        if (candidate === entry) {
            return;
        }

        const distance = getPointDistance(
            entry.node.point,
            candidate.node.point
        );

        if (distance < nearestDistance) {
            nearestEntry = candidate;
            nearestDistance = distance;
        }
    });

    return nearestEntry;
}

function mergeCandidateComponents(firstComponent, secondComponent) {
    if (firstComponent === secondComponent) {
        return firstComponent;
    }

    return {
        edges: [
            ...firstComponent.edges,
            ...secondComponent.edges,
        ],
        nodes: [
            ...new Set([
                ...firstComponent.nodes,
                ...secondComponent.nodes,
            ]),
        ],
    };
}

function getOvershootRepair(component, gapDistance, referenceLength) {
    if (component.edges.length !== 1 || gapDistance > referenceLength * 0.02) return null;
    const source = component.edges[0].pathElement;
    if (source.localName !== "path") return null;
    const data = source.getAttribute("d");
    const parsed = parseCurvePathData(data, { extended: true });
    if (!parsed.supported || parsed.subpathCount !== 1 || parsed.hasClose
        || parsed.commands.length < 4 || parsed.commands.some(({ type }) => !["M", "L"].includes(type))) return null;
    const [move, first] = parsed.commands;
    const last = parsed.commands.at(-1);
    const vector = (a, b) => ({ x: b.x - a.x, y: b.y - a.y });
    const cross = (a, b) => a.x * b.y - a.y * b.x;
    const firstDirection = vector(move.end, first.end);
    const lastDirection = vector(last.start, last.end);
    const crossDirections = cross(firstDirection, lastDirection);
    if (!crossDirections) return null;
    const t = cross(vector(last.start, move.end), firstDirection) / -crossDirections;
    if (!(t > 0 && t < 1)) return null;
    const crossing = { x: last.start.x + t * lastDirection.x, y: last.start.y + t * lastDirection.y };
    const gap = getPointDistance(move.end, last.end);
    const deviation = getPointDistance(move.end, crossing);
    const firstLength = getPointDistance(move.end, first.end);
    if (deviation > Math.min(gap * 0.25, firstLength * 0.02)) return null;
    const prefix = data.slice(0, last.sourceRef.start).replace(/[\s,]+$/, "");
    return `${prefix} Z`;
}

export function pairNearestTerminalNodes(components, terminalEntries = getTerminalEntries(components)) {
    const nearestByEntry = new Map(
        terminalEntries.map((entry) => [
            entry,
            findNearestTerminal(entry, terminalEntries),
        ])
    );
    const pairedEntries = new Set();
    const pairs = [];

    terminalEntries.forEach((entry) => {
        if (pairedEntries.has(entry)) {
            return;
        }

        const nearestEntry = nearestByEntry.get(entry);

        if (
            !nearestEntry ||
            pairedEntries.has(nearestEntry) ||
            nearestByEntry.get(nearestEntry) !== entry
        ) {
            return;
        }

        pairedEntries.add(entry);
        pairedEntries.add(nearestEntry);
        pairs.push([entry, nearestEntry]);
    });

    return pairs;
}

function analyzeTerminalPair(firstEntry, secondEntry) {
    const component = mergeCandidateComponents(
        firstEntry.component,
        secondEntry.component
    );
    const endpoints = {
        start: firstEntry.node.point,
        end: secondEntry.node.point,
    };
    const gapDistance = getEndpointDistance(endpoints);
    const referenceLength = getComponentReferenceLength(component);
    const retracesSingleEdge = component.edges.length === 1 && gapDistance >= referenceLength * 0.999999;

    return {
        component,
        terminalNodes: [
            firstEntry.node,
            secondEntry.node,
        ],
        endpoints,
        isClosed: false,
        hasSingleOpenGap: true,
        gapDistance,
        referenceLength,
        retracesSingleEdge,
        overshootPathData: firstEntry.component === secondEntry.component && !retracesSingleEdge
            ? getOvershootRepair(component, gapDistance, referenceLength) : null,
        gapType: classifyGap(
            gapDistance,
            referenceLength
        ),
    };
}

export function analyzeContours(pathElements) {
    const graph =
        buildEndpointGraph(pathElements);

    const components =
        getConnectedEdgeComponents(graph);

    const closedAnalyses = components
        .map((component) => analyzeComponent(component))
        .filter((analysis) => analysis.isClosed);

    const openAnalyses = [];
    const pairKeys = new Set();
    const terminals = getTerminalEntries(components);
    const terminalIds = new Map(terminals.map(({ node }, index) => [node, index]));
    const paired = new Set();
    const excluded = new Set();
    const drawingLength = graph.edges.reduce((largest, edge) => Math.max(largest, edge.referenceLength ?? 0), 0);
    function addPair(first, second, ambiguous = false) {
        const key = [terminalIds.get(first.node), terminalIds.get(second.node)].sort((a, b) => a - b).join(":");
        if (pairKeys.has(key)) return;
        pairKeys.add(key);
        paired.add(first.node);
        paired.add(second.node);
        openAnalyses.push({ ...analyzeTerminalPair(first, second), ambiguous });
    }
    for (const component of components) {
        const local = getTerminalEntries([component]);
        if (local.length !== 2) continue;
        const candidate = analyzeTerminalPair(...local);
        if (!candidate.retracesSingleEdge) addPair(...local);
        else if (component.edges.length === 1) {
            // A tiny isolated stroke is a stray-node candidate, not a bridge target.
            if (candidate.referenceLength <= drawingLength * 0.005) {
                local.forEach(({ node }) => excluded.add(node));
            }
        }
    }
    const remaining = terminals.filter(({ node }) => !excluded.has(node));
    const pairs = pairNearestTerminalNodes(components, remaining);
    for (const [first, second] of pairs) addPair(first, second, paired.has(first.node) || paired.has(second.node));
    for (const entry of terminals) {
        if (paired.has(entry.node) || excluded.has(entry.node)) continue;
        const neighbor = findNearestTerminal(entry, remaining);
        if (neighbor) addPair(entry, neighbor, true);
    }

    return [
        ...closedAnalyses,
        ...openAnalyses,
    ];
}

export function createContourBridge(analysis, svgDocument) {
    if (
        !isRepairableContour(analysis)
    ) {
        return null;
    }

    const sourceElement =
        analysis.component.edges[0]?.pathElement;

    if (!sourceElement) {
        return null;
    }

    svgDocument ??= sourceElement.ownerDocument;
    const sourceData = sourceElement.localName === "path" ? sourceElement.getAttribute("d") : null;
    const parsed = sourceData && analysis.component.edges.length === 1
        ? parseCurvePathData(sourceData, { extended: true }) : null;
    const closeInPlace = parsed?.supported && !parsed.hasClose && splitPathData(sourceData).length === 1;
    if (analysis.overshootPathData || closeInPlace) {
        const index = getPathElements(sourceElement.ownerDocument).indexOf(sourceElement);
        const workingPath = getPathElements(svgDocument)[index];
        if (!workingPath || workingPath.localName !== "path") return null;
        workingPath.setAttribute("d", analysis.overshootPathData ?? `${sourceData.trimEnd()} Z`);
        return workingPath;
    }

    const bridge = svgDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    bridge.setAttribute(
        "x1",
        analysis.endpoints.start.x
    );

    bridge.setAttribute(
        "y1",
        analysis.endpoints.start.y
    );

    bridge.setAttribute(
        "x2",
        analysis.endpoints.end.x
    );

    bridge.setAttribute(
        "y2",
        analysis.endpoints.end.y
    );

    [
        "class",
        "style",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "vector-effect",
    ].forEach((attributeName) => {
        let source = sourceElement;
        while (source && !source.hasAttribute(attributeName)) {
            source = source.parentElement;
        }
        const attributeValue = source?.getAttribute(attributeName);

        if (attributeValue != null && (source === sourceElement || attributeName.startsWith("stroke"))) {
            bridge.setAttribute(
                attributeName,
                attributeValue
            );
        }
    });

    if (!bridge.hasAttribute("stroke") || bridge.getAttribute("stroke") === "none") {
        bridge.setAttribute("stroke", "black");
    }

    bridge.setAttribute(
        "data-pathseal-repair",
        "true"
    );

    svgDocument.documentElement.append(bridge);

    return bridge;
}

export function classifyGap(gapDistance, referenceLength) {
    const gapRatio = gapDistance / referenceLength;

    if (gapRatio <= 0.005) {
        return "micro-gap";
    }

    if (gapRatio <= 0.02) {
        return "gap";
    }

    return "large-gap";
}

export function isRepairableContour(analysis) {
    return Boolean(
        analysis?.hasSingleOpenGap &&
        analysis.endpoints &&
        !analysis.retracesSingleEdge &&
        Number.isFinite(analysis.gapDistance) &&
        analysis.gapDistance > 0
    );
}
export function closePathData(pathData) {
    const cleanPathData = pathData.trim();

    if (isPathExplicitlyClosed(cleanPathData)) {
        return cleanPathData;
    }

    return `${cleanPathData} Z`;
}
export function updatePathData(pathElement, repairedPathData) {
    pathElement.setAttribute("d", repairedPathData);

    return pathElement;
}
export function serializeSvg(svgDocument) {
    const serializer = new XMLSerializer();

    return serializer.serializeToString(svgDocument);
}
export function analyzePath(pathElement) {
    const pathData = getPathData(pathElement);
    const isClosed = isPathExplicitlyClosed(pathData);
    const endpoints = getPathEndpoints(pathElement);
    const gapDistance = getEndpointDistance(endpoints);
    const referenceLength = getPathReferenceLength(pathElement);
    const gapType = classifyGap(gapDistance, referenceLength);

    return {
        pathElement,
        pathData,
        isClosed,
        endpoints,
        gapDistance,
        referenceLength,
        gapType,
    };
}
export function validateSvgText(svgText) {
    try {
        const validationDocument = parseSvg(svgText);
        const rootElement = validationDocument.documentElement;

        if (rootElement.tagName.toLowerCase() !== "svg") {
            return {
                isValid: false,
                message: "The repaired file does not have an SVG root element.",
            };
        }

        return {
            isValid: true,
            message: "The repaired SVG structure is valid.",
        };
    } catch (error) {
        return {
            isValid: false,
            message: error.message,
        };
    }
}
export function validateRepairedPaths(repairs) {
    const failedRepairs = repairs.filter((repair) => {
        const updatedPathData = getPathData(repair.pathElement);

        return !isPathExplicitlyClosed(updatedPathData);
    });

    if (failedRepairs.length > 0) {
        return {
            isValid: false,
            failedCount: failedRepairs.length,
            message: `${failedRepairs.length} path repair failed validation.`,
        };
    }

    return {
        isValid: true,
        failedCount: 0,
        message: "All repaired paths are closed.",
    };
}
