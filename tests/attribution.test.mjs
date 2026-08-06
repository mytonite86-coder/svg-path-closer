import test from "node:test";
import assert from "node:assert/strict";
import {
    captureAttribution,
    getStoredAttribution,
} from "../modules/attribution.js";

function memoryStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
    };
}

test("captures the first attributed PathSeal visit", () => {
    const storage = memoryStorage();
    const attribution = captureAttribution({
        search: "?utm_source=linkedin&utm_medium=social&utm_campaign=founder-launch",
        storage,
        cryptoApi: { randomUUID: () => "visitor-1" },
        now: new Date("2026-08-06T12:00:00Z"),
    });

    assert.deepEqual(attribution, {
        visitorId: "visitor-1",
        source: "linkedin",
        medium: "social",
        campaign: "founder-launch",
        capturedAt: "2026-08-06T12:00:00.000Z",
    });
    assert.deepEqual(getStoredAttribution(storage), attribution);
});

test("preserves first-touch attribution across later visits", () => {
    const storage = memoryStorage();
    const common = {
        storage,
        cryptoApi: { randomUUID: () => "visitor-1" },
    };

    captureAttribution({
        ...common,
        search: "?utm_source=facebook&utm_campaign=first",
    });
    const later = captureAttribution({
        ...common,
        search: "?utm_source=linkedin&utm_campaign=second",
    });

    assert.equal(later.source, "facebook");
    assert.equal(later.campaign, "first");
});

test("records unattributed traffic as direct", () => {
    const attribution = captureAttribution({
        search: "",
        storage: memoryStorage(),
        cryptoApi: { randomUUID: () => "visitor-direct" },
    });

    assert.equal(attribution.source, "direct");
    assert.equal(attribution.visitorId, "visitor-direct");
});

