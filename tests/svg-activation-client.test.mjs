import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function newClient() {
    const values = new Map([
        ["svg-micro-eco-access-token", "isolated-svg-token"],
        ["svg-micro-eco-user", '{"entitlements":[]}'],
    ]);
    globalThis.localStorage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key,value) => values.set(key,value),
        removeItem: key => values.delete(key),
    };
    return import("../modules/auth.js?svgtest=" + Math.random());
}

test("SVG single-use code activates through the authenticated API, then refreshes verified access", async () => {
    const requests = [];
    const auth = await newClient();
    globalThis.fetch = async (url, options) => {
        requests.push({url,options});
        if (url.endsWith("/svg/activate")) return {
            ok:true, json:async()=>({success:true,entitlements:["pathseal","curve_repair"]})
        };
        if (url.endsWith("/auth/me")) return {
            ok:true,json:async()=>({entitlements:["pathseal","curve_repair"],svg_lifetime_entitlements:["pathseal","curve_repair"]})
        };
        throw new Error("Unexpected request");
    };
    const response = await auth.activateSvgLifetime("SVG1-" + "A".repeat(32));
    assert.equal(response.success,true);
    const actual = requests.at(-1);
    assert.match(actual.url,/\/api\/svg\/activate$/);
    assert.equal(actual.options.headers.Authorization,"Bearer isolated-svg-token");
    assert.deepEqual(JSON.parse(actual.options.body),{code:"SVG1-"+"A".repeat(32)});
    assert.deepEqual(auth.getCurrentUser().entitlements,[],"the client must never grant based on activation reply");
    await auth.refreshSession();
    assert.deepEqual(auth.getCurrentUser().entitlements,["pathseal","curve_repair"]);
});

test("SVG activation is unavailable while signed out", async () => {
    const auth = await newClient();
    auth.clearSession();
    globalThis.fetch = async () => {throw Error("No request expected")};
    await assert.rejects(auth.activateSvgLifetime("SVG1-"+"A".repeat(32)),/Sign in required/);
});

test("hub retains disabled checkout and limits activation UI to authenticated accounts", async () => {
    const html = await readFile(new URL("../index.html",import.meta.url),"utf-8");
    const controller = await readFile(new URL("../ecosystem.js",import.meta.url),"utf-8");
    assert.match(html,/id="svg-activation-panel"[^>]*hidden/);
    assert.match(html,/id="svg-activation-code"/);
    assert.match(controller,/activationPanel.hidden = !user/);
    assert.match(controller,/await refreshSession\(\)/);
    assert.match(html,/id="subscription-checkout"[^>]*hidden disabled/);
});
