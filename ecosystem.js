import {
    formatUsd,
    requestSvgSubscriptionQuote,
} from "./modules/svgSubscription.js?v=selector-20260820";

const availableChoices = [
    ...document.querySelectorAll('.ecosystem-tool-choice input:not(:disabled)'),
];
const status = document.querySelector("#subscription-status");
const quotePanel = document.querySelector("#subscription-quote");
const toolCount = document.querySelector("#quote-tool-count");
const subtotal = document.querySelector("#quote-subtotal");
const discount = document.querySelector("#quote-discount");
const total = document.querySelector("#quote-total");
const lineItems = document.querySelector("#quote-line-items");
let quoteRequestNumber = 0;

function selectedProductIds() {
    return availableChoices
        .filter((choice) => choice.checked)
        .map((choice) => choice.value);
}

function clearQuote(message) {
    quotePanel.hidden = true;
    lineItems.replaceChildren();
    status.textContent = message;
}

async function updateQuote() {
    const productIds = selectedProductIds();
    const requestNumber = ++quoteRequestNumber;

    if (productIds.length === 0) {
        clearQuote("Select at least one available tool to see your monthly quote.");
        return;
    }

    status.textContent = "Calculating your approved monthly price…";

    try {
        const quote = await requestSvgSubscriptionQuote(productIds);

        if (requestNumber !== quoteRequestNumber) {
            return;
        }

        toolCount.textContent = quote.tool_count;
        subtotal.textContent = formatUsd(quote.subtotal_cents);
        discount.textContent = quote.discount_percent
            ? `${quote.discount_percent}% − ${formatUsd(quote.discount_cents)}`
            : "No discount";
        total.textContent = formatUsd(quote.total_cents);
        lineItems.replaceChildren(
            ...quote.line_items.map((lineItem) => {
                const item = document.createElement("li");
                item.textContent = `${lineItem.name} — ${formatUsd(lineItem.unit_amount_cents)}/month`;
                return item;
            })
        );
        quotePanel.hidden = false;
        status.textContent = `${quote.tool_count} tool${quote.tool_count === 1 ? "" : "s"} selected. Quote calculated before tax.`;
    } catch (error) {
        if (requestNumber !== quoteRequestNumber) {
            return;
        }

        clearQuote(error.message);
    }
}

availableChoices.forEach((choice) => {
    choice.addEventListener("change", updateQuote);
});
