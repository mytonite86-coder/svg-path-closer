import { deriveToolAccessState } from "./accessFoundation.js";
import { getProduct } from "./productManifest.js";

const PRODUCT_ID = "stray_node_cleaner";
const EXPIRED = new Set(["canceled", "cancelled", "expired", "incomplete_expired", "paused", "unpaid"]);

export class StrayNodeAccessError extends Error {
    constructor(code) {
        super(code === "signed_out"
            ? "Sign in through the shared hub to verify Stray Node Cleaner access. Upload, scan and review remain free."
            : code === "unentitled" || code === "expired"
                ? "Your account does not have active Stray Node Cleaner access. Tool purchases are not enabled yet."
                : "Tool access could not be verified. Try again through the shared hub.");
        this.name = "StrayNodeAccessError";
        this.code = code;
    }
}

export async function runWithFreshStrayNodeAccess(refreshSession, action) {
    let user;
    try {
        user = await refreshSession();
    } catch {
        throw new StrayNodeAccessError("unavailable");
    }
    if (user === null) throw new StrayNodeAccessError("signed_out");
    if (!user || !Array.isArray(user.entitlements) || !user.entitlements.every((id) => typeof id === "string")) {
        throw new StrayNodeAccessError("malformed");
    }
    const state = deriveToolAccessState(getProduct(PRODUCT_ID), user);
    if (state.key !== "lifetime") {
        const status = user.subscription_statuses?.[PRODUCT_ID] ?? user.subscriptionStatusByProduct?.[PRODUCT_ID] ?? null;
        if (status !== null && typeof status !== "string") throw new StrayNodeAccessError("malformed");
        if (EXPIRED.has(status?.toLowerCase())) throw new StrayNodeAccessError("expired");
        if (!["owned", "grace"].includes(state.key)) throw new StrayNodeAccessError("unentitled");
    }
    if (typeof action !== "function") throw new StrayNodeAccessError("malformed");
    return action(user);
}
