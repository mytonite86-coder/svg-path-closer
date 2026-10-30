import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCurveRepairSession } from "../modules/curveRepair.js";
import { parseCurvePathData } from "../modules/curveAnalyzer.js";
import { CURVE_ENTITLEMENT, runWithFreshCurveAccess } from "../modules/curveAccess.js";
import { getProduct, getProductionSelectableProductIds } from "../modules/productManifest.js";
import { deriveToolAccessState, validateReturnDestination } from "../modules/accessFoundation.js";

const ABS = "M20 100 C40 20 80 20 100 100 C100 100 100 100 100 100 C160 180 220 20 280 100";
const REL = "m20 100 c20 -80 60 -80 80 0 c0 0 0 0 0 0 c60 80 120 -80 180 0";
const TWO = "M0 0 C1 2 2 2 3 0 C3 0 3 0 3 0 C4 -2 5 -2 6 0 C6 0 6 0 6 0 C7 2 8 2 9 0";
const id = (pathIndex = 0, segmentIndex = 2) => `remove-collapsed-cubic:${pathIndex}:${segmentIndex}`;
class Element {
    constructor(localName, values = {}, children = []) { this.localName = this.tagName = localName; this.namespaceURI = "http://www.w3.org/2000/svg"; this.values = { ...values }; this.children = children; children.forEach((node) => { node.parentElement = this; }); }
    get attributes() { return Object.entries(this.values).map(([name, value]) => ({ name, value })); }
    getAttribute(name) { return this.values[name] ?? null; }
    hasAttribute(name) { return Object.hasOwn(this.values, name); }
    setAttribute(name, value) { this.values[name] = String(value); }
    all() { return [this, ...this.children.flatMap((node) => node.all())]; }
    snapshot() { return [this.localName, this.values, this.children.map((node) => node.snapshot())]; }
    cloneNode() { return new Element(this.localName, this.values, this.children.map((node) => node.cloneNode(true))); }
}
class Document {
    constructor(children) { this.documentElement = new Element("svg", { xmlns: "http://www.w3.org/2000/svg" }, children); this.childNodes = [this.documentElement]; }
    querySelector() { return null; }
    querySelectorAll(selector) { return this.documentElement.all().filter((node) => selector === "*" || node.localName === selector); }
    cloneNode() { const copy = new Document([]); copy.documentElement = this.documentElement.cloneNode(true); copy.childNodes = [copy.documentElement]; return copy; }
    normalize() {} // No text segmentation in this fixture; actual XML is checked in Chrome.
    isEqualNode(other) { return JSON.stringify(this.documentElement.snapshot()) === JSON.stringify(other.documentElement.snapshot()); }
}
const path = (d = ABS, extra = {}) => new Element("path", { d, fill: "#2563eb", stroke: "none", ...extra });
function setup(t, children = [path()], transform = (document) => document) {
    const original = new Document(children), baseline = original.cloneNode(true), documents = new Map();
    const oldParser = globalThis.DOMParser, oldSerializer = globalThis.XMLSerializer;
    globalThis.XMLSerializer = class { serializeToString(document) { const text = `<svg data-test="${documents.size}"/>`; documents.set(text, transform(document.cloneNode(true))); return text; } };
    globalThis.DOMParser = class { parseFromString(text) { if (!documents.has(text)) throw new Error("Malformed serialized SVG"); return documents.get(text).cloneNode(true); } };
    t.after(() => { globalThis.DOMParser = oldParser; globalThis.XMLSerializer = oldSerializer; });
    const session = createCurveRepairSession("<svg/>", { DOMParser: class { parseFromString() { return original; } } });
    return { original, baseline, session };
}

test("selected absolute cubic removal preserves retained commands, unselected path data and original", (t) => {
    const unrelated = "M0 0 Q10 20 20 0";
    const { original, baseline, session } = setup(t, [path(), path(unrelated, { id: "keep-path" }), new Element("rect", { id: "control", x: "20", width: "10" })]);
    const result = session.execute([id()]);
    assert.equal(result.ok, true); assert.equal(result.executedCount, 1); assert.equal(result.skippedCount, 0);
    assert.equal(result.workingDocument.querySelectorAll("path")[0].getAttribute("d"), ABS.replace("C100 100 100 100 100 100", ""));
    assert.equal(result.workingDocument.querySelectorAll("path")[1].getAttribute("d"), unrelated);
    assert.equal(result.workingDocument.querySelectorAll("rect")[0].getAttribute("id"), "control");
    assert.equal(original.isEqualNode(baseline), true);
    assert.equal(session.prepareDownload(1).executedCount, 1);
});

