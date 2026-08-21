const SVG_QUOTE_URL =
    "https://mab-path-editor.onrender.com/api/payments/svg-subscription/quote";

export function formatUsd(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(cents / 100);
}

export async function requestSvgSubscriptionQuote(
    selectedProductIds,
    fetchApi = fetch
) {
    const response = await fetchApi(SVG_QUOTE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            selected_product_ids: selectedProductIds,
        }),
    });

    if (!response.ok) {
        throw new Error("The subscription quote is temporarily unavailable.");
    }

    return response.json();
}
