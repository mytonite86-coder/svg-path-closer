import { RELEASE_FLAGS } from "./modules/releaseFlags.js";
import { login, registerAccount, refreshSession, clearSession, getCurrentUser, getAccessToken, startSvgSubscriptionCheckout, confirmSvgSubscriptionCheckout, activateSvgLifetime } from "./modules/auth.js";
import { PRODUCT_MANIFEST } from "./modules/productManifest.js";
import { deriveToolAccessState, validateReturnDestination } from "./modules/accessFoundation.js";
import { formatUsd, requestSvgSubscriptionQuote } from "./modules/svgSubscription.js?v=selector-20260820";

const cards = document.querySelector("#tool-cards");
const status = document.querySelector("#subscription-status");
const quotePanel = document.querySelector("#subscription-quote");
const lineItems = document.querySelector("#quote-line-items");
const accountStatus = document.querySelector("#hub-account-status");
const accountFields = document.querySelector("#hub-account-fields");
const accountSession = document.querySelector("#hub-account-session");
const accountName = document.querySelector("#hub-account-name");
const email = document.querySelector("#hub-email");
const username = document.querySelector("#hub-username");
const password = document.querySelector("#hub-password");
const checkoutButton = document.querySelector("#subscription-checkout");
const activationPanel = document.querySelector("#svg-activation-panel");
const activationCode = document.querySelector("#svg-activation-code");
const activationButton = document.querySelector("#svg-activate-button");
const activationStatus = document.querySelector("#svg-activation-status");
let authorityAvailable = true;
let quoteRequestNumber = 0;

function toolCard(tool) {
    const state = deriveToolAccessState(tool, getCurrentUser(), { authorityAvailable });
    const article = document.createElement("article");
    article.className = `eco-card ${tool.lifecycle === "planned" ? "ecosystem-card--planned" : "eco-panel--accent"}`;
    article.dataset.productId = tool.id;
    const eyebrow = document.createElement("p"); eyebrow.className = "eco-eyebrow"; eyebrow.textContent = `Tool ${tool.order} · ${tool.lifecycle === "planned" ? "Planned" : "Workspace"}`;
    const heading = document.createElement("h3"); heading.className = "eco-heading"; heading.textContent = tool.name;
    const description = document.createElement("p"); description.className = "eco-muted"; description.textContent = tool.description;
    const badge = document.createElement("p"); badge.className = "ecosystem-state"; badge.dataset.state = state.key; badge.textContent = state.label;
    article.append(eyebrow, heading, description, badge);
    if (state.canSelect) {
        const choice = document.createElement("label"); choice.className = "ecosystem-tool-choice";
        const input = document.createElement("input"); input.type = "checkbox"; input.value = tool.id; input.addEventListener("change", updateQuote);
        choice.append(input, ` Add ${tool.name}`); article.append(choice);
    } else if (tool.lifecycle === "planned") {
        const note = document.createElement("p"); note.className = "eco-muted"; note.textContent = "Coming later — not available for purchase."; article.append(note);
    } else if (!tool.productionEnabled && !["owned", "lifetime"].includes(state.key)) {
        const note = document.createElement("p"); note.className = "eco-muted"; note.textContent = "No production purchase option is enabled."; article.append(note);
    }
    if (tool.route && state.canOpen) {
        const link = document.createElement("a"); link.className = "eco-button pathseal-repair-button"; link.href = tool.route; link.textContent = `Open ${tool.name}`; article.append(link);
    }
    return article;
}

function render() {
    const user = getCurrentUser();
    cards.replaceChildren(...PRODUCT_MANIFEST.map(toolCard));
    quoteRequestNumber += 1;
    checkoutButton.hidden = !RELEASE_FLAGS.svgSubscriptionCheckout;
    clearQuote("Select an available tool to see a one-time lifetime quote.");
    accountFields.hidden = Boolean(user); accountSession.hidden = !user;
    activationPanel.hidden = !user;
    accountName.textContent = user ? user.username || user.email : "";
    if (!user) accountStatus.textContent = "Sign in to see verified tool access.";
    else if (!authorityAvailable) accountStatus.textContent = "Account status is temporarily unavailable. Try again before a gated action.";
    else if (user.entitlements?.includes("all_products_lifetime")) accountStatus.textContent = "Universal lifetime access is active for every implemented tool.";
    else accountStatus.textContent = "Your verified tool access is shown below.";
}

