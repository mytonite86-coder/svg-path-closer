import test from "node:test";
import assert from "node:assert/strict";

// Exercise the actual page controller and its event handlers without adding a DOM dependency.
async function page(t) {
    const fixtures = new Map();
    const elements = new Map();
    const doc = {
        querySelector: (id) => elements.get(id),
        createElement: (tag) => new Node(tag),
        createElementNS: (_ns, tag) => new Node(tag),
    };
    class Node {
        constructor(tag) {
            this.localName = tag;
            this.children = [];
            this.dataset = {};
            this.attributes = new Map();
            this.listeners = new Map();
            this.ownerDocument = doc;
            this.textContent = "";
        }
        append(...children) { this.children.push(...children); }
        replaceChildren(...children) { this.children = children; }
        setAttribute(key, value) { this.attributes.set(key, String(value)); }
        getAttribute(key) { return this.attributes.get(key) ?? null; }
        hasAttribute(key) { return this.attributes.has(key); }
        addEventListener(event, handler) { this.listeners.set(event, handler); }
        async fire(event) { await this.listeners.get(event)?.(); }
        all() { return this.children.filter((child) => typeof child !== "string").flatMap((child) => [child, ...child.all()]); }
        querySelectorAll() { return this.all().filter((node) => node.type === "checkbox" && node.checked); }
    }
    for (const name of ["file", "results", "status", "summary", "categories", "category-list", "preview-panel", "preview-status", "preview", "repair-review", "repair-status", "repair-proposals", "repair-rejections", "repair-rejection-list", "findings"]) {
        elements.set(`#stray-node-${name}`, new Node("div"));
    }
    const oldDocument = globalThis.document;
    const oldParser = globalThis.DOMParser;
    globalThis.document = doc;
    globalThis.DOMParser = class {
        parseFromString(source) {
            if (!fixtures.has(source)) throw new Error("Malformed fixture");
            return { documentElement: { localName: "svg" }, querySelector: () => null, querySelectorAll: () => fixtures.get(source) };
        }
    };
    t.after(() => { globalThis.document = oldDocument; globalThis.DOMParser = oldParser; });
    await import(`../stray-node-cleaner.js?selection-test=${Math.random()}`);
    const get = (name) => elements.get(`#stray-node-${name}`);
    const geometry = (id, points, tag = "polyline", extra = {}) => {
        const node = new Node(tag);
        for (const [key, value] of Object.entries({ id, points, ...extra })) node.setAttribute(key, value);
        return node;
    };
    return {
        get, geometry,
        boxes: () => get("repair-proposals").all().filter((node) => node.type === "checkbox"),
        register(source, nodes) { fixtures.set(source, nodes); },
        async upload(source, nodes) {
            fixtures.set(source, nodes);
            get("file").files = [{ name: "drawing.svg", text: async () => source }];
            await get("file").fire("change");
        },
        async toggle(box, checked) { box.checked = checked; await box.fire("change"); },
    };
}

test("selects and deselects proposals independently while keeping source geometry intact", async (t) => {
    const p = await page(t);
    const source = "<svg data-fixture='two-safe'/>";
    const shape = p.geometry("two", "0,0 5,0 5,0 10,0 10,0 15,0");
    const original = [...shape.attributes];
    await p.upload(source, [shape]);
    const [first, second] = p.boxes();
    assert.equal(p.boxes().length, 2);
    assert.equal(first.checked, false);
    assert.match(p.get("repair-status").textContent, /^0 of 2/);
    await p.toggle(first, true);
    assert.match(p.get("repair-status").textContent, /^1 of 2/);
    assert.equal(second.checked, false);
    await p.toggle(second, true);
    assert.match(p.get("repair-status").textContent, /^2 of 2/);
    await p.toggle(first, false);
    assert.match(p.get("repair-status").textContent, /^1 of 2/);
    assert.equal(second.checked, true);
    assert.deepEqual([...shape.attributes], original);
    assert.match(p.get("summary").textContent, /No geometry was changed/);
});

test("unsafe and review-only findings never receive repair selection controls", async (t) => {
    const p = await page(t);
    await p.upload("<svg data-fixture='mixed'/>", [
        p.geometry("safe", "0,0 5,0 5,0 10,0"),
        p.geometry("near", "0,0 0.00001,0 10,0"),
        p.geometry("collapsed", "0,0 0,0 0,0"),
        p.geometry("transformed", "0,0 5,0 5,0 10,0", "polyline", { transform: "translate(5)" }),
        p.geometry("curve", "", "path", { d: "M0 0 Q5 5 10 0" }),
    ]);
    assert.equal(p.boxes().length, 1);
    assert.match(p.boxes()[0].dataset.proposalId, /:safe:/);
    assert.equal(p.get("repair-rejections").hidden, false);
    assert.ok(p.get("findings").children.length > 1);
    await p.toggle(p.boxes()[0], true);
    assert.match(p.get("repair-status").textContent, /^1 of 1/);
});

test("new uploads reset selections even when proposal identifiers repeat; invalid input clears review", async (t) => {
    const p = await page(t);
    const shape = p.geometry("same", "0,0 5,0 5,0 10,0");
    await p.upload("<svg data-fixture='first'/>", [shape]);
    await p.toggle(p.boxes()[0], true);
    await p.upload("<svg data-fixture='second'/>", [shape]);
    assert.equal(p.boxes()[0].checked, false);
    assert.match(p.get("repair-status").textContent, /^0 of 1/);
    p.get("file").files = [];
    await p.get("file").fire("change");
    assert.equal(p.boxes().length, 0);
    assert.equal(p.get("repair-review").hidden, true);
    assert.equal(p.get("results").dataset.state, "error");
});

test("selection preserves proposal details, finding highlighting and preview coordinates", async (t) => {
    const p = await page(t);
    await p.upload("<svg data-fixture='preview'/>", [p.geometry("safe", "0,0 5,0 5,0 10,0")]);
    const preview = p.get("preview").children[0];
    const points = preview.getAttribute("points");
    const details = p.get("repair-proposals").all().map((node) => node.textContent).join(" ");
    assert.match(details, /Before \(4 nodes\)/);
    assert.match(details, /Proposed result \(3 nodes\)/);
    const highlight = p.get("findings").all().find((node) => node.textContent === "Highlight affected geometry");
    await highlight.fire("click");
    await p.toggle(p.boxes()[0], true);
    assert.equal(preview.getAttribute("aria-current"), "true");
    assert.equal(preview.getAttribute("points"), points);
    assert.match(p.get("preview-status").textContent, /Highlighted/);
});

test("late upload completion cannot replace the current proposal selection", async (t) => {
    const p = await page(t);
    let finish;
    p.register("<svg data-fixture='old'/>", [p.geometry("old", "0,0 5,0 5,0 10,0")]);
    p.get("file").files = [{ name: "old.svg", text: () => new Promise((resolve) => { finish = resolve; }) }];
    const pending = p.get("file").fire("change");
    await p.upload("<svg data-fixture='current'/>", [p.geometry("current", "0,0 5,0 5,0 10,0")]);
    await p.toggle(p.boxes()[0], true);
    finish("<svg data-fixture='old'/>");
    await pending;
    assert.match(p.boxes()[0].dataset.proposalId, /:current:/);
    assert.equal(p.boxes()[0].checked, true);
    assert.match(p.get("repair-status").textContent, /^1 of 1/);
});
