import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    createStrayNodePreviewModel,
    getFindingPreviewKey,
    renderStrayNodePreview,
    setPreviewHighlight,
} from "../modules/strayNodePreview.js";

function svgElement(localName, attributes = {}) {
    const values = new Map(Object.entries(attributes).map(([name, value]) => [name, String(value)]));
    return {
        localName,
        getAttribute: (name) => values.has(name) ? values.get(name) : null,
        hasAttribute: (name) => values.has(name),
    };
}

function parserFor(geometry, { malformed = false } = {}) {
    return class FixtureParser {
        parseFromString() {
            return {
                documentElement: { localName: "svg" },
                querySelector: (selector) => selector === "parsererror" && malformed ? {} : null,
                querySelectorAll: () => geometry,
            };
        }
    };
}

function modelFor(geometry) {
    return createStrayNodePreviewModel("<svg data-safe-fixture='true' />", {
        DOMParser: parserFor(geometry),
    });
}

function renderedNode(localName) {
    const attributes = new Map();
    return {
        localName,
        attributes,
        setAttribute: (name, value) => attributes.set(name, String(value)),
    };
}

test("builds preview shapes only from normalized numeric geometry", () => {
    const model = modelFor([
        svgElement("line", {
            id: "safe-line", x1: 0, y1: 0, x2: 10, y2: 10,
            onclick: "alert(1)", href: "https://example.invalid/tracker",
        }),
        svgElement("path", { id: "linear-path", d: "M0 5 H10 V15" }),
    ]);

    assert.equal(model.shapes.length, 2);
    assert.deepEqual(model.shapes[0].nodes, [{ x: 0, y: 0 }, { x: 10, y: 10 }]);
    assert.equal(model.shapes[0].shapeType, "line");
    assert.equal(model.shapes[0].mappingKey, "safe-line");
    assert.equal(model.shapes[1].shapeType, "polyline");
    assert.ok(Object.values(model.shapes[0]).every((value) =>
        typeof value !== "string" || !value.includes("alert(1)")
    ));
});

test("maps findings only to one unique supported geometry identifier", () => {
    const unique = modelFor([
        svgElement("line", { id: "one", x1: 0, y1: 0, x2: 1, y2: 1 }),
    ]);
    assert.equal(getFindingPreviewKey({ elementId: "one", classification: "coincident-node" }, unique), "one");
    assert.equal(getFindingPreviewKey({ elementId: "one", classification: "unsupported-geometry" }, unique), null);
    assert.equal(getFindingPreviewKey({ elementId: "missing", classification: "isolated-endpoints" }, unique), null);

    const duplicate = modelFor([
        svgElement("line", { id: "same", x1: 0, y1: 0, x2: 1, y2: 1 }),
        svgElement("line", { id: "same", x1: 2, y1: 2, x2: 3, y2: 3 }),
    ]);
    assert.ok(duplicate.shapes.every(({ mappingKey }) => mappingKey === null));
    assert.equal(getFindingPreviewKey({ elementId: "same", classification: "coincident-node" }, duplicate), null);
});

test("renders fresh SVG geometry without copying source markup or active attributes", () => {
    const model = modelFor([
        svgElement("polygon", { id: "shape", points: "0,0 10,0 10,10" }),
    ]);
    const children = [];
    const svgAttributes = new Map();
    const svg = {
        ownerDocument: null,
        replaceChildren: () => { children.length = 0; },
        setAttribute: (name, value) => svgAttributes.set(name, String(value)),
        append: (node) => children.push(node),
    };
    const factory = { createElementNS: (_namespace, name) => renderedNode(name) };
    const rendered = renderStrayNodePreview(svg, model, factory);

    assert.equal(children.length, 1);
    assert.equal(children[0].localName, "polygon");
    assert.equal(children[0].attributes.get("points"), "0,0 10,0 10,10");
    for (const forbidden of ["onclick", "onload", "href", "src", "style", "id"]) {
        assert.equal(children[0].attributes.has(forbidden), false);
    }
    assert.equal(svgAttributes.get("role"), "img");
    assert.equal(rendered.get("shape"), children[0]);
});

test("highlights exactly the selected mapped geometry and clears other highlights", () => {
    const first = renderedNode("line");
    const second = renderedNode("polyline");
    const rendered = new Map([["first", first], ["second", second]]);

    assert.equal(setPreviewHighlight(rendered, "second"), true);
    assert.equal(first.attributes.get("aria-current"), "false");
    assert.equal(second.attributes.get("aria-current"), "true");
    assert.equal(second.attributes.get("stroke"), "#d97706");
    assert.equal(setPreviewHighlight(rendered, "missing"), false);
    assert.ok([first, second].every((node) => node.attributes.get("aria-current") === "false"));
});

test("rejects malformed or non-renderable preview input safely", () => {
    assert.throws(
        () => createStrayNodePreviewModel("<svg>", { DOMParser: parserFor([], { malformed: true }) }),
        /could not be safely previewed/
    );
    assert.throws(
        () => modelFor([svgElement("path", { id: "curve", d: "M0 0 C1 2 3 4 5 6" })]),
        /No safely renderable geometry/
    );
});

test("page wiring remains read-only and never injects uploaded markup", async () => {
    const [page, controller, previewSource] = await Promise.all([
        readFile(new URL("../stray-node-cleaner.html", import.meta.url), "utf8"),
        readFile(new URL("../stray-node-cleaner.js", import.meta.url), "utf8"),
        readFile(new URL("../modules/strayNodePreview.js", import.meta.url), "utf8"),
    ]);

    assert.match(page, /id="stray-node-preview"/);
    assert.match(page, /Read-only geometry preview/);
    assert.match(controller, /Highlight affected geometry/);
    assert.match(controller, /text-only because no unique supported geometry mapping/);
    assert.doesNotMatch(`${controller}\n${previewSource}`, /innerHTML|outerHTML|insertAdjacentHTML|importNode|adoptNode|cloneNode|fetch\(|XMLHttpRequest|sendBeacon|Blob|createObjectURL|\.download/);
    assert.match(previewSource, /createElementNS/);
});
