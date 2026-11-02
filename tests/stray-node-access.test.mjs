import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runWithFreshStrayNodeAccess } from "../modules/strayNodeAccess.js";
import { getProduct, getProductionSelectableProductIds } from "../modules/productManifest.js";
import { deriveToolAccessState, validateReturnDestination } from "../modules/accessFoundation.js";

test("hub exposes free Tool 3 workspace for all access states while purchases stay disabled", () => {
    const tool = getProduct("stray_node_cleaner");
    assert.equal(tool.route, "stray-node-cleaner.html");
    assert.equal(tool.lifecycle, "implemented");
    assert.equal(tool.productionEnabled, false);
    for (const user of [null, { entitlements: [] }, { entitlements: [tool.id] }, { entitlements: ["all_products_lifetime"] }]) {
        const state = deriveToolAccessState(tool, user);
        assert.equal(state.canOpen, true);
        assert.equal(state.canSelect, false);
    }
    assert.deepEqual(getProductionSelectableProductIds(), ["pathseal"]);
    assert.equal(validateReturnDestination(tool.route), tool.route);
});

test("fresh Tool 3 and universal lifetime grants authorize protected actions", async () => {
    for (const user of [
        { entitlements: ["stray_node_cleaner"] },
        { entitlements: ["stray_node_cleaner"], subscriptionStatusByProduct: { stray_node_cleaner: "past_due" } },
        { entitlements: ["all_products_lifetime"], subscription_statuses: { stray_node_cleaner: "canceled" } },
    ]) {
        let calls = 0;
        assert.equal(await runWithFreshStrayNodeAccess(async () => user, (verified) => { calls++; return verified; }), user);
        assert.equal(calls, 1);
    }
});

test("signed-out, unentitled, wrong-tool, expired, malformed and unavailable states cannot execute", async () => {
    const denied = [
        [null, "signed_out"], [{ entitlements: [] }, "unentitled"],
        [{ entitlements: ["pathseal", "duplicate_geometry"] }, "unentitled"],
        [{ entitlements: ["stray_node_cleaner"], subscription_statuses: { stray_node_cleaner: "expired" } }, "expired"],
        [{ entitlements: ["stray_node_cleaner"], subscriptionStatusByProduct: { stray_node_cleaner: "canceled" } }, "expired"],
        [{ entitlements: "stray_node_cleaner" }, "malformed"],
        [{ entitlements: [true] }, "malformed"],
        [{ entitlements: ["stray_node_cleaner"], subscription_statuses: { stray_node_cleaner: {} } }, "malformed"],
    ];
    let calls = 0;
    for (const [user, code] of denied) {
        await assert.rejects(runWithFreshStrayNodeAccess(async () => user, () => calls++), { code });
    }
    await assert.rejects(runWithFreshStrayNodeAccess(async () => { throw new Error("offline"); }, () => calls++), { code: "unavailable" });
    assert.equal(calls, 0);
});

test("a repair grant cannot authorize a later download after revocation", async () => {
    let refreshCalls = 0;
    let protectedCalls = 0;
    const refresh = async () => ++refreshCalls === 1 ? { entitlements: ["stray_node_cleaner"] } : { entitlements: [] };
    await runWithFreshStrayNodeAccess(refresh, () => protectedCalls++);
    await assert.rejects(runWithFreshStrayNodeAccess(refresh, () => protectedCalls++), { code: "unentitled" });
    assert.equal(refreshCalls, 2);
    assert.equal(protectedCalls, 1);
});

test("Tool 3 entry reuses shared session and account hub without checkout wiring", async () => {
    const [entry, page, controller] = await Promise.all([
        readFile(new URL("../stray-node-cleaner-entry.js", import.meta.url), "utf8"),
        readFile(new URL("../stray-node-cleaner.html", import.meta.url), "utf8"),
        readFile(new URL("../stray-node-cleaner.js", import.meta.url), "utf8"),
    ]);
    assert.match(entry, /import \{ refreshSession \} from "\.\/modules\/auth.js"/);
    assert.match(page, /index.html\?return_to=stray-node-cleaner.html#account/);
    assert.match(controller, /runWithFreshStrayNodeAccess/);
    assert.equal((controller.match(/return withToolAccess\(/g) || []).length, 2);
    assert.doesNotMatch(entry + controller, /startPathSealCheckout|startSvgSubscriptionCheckout|\/payments\//);
});
