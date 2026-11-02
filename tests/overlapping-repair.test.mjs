import test from "node:test";
import assert from "node:assert/strict";
import { createOverlappingRepairSession } from "../modules/overlappingShapeRepair.js";
import { runWithFreshOverlappingAccess, OVERLAPPING_SHAPE_ENTITLEMENT } from "../modules/overlappingShapeAccess.js";
import { getProduct, getProductionSelectableProductIds } from "../modules/productManifest.js";
import { deriveToolAccessState, validateReturnDestination } from "../modules/accessFoundation.js";

class Element {
    constructor(localName, values = {}, children = []) {
        this.localName = localName;
        this.tagName = localName;
        this.namespaceURI = "http://www.w3.org/2000/svg";
        this.values = { ...values };
        this.children = children;
        this.link();
    }
    link() {
        let previous = null;
        this.children.forEach((node) => { node.parentElement = this; node.parentNode = this; node.previousElementSibling = previous; if (node.nodeType !== 3) previous = node; });
    }
    get attributes() { return Object.entries(this.values).map(([name, value]) => ({ name, value })); }
    getAttribute(name) { return this.values[name] ?? null; }
    hasAttribute(name) { return Object.hasOwn(this.values, name); }
    setAttribute(name, value) { this.values[name] = value; }
    removeChild(node) { this.children.splice(this.children.indexOf(node), 1); this.link(); }
    all() { return [this, ...this.children.flatMap((node) => node.all())]; }
    cloneNode() { return new Element(this.localName, this.values, this.children.map((node) => node.cloneNode(true))); }
    snapshot() { return [this.localName, this.values, this.children.map((node) => node.snapshot())]; }
}
class Text extends Element {
    constructor(value) { super("#text"); this.nodeType = 3; this.value = value; }
    cloneNode() { return new Text(this.value); }
    snapshot() { return ["#text", this.value]; }
}
class Document {
    constructor(children) { this.documentElement = new Element("svg", { xmlns: "http://www.w3.org/2000/svg" }, children); this.childNodes = [this.documentElement]; }
    querySelector() { return null; }
    querySelectorAll(selector) { return this.documentElement.all().filter((node) => selector === "*" || selector.split(",").includes(node.localName)); }
    cloneNode() { const copy = new Document([]); copy.documentElement = this.documentElement.cloneNode(true); copy.childNodes = [copy.documentElement]; return copy; }
    normalize() {
        function merge(parent) {
            const children = [];
            for (const node of parent.children) {
                if (node.nodeType === 3 && children.at(-1)?.nodeType === 3) children.at(-1).value += node.value;
                else { if (node.nodeType !== 3) merge(node); children.push(node); }
            }
            parent.children = children;
            parent.link();
        }
        merge(this.documentElement);
    }
    isEqualNode(other) { return JSON.stringify(this.documentElement.snapshot()) === JSON.stringify(other.documentElement.snapshot()); }
}
const rect = (extra = {}) => new Element("rect", { x: "20", y: "30", width: "120", height: "100", fill: "#2563eb", stroke: "none", "shape-rendering": "crispEdges", ...extra });
const id = (index = 1) => `remove-exact-overlap:${index}`;
function setup(t, children = [rect(), rect()], transform = (document) => document) {
    const original = new Document(children);
    const baseline = original.cloneNode(true);
    const oldParser = globalThis.DOMParser, oldSerializer = globalThis.XMLSerializer;
    const serialized = new Map();
    globalThis.XMLSerializer = class {
        serializeToString(document) { const text = `<svg data-test="${serialized.size}"/>`; serialized.set(text, transform(document.cloneNode(true))); return text; }
    };
    globalThis.DOMParser = class { parseFromString(text) { if (!serialized.has(text)) throw new Error("Malformed serialized SVG"); const copy = serialized.get(text).cloneNode(true); copy.normalize(); return copy; } };
    t.after(() => { globalThis.DOMParser = oldParser; globalThis.XMLSerializer = oldSerializer; });
    const repair = createOverlappingRepairSession("<svg/>", { DOMParser: class { parseFromString() { return original; } } });
    return { original, baseline, repair };
}