test("relative removal preserves exact following controls/endpoints and the original command spelling", (t) => {
    const { session } = setup(t, [path(REL)]);
    const result = session.execute([id()]);
    assert.equal(result.ok, true);
    const actual = result.workingDocument.querySelectorAll("path")[0].getAttribute("d");
    assert.equal(actual, REL.replace("c0 0 0 0 0 0", ""));
    const before = parseCurvePathData(REL).commands.filter((_command, index) => index !== 2).map(({ exactGeometry }) => exactGeometry);
    const after = parseCurvePathData(actual).commands.map(({ exactGeometry }) => exactGeometry);
    assert.deepEqual(after, before);
});

test("multiple ranges execute from original offsets while unselected defects stay untouched", async (t) => {
    await t.test("selected subset", (t) => {
        const { session } = setup(t, [path(TWO)]);
        const outcome = session.execute([id()]);
        assert.equal(outcome.ok, true);
        assert.equal(outcome.workingDocument.querySelectorAll("path")[0].getAttribute("d"), TWO.replace("C3 0 3 0 3 0", ""));
        assert.equal(outcome.inspection.proposals.length, 1);
    });
    await t.test("whole selected batch", (t) => {
        const { session } = setup(t, [path(TWO), path(REL)]);
        const outcome = session.execute([id(0, 4), id(), id(1)]);
        assert.equal(outcome.ok, true); assert.equal(outcome.executedCount, 3);
        assert.equal(parseCurvePathData(outcome.workingDocument.querySelectorAll("path")[0].getAttribute("d")).commands.length, 4);
        assert.equal(session.prepareDownload(3).executedCount, 3);
    });
});

test("unsafe/manual, unsupported, transformed, referenced and closure cases cannot execute", async (t) => {
    const unsafe = [path(ABS, { id: "referenced" }), path(ABS, { transform: "scale(2)" }), path(ABS, { stroke: "black" }), path(ABS + " Z"), path("M0 0 Q10 10 20 0"), path("M60 100 C120 10 180 190 60 100")];
    for (const node of unsafe) await t.test("manual-only source", (t) => {
        const { original, baseline, session } = setup(t, [node]);
        assert.equal(session.execute([id()]).ok, false);
        assert.equal(original.isEqualNode(baseline), true); assert.equal(session.workingDocument, null);
    });
});

test("stale, conflicting and mixed safe/unknown selections roll back the entire batch", (t) => {
    const { original, baseline, session } = setup(t);
    assert.match(session.execute([id(), id()]).reason, /Conflicting/);
    const unknown = session.execute([id(), "unknown"]);
    assert.equal(unknown.ok, false); assert.equal(unknown.executedCount, 0); assert.equal(unknown.skippedCount, 2);
    assert.equal(original.isEqualNode(baseline), true); assert.equal(session.workingDocument, null);
    original.querySelectorAll("path")[0].setAttribute("d", REL);
    assert.match(session.execute([id()]).reason, /stale/);
});

test("preview and retained-geometry validation failures preserve the original and allow retry", (t) => {
    const { original, baseline, session } = setup(t);
    assert.equal(session.execute([id()], () => false).ok, false);
    const changed = session.execute([id()], (working) => { working.querySelectorAll("path")[0].setAttribute("d", "M0 0 C1 1 2 2 3 3"); return true; });
    assert.equal(changed.ok, false); assert.equal(session.workingDocument, null);
    assert.equal(original.isEqualNode(baseline), true);
    assert.equal(session.execute([id()]).ok, true);
});

