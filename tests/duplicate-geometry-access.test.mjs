import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    DuplicateGeometryAccessError,
    requireFreshDuplicateGeometryAccess,
    runWithFreshDuplicateGeometryAccess,
} from "../modules/duplicateGeometryAccess.js";

const directUser = {
    entitlements: ["duplicate_geometry"],
    subscription_statuses: { duplicate_geometry: "active" },
};

async function deniedCode(refreshSession) {
    try {
        await requireFreshDuplicateGeometryAccess(refreshSession);
        return null;
    } catch (error) {
        assert.ok(error instanceof DuplicateGeometryAccessError);
        return error.code;
    }
}

test("allows a fresh direct Tool 2 entitlement", async () => {
    assert.equal(
        await requireFreshDuplicateGeometryAccess(async () => directUser),
        directUser
    );
});

test("allows a fresh universal lifetime entitlement", async () => {
    const user = { entitlements: ["all_products_lifetime"] };
    assert.equal(
        await requireFreshDuplicateGeometryAccess(async () => user),
        user
    );
});

test("denies signed-out, unentitled, expired, malformed, and unavailable states", async () => {
    assert.equal(await deniedCode(async () => null), "signed_out");
    assert.equal(await deniedCode(async () => ({ entitlements: [] })), "unentitled");
    assert.equal(await deniedCode(async () => ({
        entitlements: ["duplicate_geometry"],
        subscription_statuses: { duplicate_geometry: "canceled" },
    })), "expired");
    assert.equal(await deniedCode(async () => ({ entitlements: "duplicate_geometry" })), "malformed");
    assert.equal(await deniedCode(async () => { throw new Error("backend down"); }), "unavailable");
});

test("does not run protected output or download work when authorization fails", async () => {
    let protectedActionCalls = 0;
    const protectedAction = () => { protectedActionCalls += 1; };

    await assert.rejects(
        runWithFreshDuplicateGeometryAccess(async () => ({ entitlements: [] }), protectedAction),
        { code: "unentitled" }
    );
    await assert.rejects(
        runWithFreshDuplicateGeometryAccess(async () => { throw new Error("offline"); }, protectedAction),
        { code: "unavailable" }
    );
    assert.equal(protectedActionCalls, 0);
});

test("requires a new authoritative refresh for every protected action", async () => {
    let refreshCalls = 0;
    let protectedActionCalls = 0;
    const refreshSession = async () => {
        refreshCalls += 1;
        return directUser;
    };

    await runWithFreshDuplicateGeometryAccess(refreshSession, () => { protectedActionCalls += 1; });
    await runWithFreshDuplicateGeometryAccess(refreshSession, () => { protectedActionCalls += 1; });

    assert.equal(refreshCalls, 2);
    assert.equal(protectedActionCalls, 2);
});

test("controller gates both confirmation and download without cached entitlement checks", async () => {
    const controller = await readFile(new URL("../duplicate-geometry.js", import.meta.url), "utf8");
    assert.equal((controller.match(/runWithFreshDuplicateGeometryAccess\(/g) ?? []).length, 2);
    assert.doesNotMatch(controller, /hasEntitlement|getCurrentUser/);
    assert.match(controller, /runWithFreshDuplicateGeometryAccess\([\s\S]*?createDuplicateRemovalSvg/);
    assert.match(controller, /runWithFreshDuplicateGeometryAccess\([\s\S]*?URL\.createObjectURL/);
});
