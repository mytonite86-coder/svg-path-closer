const ATTRIBUTION_STORAGE_KEY = "pathseal-attribution-v1";
const VISITOR_STORAGE_KEY = "pathseal-visitor-id-v1";

const clean = (value, maxLength = 200) =>
    typeof value === "string"
        ? value.trim().slice(0, maxLength)
        : "";

function readJson(storage, key) {
    try {
        return JSON.parse(storage.getItem(key) || "null");
    } catch {
        storage.removeItem(key);
        return null;
    }
}

function createVisitorId(cryptoApi) {
    return typeof cryptoApi?.randomUUID === "function"
        ? cryptoApi.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function captureAttribution({
    search = "",
    storage = window.localStorage,
    cryptoApi = window.crypto,
    now = new Date(),
} = {}) {
    let visitorId = clean(storage.getItem(VISITOR_STORAGE_KEY), 120);

    if (!visitorId) {
        visitorId = createVisitorId(cryptoApi);
        storage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }

    const existing = readJson(storage, ATTRIBUTION_STORAGE_KEY);

    if (existing?.visitorId) {
        return existing;
    }

    const parameters = new URLSearchParams(search);
    const attribution = {
        visitorId,
        source: clean(parameters.get("utm_source"), 120) || "direct",
        medium: clean(parameters.get("utm_medium"), 120),
        campaign: clean(parameters.get("utm_campaign"), 200),
        capturedAt: now.toISOString(),
    };

    storage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(attribution)
    );

    return attribution;
}

export function getStoredAttribution(
    storage = window.localStorage
) {
    return readJson(storage, ATTRIBUTION_STORAGE_KEY);
}