test("invalid serialized SVG discards the attempted batch before acceptance", (t) => {
    let corrupt = true;
    const { original, baseline, session } = setup(t, [path()], (document) => { if (corrupt) document.documentElement.localName = document.documentElement.tagName = "html"; return document; });
    assert.equal(session.execute([id()]).ok, false); assert.equal(session.workingDocument, null);
    assert.throws(() => session.prepareDownload(1), /repair record/);
    assert.equal(original.isEqualNode(baseline), true);
    corrupt = false; assert.equal(session.execute([id()]).ok, true);
});

test("repeat execution, altered result objects and failed later download validation cannot corrupt accepted state", (t) => {
    let corrupt = false;
    const { session } = setup(t, [path()], (document) => { if (corrupt) document.querySelectorAll("path")[0].setAttribute("fill", "red"); return document; });
    const result = session.execute([id()]), accepted = session.workingDocument;
    assert.equal(result.ok, true);
    assert.equal(session.execute([id()]).ok, false);
    result.workingDocument.querySelectorAll("path")[0].setAttribute("d", "M0 0");
    assert.equal(session.workingDocument.isEqualNode(accepted), true);
    assert.equal(session.prepareDownload(1).executedCount, 1);
    for (const count of [0, 2, "1"]) assert.throws(() => session.prepareDownload(count), /repair record/);
    corrupt = true; assert.throws(() => session.prepareDownload(1), /unrelated/);
    assert.equal(session.workingDocument.isEqualNode(accepted), true);
});

test("manifest exposes Curve Repair and its account return route while purchases stay off", () => {
    const tool = getProduct("curve_repair");
    assert.equal(CURVE_ENTITLEMENT, tool.id); assert.equal(tool.lifecycle, "implemented");
    assert.equal(tool.productionEnabled, false); assert.equal(validateReturnDestination(tool.route), "curve-repair.html");
    for (const user of [null, { entitlements: [] }, { entitlements: [tool.id] }, { entitlements: ["all_products_lifetime"] }]) {
        const state = deriveToolAccessState(tool, user); assert.equal(state.canOpen, true); assert.equal(state.canSelect, false);
    }
    assert.deepEqual(getProductionSelectableProductIds(), ["pathseal"]);
});

test("fresh Curve Repair and lifetime grants permit actions; denied/expired/malformed/offline sessions cannot", async () => {
    let actions = 0;
    for (const user of [{ entitlements: ["curve_repair"] }, { entitlements: ["all_products_lifetime"], subscription_statuses: { curve_repair: "expired" } }]) await runWithFreshCurveAccess(async () => user, () => actions++);
    for (const user of [null, { entitlements: [] }, { entitlements: ["pathseal", "duplicate_geometry", "stray_node_cleaner", "overlapping_shape_repair"] }, { entitlements: "curve_repair" }, { entitlements: ["curve_repair"], subscription_statuses: { curve_repair: "canceled" } }]) await assert.rejects(runWithFreshCurveAccess(async () => user, () => actions++));
    await assert.rejects(runWithFreshCurveAccess(async () => { throw new Error("offline"); }, () => actions++));
    assert.equal(actions, 2);
});

test("a repair grant cannot substitute for a fresh download entitlement check", async () => {
    let calls = 0, actions = 0;
    const refresh = async () => ++calls === 1 ? { entitlements: ["curve_repair"] } : { entitlements: [] };
    await runWithFreshCurveAccess(refresh, () => actions++);
    await assert.rejects(runWithFreshCurveAccess(refresh, () => actions++));
    assert.equal(calls, 2); assert.equal(actions, 1);
});

test("entry and protected download reuse existing account and SVG download helpers", async () => {
    const [entry, controller] = await Promise.all([readFile(new URL("../curve-repair-entry.js", import.meta.url), "utf8"), readFile(new URL("../curve-repair.js", import.meta.url), "utf8")]);
    assert.match(entry, /refreshSession.*from "\.\/modules\/auth.js"/);
    assert.match(controller, /downloadCleanedSvg.*from "\.\/modules\/strayNodeDownload.js"/);
    assert.equal((controller.match(/return withAccess\(/g) || []).length, 2);
    assert.doesNotMatch(entry + controller, /startPathSealCheckout|startSvgSubscriptionCheckout|\/payments\//);
});
