import test from "node:test";
import assert from "node:assert/strict";
import { createStrayNodeRepairSession } from "../modules/strayNodeRepairExecution.js";

// Minimal document fixture: real analysis/planning/execution code runs against
// independently cloned attributes/subtrees; browser DOM is also smoke-tested locally.
class Element {
    constructor(localName, attributes = {}, children = []) {
        this.localName = localName;
        this.attributes = { ...attributes };
        this.children = children;
        for (const child of children) child.parentElement = this;
    }
    getAttribute(name) { return this.attributes[name] ?? null; }
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    cloneNode() { return new Element(this.localName, this.attributes, this.children.map((child) => child.cloneNode(true))); }
    all() { return this.children.flatMap((child) => [child, ...child.all()]); }
    snapshot() { return [this.localName, this.attributes, this.children.map((child) => child.snapshot())]; }
}
class Document {
    constructor(children) { this.documentElement = new Element("svg", { xmlns: "http://www.w3.org/2000/svg" }, children); }
    querySelector() { return null; }
    querySelectorAll(selector) { return this.documentElement.all().filter((node) => selector.split(",").includes(node.localName)); }
    cloneNode() { const copy = new Document([]); copy.documentElement = this.documentElement.cloneNode(true); return copy; }
    isEqualNode(other) { return JSON.stringify(this.documentElement.snapshot()) === JSON.stringify(other.documentElement.snapshot()); }
}
const shape = (id, points, attributes = {}) => new Element("polyline", { id, points, ...attributes });
const id = (name, index = 2) => `remove-exact-coincident-node:${name}:${index}`;
function session(nodes) {
    const original = new Document(nodes);
    const before = original.cloneNode(true);
    const repair = createStrayNodeRepairSession("<svg/>", { DOMParser: class { parseFromString() { return original; } } });
    return { original, before, repair };
}

test("executes selected exact removals and preserves all unselected/unsupported SVG content", () => {
    const { original, before, repair } = session([
        shape("chosen", "0,0 5,0 5,0 10,0", { stroke: "red", "data-note": "preserve" }),
        shape("unselected", "0,1 5,1 5,1 10,1"),
        new Element("path", { id: "curve", d: "M0 0 Q5 5 10 0" }),
        new Element("metadata", {}, [new Element("custom", { value: "untouched" })]),
    ]);
    const result = repair.execute([id("chosen")]);
    assert.equal(result.ok, true);
    assert.equal(result.executedCount, 1);
    assert.equal(result.skippedCount, 0);
    const nodes = result.workingDocument.querySelectorAll("polyline,path");
    assert.equal(nodes[0].getAttribute("points"), "0,0 5,0 10,0");
    assert.equal(nodes[0].getAttribute("stroke"), "red");
    assert.equal(nodes[1].getAttribute("points"), "0,1 5,1 5,1 10,1");
    assert.equal(nodes[2].getAttribute("d"), "M0 0 Q5 5 10 0");
    assert.equal(original.isEqualNode(before), true);
    assert.equal(repair.workingDocument.isEqualNode(result.workingDocument), true);
});

test("applies independent removals by original indexes, including safe polygon cleanup", () => {
    const { repair } = session([
        shape("separate", "0,0 5,0 5,0 10,0 10,0 15,0"),
        new Element("polygon", { id: "polygon", points: "0,0 10,0 10,0 10,10 0,10" }),
    ]);
    const result = repair.execute([id("separate"), id("separate", 4), id("polygon")]);
    assert.equal(result.ok, true);
    assert.equal(result.executedCount, 3);
    assert.equal(result.workingDocument.querySelectorAll("polyline")[0].getAttribute("points"), "0,0 5,0 10,0 15,0");
});