function selectedProductIds() { return [...cards.querySelectorAll('input[type="checkbox"]:checked')].map(({ value }) => value); }
function clearQuote(message) { checkoutButton.disabled = true; quotePanel.hidden = true; lineItems.replaceChildren(); status.textContent = message; }
async function updateQuote() {
    const productIds = selectedProductIds(); const requestNumber = ++quoteRequestNumber;
    if (!productIds.length) return clearQuote("Select an available tool to see a one-time lifetime quote.");
    checkoutButton.disabled = true;
    status.textContent = "Calculating your approved one-time price…";
    try {
        const quote = await requestSvgSubscriptionQuote(productIds); if (requestNumber !== quoteRequestNumber) return;
        document.querySelector("#quote-tool-count").textContent = quote.tool_count;
        document.querySelector("#quote-subtotal").textContent = formatUsd(quote.subtotal_cents);
        document.querySelector("#quote-discount").textContent = quote.discount_percent ? `${quote.discount_percent}% − ${formatUsd(quote.discount_cents)}` : "No coupon";
        document.querySelector("#quote-total").textContent = formatUsd(quote.total_cents);
        lineItems.replaceChildren(...quote.line_items.map((lineItem) => { const item = document.createElement("li"); item.textContent = `${lineItem.name} — ${formatUsd(lineItem.unit_amount_cents)} one time`; return item; }));
        quotePanel.hidden = false;
        checkoutButton.disabled = !RELEASE_FLAGS.svgSubscriptionCheckout || !getCurrentUser() || !authorityAvailable;
        status.textContent = RELEASE_FLAGS.svgSubscriptionCheckout ? "Review your one-time total before continuing to secure checkout." : "One-time lifetime quote before tax. Checkout is not enabled.";
    } catch (error) { if (requestNumber === quoteRequestNumber) clearQuote(error.message); }
}

async function authenticate(createAccount) {
    accountStatus.textContent = createAccount ? "Creating your account…" : "Signing in…";
    try {
        if (createAccount) await registerAccount(email.value.trim(), username.value.trim(), password.value); else await login(email.value.trim(), password.value);
        password.value = ""; authorityAvailable = true; render();
        const destination = validateReturnDestination(new URLSearchParams(location.search).get("return_to"));
        if (destination) location.assign(destination);
    } catch (error) { accountStatus.textContent = error.message || "Account request failed."; }
}

document.querySelector("#hub-login").addEventListener("click", () => authenticate(false));
document.querySelector("#hub-register").addEventListener("click", () => authenticate(true));
document.querySelector("#hub-logout").addEventListener("click", () => { clearSession(); authorityAvailable = true; render(); });
render();
if (getCurrentUser()) { accountStatus.textContent = "Checking account status…"; try { await refreshSession(); } catch { authorityAvailable = Boolean(getCurrentUser()) ? false : true; } render(); }

checkoutButton.addEventListener("click", async () => {
    if (!RELEASE_FLAGS.svgSubscriptionCheckout || checkoutButton.disabled) return;
    checkoutButton.disabled = true;
    const selection = selectedProductIds(), token = getAccessToken();
    try {
        await refreshSession();
        if (!getCurrentUser() || token !== getAccessToken()) throw new Error("Sign in before checkout.");
        if (JSON.stringify(selection) !== JSON.stringify(selectedProductIds())) throw new Error("Selection changed. Review your quote again.");
        await startSvgSubscriptionCheckout(selection);
    } catch (error) { status.textContent = error.message || "Checkout is unavailable."; }
});

const checkoutReturn = new URLSearchParams(location.search);
if (checkoutReturn.get("session_id")) {
    try {
        const result = await confirmSvgSubscriptionCheckout(checkoutReturn.get("session_id"));
        authorityAvailable = true;
        render();
        status.textContent = result.checkoutStatus.payment_status === "paid"
            ? "Payment received. Your verified tool access is shown above."
            : "Checkout status checked. Access remains pending until verified by the payment service.";
    } catch (error) { status.textContent = error.message || "Checkout status could not be verified."; }
}

activationButton.addEventListener("click", async () => {
    if (!getCurrentUser() || activationButton.disabled) return;
    const code = activationCode.value.trim().toUpperCase();
    if (!/^SVG1-[0-9A-F]{32}$/.test(code)) {
        activationStatus.textContent = "Enter the SVG1 code from your purchase email.";
        return;
    }
    activationButton.disabled = true;
    activationStatus.textContent = "Verifying single-use lifetime code…";
    try {
        await activateSvgLifetime(code);
        await refreshSession();
        activationCode.value = "";
        render();
        activationStatus.textContent = "SVG Micro Eco lifetime access activated.";
    } catch (error) {
        activationStatus.textContent = error.message || "Could not activate this code.";
    } finally {
        activationButton.disabled = false;
    }
});
