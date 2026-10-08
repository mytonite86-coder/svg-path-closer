import { PRODUCT_MANIFEST, UNIVERSAL_ENTITLEMENT_ID } from "./productManifest.js";

export const HUB_ROUTE = "index.html";
const SAFE_RETURN_ROUTES = new Set(PRODUCT_MANIFEST.filter(({ lifecycle, route }) => lifecycle === "implemented" && route).map(({ route }) => route));

function subscriptionStatusFor(user, productId) {
    return user?.subscription_statuses?.[productId] || user?.subscriptionStatusByProduct?.[productId] || (productId === "pathseal" ? user?.subscription_status : null) || null;
}

export function validateReturnDestination(value) {
    if (typeof value !== "string" || !value || value.length > 120) return null;
    let decoded;
    try { decoded = decodeURIComponent(value); } catch { return null; }
    if (decoded !== value || /[\\\u0000-\u001f\u007f]/.test(value) || value.startsWith("/") || value.includes(":") || value.includes("?") || value.includes("#") || value.includes("..")) return null;
    return SAFE_RETURN_ROUTES.has(value) ? value : null;
}

export function deriveToolAccessState(tool, user, { authorityAvailable = true } = {}) {
    if (tool.lifecycle === "planned") return { key: "planned", label: "Planned", canOpen: false, canSelect: false };
    if (!authorityAvailable && user) return { key: "unavailable", label: "Status unavailable", canOpen: true, canSelect: false };
    if (!user) return { key: "signed_out", label: "Signed out", canOpen: true, canSelect: false };
    const entitlements = Array.isArray(user.entitlements) ? user.entitlements : [];
    if (entitlements.includes(UNIVERSAL_ENTITLEMENT_ID)) return { key: "lifetime", label: "Lifetime access", canOpen: true, canSelect: false };
    const status = subscriptionStatusFor(user, tool.id);
    const entitled = entitlements.includes(tool.id);
    if (entitled && status === "past_due") return { key: "grace", label: "Payment retry — access remains on", canOpen: true, canSelect: false };
    if (entitled) return { key: "owned", label: "Owned", canOpen: true, canSelect: false };
    if (["canceled", "unpaid", "incomplete_expired", "paused"].includes(status)) return { key: "expired", label: "Access ended", canOpen: true, canSelect: tool.productionEnabled };
    if (tool.productionEnabled) return { key: "available", label: "Available to add", canOpen: true, canSelect: true };
    return { key: "preview", label: "Workspace preview", canOpen: true, canSelect: false };
}
