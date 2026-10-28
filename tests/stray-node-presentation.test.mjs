import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectStrayNodeSvg } from "../modules/strayNodeBrowserAdapter.js";
import {
    buildFindingPresentation,
    describeFindingCertainty,
    describeFindingLocation,
    summarizeFindingCategories,
} from "../stray-node-cleaner.js";

function svgElement(localName, attributes = {}) {
    const values = new Map(Object.entries(attributes).map(([name, value]) => [name, String(value)]));
    return {
        localName,
        getAttribute: (name) => values.has(name) ? values.get(name) : null,
        hasAttribute: (name) => values.has(name),
    };
}

function parserFor(geometry) {
    return class FixtureParser {
        parseFromString() {
            return {
                documentElement: { localName: "svg" },
                querySelector: () => null,
                querySelectorAll: () => geometry,
            };
        }
    };
}

function syntheticInspection() {
    return inspectStrayNodeSvg("<svg data-fixture='presentation' />", {
        DOMParser: parserFor([
            svgElement("polyline", { id: "duplicate-node", points: "0,0 5,0 5,0 10,0" }),
            svgElement("line", { id: "open-cut", x1: 0, y1: 10, x2: 20, y2: 10 }),
            svgElement("polyline", { id: "near-close", points: "0,20 20,20 0.005,20" }),
            svgElement("path", { id: "curve", d: "M0 0 C1 2 3 4 5 6" }),
        ]),
    });
}

test("summarizes synthetic findings by existing analyzer category", () => {
    const summary = summarizeFindingCategories(syntheticInspection().findings);
    const byCategory = Object.fromEntries(summary.map(({ classification, count }) => [classification, count]));

    assert.equal(byCategory["coincident-node"], 1);
    assert.equal(byCategory["isolated-endpoints"], 3);
    assert.equal(byCategory["malformed-closure"], 1);
    assert.equal(byCategory["unsupported-geometry"], 1);
    assert.ok(summary.every(({ label }) => typeof label === "string" && label.length > 0));
});

test("distinguishes definite, possible, and unsupported findings", () => {
    const findings = syntheticInspection().findings;
    const coincident = findings.find(({ classification }) => classification === "coincident-node");
    const endpoints = findings.find(({ classification }) => classification === "isolated-endpoints");
    const unsupported = findings.find(({ classification }) => classification === "unsupported-geometry");

    assert.deepEqual(describeFindingCertainty(coincident), {
        key: "definite", label: "Definite finding",
    });
    assert.deepEqual(describeFindingCertainty(endpoints), {
        key: "possible", label: "Possible finding — review required",
    });
    assert.deepEqual(describeFindingCertainty(unsupported), {
        key: "unsupported", label: "Unsupported geometry — not analyzed",
    });
});

test("shows geometry identifiers and only available analyzer measurements", () => {
    const findings = syntheticInspection().findings;
    const coincident = findings.find(({ classification }) => classification === "coincident-node");
    const endpoints = findings.find(({ classification, elementId }) =>
        classification === "isolated-endpoints" && elementId === "open-cut"
    );
    const closure = findings.find(({ classification }) => classification === "malformed-closure");

    const coincidentPresentation = buildFindingPresentation(coincident);
    assert.equal(coincidentPresentation.geometry, "polyline #duplicate-node");
    assert.match(coincidentPresentation.location, /^Segment 2; length 0/);
    assert.equal(describeFindingLocation(endpoints), "endpoints (0, 10) to (20, 10)");
    assert.equal(describeFindingLocation(closure), "closure gap 0.005");
});

test("page exposes accessible empty, loading, error, and complete review states", async () => {
    const [page, controller] = await Promise.all([
        readFile(new URL("../stray-node-cleaner.html", import.meta.url), "utf8"),
        readFile(new URL("../stray-node-cleaner.js", import.meta.url), "utf8"),
    ]);

    assert.match(page, /data-state="empty"/);
    assert.match(page, /aria-busy="false"/);
    assert.match(page, /role="status"[^>]*aria-live="polite"/);
    assert.match(page, /Choose a local SVG file to begin/);
    for (const state of ["loading", "error", "complete"]) {
        assert.match(controller, new RegExp(`setReviewState\\(\\s*"${state}"`));
    }
    assert.match(controller, /Inspection stopped safely\. No geometry was changed\./);
    assert.match(controller, /No supported stray-node findings were detected\./);
});

test("presentation provides a disabled download control pending validation", async () => {
    const [page, controller] = await Promise.all([
        readFile(new URL("../stray-node-cleaner.html", import.meta.url), "utf8"),
        readFile(new URL("../stray-node-cleaner.js", import.meta.url), "utf8"),
    ]);

    assert.match(page, /original\s+upload is altered/);
    assert.match(page, /id="stray-node-download"[^>]*disabled/);
    assert.match(page, /id="stray-node-validation-status"/);
    assert.doesNotMatch(page, /checkout|subscribe/i);
    assert.doesNotMatch(controller, /createDuplicateRemovalSvg|XMLSerializer|Blob|createObjectURL|\.download|fetch\(/);
});
