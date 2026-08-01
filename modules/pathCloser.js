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
export function getSvgReferenceLength(svgDocument) {
    const svgElement = svgDocument.documentElement;
    const viewBox = svgElement.viewBox.baseVal;

    if (viewBox.width > 0 && viewBox.height > 0) {
        return Math.hypot(viewBox.width, viewBox.height);
    }

    return 1000;
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