import { login, registerAccount, refreshSession, clearSession, getCurrentUser } from "./modules/auth.js";
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
    accountFields.hidden = Boolean(user); accountSession.hidden = !user;
    accountName.textContent = user ? user.username || user.email : "";
    if (!user) accountStatus.textContent = "Sign in to see verified tool access.";
    else if (!authorityAvailable) accountStatus.textContent = "Account status is temporarily unavailable. Try again before a gated action.";
    else if (user.entitlements?.includes("all_products_lifetime")) accountStatus.textContent = "Universal lifetime access is active for every implemented tool.";
    else accountStatus.textContent = "Your verified tool access is shown below.";
}

function selectedProductIds() { return [...cards.querySelectorAll('input[type="checkbox"]:checked')].map(({ value }) => value); }
function clearQuote(message) { quotePanel.hidden = true; lineItems.replaceChildren(); status.textContent = message; }
async function updateQuote() {
    const productIds = selectedProductIds(); const requestNumber = ++quoteRequestNumber;
    if (!productIds.length) return clearQuote("Select an available tool to see a monthly quote.");
    status.textContent = "Calculating your approved monthly price…";
    try {
        const quote = await requestSvgSubscriptionQuote(productIds); if (requestNumber !== quoteRequestNumber) return;
        document.querySelector("#quote-tool-count").textContent = quote.tool_count;
        document.querySelector("#quote-subtotal").textContent = formatUsd(quote.subtotal_cents);
        document.querySelector("#quote-discount").textContent = quote.discount_percent ? `${quote.discount_percent}% − ${formatUsd(quote.discount_cents)}` : "No discount";
        document.querySelector("#quote-total").textContent = formatUsd(quote.total_cents);
        lineItems.replaceChildren(...quote.line_items.map((lineItem) => { const item = document.createElement("li"); item.textContent = `${lineItem.name} — ${formatUsd(lineItem.unit_amount_cents)}/month`; return item; }));
        quotePanel.hidden = false; status.textContent = "Quote calculated before tax. Checkout is not enabled from this Phase 1 hub.";
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
