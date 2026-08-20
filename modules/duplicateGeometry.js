export const DUPLICATE_GEOMETRY_PRODUCT_ID = "duplicate_geometry";

const GEOMETRY_ATTRIBUTES = new Set(["x1", "y1", "x2", "y2"]);
const REFERENCE_ATTRIBUTES = new Set(["id", "href", "xlink:href"]);

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
    const firstPoint = pointKey(x1, y1);
    const secondPoint = pointKey(x2, y2);

    return [firstPoint, secondPoint].sort().join("|");
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

    if (!attributesMatch(keptLine, duplicateLine)) {
        return {
            recommendation: "review",
            reason: "Matching geometry has different styling or metadata.",
        };
    }

    return {
        recommendation: "remove",
        reason: "Exact geometry, parent, styling, and metadata match.",
    };
}

export function findExactDuplicateLines(svgDocument) {
    const groups = new Map();

    [...svgDocument.querySelectorAll("line")].forEach((lineElement, index) => {
        const geometryKey = getExactLineKey(lineElement);

        if (!geometryKey) {
            return;
        }

        const group = groups.get(geometryKey) ?? [];
        group.push({ lineElement, index });
        groups.set(geometryKey, group);
    });

    return [...groups.entries()].flatMap(([geometryKey, matches]) => {
        if (matches.length < 2) {
            return [];
        }

        const kept = matches[0];

        return matches.slice(1).map((duplicate) => ({
            productId: DUPLICATE_GEOMETRY_PRODUCT_ID,
            geometryKey,
            keptElement: kept.lineElement,
            duplicateElement: duplicate.lineElement,
            keptIndex: kept.index,
            duplicateIndex: duplicate.index,
            ...assessRemovalSafety(kept.lineElement, duplicate.lineElement),
        }));
    });
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

    const lineElements = [...svgDocument.querySelectorAll("line")];
    const unsupported = lineElements
        .map((lineElement, index) => ({ lineElement, index }))
        .filter(({ lineElement }) => getExactLineKey(lineElement) === null)
        .map(({ index }) => index);
    const proposals = findExactDuplicateLines(svgDocument);
    const removalIndexes = proposals
        .filter((proposal) => proposal.recommendation === "remove")
        .map((proposal) => proposal.duplicateIndex);

    return {
        productId: DUPLICATE_GEOMETRY_PRODUCT_ID,
        lineCount: lineElements.length,
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