test("executes only the selected safe duplicate, retaining unselected/unsupported geometry and original", (t) => {
    const { original, baseline, repair } = setup(t, [rect(), rect(), rect({ x: "220" }), rect({ x: "220" }), new Element("path", { id: "untouched", d: "M0 0 C0 5 5 10 10 10" })]);
    const result = repair.execute([id()]);
    assert.equal(result.ok, true);
    assert.equal(result.executedCount, 1);
    assert.equal(result.skippedCount, 0);
    assert.equal(result.workingDocument.querySelectorAll("rect").length, 3);
    assert.equal(result.workingDocument.querySelectorAll("rect")[1].getAttribute("x"), "220");
    assert.equal(result.workingDocument.querySelectorAll("rect")[2].getAttribute("x"), "220");
    assert.equal(result.workingDocument.querySelectorAll("path")[0].getAttribute("d"), "M0 0 C0 5 5 10 10 10");
    assert.equal(original.isEqualNode(baseline), true);
    assert.equal(repair.prepareDownload(1).executedCount, 1);
});

test("independent selected pairs execute as a single validated batch", (t) => {
    const { repair } = setup(t, [rect(), rect(), rect({ x: "220" }), rect({ x: "220" })]);
    const result = repair.execute([id(), id(3)]);
    assert.equal(result.ok, true);
    assert.equal(result.executedCount, 2);
    assert.equal(result.workingDocument.querySelectorAll("rect").length, 2);
    assert.throws(() => repair.prepareDownload(1), /repair record/);
});

test("XML round-trip whitespace coalescing is accepted without altering original text content", (t) => {
    const { original, baseline, repair } = setup(t, [new Text("\n  "), rect(), new Text("\n  "), rect(), new Text("\n  "), rect({ id: "control", x: "250" })]);
    const result = repair.execute([id()]);
    assert.equal(result.ok, true);
    assert.equal(repair.prepareDownload(1).executedCount, 1);
    assert.equal(original.isEqualNode(baseline), true);
    assert.equal(result.workingDocument.documentElement.children.filter((node) => node.nodeType === 3).map((node) => node.value).join(""), "\n  \n  \n  ");
});

test("unknown, unsafe, partial, transformed and referenced selections are refused without mutation", async (t) => {
    for (const nodes of [[rect(), rect({ x: "100" })], [rect({ transform: "scale(2)" }), rect({ transform: "scale(2)" })], [rect({ id: "referenced" }), rect({ id: "duplicate" }), new Element("use", { href: "#duplicate" })]]) {
        await t.test("unsafe source", (t) => {
            const { original, baseline, repair } = setup(t, nodes);
            const outcome = repair.execute([id()]);
            assert.equal(outcome.ok, false);
            assert.equal(outcome.executedCount, 0);
            assert.equal(outcome.skippedCount, 1);
            assert.equal(repair.workingDocument, null);
            assert.equal(original.isEqualNode(baseline), true);
        });
    }
});

test("conflicting repeated IDs and stale source selections are refused", (t) => {
    const { original, repair } = setup(t);
    assert.match(repair.execute([id(), id()]).reason, /Conflicting/);
    assert.equal(repair.execute(["unknown"]).ok, false);
    original.querySelectorAll("rect")[1].setAttribute("id", "changed-after-review");
    assert.match(repair.execute([id()]).reason, /stale/);
    assert.equal(repair.workingDocument, null);
});

test("preview/validation failure rolls back the candidate and allows a clean retry", (t) => {
    const { original, baseline, repair } = setup(t);
    const failed = repair.execute([id()], () => false);
    assert.equal(failed.ok, false);
    assert.equal(repair.workingDocument, null);
    assert.equal(original.isEqualNode(baseline), true);
    assert.equal(repair.execute([id()]).ok, true);
});

