import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    DUPLICATE_GEOMETRY_PRODUCT_ID,
    analyzeDuplicateGeometry,
    applyDuplicateLineRemovals,
    createDuplicateRemovalSvg,
    findExactDuplicateLines,
    getExactLineKey,
} from "../modules/duplicateGeometry.js";

const fixture = (name) => readFile(
    new URL(`fixtures/${name}`, import.meta.url),
    "utf8"
);

test("the review page versions its controller and engine together", async () => {
    const page = await readFile(new URL("../duplicate-geometry.html", import.meta.url), "utf8");
    const controller = await readFile(new URL("../duplicate-geometry.js", import.meta.url), "utf8");
    const pageVersion = page.match(/duplicate-geometry\.js\?v=([^\"]+)/)?.[1];
    const engineVersion = controller.match(/duplicateGeometry\.js\?v=([^\"]+)/)?.[1];

    assert.ok(pageVersion);
    assert.equal(engineVersion, pageVersion);
});

function line(attributes, parentNode = {}) {
    const values = new Map(Object.entries(attributes));
    return {
        tagName: "line",
        parentNode,
        removed: false,
        get attributes() {
            return [...values].map(([name, value]) => ({ name, value: String(value) }));
        },
        getAttribute: (name) => values.has(name) ? String(values.get(name)) : null,
        remove() {
            this.removed = true;
        },
    };
}

function documentWith(...lines) {
    return { querySelectorAll: () => lines };
}

test("matches exact line geometry in either direction", () => {
    const parent = {};
    const first = line({ x1: 1, y1: 2, x2: 3, y2: 4 }, parent);
    const reversed = line({ x1: 3, y1: 4, x2: 1, y2: 2 }, parent);

    assert.equal(getExactLineKey(first), getExactLineKey(reversed));
    const proposals = findExactDuplicateLines(documentWith(first, reversed));
    assert.equal(proposals.length, 1);
    assert.equal(proposals[0].productId, DUPLICATE_GEOMETRY_PRODUCT_ID);
    assert.equal(proposals[0].recommendation, "remove");
});

test("does not treat near or invalid coordinates as exact duplicates", () => {
    const parent = {};
    const lines = [
        line({ x1: 0, y1: 0, x2: 10, y2: 10 }, parent),
        line({ x1: 0, y1: 0, x2: 10.000001, y2: 10 }, parent),
        line({ x1: "10px", y1: 10, x2: 0, y2: 0 }, parent),
    ];

    assert.deepEqual(findExactDuplicateLines(documentWith(...lines)), []);
});

test("requires review when presentation, references, or parent context differ", () => {
    const parent = {};
    const original = line({ x1: 0, y1: 0, x2: 5, y2: 5, stroke: "black" }, parent);
    const styled = line({ x1: 5, y1: 5, x2: 0, y2: 0, stroke: "red" }, parent);
    const referenced = line({ x1: 0, y1: 0, x2: 5, y2: 5, stroke: "black", id: "cut" }, parent);
    const grouped = line({ x1: 0, y1: 0, x2: 5, y2: 5, stroke: "black" }, {});

    const proposals = findExactDuplicateLines(
        documentWith(original, styled, referenced, grouped)
    );

    assert.equal(proposals.length, 3);
    assert.ok(proposals.every((proposal) => proposal.recommendation === "review"));
});

test("removes only explicitly safe proposals", () => {
    const safeLine = line({});
    const reviewLine = line({});
    const removed = applyDuplicateLineRemovals([
        { recommendation: "remove", duplicateElement: safeLine },
        { recommendation: "review", duplicateElement: reviewLine },
    ]);

    assert.equal(removed, 1);
    assert.equal(safeLine.removed, true);
    assert.equal(reviewLine.removed, false);
});

test("focused SVG fixtures preserve curves and encode the safety boundary", async () => {
    const duplicates = await fixture("duplicate-lines.svg");
    const distinct = await fixture("distinct-lines.svg");
    const unsupported = await fixture("unsupported-lines.svg");

    assert.equal((duplicates.match(/<line\b/g) ?? []).length, 3);
    assert.match(duplicates, /<path\b/);
    assert.match(distinct, /10\.001/);
    assert.match(distinct, /stroke="red"/);
    assert.match(unsupported, /x1="10%"/);
    assert.match(unsupported, /<polyline\b/);
});

test("rejects malformed SVG reported by the XML parser", () => {
    class InvalidParser {
        parseFromString() {
            return {
                documentElement: null,
                querySelector: (selector) => selector === "parsererror" ? {} : null,
            };
        }
    }

    assert.throws(
        () => analyzeDuplicateGeometry("<svg><line>", {
            DOMParser: InvalidParser,
            XMLSerializer: class {},
        }),
        /not a valid SVG/
    );
});

test("Tool 2 uses its own badge instead of the SVG Micro Eco family emblem", async () => {
    const page = await readFile(
        new URL("../duplicate-geometry.html", import.meta.url),
        "utf8"
    );
    const badge = await readFile(
        new URL("../assets/duplicate-line-remover-badge.svg", import.meta.url),
        "utf8"
    );

    assert.match(page, /assets\/duplicate-line-remover-badge\.svg/);
    assert.doesNotMatch(page, /rel="icon" href="assets\/svg-micro-eco-badge\.svg/);
    assert.match(badge, /two exact duplicate lines reduced to one retained line/);
    assert.match(badge, />DUPLICATE</);
    assert.match(badge, />LINE REMOVER</);
});

test("analysis does not remove geometry before customer confirmation", () => {
    const parent = {};
    const kept = line({ x1: 0, y1: 0, x2: 5, y2: 5 }, parent);
    const duplicate = line({ x1: 0, y1: 0, x2: 5, y2: 5 }, parent);
    const svgDocument = {
        documentElement: { localName: "svg" },
        querySelector: () => null,
        querySelectorAll: () => [kept, duplicate],
    };
    class Parser { parseFromString() { return svgDocument; } }
    class Serializer { serializeToString() { return "<svg />"; } }

    analyzeDuplicateGeometry("<svg />", { DOMParser: Parser, XMLSerializer: Serializer });

    assert.equal(duplicate.removed, false);
});

test("creates output from only the safe removals explicitly selected", () => {
    const parent = {};
    const kept = line({ x1: 0, y1: 0, x2: 5, y2: 5 }, parent);
    const selected = line({ x1: 5, y1: 5, x2: 0, y2: 0 }, parent);
    const unselected = line({ x1: 0, y1: 0, x2: 5, y2: 5 }, parent);
    const svgDocument = {
        documentElement: { localName: "svg" },
        querySelector: () => null,
        querySelectorAll: () => [kept, selected, unselected],
    };
    class Parser { parseFromString() { return svgDocument; } }
    class Serializer { serializeToString() { return "<svg reviewed=\"true\" />"; } }

    const result = createDuplicateRemovalSvg("<svg />", [1], {
        DOMParser: Parser,
        XMLSerializer: Serializer,
    });

    assert.equal(result.removedCount, 1);
    assert.equal(selected.removed, true);
    assert.equal(unselected.removed, false);
    assert.match(result.svgText, /reviewed/);
});
