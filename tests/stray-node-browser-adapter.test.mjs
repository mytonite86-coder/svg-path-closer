import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    StrayNodeSvgInputError,
    inspectStrayNodeSvg,
    normalizeSvgGeometry,
    presentStrayNodeFinding,
    readLocalSvgFile,
} from "../modules/strayNodeBrowserAdapter.js";

function svgElement(localName, attributes = {}) {
    const values = new Map(Object.entries(attributes).map(([name, value]) => [name, String(value)]));
    return {
        localName,
        getAttribute: (name) => values.has(name) ? values.get(name) : null,
        hasAttribute: (name) => values.has(name),
    };
}

function parserFor({ root = "svg", geometry = [], malformed = false } = {}) {
    return class FixtureParser {
        parseFromString() {
            return {
                documentElement: { localName: root },
                querySelector: (selector) => selector === "parsererror" && malformed ? {} : null,
                querySelectorAll: () => geometry,
            };
        }
    };
}

test("reads only non-empty local SVG files", async () => {
    assert.equal(await readLocalSvgFile({
        name: "drawing.svg",
        type: "image/svg+xml",
        text: async () => "<svg />",
    }), "<svg />");

    await assert.rejects(
        readLocalSvgFile({ name: "drawing.txt", type: "text/plain", text: async () => "text" }),
        { code: "unsupported_file" }
    );
    await assert.rejects(
        readLocalSvgFile({ name: "empty.svg", type: "image/svg+xml", text: async () => "  " }),
        { code: "empty_file" }
    );
});

test("normalizes supported line, point-list, and linear path geometry", () => {
    assert.deepEqual(normalizeSvgGeometry(svgElement("line", {
        id: "cut-line", x1: 0, y1: 1, x2: 5, y2: 6,
    })).element, {
        id: "cut-line", type: "line", closed: false,
        nodes: [{ x: 0, y: 1 }, { x: 5, y: 6 }],
    });
    assert.deepEqual(
        normalizeSvgGeometry(svgElement("polygon", { points: "0,0 10,0 10,10" })).element.nodes,
        [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]
    );
    const path = normalizeSvgGeometry(svgElement("path", { d: "M0 0 H10 V5 Z" }));
    assert.equal(path.supported, true);
    assert.equal(path.element.closed, true);
    assert.deepEqual(path.element.nodes, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }]);
});

test("converts supported SVG geometry and presents existing analyzer findings", () => {
    const geometry = [
        svgElement("polyline", { id: "duplicate-node", points: "0,0 5,0 5,0 10,0" }),
        svgElement("path", { id: "curve", d: "M0 0 C1 2 3 4 5 6" }),
    ];
    const result = inspectStrayNodeSvg("<svg>unchanged source</svg>", {
        DOMParser: parserFor({ geometry }),
    });

    assert.equal(result.elementCount, 2);
    assert.equal(result.supportedElementCount, 1);
    assert.equal(result.unsupported.length, 1);
    assert.ok(result.findings.some(({ classification, elementId }) =>
        classification === "coincident-node" && elementId === "duplicate-node"
    ));
    assert.ok(result.findings.some(({ classification, elementId }) =>
        classification === "unsupported-geometry" && elementId === "curve"
    ));
    assert.deepEqual(result.repairProposals, []);
    assert.ok(result.findings.every(({ safeToAutoRepair }) => safeToAutoRepair === false));

    const presented = presentStrayNodeFinding(
        result.findings.find(({ classification }) => classification === "coincident-node")
    );
    assert.equal(presented.title, "Coincident node");
    assert.equal(presented.geometry, "polyline #duplicate-node");
    assert.equal(presented.reviewOnly, true);
});

test("rejects empty, malformed, non-SVG, and geometry-free SVG input safely", () => {
    assert.throws(() => inspectStrayNodeSvg(""), { code: "empty_svg" });
    assert.throws(
        () => inspectStrayNodeSvg("<svg>", { DOMParser: parserFor({ malformed: true }) }),
        { code: "malformed_svg" }
    );
    assert.throws(
        () => inspectStrayNodeSvg("<xml />", { DOMParser: parserFor({ root: "xml" }) }),
        { code: "not_svg" }
    );
    assert.throws(
        () => inspectStrayNodeSvg("<svg><circle /></svg>", { DOMParser: parserFor() }),
        { code: "unsupported_svg" }
    );
});

test("flags transformed and malformed supported elements without interpreting them", () => {
    const transformed = normalizeSvgGeometry(svgElement("line", {
        id: "moved", x1: 0, y1: 0, x2: 1, y2: 1, transform: "translate(5 5)",
    }));
    const malformed = normalizeSvgGeometry(svgElement("line", {
        id: "units", x1: "1px", y1: 0, x2: 1, y2: 1,
    }));
    assert.equal(transformed.supported, false);
    assert.match(transformed.reason, /Transformed geometry/);
    assert.equal(malformed.supported, false);
    assert.match(malformed.reason, /finite unitless numbers/);
});

test("customer page remains local and review-only", async () => {
    const [page, controller, adapter] = await Promise.all([
        readFile(new URL("../stray-node-cleaner.html", import.meta.url), "utf8"),
        readFile(new URL("../stray-node-cleaner.js", import.meta.url), "utf8"),
        readFile(new URL("../modules/strayNodeBrowserAdapter.js", import.meta.url), "utf8"),
    ]);

    assert.match(page, /id="stray-node-file"[^>]*type="file"/);
    assert.match(page, /Automatic and manual repairs are not available/);
    assert.match(page, /No geometry is altered/);
    assert.doesNotMatch(page, /\bdownload(?:=|\s)|id="[^"]*download|checkout|subscribe/i);
    assert.doesNotMatch(controller, /fetch\(|XMLHttpRequest|sendBeacon|Blob|createObjectURL|\.download/);
    assert.doesNotMatch(adapter, /XMLSerializer|remove\(|replaceWith|setAttribute|fetch\(/);
    assert.match(adapter, /analyzeStrayNodes\(elements\)/);
});

test("input errors expose stable safe categories", () => {
    const error = new StrayNodeSvgInputError("unsupported_svg", "Unsupported SVG.");
    assert.equal(error.code, "unsupported_svg");
    assert.equal(error.message, "Unsupported SVG.");
});
