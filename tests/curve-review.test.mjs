import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import { parseCurvePathData, inspectCurveDocument } from "../modules/curveAnalyzer.js";
import { renderCurvePreview, highlightCurveFinding } from "../modules/curvePreview.js";
import { buildTool5LocalBundle, outputPath } from "../scripts/build-tool5-local.mjs";

const ABS = "M20 100 C40 20 80 20 100 100 C100 100 100 100 100 100 C160 180 220 20 280 100";
const REL = "m20 100 c20 -80 60 -80 80 0 c0 0 0 0 0 0 c60 80 120 -80 180 0";
class Element {
    constructor(localName, values = {}, children = []) {
        this.localName = localName; this.namespaceURI = "http://www.w3.org/2000/svg";
        this.values = { ...values }; this.children = children;
        children.forEach((child) => { child.parentElement = this; });
    }
    get attributes() { return Object.entries(this.values).map(([name, value]) => ({ name, value })); }
    getAttribute(name) { return this.values[name] ?? null; }
    hasAttribute(name) { return Object.hasOwn(this.values, name); }
    setAttribute(name, value) { this.values[name] = String(value); }
    all() { return [this, ...this.children.flatMap((child) => child.all())]; }
    snapshot() { return [this.localName, this.values, this.children.map((child) => child.snapshot())]; }
}
const path = (data = ABS, extra = {}) => new Element("path", { d: data, fill: "#2563eb", stroke: "none", ...extra });
function doc(children, rootAttributes = {}) {
    const root = new Element("svg", { xmlns: "http://www.w3.org/2000/svg", ...rootAttributes }, children);
    return { documentElement: root, childNodes: [root], querySelector: () => null, querySelectorAll: (selector) => root.all().filter((node) => selector === "*" || selector === node.localName) };
}

test("proposes only an exact interior collapsed cubic with immutable source references", () => {
    const document = doc([path(), new Element("rect", { id: "control", x: "10", width: "20" })]);
    const before = JSON.stringify(document.documentElement.snapshot());
    const result = inspectCurveDocument(document);
    assert.equal(result.proposals.length, 1);
    assert.equal(result.findings[0].number, 1);
    assert.equal(result.proposals[0].segmentIndex, 2);
    assert.equal(result.proposals[0].sourceRef.text, "C100 100 100 100 100 100");
    assert.equal(result.proposals[0].safeToAutoApply, false);
    assert.equal(result.proposals[0].preservesGeometry, true);
    assert.equal(JSON.stringify(document.documentElement.snapshot()), before);
});

test("absolute and relative cubic geometry resolve equivalently without changing source syntax", () => {
    const absolute = parseCurvePathData(ABS), relative = parseCurvePathData(REL);
    assert.equal(absolute.supported, true); assert.equal(relative.supported, true);
    assert.deepEqual(relative.commands.map(({ start, end, controls }) => ({ start, end, controls })), absolute.commands.map(({ start, end, controls }) => ({ start, end, controls })));
    const result = inspectCurveDocument(doc([path(REL)]));
    assert.equal(result.proposals.length, 1);
    assert.equal(result.proposals[0].sourceRef.command, "c");
    assert.equal(result.proposals[0].sourceRef.text, "c0 0 0 0 0 0");
});

test("exact decimal arithmetic refuses float-rounded false coincidences", () => {
    const data = "M0 0 C1 0 4 1 5 0 C5.000000000000000001 0 5 0 5 0 C6 0 9 1 10 0";
    const parsed = parseCurvePathData(data);
    assert.equal(parsed.supported, true);
    assert.equal(parsed.commands[2].collapsed, false);
    assert.equal(inspectCurveDocument(doc([path(data)])).proposals.length, 0);
    assert.equal(parseCurvePathData(ABS.replace("100 100 100 100 100 100", "1e-31 100 100 100 100 100")).supported, false);
});

test("equivalent decimals/exponents prove exact collapse rather than requiring lexical identity", () => {
    const result = inspectCurveDocument(doc([path(ABS.replace("C100 100 100 100 100 100", "C1e2 100.0 +100 1e+2 100.000 100"))]));
    assert.equal(result.proposals.length, 1);
});

test("a same-endpoint real loop is a warning, never a redundant-segment proposal", () => {
    const result = inspectCurveDocument(doc([path("M60 100 C120 10 180 190 60 100")]));
    assert.equal(result.proposals.length, 0);
    assert.match(result.findings[0].reason, /real curve\/loop/);
});

test("moveto repetition, relative lines, horizontal/vertical commands and closure keep defined coordinates", () => {
    const result = parseCurvePathData("m10 20 5 5 h10 v-5 z m5 0 c1 2 3 4 5 6");
    assert.equal(result.supported, true);
    assert.deepEqual(result.commands.map(({ type }) => type), ["M", "L", "L", "L", "Z", "M", "C"]);
    assert.deepEqual(result.commands[4].end, { x: 10, y: 20 });
    assert.deepEqual(result.commands[5].end, { x: 15, y: 20 });
    assert.deepEqual(result.commands[6].end, { x: 20, y: 26 });
    assert.equal(result.subpathCount, 2);
});

