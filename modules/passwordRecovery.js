import { API_BASE_URL, clearSession } from "./auth.js";

async function send(path, body) {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof result.detail === "string" ? result.detail : "Password recovery is temporarily unavailable. Try again later.");
    return result.message;
}

export function initializePasswordRecovery({ email, onComplete }) {
    const toggle = document.querySelector("#hub-forgot-password");
    const request = document.querySelector("#password-reset-request");
    const confirm = document.querySelector("#password-reset-confirm");
    const confirmPassword = document.querySelector("#reset-new-password");
    const requestEmail = document.querySelector("#reset-email");
    const repeatedPassword = document.querySelector("#reset-repeat-password");
    const status = document.querySelector("#password-reset-status");
    const hash = new URLSearchParams(location.hash.slice(1));
    let token = hash.get("reset-password");

    function showRequest() {
        confirm.hidden = true;
        request.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        requestEmail.value = email.value;
        requestEmail.focus();
    }

    async function submit(form, action) {
        const button = form.querySelector('button[type="submit"]');
        if (button.disabled) return;
        button.disabled = true;
        status.textContent = "Working…";
        try {
            status.textContent = await action();
        } catch (error) {
            status.textContent = error.message || "Password recovery is temporarily unavailable.";
        } finally {
            button.disabled = false;
        }
    }

    toggle.addEventListener("click", showRequest);
    request.addEventListener("submit", (event) => {
        event.preventDefault();
        void submit(request, () => send("request", { email: requestEmail.value.trim() }));
    });
    confirm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (confirmPassword.value !== repeatedPassword.value) {
            status.textContent = "Enter the same password in both fields.";
            return;
        }
        if (new TextEncoder().encode(confirmPassword.value).length > 72) {
            status.textContent = "Use a password of at most 72 UTF-8 bytes.";
            return;
        }
        void submit(confirm, async () => {
            const message = await send("confirm", { token, password: confirmPassword.value });
            token = null;
            confirm.reset();
            confirm.hidden = true;
            clearSession();
            onComplete();
            email.focus();
            return message;
        });
    });

    if (token !== null) {
        history.replaceState(null, "", location.pathname + location.search + "#account");
        if (/^[A-Za-z0-9_-]{43}$/.test(token)) {
            confirm.hidden = false;
            confirmPassword.focus();
        } else {
            token = null;
            status.textContent = "This reset link is invalid. Request a new link.";
            showRequest();
        }
    } else if (new URLSearchParams(location.search).get("recover") === "1") {
        showRequest();
    }
}
