import assert from "node:assert/strict";
import test from "node:test";

function createStorage(initial = {}) {
    const values = new Map(Object.entries(initial));

    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
    };
}

async function loadAuth(user) {
    globalThis.localStorage = createStorage(
        user
            ? {
                  "svg-micro-eco-user": JSON.stringify(user),
              }
            : {}
    );

    return import(`../modules/auth.js?case=${Math.random()}`);
}

test("grants direct PathSeal entitlement", async () => {
    const auth = await loadAuth({
        entitlements: ["pathseal"],
    });

    assert.equal(auth.hasEntitlement("pathseal"), true);
});

test("universal lifetime entitlement grants PathSeal", async () => {
    const auth = await loadAuth({
        entitlements: ["all_products_lifetime"],
    });

    assert.equal(auth.hasEntitlement("pathseal"), true);
});

test("unrelated or absent entitlements do not grant PathSeal", async () => {
    const unrelated = await loadAuth({
        entitlements: ["mab_s1"],
    });
    assert.equal(unrelated.hasEntitlement("pathseal"), false);

    const signedOut = await loadAuth(null);
    assert.equal(signedOut.hasEntitlement("pathseal"), false);
});
