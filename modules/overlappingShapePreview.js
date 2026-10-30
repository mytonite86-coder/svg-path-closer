const SVG_NS = "http://www.w3.org/2000/svg";

export function renderOverlappingPreview(svg, shapes) {
    svg.replaceChildren();
    const supported = shapes.filter(({ bounds, geometry }) => bounds && geometry);
    const rendered = new Map();
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Schematic geometry preview; source styles and effects are not rendered");
    if (!supported.length) { svg.setAttribute("viewBox", "0 0 100 100"); return rendered; }
    const x = Math.min(...supported.map(({ bounds }) => bounds.x));
    const y = Math.min(...supported.map(({ bounds }) => bounds.y));
    const right = Math.max(...supported.map(({ bounds }) => bounds.x + bounds.width));
    const bottom = Math.max(...supported.map(({ bounds }) => bounds.y + bounds.height));
    const size = Math.max(right - x, bottom - y, 1);
    const padding = size * 0.08;
    svg.setAttribute("viewBox", `${x - padding} ${y - padding} ${Math.max(right - x, 1) + 2 * padding} ${Math.max(bottom - y, 1) + 2 * padding}`);
    for (const shape of supported) {
        const node = svg.ownerDocument.createElementNS(SVG_NS, shape.type);
        for (const [name, value] of Object.entries(shape.geometry)) node.setAttribute(name, String(value));
        node.setAttribute("fill", "none");
        node.setAttribute("stroke", "#1f2937");
        node.setAttribute("stroke-width", "1.5");
        node.setAttribute("vector-effect", "non-scaling-stroke");
        node.setAttribute("data-shape-index", String(shape.index));
        svg.append(node);
        rendered.set(shape.index, node);
        const label = svg.ownerDocument.createElementNS(SVG_NS, "text");
        label.setAttribute("x", String(shape.bounds.x));
        label.setAttribute("y", String(shape.bounds.y + size * 0.04 * (shape.index % 3)));
        label.setAttribute("font-size", String(size * 0.035));
        label.setAttribute("fill", "#111827");
        label.textContent = String(shape.index + 1);
        svg.append(label);
    }
    return rendered;
}

export function highlightOverlappingFinding(rendered, indexes) {
    const active = new Set(indexes);
    for (const [index, node] of rendered) {
        node.setAttribute("stroke", active.has(index) ? "#d97706" : "#1f2937");
        node.setAttribute("stroke-width", active.has(index) ? "4" : "1.5");
        node.setAttribute("aria-current", active.has(index) ? "true" : "false");
    }
}