test("unrelated edits during validation cannot be committed", (t) => {
    const { repair } = setup(t, [rect(), rect(), rect({ id: "control", x: "250" })]);
    const result = repair.execute([id()], (working) => { working.querySelectorAll("rect")[1].setAttribute("x", "0"); return true; });
    assert.equal(result.ok, false);
    assert.match(result.reason, /unrelated/);
    assert.equal(repair.workingDocument, null);
});

test("invalid serialized SVG rolls back execution and blocks download", (t) => {
    const { repair } = setup(t, [rect(), rect()], (document) => { document.documentElement.tagName = "html"; document.documentElement.localName = "html"; return document; });
    assert.equal(repair.execute([id()]).ok, false);
    assert.equal(repair.workingDocument, null);
    assert.throws(() => repair.prepareDownload(1), /repair record/);
});

test("a completed batch cannot repeat and failed later validation preserves the accepted working copy", (t) => {
    let corrupt = false;
    const { repair } = setup(t, [rect(), rect()], (document) => { if (corrupt) document.querySelectorAll("rect")[0].setAttribute("fill", "red"); return document; });
    const first = repair.execute([id()]);
    assert.equal(first.ok, true);
    const saved = repair.workingDocument;
    assert.equal(repair.execute([id()]).ok, false);
    assert.equal(repair.workingDocument.isEqualNode(saved), true);
    first.workingDocument.querySelectorAll("rect")[0].setAttribute("fill", "green");
    assert.equal(repair.workingDocument.isEqualNode(saved), true);
    corrupt = true;
    assert.throws(() => repair.prepareDownload(1), /unrelated/);
    assert.equal(repair.workingDocument.isEqualNode(saved), true);
});

test("hub manifest exposes Tool 4 workspace and return route with purchase controls disabled", () => {
    const tool = getProduct("overlapping_shape_repair");
    assert.equal(OVERLAPPING_SHAPE_ENTITLEMENT, tool.id);
    assert.equal(tool.lifecycle, "implemented");
    assert.equal(tool.productionEnabled, false);
    assert.equal(validateReturnDestination(tool.route), "overlapping-shape-repair.html");
    for (const user of [null, { entitlements: [] }, { entitlements: [tool.id] }, { entitlements: ["all_products_lifetime"] }]) {
        const access = deriveToolAccessState(tool, user);
        assert.equal(access.canOpen, true);
        assert.equal(access.canSelect, false);
    }
    assert.deepEqual(getProductionSelectableProductIds(), ["pathseal"]);
});

test("fresh Tool 4 and lifetime access authorize actions; other grants cannot", async () => {
    let calls = 0;
    for (const user of [{ entitlements: ["overlapping_shape_repair"] }, { entitlements: ["all_products_lifetime"], subscription_statuses: { overlapping_shape_repair: "canceled" } }]) {
        await runWithFreshOverlappingAccess(async () => user, () => calls++);
    }
    for (const user of [null, { entitlements: [] }, { entitlements: ["pathseal", "duplicate_geometry", "stray_node_cleaner"] }, { entitlements: ["overlapping_shape_repair"], subscription_statuses: { overlapping_shape_repair: "expired" } }, { entitlements: "overlapping_shape_repair" }]) {
        await assert.rejects(runWithFreshOverlappingAccess(async () => user, () => calls++));
    }
    await assert.rejects(runWithFreshOverlappingAccess(async () => { throw new Error("offline"); }, () => calls++));
    assert.equal(calls, 2);
});

test("download requires another fresh access check and revocation prevents the protected action", async () => {
    let checks = 0, actions = 0;
    const refresh = async () => ++checks === 1 ? { entitlements: ["overlapping_shape_repair"] } : { entitlements: [] };
    await runWithFreshOverlappingAccess(refresh, () => actions++);
    await assert.rejects(runWithFreshOverlappingAccess(refresh, () => actions++));
    assert.equal(checks, 2);
    assert.equal(actions, 1);
});
