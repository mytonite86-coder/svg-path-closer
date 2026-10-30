import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import { inspectOverlappingDocument, inspectOverlappingSvg } from "../modules/overlappingShapes.js";
import { renderOverlappingPreview, highlightOverlappingFinding } from "../modules/overlappingShapePreview.js";
import { buildTool4LocalBundle, outputPath } from "../scripts/build-tool4-local.mjs";

const NS = "http://www.w3.org/2000/svg";
class Element {
    constructor(localName, values = {}, children = []) {
        this.localName = localName;
        this.namespaceURI = NS;
        this.values = { ...values };
        this.children = children;
        children.forEach((child, index) => { child.parentElement = this; child.previousElementSibling = children[index - 1] || null; });
    }
    get attributes() { return Object.entries(this.values).map(([name, value]) => ({ name, value })); }
    getAttribute(name) { return this.values[name] ?? null; }
    hasAttribute(name) { return Object.hasOwn(this.values, name); }
    setAttribute(name, value) { this.values[name] = String(value); }
    all() { return [this, ...this.children.flatMap((node) => node.all())]; }
    snapshot() { return [this.localName, this.values, this.children.map((node) => node.snapshot())]; }
}
const rect = (extra = {}) => new Element("rect", { x: "20", y: "30", width: "120", height: "100", fill: "#2563eb", stroke: "none", "shape-rendering": "crispEdges", ...extra });
function documentFor(children, rootAttributes = {}) {
    const root = new Element("svg", { xmlns: NS, ...rootAttributes }, children);
    return { documentElement: root, childNodes: [root], querySelector: () => null, querySelectorAll: (selector) => root.all().filter((node) => selector === "*" || selector.split(",").includes(node.localName)) };
}

test("offers only the second adjacent exact safe rectangle and never mutates the document", () => {
    const document = documentFor([rect(), rect(), rect({ id: "control", x: "220", width: "80" })]);
    const before = JSON.stringify(document.documentElement.snapshot());
    const result = inspectOverlappingDocument(document);
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].number, 1);
    assert.equal(result.findings[0].kind, "exact-duplicate");
    assert.equal(result.proposals.length, 1);
    assert.equal(result.proposals[0].keptIndex, 0);
    assert.equal(result.proposals[0].duplicateIndex, 1);
    assert.equal(result.proposals[0].safeToAutoApply, false);
    assert.equal(result.proposals[0].requiresReview, true);
    assert.equal(JSON.stringify(document.documentElement.snapshot()), before);
});

test("partial overlaps, containment and source-number ambiguity remain review-only", () => {
    for (const pair of [
        [rect(), rect({ x: "100" })],
        [rect(), rect({ x: "40", width: "30" })],
        [rect({ x: "20.000000000000000001" }), rect({ x: "20.000000000000000002" })],
    ]) {
        const result = inspectOverlappingDocument(documentFor(pair));
        assert.equal(result.proposals.length, 0);
        assert.ok(result.findings.some(({ kind }) => kind === "possible-overlap"));
        assert.ok(result.findings.every(({ proposalId }) => proposalId === null));
    }
});

test("does not flag separated shapes or merely touching rectangle edges", () => {
    const result = inspectOverlappingDocument(documentFor([rect(), rect({ x: "140" }), new Element("circle", { cx: "310", cy: "80", r: "20" })]));
    assert.equal(result.findings.length, 0);
    assert.equal(result.proposals.length, 0);
});

test("IDs, presentation differences, transparency, strokes and metadata exclude exact duplicates", () => {
    const variants = [{ id: "preserve-id" }, { class: "styled" }, { opacity: "0.5" }, { "fill-opacity": "0.5" }, { stroke: "black" }, { fill: "url(#paint)" }, { "data-note": "preserve" }, { "shape-rendering": "auto" }];
    for (const extra of variants) {
        const result = inspectOverlappingDocument(documentFor([rect(extra), rect(extra)]));
        assert.equal(result.proposals.length, 0, JSON.stringify(extra));
        assert.ok(result.findings.some(({ kind }) => kind === "exact-duplicate"));
    }
    assert.equal(inspectOverlappingDocument(documentFor([rect(), rect({ fill: "#ffffff" })])).proposals.length, 0);
});

test("references, CSS, active content and inherited effects disable safe selection", () => {
    for (const other of [new Element("use", { href: "#id" }), new Element("style"), new Element("script"), new Element("animate"), new Element("path", { style: "fill:red", d: "M0 0" })]) {
        assert.equal(inspectOverlappingDocument(documentFor([rect(), rect(), other])).proposals.length, 0);
    }
    assert.equal(inspectOverlappingDocument(documentFor([new Element("g", { opacity: "0.5" }, [rect(), rect()])])).proposals.length, 0);
    const document = documentFor([rect(), rect()]);
    document.childNodes.unshift({ nodeType: 7 });
    assert.equal(inspectOverlappingDocument(document).proposals.length, 0);
});

