export const DUPLICATE_GEOMETRY_ENTITLEMENT = "duplicate_geometry";
export const UNIVERSAL_ENTITLEMENT = "all_products_lifetime";

const EXPIRED_STATUSES = new Set([
    "canceled",
    "cancelled",
    "expired",
    "incomplete_expired",
    "paused",
    "unpaid",
]);

export class DuplicateGeometryAccessError extends Error {
    constructor(code) {
        super("Tool access could not be verified. Sign in and try again.");
        this.name = "DuplicateGeometryAccessError";
        this.code = code;
    }
}

function fail(code) {
    throw new DuplicateGeometryAccessError(code);
}

function readProductStatus(user) {
    const status = user.subscription_statuses?.[DUPLICATE_GEOMETRY_ENTITLEMENT]
        ?? user.subscriptionStatusByProduct?.[DUPLICATE_GEOMETRY_ENTITLEMENT]
        ?? null;

    if (status !== null && typeof status !== "string") {
        fail("malformed");
    }

    return status?.toLowerCase() ?? null;
}

export async function requireFreshDuplicateGeometryAccess(refreshSession) {
    if (typeof refreshSession !== "function") {
        fail("unavailable");
    }

    let user;
    try {
        user = await refreshSession();
    } catch {
        fail("unavailable");
    }

    if (user === null) {
        fail("signed_out");
    }
    if (!user || typeof user !== "object" || !Array.isArray(user.entitlements)) {
        fail("malformed");
    }
    if (!user.entitlements.every((entitlement) => typeof entitlement === "string")) {
        fail("malformed");
    }

    if (user.entitlements.includes(UNIVERSAL_ENTITLEMENT) || (user.entitlements.includes(DUPLICATE_GEOMETRY_ENTITLEMENT) && user.svg_lifetime_entitlements?.includes(DUPLICATE_GEOMETRY_ENTITLEMENT))) {
        return user;
    }

    const status = readProductStatus(user);
    if (status && EXPIRED_STATUSES.has(status)) {
        fail("expired");
    }
    if (!user.entitlements.includes(DUPLICATE_GEOMETRY_ENTITLEMENT)) {
        fail("unentitled");
    }

    return user;
}

export async function runWithFreshDuplicateGeometryAccess(
    refreshSession,
    protectedAction
) {
    const user = await requireFreshDuplicateGeometryAccess(refreshSession);
    if (typeof protectedAction !== "function") {
        fail("malformed");
    }
    return protectedAction(user);
}
