export const UNIVERSAL_ENTITLEMENT_ID = "all_products_lifetime";

export const PRODUCT_MANIFEST = Object.freeze([
    Object.freeze({ id: "pathseal", name: "PathSeal", order: 1, lifecycle: "implemented", productionEnabled: true, route: "pathseal.html", description: "Find open contours, review questionable gaps, and seal only the paths you approve." }),
    Object.freeze({ id: "duplicate_geometry", name: "Duplicate Line Remover", order: 2, lifecycle: "implemented", productionEnabled: false, route: "duplicate-geometry.html", description: "Find exact duplicate lines and prepare safe removals without touching questionable geometry." }),
    Object.freeze({ id: "stray_node_cleaner", name: "Stray Node Cleaner", order: 3, lifecycle: "planned", productionEnabled: false, route: null, description: "Remove isolated nodes while preserving intentional drawing geometry." }),
    Object.freeze({ id: "overlapping_shape_repair", name: "Overlapping Shape Repair", order: 4, lifecycle: "planned", productionEnabled: false, route: null, description: "Find and resolve overlapping shapes through a review-first workflow." }),
    Object.freeze({ id: "curve_repair", name: "Curve Repair", order: 5, lifecycle: "planned", productionEnabled: false, route: null, description: "Inspect and repair damaged curve geometry without blind simplification." }),
]);

export function getProduct(productId) {
    return PRODUCT_MANIFEST.find(({ id }) => id === productId) || null;
}

export function getProductionSelectableProductIds() {
    return PRODUCT_MANIFEST.filter(({ lifecycle, productionEnabled }) => lifecycle === "implemented" && productionEnabled).map(({ id }) => id);
}
