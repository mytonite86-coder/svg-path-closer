import { normalizeSvgGeometry } from "./strayNodeBrowserAdapter.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SAFE_GEOMETRY_SELECTOR = "line,polyline,polygon,path";

function boundsFor(shapes) {
    const points = shapes.flatMap(({ nodes }) => nodes);
    const xs = points.map(({ x }) => x);
    const ys = points.map(({ y }) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const padding = Math.max(width, height) * 0.05;
    return {
        x: minX - padding,
        y: minY - padding,
        width: width + padding * 2,
        height: height + padding * 2,
    };
}

export function createStrayNodePreviewModel(
    source,
    { DOMParser: Parser = globalThis.DOMParser } = {}
) {
    if (typeof source !== "string" || !source.trim() || typeof Parser !== "function") {
        throw new Error("A valid local SVG is required for preview.");
    }
    const document = new Parser().parseFromString(source, "image/svg+xml");
    if (!document?.documentElement || document.querySelector("parsererror")) {
        throw new Error("The local SVG could not be safely previewed.");
    }

    const normalized = [...document.querySelectorAll(SAFE_GEOMETRY_SELECTOR)]
        .map(normalizeSvgGeometry);
    const idCounts = new Map();
    for (const { element } of normalized) {
        idCounts.set(element.id, (idCounts.get(element.id) || 0) + 1);
    }

    const shapes = normalized
        .filter(({ supported, element }) => supported && element.nodes.length >= 2)
        .map(({ element }, index) => ({
            previewKey: `preview-${index + 1}`,
            elementId: element.id,
            sourceType: element.type,
            shapeType: element.type === "line" ? "line" : element.closed ? "polygon" : "polyline",
            nodes: element.nodes.map(({ x, y }) => ({ x, y })),
            mappingKey: idCounts.get(element.id) === 1 ? element.id : null,
        }));

    if (shapes.length === 0) {
        throw new Error("No safely renderable geometry is available for preview.");
    }

    return {
        shapes,
        bounds: boundsFor(shapes),
    };
}

export function getFindingPreviewKey(finding, model) {
    if (!finding?.elementId || finding.classification === "unsupported-geometry") {
        return null;
    }
    const matches = model.shapes.filter(({ mappingKey }) => mappingKey === finding.elementId);
    return matches.length === 1 ? matches[0].mappingKey : null;
}

function pointList(nodes) {
    return nodes.map(({ x, y }) => `${x},${y}`).join(" ");
}

export function renderStrayNodePreview(svg, model, documentFactory = svg.ownerDocument) {
    svg.replaceChildren();
    const { x, y, width, height } = model.bounds;
    svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Read-only preview of supported uploaded SVG geometry");
    const rendered = new Map();

    for (const shape of model.shapes) {
        const node = documentFactory.createElementNS(SVG_NAMESPACE, shape.shapeType);
        if (shape.shapeType === "line") {
            node.setAttribute("x1", String(shape.nodes[0].x));
            node.setAttribute("y1", String(shape.nodes[0].y));
            node.setAttribute("x2", String(shape.nodes[1].x));
            node.setAttribute("y2", String(shape.nodes[1].y));
        } else {
            node.setAttribute("points", pointList(shape.nodes));
        }
        node.setAttribute("fill", shape.shapeType === "polygon" ? "rgba(37, 99, 235, 0.08)" : "none");
        node.setAttribute("stroke", "#1f2937");
        node.setAttribute("stroke-width", "1.5");
        node.setAttribute("vector-effect", "non-scaling-stroke");
        node.setAttribute("data-preview-key", shape.previewKey);
        svg.append(node);
        if (shape.mappingKey) rendered.set(shape.mappingKey, node);
    }

    return rendered;
}

export function setPreviewHighlight(rendered, mappingKey) {
    let highlighted = false;
    for (const [key, node] of rendered) {
        const active = key === mappingKey;
        node.setAttribute("stroke", active ? "#d97706" : "#1f2937");
        node.setAttribute("stroke-width", active ? "4" : "1.5");
        node.setAttribute("aria-current", active ? "true" : "false");
        highlighted ||= active;
    }
    return highlighted;
}
