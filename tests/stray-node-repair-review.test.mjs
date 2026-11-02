import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectStrayNodeSvg } from "../modules/strayNodeBrowserAdapter.js";
import { createStrayNodePreviewModel } from "../modules/strayNodePreview.js";
import { planExactCoincidentNodeRepairs } from "../modules/strayNodeRepairPlanner.js";
import {
    buildRepairProposalPresentation,
    previewModelToPlannerElements,
    summarizeRepairRejections,
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

function integratedPlan(geometry) {
    const Parser = parserFor(geometry);
    const source = "<svg data-fixture='repair-review' />";
    const inspection = inspectStrayNodeSvg(source, { DOMParser: Parser });
    const preview = createStrayNodePreviewModel(source, { DOMParser: Parser });
    return planExactCoincidentNodeRepairs(previewModelToPlannerElements(preview), inspection);
}

test("presents only a planner-approved exact coincident-node proposal", () => {
    const plan = integratedPlan([
        svgElement("polyline", { id: "safe-node", points: "0,0 5,0 5,0 10,0" }),
    ]);

    assert.equal(plan.proposals.length, 1);
    const proposal = plan.proposals[0];
    const presentation = buildRepairProposalPresentation(proposal);
    assert.equal(presentation.geometry, "polyline #safe-node");
    assert.equal(presentation.location, "Segment 2; redundant node 3");
    assert.equal(presentation.coordinate, "(5, 0)");
    assert.equal(presentation.before, proposal.before.description);
    assert.equal(presentation.after, proposal.after.description);
    assert.equal(presentation.beforeNodeCount, 4);
    assert.equal(presentation.afterNodeCount, 3);
    assert.equal(presentation.requiresReview, true);
    assert.equal(presentation.applied, false);
    assert.match(presentation.reviewLabel, /Requires customer review/);
    assert.match(presentation.reviewLabel, /not been applied/);
});

test("keeps unsupported source types and ambiguous identifiers out of eligible proposals", () => {
    const pathPlan = integratedPlan([
        svgElement("path", { id: "linear-path", d: "M0 0 H5 H5 H10" }),
    ]);
    assert.equal(pathPlan.proposals.length, 0);
    assert.ok(pathPlan.rejections.some(({ code }) => code === "unsupported_element_type"));

    const duplicatePlan = integratedPlan([
        svgElement("polyline", { id: "duplicate", points: "0,0 5,0 5,0 10,0" }),
        svgElement("polyline", { id: "duplicate", points: "0,10 5,10 5,10 10,10" }),
    ]);
    assert.equal(duplicatePlan.proposals.length, 0);
    assert.ok(duplicatePlan.rejections.some(({ code }) => code === "ambiguous_source_reference"));
});

test("groups planner rejection explanations without changing their meaning", () => {
    const summaries = summarizeRepairRejections([
        { code: "outside_exact_scope", reason: "Only exact findings are eligible." },
        { code: "outside_exact_scope", reason: "Only exact findings are eligible." },
        { code: "unsupported_element_type", reason: "Unsupported source type." },
    ]);

    assert.deepEqual(summaries, [
        { code: "outside_exact_scope", reason: "Only exact findings are eligible.", count: 2 },
        { code: "unsupported_element_type", reason: "Unsupported source type.", count: 1 },
    ]);
});

test("page wiring shows review-only proposals and preserves preview behavior", async () => {
    const [page, controller] = await Promise.all([
        readFile(new URL("../stray-node-cleaner.html", import.meta.url), "utf8"),
        readFile(new URL("../stray-node-cleaner.js", import.meta.url), "utf8"),
    ]);

    assert.match(page, /id="stray-node-repair-review"/);
    assert.match(page, /id="stray-node-repair-proposals"/);
    assert.match(page, /Why other findings are not repair proposals/);
    assert.match(controller, /planExactCoincidentNodeRepairs/);
    assert.match(controller, /Proposed exact coincident-node cleanup/);
    assert.match(controller, /Requires customer review/);
    assert.match(controller, /Highlight affected geometry/);
    assert.doesNotMatch(`${page}\n${controller}`, /XMLSerializer|Blob|createObjectURL|\.download|fetch\(|applyRepair|executeRepair|selectProposal/);
});
