import { PRODUCT_MANIFEST, SVG_PURCHASE_CATALOG } from "./productManifest.js";
export const API_BASE_URL =
    "https://mab-path-editor.onrender.com/api";

const TOKEN_STORAGE_KEY =
    "svg-micro-eco-access-token";

const USER_STORAGE_KEY =
    "svg-micro-eco-user";

function readStoredUser() {
    const storedUser =
        localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
    }
}

let accessToken =
    localStorage.getItem(TOKEN_STORAGE_KEY) || "";

let currentUser = readStoredUser();

async function apiRequest(
    path,
    {
        method = "GET",
        body = null,
        requiresAuth = false,
    } = {}
) {
    const headers = {
        Accept: "application/json",
    };

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    if (requiresAuth) {
        if (!accessToken) {
            throw new Error("Sign in required.");
        }

        headers.Authorization =
            `Bearer ${accessToken}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            method,
            headers,
            body:
                body === null
                    ? undefined
                    : JSON.stringify(body),
        }
    );

    let responseData = null;

    try {
        responseData = await response.json();
    } catch {
        responseData = null;
    }

    if (!response.ok) {
        if (
            response.status === 401 &&
            requiresAuth
        ) {
            clearSession();
        }

        throw new Error(
            responseData?.detail ||
                "The request could not be completed."
        );
    }

    return responseData;
}

export async function login(email, password) {
    const session = await apiRequest(
        "/auth/login",
        {
            method: "POST",
            body: {
                email,
                password,
            },
        }
    );

    saveSession(
        session.access_token,
        session.user
    );

    return session.user;
}

export async function registerAccount(
    email,
    username,
    password
) {
    const session = await apiRequest(
        "/auth/register",
        {
            method: "POST",
            body: {
                email,
                username,
                password,
            },
        }
    );

    saveSession(
        session.access_token,
        session.user
    );

    return session.user;
}

export async function refreshSession() {
    if (!accessToken) {
        return null;
    }

    const user = await apiRequest(
        "/auth/me",
        {
            requiresAuth: true,
        }
    );

    saveSession(
        accessToken,
        user
    );

    return user;
}

export async function startPathSealCheckout(
    attribution = {}
) {
    return startSvgSubscriptionCheckout(["pathseal"]);
}

export async function confirmPathSealCheckout(
    sessionId
) {
    const checkoutStatus = await apiRequest(
        `/payments/checkout/status/${
            encodeURIComponent(sessionId)
        }`,
        {
            requiresAuth: true,
        }
    );

    const user = await refreshSession();

    return {
        checkoutStatus,
        user,
    };
}



export function saveSession(token, user) {
    accessToken = token;
    currentUser = user;

    localStorage.setItem(
        TOKEN_STORAGE_KEY,
        token
    );

    localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(user)
    );
}

export function clearSession() {
    accessToken = "";
    currentUser = null;

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
}

export function getAccessToken() {
    return accessToken;
}

export function getCurrentUser() {
    return currentUser;
}

export function hasEntitlement(productId) {
    const entitlements = currentUser?.entitlements || [];

    return Boolean(
        entitlements.includes(productId) ||
        entitlements.includes("all_products_lifetime")
    );
}
const SELECTABLE_SVG_CHECKOUT_PRODUCT_IDS = new Set(SVG_PURCHASE_CATALOG.map(({ id }) => id));

function validateSvgCheckoutSelection(selectedProductIds) {
    if (
        !Array.isArray(selectedProductIds) ||
        selectedProductIds.length === 0
    ) {
        throw new Error("Select at least one available SVG tool.");
    }

    const uniqueProductIds = new Set(selectedProductIds);

    if (
        uniqueProductIds.size !== selectedProductIds.length ||
        selectedProductIds.some(
            (productId) =>
                !SELECTABLE_SVG_CHECKOUT_PRODUCT_IDS.has(productId)
        )
    ) {
        throw new Error("The SVG tool selection is not available.");
    }

    if (uniqueProductIds.has("svg_complete_bundle") && uniqueProductIds.size !== 1) throw new Error("Choose the bundle or individual tools.");
    return [...uniqueProductIds];
}

export async function startSvgSubscriptionCheckout(
    selectedProductIds
) {
    const selection = validateSvgCheckoutSelection(selectedProductIds);
    const checkout = await apiRequest(
        "/payments/svg-subscription/checkout/session",
        {
            method: "POST",
            requiresAuth: true,
            body: {
                selected_product_ids: selection,
                origin_url:
                    window.location.origin +
                    window.location.pathname,
            },
        }
    );

    let checkoutUrl;

    try {
        checkoutUrl = new URL(checkout?.url);
    } catch {
        throw new Error("Checkout did not return a safe destination.");
    }

    if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.stripe.com"
    ) {
        throw new Error("Checkout did not return a safe destination.");
    }

    window.location.assign(checkoutUrl.href);
}

export async function confirmSvgSubscriptionCheckout(
    sessionId
) {
    if (!sessionId) {
        throw new Error("Checkout session is required.");
    }

    const checkoutStatus = await apiRequest(
        `/payments/checkout/status/${
            encodeURIComponent(sessionId)
        }`,
        {
            requiresAuth: true,
        }
    );

    const user = await refreshSession();

    return {
        checkoutStatus,
        user,
    };
}


export async function activateSvgLifetime(code) {
    return apiRequest("/svg/activate", {
        method: "POST", requiresAuth: true, body: { code },
    });
}
