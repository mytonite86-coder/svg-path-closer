import { clearSession, getCurrentUser, refreshSession } from "./auth.js";
import { getProduct } from "./productManifest.js";
import { deriveToolAccessState } from "./accessFoundation.js";

export async function initializeCompactAccount(productId) {
    const root = document.querySelector("[data-compact-account]");
    if (!root) return;
    const status = root.querySelector("[data-account-status]");
    const signIn = root.querySelector("[data-account-sign-in]");
    const logout = root.querySelector("[data-account-logout]");
    const tool = getProduct(productId);
    let authorityAvailable = true;
    const render = () => {
        const user = getCurrentUser();
        const state = deriveToolAccessState(tool, user, { authorityAvailable });
        status.textContent = user ? `${user.username || user.email} · ${state.label}` : state.label;
        signIn.hidden = Boolean(user);
        logout.hidden = !user;
    };
    render();
    if (getCurrentUser()) {
        status.textContent = "Checking account status…";
        try { await refreshSession(); } catch { authorityAvailable = Boolean(getCurrentUser()) ? false : true; }
        render();
    }
    logout.addEventListener("click", () => { clearSession(); authorityAvailable = true; render(); });
}
