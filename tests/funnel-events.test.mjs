import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";


const appSource = await readFile(
    new URL("../app.js", import.meta.url),
    "utf8"
);
const authSource = await readFile(
    new URL("../modules/auth.js", import.meta.url),
    "utf8"
);
const attributionSource = await readFile(
    new URL("../modules/attribution.js", import.meta.url),
    "utf8"
);


test("PathSeal emits the canonical Stage 1 funnel events", () => {
    const requiredEvents = [
        "landing_visit",
        "upload_started",
        "scan_completed",
        "account_created",
        "login_completed",
        "repair_selected",
        "checkout_started",
        "validated_download_completed",
        "error",
    ];

    for (const eventType of requiredEvents) {
        assert.match(
            appSource,
            new RegExp(`["']${eventType}["']`)
        );
    }

    assert.doesNotMatch(
        appSource,
        /trackPathSealEvent\(["'](?:visit|upload)["']/
    );
    assert.doesNotMatch(appSource, /payment_completed/);
});


test("checkout carries only bounded attribution field names", () => {
    for (const field of [
        "visitor_id",
        "source",
        "medium",
        "campaign",
    ]) {
        assert.match(authSource, new RegExp(`\\b${field}:`));
    }

    assert.doesNotMatch(authSource, /utm_content|utm_term/);
});


test("event delivery can finish while checkout navigates away", () => {
    assert.match(attributionSource, /keepalive:\s*true/);
});
