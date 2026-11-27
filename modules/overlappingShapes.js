import { parseCurvePathData } from "./curveAnalyzer.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SELECTOR = "rect,circle,ellipse,path,polygon,polyline,line,text,image,use";
const NUMBER = /^[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?$/;
const GEOMETRY = { rect: ["x", "y", "width", "height"], circle: ["cx", "cy", "r"], ellipse: ["cx", "cy", "rx", "ry"] };
const SAFE_ATTRIBUTES = new Set(["x", "y", "width", "height", "fill", "stroke", "opacity", "fill-opacity", "shape-rendering"]);
const ROOT_ATTRIBUTES = new Set(["xmlns", "width", "height", "viewBox", "preserveAspectRatio", "version", "id"]);
const OPAQUE_COLOR = /^(?:#[0-9a-f]{3}|#[0-9a-f]{6}|black|white|red|green|blue|yellow)$/i;

function attributes(node) { return [...node.attributes].map(({ name, value }) => [name, value]); }
function ancestors(node) {
    const result = [];
    for (let parent = node.parentElement; parent; parent = parent.parentElement) result.push(parent);
    return result;
}
function sourceLabel(node, index) { return `${node.localName} ${index + 1}${node.getAttribute("id") ? ` (#${node.getAttribute("id")})` : ""}`; }

function rectanglePathBounds(node) {
    const path = parseCurvePathData(node.getAttribute("d"));
    if (!path.supported || path.commands.map(({ type }) => type).join("") !== "MLLLZ") return null;
    const corners = path.commands.slice(0, 4).map(({ end }) => end);
    const xs = [...new Set(corners.map(({ x }) => x))].sort((a, b) => a - b);
    const ys = [...new Set(corners.map(({ y }) => y))].sort((a, b) => a - b);
    if (xs.length !== 2 || ys.length !== 2 || new Set(corners.map(({ x, y }) => `${x},${y}`)).size !== 4
        || corners.some(({ x, y }, index) => {
            const next = corners[(index + 1) % 4];
            return x !== next.x && y !== next.y;
        })) return null;
    return { x: xs[0], y: ys[0], width: xs[1] - xs[0], height: ys[1] - ys[0] };
}

function normalize(node, index) {
    const type = node.localName;
    const base = { index, type, label: sourceLabel(node, index), geometry: null, bounds: null };
    if (node.namespaceURI !== SVG_NS || (!GEOMETRY[type] && type !== "path")) return { ...base, reason: "Unsupported shape type or namespace; manual review only." };
    const context = [node, ...ancestors(node)];
    if (context.filter((item) => item.localName === "svg").length > 1
        || context.some((item) => item.hasAttribute("transform") || !["svg", "g", "rect", "circle", "ellipse", "path"].includes(item.localName))) {
        return { ...base, reason: "Transformed or definition/container geometry has no supported drawing-space mapping." };
    }
    if (type === "path") {
        const bounds = rectanglePathBounds(node);
        if (!bounds) return { ...base, reason: "Path is outside the supported rectangular path geometry." };
        const { x, y, width, height } = bounds;
        return { ...base, bounds, geometry: { d: `M${x} ${y} H${x + width} V${y + height} H${x} Z` },
            exactKey: `rect-path:${Object.values(bounds).join("|")}`, reason: null };
    }
    if (type === "rect" && (node.hasAttribute("rx") || node.hasAttribute("ry"))) return { ...base, reason: "Rounded rectangles require manual review." };
    const geometry = {};
    const keys = [];
    for (const name of GEOMETRY[type]) {
        const optional = ["x", "y", "cx", "cy"].includes(name);
        const raw = (node.getAttribute(name) ?? (optional ? "0" : "")).trim();
        const value = Number(raw);
        if (!NUMBER.test(raw) || !Number.isFinite(value) || (!optional && value <= 0)) {
            return { ...base, reason: "Coordinates must be finite unitless numbers with positive dimensions." };
        }
        geometry[name] = value;
        // Source-text identity avoids false duplicates from floating-point rounding.
        keys.push(raw);
    }
    const bounds = type === "rect"
        ? { x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height }
        : { x: geometry.cx - (geometry.rx ?? geometry.r), y: geometry.cy - (geometry.ry ?? geometry.r), width: 2 * (geometry.rx ?? geometry.r), height: 2 * (geometry.ry ?? geometry.r) };
    if (![...Object.values(bounds), bounds.x + bounds.width, bounds.y + bounds.height].every(Number.isFinite)) {
        return { ...base, reason: "Drawing bounds exceed the supported finite range." };
    }
    return { ...base, geometry, bounds, exactKey: `${type}:${keys.join("|")}`, reason: null };
}

function circleCrossesRectangle({ cx, cy, r }, { x, y, width, height }) {
    function crosses(centerAlong, centerAcross, start, end, edgePosition) {
        const offset = Math.abs(centerAcross - edgePosition);
        if (offset >= r) return false;
        const reach = Math.sqrt((r - offset) * (r + offset));
        return [centerAlong - reach, centerAlong + reach].some((hit) => hit > start && hit < end);
    }
    return crosses(cx, cy, x, x + width, y) || crosses(cx, cy, x, x + width, y + height)
        || crosses(cy, cx, y, y + height, x) || crosses(cy, cx, y, y + height, x + width);
}

function safeRemoval(first, duplicate, documentRisk) {
    if (documentRisk) return "Document styles, references, animation, or active content prevent a rendering-safety proof.";
    if (first.localName !== "rect") return "Exact curved shapes remain review-only; safe removal is limited to opaque crisp-edge rectangles.";
    if (first.parentElement !== duplicate.parentElement || duplicate.previousElementSibling !== first) {
        return "Different groups or intervening elements may change stacking/rendering; manual review required.";
    }
    for (const node of [first, duplicate]) {
        if (node.children.length || attributes(node).some(([name]) => !SAFE_ATTRIBUTES.has(name))) {
            return "IDs, references, transforms, styles, metadata, or other attributes/children must be preserved.";
        }
        if (!OPAQUE_COLOR.test(node.getAttribute("fill") || "") || node.getAttribute("stroke") !== "none"
            || node.getAttribute("shape-rendering") !== "crispEdges"
            || ["opacity", "fill-opacity"].some((name) => node.hasAttribute(name) && node.getAttribute(name) !== "1")) {
            return "Removal requires an explicit opaque solid fill, no stroke, crisp edges, and full opacity.";
        }
        for (const parent of ancestors(node)) {
            const allowed = parent.localName === "svg" ? ROOT_ATTRIBUTES : new Set(["id"]);
            if (attributes(parent).some(([name]) => !allowed.has(name))) return "Inherited presentation or coordinate context requires manual review.";
        }
    }
    const signature = (node) => JSON.stringify(attributes(node).sort(([a], [b]) => a.localeCompare(b)));
    if (signature(first) !== signature(duplicate)) return "Presentation or source attributes differ; manual review required.";
    return null;
}

export function getOverlappingSourceElements(document) {
    return [...document.querySelectorAll(SELECTOR)];
}

export function inspectOverlappingDocument(document) {
    const root = document?.documentElement;
    if (!root || root.localName !== "svg" || root.namespaceURI !== SVG_NS || document.querySelector("parsererror")) {
        throw new Error("Choose a valid SVG document with the SVG namespace.");
    }
    const all = [...document.querySelectorAll("*")];
    const documentRisk = Boolean(document.doctype)
        || [...(document.childNodes || [])].some((node) => node.nodeType === 7)
        || all.some((node) => ["style", "script", "use", "animate", "animateTransform", "animateMotion", "set", "foreignObject"].includes(node.localName)
            || attributes(node).some(([name, value]) => name === "style" || name === "href" || name.endsWith(":href") || /^on/i.test(name) || /url\s*\(/i.test(value)));
    const nodes = getOverlappingSourceElements(document);
    const shapes = nodes.slice(0, 300).map(normalize);
    const findings = [];
    const proposals = [];
    function add(kind, indexes, reason, proposal = null) {
        const number = findings.length + 1;
        const id = `overlap-finding-${number}`;
        findings.push({ id, number, kind, indexes, reason, proposalId: proposal?.id ?? null });
        if (proposal) proposals.push({ ...proposal, findingId: id, requiresReview: true, safeToAutoApply: false });
    }
    for (const shape of shapes) {
        if (shape.reason) add("unsupported-geometry", [shape.index], shape.reason);
    }
    if (nodes.length > shapes.length) add("unsupported-geometry", [], "Only the first 300 shapes were inspected. Remaining geometry requires manual review.");
    const canonical = new Map();
    for (const shape of shapes.filter(({ bounds }) => bounds)) {
        const first = canonical.get(shape.exactKey);
        if (!first) { canonical.set(shape.exactKey, shape); continue; }
        const risk = safeRemoval(nodes[first.index], nodes[shape.index], documentRisk);
        add("exact-duplicate", [first.index, shape.index], risk || "Adjacent exact opaque crisp-edge rectangles share identical attributes and drawing context; keep the first and propose removing the second.", risk ? null : {
            id: `remove-exact-overlap:${shape.index}`, kind: "remove-exact-duplicate-shape", keptIndex: first.index, duplicateIndex: shape.index,
        });
    }
    const unique = [...canonical.values()];
    let capped = false;
    for (let a = 0; a < unique.length && !capped; a++) {
        for (let b = a + 1; b < unique.length; b++) {
            const first = unique[a], second = unique[b];
            if (!first.bounds || !second.bounds || first.exactKey === second.exactKey) continue;
            const circle = first.type === "circle" ? first : second.type === "circle" ? second : null;
            const rectangle = circle === first ? second : first;
            if (circle && ["rect", "path"].includes(rectangle.type) && circleCrossesRectangle(circle.geometry, rectangle.bounds)) {
                if (findings.length >= 500) { capped = true; break; }
                add("outline-crossing", [first.index, second.index], "The circle outline crosses a rectangle edge. Review where to join or trim both contours.");
                continue;
            }
            if (first.type === "circle" && second.type === "circle"
                && [first, second].every(({ index }) => nodes[index].getAttribute("fill") === "none")) {
                const a = first.geometry, b = second.geometry;
                const separation = Math.hypot(a.cx - b.cx, a.cy - b.cy);
                if (separation < Math.abs(a.r - b.r) || separation > a.r + b.r) continue;
            }
            const x = Math.max(first.bounds.x, second.bounds.x), y = Math.max(first.bounds.y, second.bounds.y);
            if (Math.min(first.bounds.x + first.bounds.width, second.bounds.x + second.bounds.width) > x
                && Math.min(first.bounds.y + first.bounds.height, second.bounds.y + second.bounds.height) > y) {
                if (findings.length >= 500) { capped = true; break; }
                add("possible-overlap", [first.index, second.index], "Drawing bounds overlap. Partial intersection, containment, or equivalent geometry is ambiguous; bounds alone do not prove an intersection or a safe removal.");
            }
        }
    }
    if (capped) add("unsupported-geometry", [], "Finding limit reached; additional pairs require manual review.");
    return { productId: "overlapping_shape_repair", shapeCount: nodes.length, inspectedCount: shapes.length, shapes, findings, proposals };
}

export function inspectOverlappingSvg(source, { DOMParser: Parser = globalThis.DOMParser } = {}) {
    if (typeof source !== "string" || !source.trim() || typeof Parser !== "function") throw new Error("Choose a non-empty SVG file.");
    return inspectOverlappingDocument(new Parser().parseFromString(source, "image/svg+xml"));
}
