export const UNIVERSAL_ENTITLEMENT_ID = "all_products_lifetime";

export const PRODUCT_MANIFEST = Object.freeze([
    Object.freeze({ id: "pathseal", priceId: "price_1UWR05GcjYPS3asvfYYyOfNb", amountCents: 999, billingMode: "payment", access: "lifetime", name: "PathSeal", order: 1, lifecycle: "implemented", productionEnabled: true, route: "pathseal.html", description: "Find open contours, review questionable gaps, and seal only the paths you approve." }),
    Object.freeze({ id: "duplicate_geometry", priceId: "price_1UWR0DGcjYPS3asvaIMuvUjo", amountCents: 999, billingMode: "payment", access: "lifetime", name: "Duplicate Line Remover", order: 2, lifecycle: "implemented", productionEnabled: false, route: "duplicate-geometry.html", description: "Find exact duplicate lines and prepare safe removals without touching questionable geometry." }),
    Object.freeze({ id: "stray_node_cleaner", priceId: "price_1UWR0EGcjYPS3asvvzGDU6eH", amountCents: 999, billingMode: "payment", access: "lifetime", name: "Stray Node Cleaner", order: 3, lifecycle: "implemented", productionEnabled: false, route: "stray-node-cleaner.html", description: "Review stray-node findings and remove selected exact coincident nodes while preserving original geometry." }),
    Object.freeze({ id: "overlapping_shape_repair", priceId: "price_1UWR0GGcjYPS3asvGXEkZ9LB", amountCents: 999, billingMode: "payment", access: "lifetime", name: "Overlapping Shape Repair", order: 4, lifecycle: "implemented", productionEnabled: false, route: "overlapping-shape-repair.html", description: "Review overlaps and remove only selected safe exact duplicate rectangles." }),
    Object.freeze({ id: "curve_repair", priceId: "price_1UWR0IGcjYPS3asvPdIxw729", amountCents: 999, billingMode: "payment", access: "lifetime", name: "Curve Repair", order: 5, lifecycle: "implemented", productionEnabled: false, route: "curve-repair.html", description: "Review curves and remove only selected, proven redundant interior cubic segments." }),
]);

export function getProduct(productId) {
    return PRODUCT_MANIFEST.find(({ id }) => id === productId) || null;
}

export function getProductionSelectableProductIds() {
    return PRODUCT_MANIFEST.filter(({ lifecycle, productionEnabled }) => lifecycle === "implemented" && productionEnabled).map(({ id }) => id);
}

export const SVG_COMPLETE_BUNDLE = Object.freeze({ id: "svg_complete_bundle", name: "Complete Five-Tool Bundle", priceId: "price_1UWR0KGcjYPS3asvWLg8MvVb", amountCents: 3499, billingMode: "payment", access: "lifetime", productionEnabled: false });
export const SVG_PURCHASE_CATALOG = Object.freeze([...PRODUCT_MANIFEST, SVG_COMPLETE_BUNDLE]);
