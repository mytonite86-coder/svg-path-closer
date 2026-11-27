import { parseCurvePathData } from "./curveAnalyzer.js";

export const DUPLICATE_GEOMETRY_PRODUCT_ID = "duplicate_geometry";

const GEOMETRY_ATTRIBUTES = new Set(["x1", "y1", "x2", "y2", "d", "points", "cx", "cy", "r", "rx", "ry"]);
const REFERENCE_ATTRIBUTES = new Set(["id", "href", "xlink:href"]);
const GEOMETRY_SELECTOR = "line, path, polyline, polygon, circle, ellipse";
const SVG_NUMBER = /^[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?$/;

function readCoordinate(lineElement, attributeName) {
    const rawValue = lineElement.getAttribute(attributeName);
    const value = rawValue === null || rawValue.trim() === ""
        ? 0
        : Number(rawValue);

    return Number.isFinite(value) ? value : null;
}

function pointKey(x, y) {
    return `${Object.is(x, -0) ? 0 : x},${Object.is(y, -0) ? 0 : y}`;
}

export function getExactLineKey(lineElement) {
    if (lineElement?.tagName?.toLowerCase() !== "line") {
        return null;
    }

    const coordinates = ["x1", "y1", "x2", "y2"].map(
        (attributeName) => readCoordinate(lineElement, attributeName)
    );

    if (coordinates.some((coordinate) => coordinate === null)) {
        return null;
    }

    const [x1, y1, x2, y2] = coordinates;
    return segmentKey({ x: x1, y: y1 }, { x: x2, y: y2 });
}

function segmentKey(start, end) {
    const firstPoint = pointKey(start.x, start.y);
    const secondPoint = pointKey(end.x, end.y);
    return [firstPoint, secondPoint].sort().join("|");
}

function straightSegments(element) {
    const type = (element.localName ?? element.tagName).toLowerCase();
    if (type === "line") {
        const key = getExactLineKey(element);
        return key ? [{ key, wholeElement: true }] : [];
    }

    let data = element.getAttribute("d");
    if (type === "polyline" || type === "polygon") {
        const points = element.getAttribute("points") ?? "";
        if (/[a-df-z]/i.test(points)) return [];
        data = `M ${points} ${type === "polygon" ? "Z" : ""}`;
    }
    const parsed = parseCurvePathData(data, { extended: true });
    if (!parsed.supported) return [];
    const standalone = parsed.commands.length === 2 && parsed.commands[1].type === "L";
    return parsed.commands.flatMap((command, index) => (
        ["L", "Z"].includes(command.type)
        && (command.start.x !== command.end.x || command.start.y !== command.end.y)
            ? [{
                key: segmentKey(command.start, command.end),
                wholeElement: standalone,
                sourceGeometry: command.exactGeometry,
                segmentIndex: index,
            }]
            : []
    ));
}

function shapeOutline(element) {
    const type = element.localName;
    if (type !== "circle" && type !== "ellipse") return [];
    const dimensions = type === "circle" ? ["r"] : ["rx", "ry"];
    const coordinates = ["cx", "cy", ...dimensions].map((name) =>
        (element.getAttribute(name) ?? (dimensions.includes(name) ? "" : "0")).trim());
    if (coordinates.some((value) => !SVG_NUMBER.test(value) || !Number.isFinite(Number(value)))
        || coordinates.slice(2).some((value) => Number(value) <= 0)) return [];
    return [{
        key: `${type}:${coordinates.join(",")}`,
        wholeElement: true,
        outline: { type, center: coordinates.slice(0, 2), radii: coordinates.slice(2) },
    }];
}

function getNonGeometryAttributes(lineElement) {
    return [...lineElement.attributes]
        .filter((attribute) => !GEOMETRY_ATTRIBUTES.has(attribute.name.toLowerCase()))
        .map((attribute) => [attribute.name.toLowerCase(), attribute.value])
        .sort(([firstName], [secondName]) => firstName.localeCompare(secondName));
}

function hasReferenceRisk(lineElement) {
    return [...lineElement.attributes].some((attribute) =>
        REFERENCE_ATTRIBUTES.has(attribute.name.toLowerCase())
    );
}

function attributesMatch(firstLine, secondLine) {
    return JSON.stringify(getNonGeometryAttributes(firstLine)) ===
        JSON.stringify(getNonGeometryAttributes(secondLine));
}

function assessRemovalSafety(keptLine, duplicateLine) {
    if (keptLine.parentNode !== duplicateLine.parentNode) {
        return {
            recommendation: "review",
            reason: "Matching geometry appears in different groups and may inherit different presentation.",
        };
    }

    if (hasReferenceRisk(keptLine) || hasReferenceRisk(duplicateLine)) {
        return {
            recommendation: "review",
            reason: "At least one matching line may be referenced elsewhere in the SVG.",
        };
    }

    const outline = ["circle", "ellipse"].includes(keptLine.localName);
    if (keptLine.tagName !== duplicateLine.tagName
        || keptLine.closest?.("defs, symbol, clipPath, mask, pattern, marker, [transform]")
        || duplicateLine.closest?.("defs, symbol, clipPath, mask, pattern, marker, [transform]")
        || ((keptLine.tagName.toLowerCase() === "path" || outline) && keptLine.ownerDocument?.querySelector("style"))) {
        return {
            recommendation: "review",
            reason: "Element types, CSS, or coordinate/reference context need review before removal.",
        };
    }

    if (!attributesMatch(keptLine, duplicateLine)) {
        return {
            recommendation: "review",
            reason: "Matching geometry has different styling or metadata.",
        };
    }
    if (outline) {
        const allowed = new Set([...GEOMETRY_ATTRIBUTES, "fill", "stroke", "stroke-width"]);
        for (const node of [keptLine, duplicateLine]) {
            if (node.children.length || [...node.attributes].some(({ name }) => !allowed.has(name))) {
                return { recommendation: "review", reason: "Effects or metadata need manual review before deleting this outline." };
            }
        }
    }

    return {
        recommendation: "remove",
        reason: "Exact geometry, parent, styling, and metadata match.",
    };
}

function scanStraightSegments(svgDocument) {
    return [...svgDocument.querySelectorAll(GEOMETRY_SELECTOR)].map((element) => [...straightSegments(element), ...shapeOutline(element)]
        .map((segment) => ({ lineElement: element, ...segment })));
}

function findMatches(scanned) {
    const groups = new Map();
    scanned.forEach((segments, index) => {
        for (const segment of segments) {
            const group = groups.get(segment.key) ?? [];
            group.push({ index, ...segment });
            groups.set(segment.key, group);
        }
    });

    return [...groups.entries()].flatMap(([geometryKey, matches]) => {
        if (matches.length < 2) {
            return [];
        }

        const kept = matches[0];

        return matches.slice(1).map((duplicate) => ({
            productId: DUPLICATE_GEOMETRY_PRODUCT_ID,
            geometryKey,
            outline: duplicate.outline,
            keptElement: kept.lineElement,
            duplicateElement: duplicate.lineElement,
            keptIndex: kept.index,
            duplicateIndex: duplicate.index,
            keptSegmentIndex: kept.segmentIndex,
            duplicateSegmentIndex: duplicate.segmentIndex,
            ...(kept.wholeElement && duplicate.wholeElement && exactPathCoordinatesMatch(kept, duplicate)
                ? assessRemovalSafety(kept.lineElement, duplicate.lineElement)
                : { recommendation: "review", reason: "Verify the matching segment in its path before editing the surrounding geometry." }),
        }));
    });
}

export function findExactDuplicateLines(svgDocument) {
    return findMatches(scanStraightSegments(svgDocument));
}

function exactPathCoordinatesMatch(first, second) {
    if (!first.sourceGeometry || !second.sourceGeometry) return true;
    const exactKey = ({ start, end }) => [start.join(","), end.join(",")].sort().join("|");
    return exactKey(first.sourceGeometry) === exactKey(second.sourceGeometry);
}

export function applyDuplicateLineRemovals(proposals) {
    const removable = proposals.filter(
        (proposal) => proposal?.recommendation === "remove"
    );

    removable.forEach((proposal) => proposal.duplicateElement.remove());

    return removable.length;
}

export function analyzeDuplicateGeometry(svgText, options = {}) {
    const Parser = options.DOMParser ?? globalThis.DOMParser;
    const Serializer = options.XMLSerializer ?? globalThis.XMLSerializer;

    if (!Parser || !Serializer) {
        throw new Error("SVG parsing is not available in this environment.");
    }

    const svgDocument = new Parser().parseFromString(svgText, "image/svg+xml");
    const root = svgDocument.documentElement;

    if (
        svgDocument.querySelector("parsererror") ||
        root?.localName?.toLowerCase() !== "svg"
    ) {
        throw new Error("The selected file is not a valid SVG.");
    }

    const scanned = scanStraightSegments(svgDocument);
    const unsupported = scanned.flatMap((segments, index) => segments.length ? [] : [index]);
    const proposals = findMatches(scanned);
    const removalIndexes = proposals
        .filter((proposal) => proposal.recommendation === "remove")
        .map((proposal) => proposal.duplicateIndex);

    return {
        productId: DUPLICATE_GEOMETRY_PRODUCT_ID,
        lineCount: scanned.length,
        scannedSegmentCount: scanned.reduce((count, segments) => count + segments.length, 0),
        proposals,
        removalIndexes,
        unsupported,
        proposedSvg: new Serializer().serializeToString(svgDocument),
    };
}

export function createDuplicateRemovalSvg(svgText, selectedDuplicateIndexes, options = {}) {
    const Parser = options.DOMParser ?? globalThis.DOMParser;
    const Serializer = options.XMLSerializer ?? globalThis.XMLSerializer;

    if (!Parser || !Serializer) {
        throw new Error("SVG parsing is not available in this environment.");
    }

    const svgDocument = new Parser().parseFromString(svgText, "image/svg+xml");
    const root = svgDocument.documentElement;

    if (svgDocument.querySelector("parsererror") || root?.localName?.toLowerCase() !== "svg") {
        throw new Error("The selected file is not a valid SVG.");
    }

    const selectedIndexes = new Set(selectedDuplicateIndexes);
    const selectedProposals = findExactDuplicateLines(svgDocument).filter(
        (proposal) => proposal.recommendation === "remove" && selectedIndexes.has(proposal.duplicateIndex)
    );
    const removedCount = applyDuplicateLineRemovals(selectedProposals);

    return {
        removedCount,
        svgText: new Serializer().serializeToString(svgDocument),
    };
}
