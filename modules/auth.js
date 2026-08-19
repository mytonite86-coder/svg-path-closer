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
    const checkout = await apiRequest(
        "/payments/checkout/session",
        {
            method: "POST",
            requiresAuth: true,
            body: {
                package_id: "pathseal_monthly",
                origin_url:
                    window.location.origin +
                    window.location.pathname,
                visitor_id: attribution.visitorId || "",
                source: attribution.source || "direct",
                medium: attribution.medium || "",
                campaign: attribution.campaign || "",
            },
        }
    );

    window.location.assign(checkout.url);
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