test("smooth cubic reflection follows SVG semantics but blocks removal proposals", () => {
    const parsed = parseCurvePathData("M0 0 C10 0 20 10 30 10 S50 20 60 0");
    assert.deepEqual(parsed.commands[2].controls[0], { x: 40, y: 10 });
    const afterLine = parseCurvePathData("M0 0 L30 10 s20 10 30 -10");
    assert.deepEqual(afterLine.commands[2].controls[0], { x: 30, y: 10 });
    const result = inspectCurveDocument(doc([path(ABS + " S300 100 310 100")]));
    assert.equal(result.proposals.length, 0);
    assert.match(result.findings[0].reason, /shorthand reflection/);
});

test("boundary, isolated, implicit-command and closed/multiple-subpath cases remain review-only", () => {
    for (const data of [
        "M0 0 C0 0 0 0 0 0", "M0 0 C0 0 0 0 0 0 C10 10 20 10 30 0",
        ABS + " Z", ABS + " M0 0 L10 10",
        "M20 100 C40 20 80 20 100 100 100 100 100 100 100 100 160 180 220 20 280 100",
        "M0 0 C1 0 2 0 3 0 4 0 5 0 6 0 C6 0 6 0 6 0 C7 0 8 0 9 0",
        ABS.replace("C160 180 220 20 280 100", "L280 100"),
    ]) {
        const result = inspectCurveDocument(doc([path(data)]));
        assert.equal(result.proposals.length, 0, data);
        assert.ok(result.findings.length > 0);
    }
});

test("IDs/references, strokes, styling, grouping effects and transforms cannot enter selection", () => {
    for (const extra of [{ id: "keep-id" }, { stroke: "black" }, { opacity: "0.5" }, { style: "fill:red" }, { "marker-end": "url(#marker)" }, { pathLength: "100" }, { transform: "scale(2)" }]) {
        const result = inspectCurveDocument(doc([path(ABS, extra)]));
        assert.equal(result.proposals.length, 0, JSON.stringify(extra));
        assert.ok(result.findings.length > 0);
    }
    for (const document of [doc([new Element("g", { opacity: "0.5" }, [path()])]), doc([path(), new Element("style")]), doc([path(), new Element("use", { href: "#x" })]), doc([new Element("g", { transform: "scale(2)" }, [path()])])]) {
        assert.equal(inspectCurveDocument(document).proposals.length, 0);
    }
});

test("unsupported commands and malformed syntax produce no parsed prefix or proposals", () => {
    for (const data of ["M0 0 Q10 10 20 0", "M0 0 A10 10 0 0 1 20 20", "M0 0 T20 20", "C0 0 0 0 0 0", "M,0 0", "M0,,0", "M0 0,", "M0 0 C1 2 3", "M0 0 garbage", "M0 0 C1e999 0 0 0 0 0"]) {
        const parsed = parseCurvePathData(data);
        assert.equal(parsed.supported, false, data);
        assert.deepEqual(parsed.commands, []);
        assert.equal(inspectCurveDocument(doc([path(data)])).proposals.length, 0);
    }
});

test("legitimate curved paths and sharp corners are not smoothed, closed or proposed for change", () => {
    const data = "M0 0 C10 20 20 20 30 0 L40 30 C50 50 60 50 70 30";
    const document = doc([path(data, { id: "keep-corner" })]);
    assert.equal(inspectCurveDocument(document).findings.length, 0);
    assert.equal(document.querySelectorAll("path")[0].getAttribute("d"), data);
});

test("preview uses numeric geometry and locates a collapsed segment with a numbered point marker", () => {
    const inspection = inspectCurveDocument(doc([path()]));
    const children = [];
    const svg = { ownerDocument: { createElementNS: (_ns, type) => new Element(type) }, replaceChildren: () => children.splice(0), append: (...nodes) => children.push(...nodes), setAttribute() {} };
    const rendered = renderCurvePreview(svg, inspection.paths, inspection.findings);
    assert.equal(rendered.pathNodes.size, 1); assert.equal(rendered.markers.size, 1);
    const marker = rendered.markers.get(inspection.findings[0].id).marker;
    assert.equal(marker.getAttribute("cx"), "100"); assert.equal(marker.getAttribute("cy"), "100");
    highlightCurveFinding(rendered, inspection.findings[0]);
    assert.equal(marker.getAttribute("aria-current"), "true");
    assert.ok(children.some((node) => node.localName === "text" && node.textContent === "1"));
    assert.ok(children.every((node) => !node.hasAttribute("id") && !node.hasAttribute("onclick")));
});

test("direct-file entry stays current and has no execution, download, access or network wiring", async () => {
    const [page, controller, bundle] = await Promise.all([
        readFile(new URL("../curve-repair.html", import.meta.url), "utf8"),
        readFile(new URL("../curve-repair.js", import.meta.url), "utf8"), readFile(outputPath, "utf8"),
    ]);
    assert.equal(bundle.replace(/\r\n/g, "\n"), await buildTool5LocalBundle());
    assert.match(page, /<script defer src="curve-repair\.local\.js/);
    assert.doesNotMatch(bundle, /XMLSerializer|Blob|createObjectURL|fetch\(|removeChild|\.remove\(|refreshSession|entitlements/);
    assert.doesNotMatch(controller, /innerHTML|outerHTML|insertAdjacentHTML/);
    const listeners = new Map();
    new Script(bundle).runInNewContext({ document: { querySelector: (selector) => ({ addEventListener: (event, handler) => listeners.set(`${selector}:${event}`, handler) }) } });
    assert.equal(typeof listeners.get("#curve-file:change"), "function");
});
