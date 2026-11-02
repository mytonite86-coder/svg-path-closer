const EXPIRED = new Set(["canceled", "cancelled", "expired", "incomplete_expired", "paused", "unpaid"]);

export class PathSealAccessError extends Error {
    constructor(code) {
        super(code === "signed_out" ? "Sign in to verify PathSeal repair and download access. Scan and preview remain free."
            : code === "unentitled" || code === "expired" ? "Purchase or verify lifetime PathSeal access through your account. Scan and preview remain free."
                : "PathSeal access could not be verified. Sign in and try again; scan and preview remain free.");
        this.name = "PathSealAccessError";
        this.code = code;
    }
}

export async function runWithFreshPathSealAccess(refreshSession, action) {
    let user;
    try { user = await refreshSession(); }
    catch { throw new PathSealAccessError("unavailable"); }
    if (user === null) throw new PathSealAccessError("signed_out");
    if (!user || !Array.isArray(user.entitlements) || !user.entitlements.every((id) => typeof id === "string")) throw new PathSealAccessError("malformed");
    if (!user.entitlements.includes("all_products_lifetime") && !(user.entitlements.includes("pathseal") && user.svg_lifetime_entitlements?.includes("pathseal"))) {
        const status = user.subscription_statuses?.pathseal ?? user.subscriptionStatusByProduct?.pathseal ?? user.subscription_status ?? null;
        if (status !== null && typeof status !== "string") throw new PathSealAccessError("malformed");
        if (EXPIRED.has(status?.toLowerCase())) throw new PathSealAccessError("expired");
        if (!user.entitlements.includes("pathseal")) throw new PathSealAccessError("unentitled");
    }
    if (typeof action !== "function") throw new PathSealAccessError("malformed");
    return action(user);
}
