const NS = "http://www.w3.org/2000/svg";
const SCALE = 10n ** 30n;
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4 };
const ROOT_ATTRIBUTES = new Set(["xmlns", "width", "height", "viewBox", "preserveAspectRatio", "version", "id"]);
const PATH_ATTRIBUTES = new Set(["d", "fill", "stroke", "opacity", "fill-opacity", "fill-rule"]);
const OPAQUE = /^(?:#[0-9a-f]{3}|#[0-9a-f]{6}|black|white|red|green|blue|yellow)$/i;
const same = (a, b) => a.x === b.x && a.y === b.y;
const numberPoint = ({ x, y }) => ({ x: Number(x) / 1e30, y: Number(y) / 1e30 });

function exactNumber(text) {
    if (text.length > 80) throw new Error("Numeric precision exceeds the supported range.");
    const [mantissa, exponentText = "0"] = text.toLowerCase().split("e");
    const exponent = Number(exponentText);
    if (!Number.isInteger(exponent) || Math.abs(exponent) > 60) throw new Error("Exponent outside the supported range.");
    const fraction = mantissa.split(".")[1]?.length || 0;
    let coefficient = BigInt(mantissa.replace(".", ""));
    let shift = 30 + exponent - fraction;
    if (coefficient === 0n) return 0n;
    while (shift < 0 && coefficient % 10n === 0n) { coefficient /= 10n; shift++; }
    if (shift < 0) throw new Error("Precision finer than 30 decimal places requires manual review.");
    const value = coefficient * 10n ** BigInt(shift);
    if (value > 1000000000000n * SCALE || value < -1000000000000n * SCALE) throw new Error("Coordinate magnitude exceeds the supported range.");
    return value;
}

function tokenize(data) {
    if (typeof data !== "string" || !data.trim() || data.length > 200000) throw new Error("Missing or oversized path data.");
    const tokens = [];
    let end = 0;
    const pattern = /[a-zA-Z]|[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g;
    for (const match of data.matchAll(pattern)) {
        const text = match[0];
        const command = /^[a-zA-Z]$/.test(text);
        const gap = data.slice(end, match.index);
        if (!/^[\t\r\n ]*(?:,[\t\r\n ]*)?$/.test(gap)
            || (gap.includes(",") && (!tokens.length || tokens.at(-1).command || command))) throw new Error("Unsupported or malformed path separators.");
        tokens.push({ text, command, start: match.index, end: match.index + text.length });
        end = match.index + text.length;
        if (tokens.length > 12000) throw new Error("Path command limit reached.");
    }
    if (!/^[\t\r\n ]*$/.test(data.slice(end))) throw new Error("Invalid trailing path syntax.");
    return tokens;
}

export function parseCurvePathData(data) {
    try {
        const tokens = tokenize(data);
        const commands = [];
        let cursor = 0, command = null, current = { x: 0n, y: 0n }, origin = null, lastControl = null, previous = null;
        let subpathCount = 0, hasSmooth = false, hasClose = false;
        while (cursor < tokens.length) {
            const explicit = tokens[cursor].command;
            const startOffset = tokens[cursor].start;
            if (explicit) command = tokens[cursor++].text;
            if (!command) throw new Error("A path command is required.");
            const upper = command.toUpperCase(), relative = command !== upper;
            if (!commands.length && upper !== "M") throw new Error("Path data must begin with moveto.");
            if (upper === "Z") {
                if (!explicit || !origin) throw new Error("Malformed closepath command.");
                commands.push({ type: "Z", sourceCommand: command, explicit, start: numberPoint(current), end: numberPoint(origin), sourceRef: { start: startOffset, end: tokens[cursor - 1].end } });
                current = { ...origin }; lastControl = null; previous = "Z"; command = null; hasClose = true;
                continue;
            }
            if (!ARITY[upper]) throw new Error(`Command ${command} requires manual review; only M/L/H/V/C/S/Z are parsed.`);
            const values = tokens.slice(cursor, cursor + ARITY[upper]);
            if (values.length !== ARITY[upper] || values.some((token) => token.command)) throw new Error("Incomplete path command parameters.");
            const numbers = values.map(({ text }) => exactNumber(text));
            cursor += values.length;
            const start = { ...current };
            const point = (index) => ({ x: numbers[index] + (relative ? start.x : 0n), y: numbers[index + 1] + (relative ? start.y : 0n) });
            let type = upper, controls = [], collapsed = false;
            if (upper === "M" || upper === "L") current = point(0);
            else if (upper === "H") { current = { x: numbers[0] + (relative ? start.x : 0n), y: start.y }; type = "L"; }
            else if (upper === "V") { current = { x: start.x, y: numbers[0] + (relative ? start.y : 0n) }; type = "L"; }
            else {
                const first = upper === "S"
                    ? (["C", "S"].includes(previous) && lastControl ? { x: 2n * start.x - lastControl.x, y: 2n * start.y - lastControl.y } : start)
                    : point(0);
                const second = point(upper === "S" ? 0 : 2);
                current = point(upper === "S" ? 2 : 4);
                controls = [first, second];
                collapsed = controls.every((control) => same(control, start)) && same(current, start);
                lastControl = second;
                type = "C";
                if (upper === "S") hasSmooth = true;
            }
            for (const p of [current, ...controls]) {
                if (p.x > 1000000000000n * SCALE || p.x < -1000000000000n * SCALE || p.y > 1000000000000n * SCALE || p.y < -1000000000000n * SCALE) throw new Error("Resolved coordinates exceed the supported range.");
            }
            commands.push({ type, sourceCommand: command, explicit, start: numberPoint(start), end: numberPoint(current), controls: controls.map(numberPoint), collapsed,
                closedEnd: same(start, current), sourceRef: { start: startOffset, end: values.at(-1).end } });
            if (upper === "M") { origin = { ...current }; subpathCount++; command = relative ? "l" : "L"; }
            if (!["C", "S"].includes(upper)) lastControl = null;
            previous = upper;
        }
        if (!commands.length) throw new Error("Missing path commands.");
        return { supported: true, commands, subpathCount, hasSmooth, hasClose };
    } catch (error) {
        return { supported: false, commands: [], reason: error.message };
    }
}

function attrs(node) { return [...node.attributes].map(({ name, value }) => [name, value]); }
function contextRisk(path, documentRisk) {
    if (documentRisk) return "Document CSS, references, active content or animation require manual review.";
    if (path.children.length || attrs(path).some(([name]) => !PATH_ATTRIBUTES.has(name))) return "IDs, references, transforms, styles, markers, path-length settings or metadata must be preserved; manual review only.";
    if (path.getAttribute("stroke") !== "none" || !OPAQUE.test(path.getAttribute("fill") || "")
        || ["opacity", "fill-opacity"].some((name) => path.hasAttribute(name) && path.getAttribute(name) !== "1")) return "Only opaque, unstroked filled paths are eligible; stroke/dash/marker rendering is outside this proof.";
    for (let parent = path.parentElement; parent; parent = parent.parentElement) {
        if (!["svg", "g"].includes(parent.localName)) return "Unsupported parent coordinate context.";
        const allowed = parent.localName === "svg" ? ROOT_ATTRIBUTES : new Set(["id"]);
        if (attrs(parent).some(([name]) => !allowed.has(name))) return "Inherited styles, transforms or effects require manual review.";
    }
    return null;
}

export function inspectCurveDocument(document) {
    if (document?.documentElement?.localName !== "svg" || document.documentElement.namespaceURI !== NS || document.querySelector("parsererror")) throw new Error("Choose a valid SVG document with the SVG namespace.");
    const all = [...document.querySelectorAll("*")];
    const documentRisk = Boolean(document.doctype) || [...(document.childNodes || [])].some((node) => node.nodeType === 7)
        || all.some((node) => ["style", "script", "use", "animate", "animateTransform", "animateMotion", "set", "foreignObject"].includes(node.localName)
            || attrs(node).some(([name, value]) => name === "style" || name === "href" || name.endsWith(":href") || /^on/i.test(name) || /url\s*\(/i.test(value)));
    const elements = [...document.querySelectorAll("path")];
    const paths = [], findings = [], proposals = [];
    let remainingData = 1000000, capped = false;
    function add(pathIndex, segmentIndex, reason, eligible = false) {
        if (findings.length >= 500) { capped = true; return; }
        const number = findings.length + 1, id = `curve-finding-${number}`;
        const proposalId = eligible ? `remove-collapsed-cubic:${pathIndex}:${segmentIndex}` : null;
        findings.push({ id, number, pathIndex, segmentIndex, reason, proposalId });
        if (eligible) {
            const segment = paths[pathIndex].parsed.commands[segmentIndex];
            proposals.push({ id: proposalId, findingId: id, kind: "remove-collapsed-cubic", pathIndex, segmentIndex,
                sourceRef: { ...segment.sourceRef, command: segment.sourceCommand, text: paths[pathIndex].data.slice(segment.sourceRef.start, segment.sourceRef.end) },
                preservesGeometry: true, requiresReview: true, safeToAutoApply: false });
        }
    }
    elements.slice(0, 200).forEach((node, index) => {
        const data = node.getAttribute("d") || "";
        const label = `path ${index + 1}${node.getAttribute("id") ? ` (#${node.getAttribute("id")})` : ""}`;
        const parsed = data.length <= remainingData ? parseCurvePathData(data) : { supported: false, commands: [], reason: "Total path-data inspection limit reached; manual review required." };
        remainingData = Math.max(remainingData - data.length, 0);
        let mappingRisk = node.namespaceURI !== NS ? "Unsupported namespace." : null;
        let svgCount = 0;
        for (let parent = node; parent; parent = parent.parentElement) {
            if (parent.localName === "svg") svgCount++;
            if (parent.hasAttribute("transform") || !["path", "svg", "g"].includes(parent.localName)) mappingRisk = "Transformed or definition/container path cannot be mapped safely in this preview.";
        }
        if (svgCount !== 1) mappingRisk = "Nested SVG viewports require manual review.";
        paths.push({ index, label, data, parsed, previewable: parsed.supported && !mappingRisk });
        if (!parsed.supported || mappingRisk) { add(index, null, mappingRisk || parsed.reason); return; }
        const risk = contextRisk(node, documentRisk);
        parsed.commands.forEach((segment, segmentIndex) => {
            if (segment.type !== "C") return;
            if (!segment.collapsed) {
                if (segment.closedEnd) add(index, segmentIndex, "Endpoint returns to the start, but control points form a real curve/loop. It is not zero-length; manual review only.");
                return;
            }
            const before = parsed.commands[segmentIndex - 1], after = parsed.commands[segmentIndex + 1];
            const eligible = !risk && segment.sourceCommand.toUpperCase() === "C" && segment.explicit
                && parsed.subpathCount === 1 && !parsed.hasClose && !parsed.hasSmooth
                && before?.type === "C" && before.explicit && !before.collapsed && after?.type === "C" && !after.collapsed && after.explicit;
            add(index, segmentIndex, eligible
                ? "Both control points and endpoint equal the segment start exactly. The interior segment is a constant point already retained by adjacent explicit cubic geometry; removal preserves geometry."
                : risk || "Collapsed cubic requires manual review: boundary/isolated segment, shorthand reflection, closure, multiple subpaths or implicit command dependencies are outside the safe scope.", eligible);
        });
    });
    if (elements.length > paths.length) add(null, null, "Only the first 200 paths were inspected; remaining paths require manual review.");
    if (capped) findings.push({ id: "curve-findings-limited", number: findings.length + 1, pathIndex: null, segmentIndex: null, proposalId: null, reason: "Finding limit reached; remaining curve geometry requires manual review." });
    return { productId: "curve_repair", pathCount: elements.length, paths, findings, proposals };
}

export function inspectCurveSvg(source, { DOMParser: Parser = globalThis.DOMParser } = {}) {
    if (typeof source !== "string" || !source.trim() || typeof Parser !== "function") throw new Error("Choose a non-empty SVG file.");
    return inspectCurveDocument(new Parser().parseFromString(source, "image/svg+xml"));
}
