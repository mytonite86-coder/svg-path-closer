import test from "node:test";
import assert from "node:assert/strict";
import {
    STRAY_NODE_CLEANER_PRODUCT_ID,
    analyzeStrayNodes,
    parseLinearPathData,
    parsePointsAttribute,
} from "../modules/strayNodeAnalyzer.js";

test("parses line-like point lists without inventing an SVG DOM", () => {
    assert.deepEqual(parsePointsAttribute("0,0 10,0 10,5"), [
        { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 },
    ]);
    assert.equal(parsePointsAttribute("0,0 10"), null);
});

test("supports deterministic linear path commands and gates curves", () => {
    assert.deepEqual(parseLinearPathData("M 0 0 h 10 v 5 L 0 5 z"), {
        supported: true,
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }],
        closed: true,
    });
    assert.equal(parseLinearPathData("M0 0 C1 2 3 4 5 6").supported, false);
});

test("reports exact coincident nodes as deterministic but never auto-repairs", () => {
    const result = analyzeStrayNodes([{
        id: "zero-length",
        type: "polyline",
        closed: false,
        nodes: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }],
    }]);
    const finding = result.findings.find(({ classification }) => classification === "coincident-node");

    assert.equal(result.productId, STRAY_NODE_CLEANER_PRODUCT_ID);
    assert.equal(finding.confidence, "deterministic");
    assert.equal(finding.safeToAutoRepair, false);
    assert.deepEqual(result.repairProposals, []);
});

test("keeps tolerance-based node and segment suspicions ambiguous", () => {
    const result = analyzeStrayNodes([{
        id: "tiny-feature",
        type: "path",
        closed: true,
        nodes: [{ x: 0, y: 0 }, { x: 0.005, y: 0 }, { x: 100, y: 100 }],
    }], { connectionTolerance: 0.01, microscopicRatio: 0.001 });
    const finding = result.findings.find(({ classification }) => classification === "near-coincident-node");

    assert.equal(finding.ambiguity, true);
    assert.equal(finding.measurements.connectionTolerance, 0.01);
    assert.equal(finding.safeToAutoRepair, false);
});

test("distinguishes legitimate open-path ambiguity from near closure", () => {
    const result = analyzeStrayNodes([
        { id: "open-cut", type: "line", closed: false, nodes: [{ x: 0, y: 0 }, { x: 10, y: 0 }] },
        { id: "almost-closed", type: "polyline", closed: false, nodes: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0.005, y: 0 }] },
    ], { connectionTolerance: 0.01 });

    assert.equal(result.findings.filter(({ classification }) => classification === "isolated-endpoints").length, 2);
    assert.equal(result.findings.filter(({ classification }) => classification === "malformed-closure").length, 1);
    assert.ok(result.findings.every(({ safeToAutoRepair }) => safeToAutoRepair === false));
});

test("flags malformed normalized input without mutating it", () => {
    const element = { id: "bad", type: "path", closed: false, nodes: [{ x: 0, y: 0 }] };
    const before = structuredClone(element);
    const result = analyzeStrayNodes([element]);

    assert.equal(result.findings[0].classification, "unsupported-geometry");
    assert.deepEqual(element, before);
});