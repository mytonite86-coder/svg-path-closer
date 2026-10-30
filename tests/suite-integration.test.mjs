import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PRODUCT_MANIFEST, getProductionSelectableProductIds } from "../modules/productManifest.js";
import { deriveToolAccessState, validateReturnDestination } from "../modules/accessFoundation.js";
import { RELEASE_FLAGS } from "../modules/releaseFlags.js";
import { runWithFreshDuplicateGeometryAccess } from "../modules/duplicateGeometryAccess.js";
import { runWithFreshStrayNodeAccess } from "../modules/strayNodeAccess.js";
import { runWithFreshOverlappingAccess } from "../modules/overlappingShapeAccess.js";
import { runWithFreshCurveAccess } from "../modules/curveAccess.js";
import { buildTool3LocalBundle } from "../scripts/build-tool3-local.mjs";
import { buildTool4LocalBundle } from "../scripts/build-tool4-local.mjs";
import { buildTool5LocalBundle } from "../scripts/build-tool5-local.mjs";

test("all five implemented hub routes and account returns have matching stable product IDs", async () => {
    assert.deepEqual(PRODUCT_MANIFEST.map(({ id }) => id), ["pathseal", "duplicate_geometry", "stray_node_cleaner", "overlapping_shape_repair", "curve_repair"]);
    for (const tool of PRODUCT_MANIFEST) {
        assert.equal(tool.lifecycle, "implemented");
        assert.equal(validateReturnDestination(tool.route), tool.route);
        assert.match(await readFile(new URL(`../${tool.route}`, import.meta.url), "utf8"), /SVG Micro Eco/);
        for (const user of [null, { entitlements: [] }, { entitlements: [tool.id] }, { entitlements: ["all_products_lifetime"] }]) assert.equal(deriveToolAccessState(tool, user).canOpen, true);
    }
});

test("embedded manifest packaging stays identical to current source without rebuilding engines", async () => {
    for (const [filename, build] of [["stray-node-cleaner.local.js", buildTool3LocalBundle], ["overlapping-shape-repair.local.js", buildTool4LocalBundle], ["curve-repair.local.js", buildTool5LocalBundle]]) {
        const actual = (await readFile(new URL(`../${filename}`, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
        assert.equal(actual === await build(), true, `${filename} contains stale source/manifest packaging`);
    }
});

test("Tools 2–5 remain unavailable for purchase and checkout/analytics flags are unchanged", () => {
    assert.deepEqual(getProductionSelectableProductIds(), ["pathseal"]);
    assert.equal(PRODUCT_MANIFEST.slice(1).every(({ productionEnabled }) => productionEnabled === false), true);
    assert.equal(RELEASE_FLAGS.svgSubscriptionCheckout, false);
    assert.equal(RELEASE_FLAGS.duplicateGeometryAnalytics, false);
});

test("Tools 2–5 gates accept only matching or lifetime grants and refresh again before download", async () => {
    const gates = [runWithFreshDuplicateGeometryAccess, runWithFreshStrayNodeAccess, runWithFreshOverlappingAccess, runWithFreshCurveAccess];
    for (const [index, run] of gates.entries()) {
        const id = PRODUCT_MANIFEST[index + 1].id;
        let actions = 0;
        for (const user of [null, { entitlements: [] }, { entitlements: ["pathseal"] }]) await assert.rejects(run(async () => user, () => actions++));
        await run(async () => ({ entitlements: [id] }), () => actions++);
        await run(async () => ({ entitlements: ["all_products_lifetime"] }), () => actions++);
        let checks = 0;
        const refresh = async () => ++checks === 1 ? { entitlements: [id] } : { entitlements: [] };
        await run(refresh, () => actions++);
        await assert.rejects(run(refresh, () => actions++));
        await assert.rejects(run(async () => { throw new Error("offline"); }, () => actions++));
        assert.equal(checks, 2); assert.equal(actions, 3);
    }
});
