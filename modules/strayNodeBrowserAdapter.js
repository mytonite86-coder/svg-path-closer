import {
    analyzePathNodeCommands,
    analyzeStrayNodes,
    drawingReferenceLength,
    inspectSmallDetachedMarks,
    parsePointsAttribute,
} from "./strayNodeAnalyzer.js";
import { parseCurvePathData } from "./curveAnalyzer.js";

const SUPPORTED_SELECTOR = "line,polyline,polygon,path";

export class StrayNodeSvgInputError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "StrayNodeSvgInputError";
        this.code = code;
    }
}

function finiteCoordinate(element, name) {
    const rawValue = element.getAttribute(name);
    if (rawValue === null || !/^[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?$/.test(rawValue.trim())) {
        return null;
    }
    const value = Number(rawValue);
    return Number.isFinite(value) ? value : null;
}

function identity(element, index) {
    return element.getAttribute("id") || `${element.localName}-${index + 1}`;
}

export function getStrayCircleGeometry(document) {
    return [...document.querySelectorAll("circle")].filter((node) =>
        node.localName === "circle" && !node.closest?.("[transform], defs, symbol, clipPath, mask, pattern, marker"))
        .map((node, index) => ({
            node,
            element: { id: identity(node, index), type: "circle" },
            center: { x: finiteCoordinate(node, "cx") ?? 0, y: finiteCoordinate(node, "cy") ?? 0 },
            radius: finiteCoordinate(node, "r"),
        })).filter(({ radius }) => radius > 0);
}

export function normalizeSvgGeometry(element, index = 0) {
    const type = String(element?.localName || "").toLowerCase();
    const normalized = {
        id: identity(element, index),
        type,
        closed: type === "polygon",
        nodes: [],
    };

    if (type !== "path" && element.hasAttribute("transform")) {
        return { element: normalized, supported: false, reason: "Transformed geometry is not supported in this review foundation." };
    }

    if (type === "line") {
        const values = ["x1", "y1", "x2", "y2"].map((name) => finiteCoordinate(element, name));
        if (values.some((value) => value === null)) {
            return { element: normalized, supported: false, reason: "Line coordinates must be finite unitless numbers." };
        }
        normalized.nodes = [
            { x: values[0], y: values[1] },
            { x: values[2], y: values[3] },
        ];
        return { element: normalized, supported: true, reason: null };
    }

    if (type === "polyline" || type === "polygon") {
        const nodes = parsePointsAttribute(element.getAttribute("points"));
        if (!nodes) {
            return { element: normalized, supported: false, reason: "Point lists must contain finite coordinate pairs." };
        }
        normalized.nodes = nodes;
        return { element: normalized, supported: true, reason: null };
    }

    if (type === "path") {
        const data = element.getAttribute("d");
        const parsed = parseCurvePathData(data, { extended: true });
        if (!parsed.supported) {
            return { element: normalized, supported: false, reason: parsed.reason };
        }
        if (parsed.subpathCount > 1 || parsed.commands.length === 1
            || element.closest?.("[transform]") || element.hasAttribute("transform")
            || parsed.commands.some(({ type }) => !["M", "L", "Z"].includes(type))
            || parsed.commands.slice(0, -1).some(({ type }) => type === "Z")) {
            return { element: normalized, supported: true, commands: parsed.commands };
        }
        normalized.nodes = parsed.commands.filter(({ type }) => type !== "Z").map(({ end }) => end);
        normalized.closed = parsed.hasClose;
        return { element: normalized, supported: true, reason: null };
    }

    return { element: normalized, supported: false, reason: "This SVG geometry type is not supported." };
}

export async function readLocalSvgFile(file) {
    if (!file || typeof file.text !== "function") {
        throw new StrayNodeSvgInputError("missing_file", "Choose an SVG file to inspect.");
    }
    const isSvgType = file.type === "image/svg+xml";
    const isSvgName = typeof file.name === "string" && /\.svg$/i.test(file.name);
    if (!isSvgType && !isSvgName) {
        throw new StrayNodeSvgInputError("unsupported_file", "Choose a local .svg file.");
    }
    const source = await file.text();
    if (!source.trim()) {
        throw new StrayNodeSvgInputError("empty_file", "The selected SVG file is empty.");
    }
    return source;
}

export function inspectStrayNodeSvg(source, { DOMParser: Parser = globalThis.DOMParser } = {}) {
    if (typeof source !== "string" || !source.trim()) {
        throw new StrayNodeSvgInputError("empty_svg", "The SVG content is empty.");
    }
    if (typeof Parser !== "function") {
        throw new StrayNodeSvgInputError("parser_unavailable", "SVG inspection is unavailable in this browser.");
    }

    const document = new Parser().parseFromString(source, "image/svg+xml");
    if (!document?.documentElement || document.querySelector("parsererror")) {
        throw new StrayNodeSvgInputError("malformed_svg", "The selected file is not valid SVG XML.");
    }
    if (String(document.documentElement.localName).toLowerCase() !== "svg") {
        throw new StrayNodeSvgInputError("not_svg", "The selected XML document is not an SVG.");
    }

    const nodes = [...document.querySelectorAll(SUPPORTED_SELECTOR)];
    const geometry = nodes.map(normalizeSvgGeometry);
    const circles = getStrayCircleGeometry(document);
    if (geometry.length === 0 && circles.length === 0) {
        throw new StrayNodeSvgInputError(
            "unsupported_svg",
            "No supported line, polyline, polygon, or linear path geometry was found."
        );
    }

    const elements = geometry.filter(({ commands }) => !commands).map(({ element }) => element);
    const pathElements = geometry.filter(({ commands }) => commands);
    const unsupported = geometry
        .filter(({ supported }) => !supported)
        .map(({ element, reason }) => ({ elementId: element.id, elementType: element.type, reason }));
    const referenceLength = drawingReferenceLength([
        ...elements,
        ...pathElements.map(({ commands }) => ({ nodes: commands.flatMap(({ end, controls = [] }) => [end, ...controls]) })),
        ...circles.map(({ center: { x, y }, radius }) => ({
            nodes: [{ x: x - radius, y: y - radius }, { x: x + radius, y: y + radius }],
        })),
    ]);
    const analysis = analyzeStrayNodes(elements, { referenceLength });
    const detached = inspectSmallDetachedMarks(elements, circles, referenceLength);
    const detachedIds = new Set(detached.map(({ elementId }) => elementId));

    return {
        ...analysis,
        elementCount: geometry.length + circles.length,
        findings: [
            ...analysis.findings.filter(({ elementId, classification }) =>
                classification !== "isolated-endpoints" || !detachedIds.has(elementId)),
            ...pathElements.flatMap(({ element, commands }) =>
                analyzePathNodeCommands(element, commands, analysis.settings, referenceLength)),
            ...detached,
        ],
        supportedElementCount: geometry.length - unsupported.length + circles.length,
        unsupported,
    };
}

export function presentStrayNodeFinding(finding) {
    const labels = {
        "coincident-node": "Coincident node",
        "isolated-node": "Isolated node",
        "small-detached-mark": "Possible stray mark",
        "near-coincident-node": "Near-coincident node",
        "microscopic-segment": "Microscopic segment",
        "isolated-endpoints": "Open endpoints",
        "malformed-closure": "Possible malformed closure",
        "unsupported-geometry": "Unsupported geometry",
    };
    return {
        title: labels[finding.classification] || "Review finding",
        geometry: `${finding.elementType} ${finding.elementId ? `#${finding.elementId}` : "without an ID"}`,
        reason: finding.reason,
        confidence: finding.confidence,
        reviewOnly: finding.safeToAutoRepair === false,
    };
}
