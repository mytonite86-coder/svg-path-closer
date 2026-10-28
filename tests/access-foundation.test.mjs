import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PRODUCT_MANIFEST, getProductionSelectableProductIds } from "../modules/productManifest.js";
import { deriveToolAccessState, validateReturnDestination } from "../modules/accessFoundation.js";
import { RELEASE_FLAGS } from "../modules/releaseFlags.js";

const tool = (id) => PRODUCT_MANIFEST.find((product) => product.id === id);

test("manifest keeps stable IDs and planned products out of production selection", () => {
    assert.deepEqual(PRODUCT_MANIFEST.map(({ id }) => id), ["pathseal", "duplicate_geometry", "stray_node_cleaner", "overlapping_shape_repair", "curve_repair"]);
    assert.deepEqual(getProductionSelectableProductIds(), ["pathseal"]);
    assert.equal(tool("stray_node_cleaner").route, "stray-node-cleaner.html");
    assert.equal(tool("stray_node_cleaner").productionEnabled, false);
});

test("derives signed-out, owned, available, grace, expired, and unavailable states", () => {
    assert.equal(deriveToolAccessState(tool("pathseal"), null).key, "signed_out");
    assert.equal(deriveToolAccessState(tool("pathseal"), { entitlements: ["pathseal"] }).key, "owned");
    assert.equal(deriveToolAccessState(tool("pathseal"), { entitlements: [] }).key, "available");
    assert.equal(deriveToolAccessState(tool("pathseal"), { entitlements: ["pathseal"], subscription_status: "past_due" }).key, "grace");
    assert.equal(deriveToolAccessState(tool("pathseal"), { entitlements: [], subscription_status: "canceled" }).key, "expired");
    assert.equal(deriveToolAccessState(tool("pathseal"), { entitlements: ["pathseal"] }, { authorityAvailable: false }).key, "unavailable");
});

test("universal lifetime unlocks every implemented tool but does not publish planned tools", () => {
    const user = { entitlements: ["all_products_lifetime"] };
    assert.equal(deriveToolAccessState(tool("pathseal"), user).key, "lifetime");
    assert.equal(deriveToolAccessState(tool("duplicate_geometry"), user).key, "lifetime");
    assert.equal(deriveToolAccessState(tool("stray_node_cleaner"), user).key, "lifetime");
    assert.equal(deriveToolAccessState(tool("curve_repair"), user).key, "planned");
});

test("return destinations accept only registered implemented internal pages", () => {
    assert.equal(validateReturnDestination("pathseal.html"), "pathseal.html");
    assert.equal(validateReturnDestination("duplicate-geometry.html"), "duplicate-geometry.html");
    assert.equal(validateReturnDestination("stray-node-cleaner.html"), "stray-node-cleaner.html");
    for (const unsafe of ["https://evil.example", "//evil.example", "/pathseal.html", "..\\pathseal.html", "pathseal.html?x=1", "curve-repair.html", "%2F%2Fevil.example"]) {
        assert.equal(validateReturnDestination(unsafe), null);
    }
});

test("commercial checkout and analytics release flags remain disabled", () => {
    assert.equal(RELEASE_FLAGS.svgSubscriptionCheckout, false);
    assert.equal(RELEASE_FLAGS.duplicateGeometryAnalytics, false);
});

test("hub retains account/session presentation without checkout wiring", async () => {
    const [hub, hubScript] = await Promise.all([
        readFile(new URL("../index.html", import.meta.url), "utf8"),
        readFile(new URL("../ecosystem.js", import.meta.url), "utf8"),
    ]);
    for (const id of ["hub-account-status", "hub-account-fields", "hub-account-session", "hub-login", "hub-register", "hub-logout", "tool-cards"]) {
        assert.match(hub, new RegExp(`id="${id}"`));
    }
    assert.match(hub, /src="ecosystem\.js\?v=access-foundation-1"/);
    assert.match(hubScript, /login, registerAccount, refreshSession, clearSession, getCurrentUser/);
    assert.doesNotMatch(hubScript, /startSvgSubscriptionCheckout|confirmSvgSubscriptionCheckout/);
});

test("focused workspaces preserve current-main behavior and expose hub navigation", async () => {
    const [pathseal, duplicate, duplicateScript, pathsealStyles] = await Promise.all([
        readFile(new URL("../pathseal.html", import.meta.url), "utf8"),
        readFile(new URL("../duplicate-geometry.html", import.meta.url), "utf8"),
        readFile(new URL("../duplicate-geometry.js", import.meta.url), "utf8"),
        readFile(new URL("../design-system/pathseal.css", import.meta.url), "utf8"),
    ]);
    assert.match(pathseal, /href="index\.html">[^<]*(?:SVG Micro Eco tools|Explore all SVG Micro Eco tools)/);
    assert.match(pathseal, /id="fix-button"/);
    assert.match(duplicate, /href="index\.html">[^<]*(?:SVG Micro Eco tools|Return to SVG Micro Eco tools)/);
    assert.match(duplicateScript, /createDuplicateRemovalSvg/);
    assert.match(duplicateScript, /link\.download/);
    assert.match(pathsealStyles, /@media \(max-width: 720px\)[\s\S]*\.pathseal-benefits\s*{\s*grid-template-columns:\s*1fr/);
});
