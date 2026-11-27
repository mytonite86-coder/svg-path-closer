// Focused release checks using the existing Playwright runtime; no installation.
// Usage: node tests/suite-browser-check.mjs <playwright-module-path> <Tool-3-fixture-path>
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_MANIFEST } from "../modules/productManifest.js";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || "playwright");
const tool3Fixture = process.argv[3];
assert.ok(tool3Fixture, "Supply the existing Tool 3 owner fixture; no replacement fixture is generated.");
const tools = [
    { ...PRODUCT_MANIFEST[0], fixture: resolve(root, "test-open-path.svg"), input: "#svg-file", repair: "#fix-button", download: "#download-button", message: "#account-status" },
    { ...PRODUCT_MANIFEST[1], fixture: resolve(root, "tests/fixtures/duplicate-lines.svg"), input: "#duplicate-file", repair: "#duplicate-confirm", download: "#duplicate-download", message: "#duplicate-selection" },
    { ...PRODUCT_MANIFEST[2], fixture: resolve(tool3Fixture), input: "#stray-node-file", repair: "#stray-node-repair-selected", download: "#stray-node-download", message: "#stray-node-access-status", state: "#stray-node-results" },
    { ...PRODUCT_MANIFEST[3], fixture: resolve(root, "tests/fixtures/tool4-safe-exact-overlap.svg"), input: "#overlap-file", repair: "#overlap-repair", download: "#overlap-download", message: "#overlap-access", state: "#overlap-results" },
    { ...PRODUCT_MANIFEST[4], fixture: resolve(root, "tests/fixtures/tool5-safe-redundant-cubic.svg"), input: "#curve-file", repair: "#curve-repair", download: "#curve-download", message: "#curve-access", state: "#curve-results" },
];
const originals = new Map(await Promise.all(tools.map(async ({ fixture }) => [fixture, await readFile(fixture, "utf8")])));
const server = createServer(async (req, res) => {
    const target = resolve(root, `.${decodeURIComponent(req.url.split("?")[0])}`);
    if (!target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
        const data = await readFile(target);
        res.setHeader("Content-Type", target.endsWith(".js") ? "text/javascript" : target.endsWith(".css") ? "text/css" : target.endsWith(".svg") ? "image/svg+xml" : "text/html");
        res.end(data);
    } catch { res.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = { passed: [], failed: [], liveRequests: 0 };
async function check(name, action) {
    if (process.env.SVG_SUITE_CASE_FILTER && !new RegExp(process.env.SVG_SUITE_CASE_FILTER).test(name)) return;
    try { await action(); report.passed.push(name); console.log(`PASS ${name}`); }
    catch (error) { const reason = error.message.split("\n")[0]; report.failed.push({ name, reason }); console.log(`FAIL ${name}: ${reason}`); }
}
async function session(user, { offline = false } = {}) {
    const context = await browser.newContext({ acceptDownloads: true });
    const state = { user, offline, checks: 0, downloads: [], errors: [], unexpected: [], delay: null };
    if (user) await context.addInitScript((user) => {
        localStorage.setItem("svg-micro-eco-access-token", "suite-fixture-token");
        localStorage.setItem("svg-micro-eco-user", JSON.stringify(user));
    }, user);
    await context.route("**/*", async (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin === base) return route.continue();
        const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,OPTIONS", "content-type": "application/json" };
        if (url.origin === "https://mab-path-editor.onrender.com" && url.pathname === "/api/auth/me") {
            state.checks++;
            if (state.delay) await state.delay();
            return route.fulfill({ status: state.offline ? 503 : 200, headers, body: JSON.stringify(state.offline ? { detail: "Test authority unavailable" } : state.user) });
        }
        if (url.pathname === "/api/auth/login") return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: "suite-fixture-token", user: state.user }) });
        if (url.pathname === "/api/analytics/pathseal/events") {
            assert.equal((request.postData() || "").includes("<svg"), false);
            return route.fulfill({ status: 200, headers, body: "{}" });
        }
        state.unexpected.push(request.url());
        return route.fulfill({ status: 503, headers, body: "{}" });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on("pageerror", (error) => state.errors.push(error.message));
    page.on("download", (download) => state.downloads.push(download));
    return { context, page, state };
}
async function open(s, tool, hub = true) {
    if (hub) {
        await s.page.goto(`${base}/index.html`);
        const card = s.page.locator(`[data-product-id="${tool.id}"]`);
        await card.getByRole("link", { name: `Open ${tool.name}`, exact: true }).click();
        if (tool.id !== "pathseal") assert.equal((await s.page.locator("[data-product-id] input").count()), 0);
        await s.page.waitForLoadState("domcontentloaded");
    } else await s.page.goto(`${base}/${tool.route}`);
    if (tool.id === "pathseal" && s.state.user) {
        await s.page.waitForFunction(() => document.querySelector("#account-status").textContent.includes("repair and download are unlocked") || document.querySelector("#account-status").textContent.includes("Subscribe") || document.querySelector("#account-status").textContent.includes("Lifetime purchases"));
        await s.page.waitForLoadState("networkidle");
    }
}
async function review(s, tool) {
    const before = s.state.checks;
    await s.page.locator(tool.input).setInputFiles(tool.fixture);
    if (tool.id === "pathseal") {
        await s.page.waitForFunction(() => Number(document.querySelector("#paths-scanned").textContent) > 0);
        await s.page.locator("#open-paths-card").click();
    } else if (tool.id === "duplicate_geometry") await s.page.waitForFunction(() => document.querySelector("#duplicate-list").querySelectorAll('input[type="checkbox"]').length > 0);
    else await s.page.waitForFunction((selector) => document.querySelector(selector).dataset.state === "complete", tool.state);
    assert.equal(s.state.checks, before, "Free scan/review must not require account refresh");
    const boxes = s.page.locator('input[type="checkbox"]');
    assert.ok(await boxes.count() > 0, "Expected supported proposals from existing fixture");
    for (const box of await boxes.all()) if (await box.isEnabled()) {
        await box.check();
    }
}
async function repaired(s, tool) {
    await s.page.locator(tool.repair).click();
    await s.page.waitForFunction((selector) => !document.querySelector(selector).disabled, tool.download);
    if (tool.id === "pathseal") assert.equal(await s.page.locator("#validation-status").innerText(), "Passed");
}
async function download(s, tool) {
    const pending = s.page.waitForEvent("download");
    await s.page.locator(tool.download).click();
    const file = await pending;
    assert.equal(await file.failure(), null);
    assert.match(file.suggestedFilename(), /\.svg$/i);
    const chunks = [];
    for await (const chunk of await file.createReadStream()) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString("utf8");
    assert.equal(await s.page.evaluate((text) => {
        const d = new DOMParser().parseFromString(text, "image/svg+xml");
        return d.documentElement.localName === "svg" && !d.querySelector("parsererror");
    }, text), true);
    assert.equal(await s.page.locator(tool.input).evaluate((input) => input.files[0].text()), originals.get(tool.fixture));
}
async function denied(s, tool) {
    if (tool.id === "pathseal") {
        await s.page.waitForFunction((selector) => /Sign in|Purchase|Subscribe/.test(document.querySelector(selector).textContent), tool.message);
        assert.equal(await s.page.locator(tool.download).isDisabled(), true, "PathSeal allowed repair after its grant was revoked");
        assert.match(await s.page.locator(tool.message).innerText(), /Sign in|Purchase|Subscribe/);
    } else await s.page.waitForFunction((selector) => /Sign in|does not have|could not be verified/i.test(document.querySelector(selector).textContent), tool.message);
    assert.equal(await s.page.locator(tool.download).isDisabled(), true);
    assert.equal(s.state.downloads.length, 0);
}
try {
    for (const tool of tools) for (const mode of ["signed_out", "unentitled", "entitled", "lifetime"]) await check(`${tool.name}: ${mode} hub/workflow`, async () => {
        const user = mode === "signed_out" ? null : { username: "suite-test", entitlements: mode === "entitled" ? [tool.id] : mode === "lifetime" ? ["all_products_lifetime"] : [] };
        const s = await session(user);
        try {
            await open(s, tool); await review(s, tool);
            if (["entitled", "lifetime"].includes(mode)) { await repaired(s, tool); await download(s, tool); }
            else { await s.page.locator(tool.repair).click(); await denied(s, tool); }
            assert.deepEqual(s.state.errors, []); assert.deepEqual(s.state.unexpected, []);
        } finally { await s.context.close(); }
    });
    for (const tool of tools) await check(`${tool.name}: revoked download denied`, async () => {
        const s = await session({ username: "suite-test", entitlements: [tool.id] });
        try {
            await open(s, tool, false); await review(s, tool); await repaired(s, tool);
            s.state.user = { entitlements: [] };
            const unauthorizedDownload = s.page.waitForEvent("download", { timeout: 500 }).then(() => true, () => false);
            await s.page.locator(tool.download).click();
            if (tool.id !== "pathseal") await s.page.waitForFunction((selector) => /does not have|could not be verified/i.test(document.querySelector(selector).textContent), tool.message);
            await s.page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
            assert.equal(await unauthorizedDownload, false, "A revoked session still generated a download");
        } finally { await s.context.close(); }
    });
    await check("PathSeal: a transformed compound path exposes its micro-gap and waits for approval", async () => {
        const s = await session({ entitlements: ["pathseal"] });
        try {
            await open(s, tools[0], false);
            const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55"><g transform="translate(5 5) scale(2)" stroke="red"><path d="M0 0 L10 0 L10 10 M10 10.002 L0 10 L0 0"/></g></svg>';
            await s.page.locator(tools[0].input).setInputFiles({
                name: "compound-cut.svg", mimeType: "image/svg+xml", buffer: Buffer.from(source),
            });
            await s.page.waitForFunction(() => Number(document.querySelector("#paths-scanned").textContent) > 0);
            await s.page.locator("#open-paths-card").click();
            const box = s.page.locator('#open-path-list input[type="checkbox"]');
            assert.equal(await box.count(), 1);
            assert.equal(await box.isChecked(), false);
            assert.equal(await s.page.locator(tools[0].repair).isDisabled(), true);
            assert.match(await s.page.locator("#open-path-list").innerText(), /0\.004\d* unit gap/);
            await box.check();
            await repaired(s, tools[0]);
            const pendingDownload = s.page.waitForEvent("download");
            await s.page.locator(tools[0].download).click();
            const downloadFile = await pendingDownload;
            const chunks = [];
            for await (const chunk of await downloadFile.createReadStream()) chunks.push(chunk);
            const result = Buffer.concat(chunks).toString("utf8");
            assert.match(result, /stroke="red" data-pathseal-repair="true"/);
            const endpoints = await s.page.evaluate((text) => {
                const svg = new DOMParser().parseFromString(text, "image/svg+xml");
                const bridge = svg.querySelector("[data-pathseal-repair]");
                return ["x1", "y1", "x2", "y2"].map((name) => Number(bridge.getAttribute(name)));
            }, result);
            assert.ok(Math.abs(endpoints[0] - 25) < 0.0001 && Math.abs(endpoints[2] - 25) < 0.0001);
            const vertical = [endpoints[1], endpoints[3]].sort((a, b) => a - b);
            assert.ok(Math.abs(vertical[0] - 25) < 0.0001 && Math.abs(vertical[1] - 25.004) < 0.0001);
            assert.equal(await s.page.locator(tools[0].input).evaluate((input) => input.files[0].text()), source);
        } finally { await s.context.close(); }
    });
    await check("PathSeal: revoked repair denied", async () => {
        const s = await session({ entitlements: ["pathseal"] });
        try { await open(s, tools[0], false); await review(s, tools[0]); s.state.user = { entitlements: [] }; await s.page.locator(tools[0].repair).click(); await denied(s, tools[0]); }
        finally { await s.context.close(); }
    });
    await check("PathSeal: an above-threshold gap stays selectable for explicit review", async () => {
        const s = await session({ entitlements: ["pathseal"] });
        try {
            await open(s, tools[0], false);
            const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><polyline points="0,0 10,0 10,10 0,10 0,2"/></svg>';
            await s.page.locator(tools[0].input).setInputFiles({
                name: "large-gap.svg", mimeType: "image/svg+xml", buffer: Buffer.from(source),
            });
            await s.page.waitForFunction(() => Number(document.querySelector("#open-paths-found").textContent) > 0);
            await s.page.locator("#open-paths-card").click();
            const box = s.page.locator('#open-path-list input[type="checkbox"]');
            assert.equal(await box.isChecked(), false);
            assert.match(await s.page.locator("#open-path-list").innerText(), /2 unit gap.*Possible bridge/);
            await box.check();
            await repaired(s, tools[0]);
        } finally { await s.context.close(); }
    });
    await check("Tool 2: finds standalone and embedded duplicate cuts in path data", async () => {
        const s = await session({ entitlements: ["duplicate_geometry"] });
        try {
            await open(s, tools[1], false);
            const source = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0 H10"/><path d="m10 0 h-10"/><path d="M0 0 H10 Q20 10 20 20"/></svg>';
            await s.page.locator(tools[1].input).setInputFiles({
                name: "duplicate-cuts.svg", mimeType: "image/svg+xml", buffer: Buffer.from(source),
            });
            const list = s.page.locator("#duplicate-list");
            await list.getByText(/Review path 1.*path 3/).waitFor();
            assert.equal(await list.locator('input:enabled').count(), 1);
            assert.equal(await list.locator('input:disabled').count(), 1);
            assert.equal(await s.page.locator(tools[1].download).isDisabled(), true);
            await repaired(s, tools[1]);
            const pendingDownload = s.page.waitForEvent("download");
            await s.page.locator(tools[1].download).click();
            const downloadFile = await pendingDownload;
            const chunks = [];
            for await (const chunk of await downloadFile.createReadStream()) chunks.push(chunk);
            const output = Buffer.concat(chunks).toString("utf8");
            assert.match(output, /M0 0 H10 Q20 10 20 20/);
            assert.doesNotMatch(output, /m10 0 h-10/);
            assert.equal(await s.page.locator(tools[1].input).evaluate((input) => input.files[0].text()), source);
        } finally { await s.context.close(); }
    });
    await check("Tool 3: reports repeated and isolated nodes inside mixed paths", async () => {
        const s = await session(null);
        try {
            await open(s, tools[2], false);
            const source = '<svg xmlns="http://www.w3.org/2000/svg"><path id="cut" d="M0 0 Q5 5 10 0 h0 M90 90 M20 20 L30 30"/></svg>';
            await s.page.locator(tools[2].input).setInputFiles({
                name: "mixed-nodes.svg", mimeType: "image/svg+xml", buffer: Buffer.from(source),
            });
            await s.page.getByRole("heading", { name: "Coincident node", exact: true }).waitFor();
            await s.page.getByRole("heading", { name: "Isolated node", exact: true }).waitFor();
            assert.equal(await s.page.locator(tools[2].repair).isDisabled(), true);
            assert.equal(await s.page.locator(tools[2].download).isDisabled(), true);
            assert.equal(s.state.checks, 0);
        } finally { await s.context.close(); }
    });
    await check("PathSeal: unavailable authority denies cached grant", async () => {
        const s = await session({ username: "suite-test", entitlements: ["pathseal"] }, { offline: true });
        try { await open(s, tools[0], false); await review(s, tools[0]); await s.page.locator(tools[0].repair).click(); await denied(s, tools[0]); }
        finally { await s.context.close(); }
    });
    await check("Tool 2: new upload invalidates pending repair approval", async () => {
        const s = await session({ entitlements: ["duplicate_geometry"] });
        try {
            await open(s, tools[1], false); await review(s, tools[1]);
            let entered, release;
            const started = new Promise((done) => { entered = done; });
            s.state.delay = () => { const wait = new Promise((done) => { release = done; }); entered(); return wait; };
            await s.page.locator(tools[1].repair).click(); await started;
            await s.page.locator(tools[1].input).setInputFiles({ name: "new-upload.svg", mimeType: "image/svg+xml", buffer: Buffer.from(originals.get(tools[1].fixture)) });
            await s.page.waitForFunction(() => /eligible for removal/.test(document.querySelector("#duplicate-status").textContent));
            const response = s.page.waitForResponse((r) => r.url().endsWith("/auth/me"));
            release(); await response;
            await s.page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
            assert.equal(await s.page.locator(tools[1].download).isDisabled(), true, "An earlier approval generated repaired output for a newer, unapproved upload");
        } finally { await s.context.close(); }
    });
    for (const status of ["expired", "canceled"]) await check(`PathSeal: ${status} fresh grant denies repair and download`, async () => {
        const s = await session({ entitlements: ["pathseal"] });
        try {
            await open(s, tools[0], false); await review(s, tools[0]); await repaired(s, tools[0]);
            s.state.user = { entitlements: ["pathseal"], subscription_status: status };
            await s.page.locator(tools[0].download).click(); await denied(s, tools[0]);
            await review(s, tools[0]);
            await s.page.locator(tools[0].repair).click(); await denied(s, tools[0]);
        } finally { await s.context.close(); }
    });
    for (const tool of tools.slice(0, 2)) await check(`${tool.name}: selection change invalidates pending approval`, async () => {
        const s = await session({ entitlements: [tool.id] });
        try {
            await open(s, tool, false); await review(s, tool);
            let release, entered;
            const started = new Promise((done) => { entered = done; });
            s.state.delay = () => { const wait = new Promise((done) => { release = done; }); entered(); return wait; };
            await s.page.locator(tool.repair).click(); await started;
            await s.page.locator('input[type="checkbox"]:checked').first().uncheck();
            const response = s.page.waitForResponse((r) => r.url().endsWith("/auth/me"));
            release(); await response;
            await s.page.waitForFunction((selector) => /Selections changed/.test(document.querySelector(selector).textContent), tool.message);
            assert.equal(await s.page.locator(tool.download).isDisabled(), true);
        } finally { await s.context.close(); }
    });
    await check("Tool 2: new upload clears completed approval and blocks pending download", async () => {
        const s = await session({ entitlements: ["duplicate_geometry"] });
        try {
            const tool = tools[1];
            await open(s, tool, false); await review(s, tool); await repaired(s, tool);
            let release, entered;
            const started = new Promise((done) => { entered = done; });
            s.state.delay = () => { const wait = new Promise((done) => { release = done; }); entered(); return wait; };
            await s.page.locator(tool.download).click(); await started;
            await s.page.locator(tool.input).setInputFiles({ name: "new-upload.svg", mimeType: "image/svg+xml", buffer: Buffer.from(originals.get(tool.fixture)) });
            await s.page.waitForFunction(() => /eligible for removal/.test(document.querySelector("#duplicate-status").textContent));
            const response = s.page.waitForResponse((r) => r.url().endsWith("/auth/me"));
            release(); await response;
            await s.page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
            assert.equal(s.state.downloads.length, 0);
            assert.equal(await s.page.locator(tool.download).isDisabled(), true);
            s.state.delay = null;
            await repaired(s, tool); await download(s, tool);
        } finally { await s.context.close(); }
    });
    await check("Shared checkout: PathSeal purchase stays disabled", async () => {
        const s = await session({ entitlements: [] });
        try {
            await open(s, tools[0], false);
            assert.equal(await s.page.locator("#subscribe-button").isDisabled(), true);
            await s.page.locator("#subscribe-button").evaluate((element) => element.dispatchEvent(new Event("click")));
            await s.page.evaluate(() => new Promise((done) => requestAnimationFrame(done)));
            assert.deepEqual(s.state.unexpected, []);
            assert.deepEqual(s.state.errors, []);
        } finally { await s.context.close(); }
    });
    await check("Shared checkout: public controls remain disabled", async () => {
        for (const user of [null, { entitlements: [] }, { entitlements: ["all_products_lifetime"] }]) {
            const s = await session(user);
            try {
                await s.page.goto(`${base}/index.html`);
                await s.page.waitForLoadState("networkidle");
                const button = s.page.locator("#subscription-checkout");
                assert.equal(await button.isVisible(), false);
                assert.equal(await button.isDisabled(), true);
                await button.evaluate((element) => element.dispatchEvent(new Event("click")));
                await s.page.evaluate(() => new Promise((done) => requestAnimationFrame(done)));
                assert.deepEqual(s.state.unexpected, []);
                assert.deepEqual(s.state.errors, []);
                assert.equal(await s.page.locator('[data-product-id]:not([data-product-id="pathseal"]) input').count(), 0);
            } finally { await s.context.close(); }
        }
    });
    for (const paid of [false, true]) await check(`Shared checkout: ${paid ? "paid" : "pending"} return refreshes actual entitlement`, async () => {
        const s = await session({ entitlements: [] });
        try {
            await s.context.route("**/api/payments/checkout/status/*", async (route) => {
                assert.equal(route.request().headers().authorization, "Bearer suite-fixture-token");
                s.state.user = { entitlements: paid ? ["curve_repair"] : [] };
                return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "content-type": "application/json" }, body: JSON.stringify({ payment_status: paid ? "paid" : "unpaid" }) });
            });
            await s.page.goto(`${base}/index.html?session_id=cs_fixture`);
            await s.page.waitForFunction(() => /Payment received|Access remains pending/.test(document.querySelector("#subscription-status").textContent));
            const curve = s.page.locator('[data-product-id="curve_repair"] [data-state]');
            assert.equal(await curve.getAttribute("data-state"), paid ? "owned" : "preview");
            assert.equal(await s.page.locator('[data-state="owned"]').count(), paid ? 1 : 0);
            assert.ok(s.state.checks >= 2, "return must refresh authoritative access separately");
            assert.deepEqual(s.state.errors, []);
            assert.deepEqual(s.state.unexpected, []);
        } finally { await s.context.close(); }
    });
    await check("Shared hub: login return, session persistence and logout", async () => {
        const s = await session(null);
        try {
            s.state.user = { username: "suite-test", entitlements: ["all_products_lifetime"] };
            await s.page.goto(`${base}/index.html?return_to=curve-repair.html`);
            await s.page.locator("#hub-email").fill("suite-test@example.invalid");
            await s.page.locator("#hub-password").fill("synthetic-test-password");
            await s.page.locator("#hub-login").click();
            await s.page.waitForURL(`${base}/curve-repair.html`);
            await s.page.goto(`${base}/index.html`);
            await s.page.waitForFunction(() => document.querySelectorAll('[data-state="lifetime"]').length === 5);
            await s.page.locator("#hub-logout").click();
            assert.equal(await s.page.evaluate(() => localStorage.getItem("svg-micro-eco-access-token")), null);
            assert.equal(await s.page.locator('[data-state="signed_out"]').count(), 5);
            assert.deepEqual(s.state.unexpected, []);
        } finally { await s.context.close(); }
    });
    for (const [fixture, original] of originals) assert.equal(await readFile(fixture, "utf8"), original);
    console.log(JSON.stringify({ passed: report.passed.length, failed: report.failed.length, failures: report.failed, liveRequests: report.liveRequests }, null, 2));
    if (report.failed.length) process.exitCode = 1;
} finally {
    await browser.close();
    await new Promise((done) => server.close(done));
}
