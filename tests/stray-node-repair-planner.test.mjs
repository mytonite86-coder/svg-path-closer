import test from "node:test";
import assert from "node:assert/strict";
import { analyzeStrayNodes } from "../modules/strayNodeAnalyzer.js";
import { planExactCoincidentNodeRepairs } from "../modules/strayNodeRepairPlanner.js";

function analyze(elements) {
    return analyzeStrayNodes(elements);
}

test("proposes reviewable removal for a safe exact polyline duplicate", () => {
    const elements = [{
        id: "safe-polyline",
        type: "polyline",
        closed: false,
        nodes: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }],
    }];
    const result = planExactCoincidentNodeRepairs(elements, analyze(elements));

    assert.equal(result.proposals.length, 1);
    assert.equal(result.rejections.filter(({ classification }) => classification === "coincident-node").length, 0);
    assert.deepEqual(result.proposals[0].elementRef, { id: "safe-polyline", type: "polyline" });
    assert.deepEqual(result.proposals[0].sourceRef, {
        segmentIndex: 1, previousNodeIndex: 1, redundantNodeIndex: 2,
    });
    assert.equal(result.proposals[0].before.nodeCount, 4);
    assert.equal(result.proposals[0].after.nodeCount, 3);
    assert.equal(result.proposals[0].preservesGeometry, true);
    assert.equal(result.proposals[0].requiresReview, true);
    assert.equal(result.proposals[0].safeToAutoApply, false);
    assert.deepEqual(result.appliedRepairs, []);
});

test("proposes exact polygon cleanup only when distinct topology remains", () => {
    const elements = [{
        id: "safe-polygon",
        type: "polygon",
        closed: true,
        nodes: [
            { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0 },
            { x: 10, y: 10 }, { x: 0, y: 10 },
        ],
    }];
    const result = planExactCoincidentNodeRepairs(elements, analyze(elements));
    assert.equal(result.proposals.length, 1);
    assert.equal(result.proposals[0].elementRef.type, "polygon");
});

test("rejects line, path, transformed, curved, and topology-sensitive sources", () => {
    const cases = [
        { expected: "unsupported_element_type", element: { id: "line", type: "line", closed: false } },
        { expected: "unsupported_element_type", element: { id: "path", type: "path", closed: false } },
        { expected: "transformed_geometry", element: { id: "moved", type: "polyline", closed: false, transformed: true } },
        { expected: "curved_geometry", element: { id: "curve", type: "polyline", closed: false, curved: true } },
        { expected: "topology_sensitive", element: { id: "topology", type: "polyline", closed: false, topologySensitive: true } },
    ];

    for (const { expected, element } of cases) {
        element.nodes = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }];
        const result = planExactCoincidentNodeRepairs([element], analyze([element]));
        assert.equal(result.proposals.length, 0);
        assert.ok(result.rejections.some(({ code }) => code === expected));
    }
});

test("rejects tolerance-based and other ambiguous findings outside exact scope", () => {
    const elements = [{
        id: "near",
        type: "polyline",
        closed: false,
        nodes: [{ x: 0, y: 0 }, { x: 0.005, y: 0 }, { x: 10, y: 0 }],
    }];
    const result = planExactCoincidentNodeRepairs(elements, analyze(elements));
    assert.equal(result.proposals.length, 0);
    assert.ok(result.rejections.some(({ classification, code }) =>
        classification === "near-coincident-node" && code === "outside_exact_scope"
    ));
});

test("rejects duplicate IDs, stale source coordinates, and insufficient topology", () => {
    const duplicateElements = [
        { id: "duplicate", type: "polyline", closed: false, nodes: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }] },
        { id: "duplicate", type: "polyline", closed: false, nodes: [{ x: 2, y: 0 }, { x: 3, y: 0 }] },
    ];
    const duplicateResult = planExactCoincidentNodeRepairs(duplicateElements, analyze([duplicateElements[0]]));
    assert.ok(duplicateResult.rejections.some(({ code }) => code === "ambiguous_source_reference"));

    const source = { id: "stale", type: "polyline", closed: false, nodes: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }] };
    const analysis = analyze([source]);
    const staleSource = structuredClone(source);
    staleSource.nodes[1] = { x: 0.5, y: 0 };
    const staleResult = planExactCoincidentNodeRepairs([staleSource], analysis);
    assert.ok(staleResult.rejections.some(({ code }) => code === "stale_or_invalid_finding"));

    const insufficient = { id: "short", type: "polyline", closed: false, nodes: [{ x: 0, y: 0 }, { x: 0, y: 0 }] };
    const insufficientResult = planExactCoincidentNodeRepairs([insufficient], analyze([insufficient]));
    assert.ok(insufficientResult.rejections.some(({ code }) => code === "insufficient_topology"));
});

test("planner does not mutate source elements or analyzer output", () => {
    const elements = [{
        id: "immutable",
        type: "polyline",
        closed: false,
        nodes: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }],
    }];
    const analysis = analyze(elements);
    const elementsBefore = structuredClone(elements);
    const analysisBefore = structuredClone(analysis);

    planExactCoincidentNodeRepairs(elements, analysis);

    assert.deepEqual(elements, elementsBefore);
    assert.deepEqual(analysis, analysisBefore);
    assert.deepEqual(analysis.repairProposals, []);
});