test("group and stacking differences never become executable proposals", () => {
    const grouped = documentFor([new Element("g", { id: "one" }, [rect()]), new Element("g", { id: "two" }, [rect()])]);
    assert.equal(inspectOverlappingDocument(grouped).proposals.length, 0);
    const intervening = documentFor([rect(), rect({ x: "250" }), rect()]);
    assert.equal(inspectOverlappingDocument(intervening).proposals.length, 0);
});

test("transforms, nested viewports, rounded rectangles and unsupported shapes are explicitly flagged", () => {
    for (const node of [rect({ transform: "translate(10)" }), rect({ rx: "10" }), new Element("path", { d: "M0 0 C0 5 5 10 10 10" }), new Element("g", { transform: "scale(2)" }, [rect()]), new Element("svg", { viewBox: "0 0 10 10" }, [rect()])]) {
        const result = inspectOverlappingDocument(documentFor([node]));
        assert.equal(result.proposals.length, 0);
        assert.ok(result.findings.some(({ kind }) => kind === "unsupported-geometry"));
    }
});

test("exact circles and ellipses are distinguishable from partial bounds overlaps but remain review-only", () => {
    for (const type of ["circle", "ellipse"]) {
        const attrs = { cx: "40", cy: "40", ...(type === "circle" ? { r: "20" } : { rx: "20", ry: "15" }) };
        const result = inspectOverlappingDocument(documentFor([new Element(type, attrs), new Element(type, attrs)]));
        assert.equal(result.findings[0].kind, "exact-duplicate");
        assert.equal(result.proposals.length, 0);
    }
});

test("invalid, unit-bearing or degenerate geometry cannot enter the proposal list", () => {
    for (const extra of [{ width: "0" }, { width: "-10" }, { width: "10px" }, { x: "NaN" }, { x: "1e309" }]) {
        const result = inspectOverlappingDocument(documentFor([rect(extra), rect(extra)]));
        assert.equal(result.proposals.length, 0);
        assert.ok(result.findings.every(({ kind }) => kind === "unsupported-geometry"));
    }
    assert.throws(() => inspectOverlappingSvg(""), /non-empty/);
    const invalid = documentFor([]);
    invalid.querySelector = () => ({});
    assert.throws(() => inspectOverlappingDocument(invalid), /valid SVG/);
});

test("preview reconstructs numeric shapes and highlights both shapes without copying source attributes", () => {
    const result = inspectOverlappingDocument(documentFor([rect({ onclick: "malicious()" }), rect(), rect({ x: "250" })]));
    const children = [];
    const svg = { ownerDocument: { createElementNS: (_ns, type) => new Element(type) }, replaceChildren: () => children.splice(0), append: (node) => children.push(node), setAttribute() {} };
    const rendered = renderOverlappingPreview(svg, result.shapes);
    assert.equal(rendered.size, 3);
    assert.equal(children[0].hasAttribute("onclick"), false);
    highlightOverlappingFinding(rendered, [0, 1]);
    assert.equal(rendered.get(0).getAttribute("aria-current"), "true");
    assert.equal(rendered.get(1).getAttribute("aria-current"), "true");
    assert.equal(rendered.get(2).getAttribute("aria-current"), "false");
});

test("direct-file bundle stays in sync, registers upload and keeps detection non-mutating", async () => {
    const [page, controller, bundle, detector] = await Promise.all([
        readFile(new URL("../overlapping-shape-repair.html", import.meta.url), "utf8"),
        readFile(new URL("../overlapping-shape-repair.js", import.meta.url), "utf8"), readFile(outputPath, "utf8"),
        readFile(new URL("../modules/overlappingShapes.js", import.meta.url), "utf8"),
    ]);
    assert.match(page, /<script defer src="overlapping-shape-repair\.local\.js/);
    assert.equal(bundle.replace(/\r\n/g, "\n"), await buildTool4LocalBundle());
    assert.doesNotMatch(detector, /XMLSerializer|createObjectURL|new Blob|fetch\(|\.remove\(|removeChild|\.download\s*=/);
    assert.doesNotMatch(controller, /innerHTML|outerHTML|insertAdjacentHTML/);
    const listeners = new Map();
    new Script(bundle).runInNewContext({ localStorage: { getItem: () => null }, document: { querySelector: (selector) => ({ addEventListener: (event, handler) => listeners.set(`${selector}:${event}`, handler) }) } });
    assert.equal(typeof listeners.get("#overlap-file:change"), "function");
});
