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
    const pathElements = svgDocument.querySelectorAll("path, line");

    return Array.from(pathElements);
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
export function getPathEndpoints(pathElement) {
    const totalLength = pathElement.getTotalLength();

    const startPoint = pathElement.getPointAtLength(0);
    const endPoint = pathElement.getPointAtLength(totalLength);

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
export function getEndpointDistance(endpoints) {
    const horizontalDistance = endpoints.end.x - endpoints.start.x;
    const verticalDistance = endpoints.end.y - endpoints.start.y;

    return Math.hypot(horizontalDistance, verticalDistance);
}
export function getPathReferenceLength(pathElement) {
    const pathLength = pathElement.getTotalLength();

    if (pathLength > 0) {
        return pathLength;
    }

    return 1;
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

export function getConnectionTolerance(pathElements) {
    const referenceLength =
        getDrawingReferenceLength(pathElements);

    return Math.max(
        referenceLength * 0.0000001,
        0.01
    );
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
    const tolerance =
        getConnectionTolerance(pathElements);

    const nodes = [];

    const edges = pathElements.map((pathElement) => {
        const endpoints =
            getPathEndpoints(pathElement);

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
            startNode,
            endNode,
        };

        startNode.edges.push(edge);
        endNode.edges.push(edge);

        return edge;
    });

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