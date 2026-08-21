import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    formatUsd,
    requestSvgSubscriptionQuote,
} from "../modules/svgSubscription.js";

test("ecosystem tool cards contain long labels without overlapping", async () => {
    const page = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const styles = await readFile(
        new URL("../design-system/ecosystem.css", import.meta.url),
        "utf8"
    );

    assert.match(page, /class="eco-shell ecosystem-shell"/);
    assert.match(page, /ecosystem-tool-grid/);
    assert.match(styles, /\.ecosystem-tool-grid \.eco-button[\s\S]*width:\s*100%/);
    assert.match(styles, /overflow-wrap:\s*anywhere/);
    assert.match(styles, /white-space:\s*normal/);
});

test("formats quote cents as customer-facing USD", () => {
    assert.equal(formatUsd(999), "$9.99");
    assert.equal(formatUsd(1898), "$18.98");
});

test("requests a quote with stable selected product IDs", async () => {
    let request;
    const quote = await requestSvgSubscriptionQuote(
        ["pathseal", "duplicate_geometry"],
        async (...args) => {
            request = args;
            return {
                ok: true,
                json: async () => ({ total_cents: 1898 }),
            };
        }
    );

    assert.match(request[0], /\/api\/payments\/svg-subscription\/quote$/);
    assert.equal(request[1].method, "POST");
    assert.deepEqual(JSON.parse(request[1].body), {
        selected_product_ids: ["pathseal", "duplicate_geometry"],
    });
    assert.deepEqual(quote, { total_cents: 1898 });
});

test("does not invent a price when the quote service fails", async () => {
    await assert.rejects(
        requestSvgSubscriptionQuote(["pathseal"], async () => ({ ok: false })),
        /temporarily unavailable/
    );
});
