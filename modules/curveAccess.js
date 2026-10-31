import { deriveToolAccessState } from "./accessFoundation.js";
import { getProduct, UNIVERSAL_ENTITLEMENT_ID } from "./productManifest.js";

export const CURVE_ENTITLEMENT = getProduct("curve_repair").id;
const EXPIRED = new Set(["canceled", "cancelled", "expired", "incomplete_expired", "paused", "unpaid"]);

export async function runWithFreshCurveAccess(refreshSession, action) {
    let user;
    try { user = await refreshSession(); }
    catch { throw new Error("Tool access could not be verified. Try again through the shared hub."); }
    if (user === null) throw new Error("Sign in through the shared hub to verify Curve Repair access. Scan and review remain free.");
    if (!user || !Array.isArray(user.entitlements) || !user.entitlements.every((id) => typeof id === "string")) throw new Error("Tool access could not be verified: malformed session.");
    if (!user.entitlements.includes(UNIVERSAL_ENTITLEMENT_ID) && !(user.entitlements.includes(CURVE_ENTITLEMENT) && user.svg_lifetime_entitlements?.includes(CURVE_ENTITLEMENT))) {
        const status = user.subscription_statuses?.[CURVE_ENTITLEMENT] ?? user.subscriptionStatusByProduct?.[CURVE_ENTITLEMENT] ?? null;
        if (status !== null && typeof status !== "string") throw new Error("Tool access could not be verified: malformed status.");
        const state = deriveToolAccessState(getProduct(CURVE_ENTITLEMENT), user);
        if (EXPIRED.has(status?.toLowerCase()) || !["owned", "grace"].includes(state.key)) throw new Error("Your account does not have active Curve Repair access. Tool purchases are not enabled yet.");
    }
    if (typeof action !== "function") throw new Error("Invalid protected action.");
    return action(user);
}
