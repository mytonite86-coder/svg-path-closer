const NS = "http://www.w3.org/2000/svg";
const pointText = ({ x, y }) => `${x},${y}`;

function commandText(command) {
    if (command.type === "Z") return "Z";
    if (command.type === "C") return `C ${command.controls.map(pointText).join(" ")} ${pointText(command.end)}`;
    return `${command.type} ${pointText(command.end)}`;
}

export function renderCurvePreview(svg, paths, findings) {
    svg.replaceChildren();
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Schematic preview of parsed paths; original styles and unsupported paths are not rendered");
    const visible = paths.filter(({ previewable }) => previewable);
    const pathNodes = new Map(), markers = new Map();
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const path of visible) for (const command of path.parsed.commands) {
        for (const point of [command.end, ...(command.controls || [])]) {
            left = Math.min(left, point.x); top = Math.min(top, point.y);
            right = Math.max(right, point.x); bottom = Math.max(bottom, point.y);
        }
    }
    if (!Number.isFinite(left)) { svg.setAttribute("viewBox", "0 0 100 100"); return { pathNodes, markers }; }
    const span = Math.max(right - left, bottom - top, 1), padding = span * 0.1;
    svg.setAttribute("viewBox", `${left - padding} ${top - padding} ${Math.max(right - left, 1) + padding * 2} ${Math.max(bottom - top, 1) + padding * 2}`);
    for (const path of visible) {
        const node = svg.ownerDocument.createElementNS(NS, "path");
        node.setAttribute("d", path.parsed.commands.map(commandText).join(" "));
        node.setAttribute("fill", "none"); node.setAttribute("stroke", "#1f2937");
        node.setAttribute("stroke-width", "1.5"); node.setAttribute("vector-effect", "non-scaling-stroke");
        node.setAttribute("data-path-index", String(path.index));
        svg.append(node); pathNodes.set(path.index, node);
    }
    for (const finding of findings) {
        const path = paths[finding.pathIndex];
        const segment = path?.previewable ? path.parsed.commands[finding.segmentIndex] : null;
        if (!segment || segment.type !== "C") continue;
        const overlay = svg.ownerDocument.createElementNS(NS, "path");
        overlay.setAttribute("d", `M ${pointText(segment.start)} ${commandText(segment)}`);
        overlay.setAttribute("fill", "none"); overlay.setAttribute("stroke", "#64748b");
        overlay.setAttribute("stroke-width", "2"); overlay.setAttribute("vector-effect", "non-scaling-stroke");
        const marker = svg.ownerDocument.createElementNS(NS, "circle");
        marker.setAttribute("cx", String(segment.start.x)); marker.setAttribute("cy", String(segment.start.y));
        marker.setAttribute("r", String(span * 0.014)); marker.setAttribute("fill", "#64748b");
        marker.setAttribute("data-finding-id", finding.id);
        const label = svg.ownerDocument.createElementNS(NS, "text");
        label.setAttribute("x", String(segment.start.x + span * 0.02)); label.setAttribute("y", String(segment.start.y - span * 0.02));
        label.setAttribute("font-size", String(span * 0.045)); label.setAttribute("fill", "#111827");
        label.textContent = String(finding.number);
        svg.append(overlay, marker, label); markers.set(finding.id, { marker, overlay });
    }
    return { pathNodes, markers };
}

export function highlightCurveFinding(rendered, finding) {
    for (const [index, node] of rendered.pathNodes) {
        node.setAttribute("stroke", index === finding.pathIndex ? "#d97706" : "#1f2937");
        node.setAttribute("aria-current", index === finding.pathIndex ? "true" : "false");
    }
    for (const [id, { marker, overlay }] of rendered.markers) {
        marker.setAttribute("fill", id === finding.id ? "#d97706" : "#64748b");
        marker.setAttribute("aria-current", id === finding.id ? "true" : "false");
        overlay.setAttribute("stroke", id === finding.id ? "#d97706" : "#64748b");
        overlay.setAttribute("stroke-width", id === finding.id ? "4" : "2");
    }
}