test("unsafe or unknown selected IDs refuse the entire batch without applying a safe neighbor", () => {
    const { original, before, repair } = session([
        shape("safe", "0,0 5,0 5,0 10,0"),
        shape("unsafe", "0,0 5,0 5,0 10,0", { transform: "translate(10)" }),
        shape("near", "0,0 0.00001,0 10,0"),
    ]);
    for (const unsafe of [id("unsafe"), id("near"), "made-up"]) {
        const result = repair.execute([id("safe"), unsafe]);
        assert.equal(result.ok, false);
        assert.equal(result.executedCount, 0);
        assert.equal(result.skippedCount, 2);
        assert.equal(repair.workingDocument, null);
    }
    assert.equal(original.isEqualNode(before), true);
});

test("refuses overlapping and repeated selections and preserves the complete source", () => {
    const { original, before, repair } = session([shape("chain", "0,0 5,0 5,0 5,0 10,0")]);
    for (const selection of [[id("chain"), id("chain", 3)], [id("chain"), id("chain")]]) {
        const result = repair.execute(selection);
        assert.equal(result.ok, false);
        assert.match(result.reason, /Conflicting/);
        assert.equal(result.executedCount, 0);
        assert.equal(repair.workingDocument, null);
        assert.equal(original.isEqualNode(before), true);
    }
});

test("refuses transformed ancestor geometry", () => {
    const { repair } = session([new Element("g", { transform: "scale(2)" }, [shape("nested", "0,0 5,0 5,0 10,0")])]);
    const result = repair.execute([id("nested")]);
    assert.equal(result.ok, false);
    assert.match(result.reason, /Transformed parent/);
});

test("repeated execution cannot apply repairs twice or change the accepted copy", () => {
    const { repair } = session([shape("safe", "0,0 5,0 5,0 10,0")]);
    const first = repair.execute([id("safe")]);
    const second = repair.execute([id("safe")]);
    assert.equal(first.ok, true);
    assert.equal(second.ok, false);
    assert.equal(second.executedCount, 0);
    assert.equal(second.skippedCount, 1);
    assert.match(second.reason, /already been repaired/);
    assert.equal(repair.workingDocument.isEqualNode(first.workingDocument), true);
});

test("validation failure discards staged edits and permits a clean retry", () => {
    const { original, before, repair } = session([shape("safe", "0,0 5,0 5,0 10,0")]);
    const failed = repair.execute([id("safe")], () => false);
    assert.equal(failed.ok, false);
    assert.equal(failed.executedCount, 0);
    assert.equal(failed.skippedCount, 1);
    assert.equal(repair.workingDocument, null);
    assert.equal(original.isEqualNode(before), true);
    assert.equal(repair.execute([id("safe")]).ok, true);
});

test("validation rejects unexpected edits to unsupported content", () => {
    const { original, before, repair } = session([shape("safe", "0,0 5,0 5,0 10,0"), new Element("path", { d: "M0 0 Q5 5 10 0" })]);
    const result = repair.execute([id("safe")], (working) => {
        working.querySelectorAll("path")[0].setAttribute("d", "M0 0");
        return true;
    });
    assert.equal(result.ok, false);
    assert.match(result.reason, /unrelated SVG/);
    assert.equal(repair.workingDocument, null);
    assert.equal(original.isEqualNode(before), true);
});

test("preserves surviving coordinate precision and refuses rounded false coincidences", () => {
    const safe = session([shape("precise", "0,0 5,0 5,0 10.123456789012345678,0")]);
    const result = safe.repair.execute([id("precise")]);
    assert.equal(result.ok, true);
    assert.equal(result.workingDocument.querySelectorAll("polyline")[0].getAttribute("points"), "0,0 5,0 10.123456789012345678,0");
    const unsafe = session([shape("rounded", "0,0 5.000000000000000001,0 5.000000000000000002,0 10,0")]);
    const refused = unsafe.repair.execute([id("rounded")]);
    assert.equal(refused.ok, false);
    assert.match(refused.reason, /precision review/);
    assert.equal(unsafe.original.isEqualNode(unsafe.before), true);
});
