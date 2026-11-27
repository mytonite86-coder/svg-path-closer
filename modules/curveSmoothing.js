const point = ({ x, y }) => `${x} ${y}`;

function ellipseOutline(points) {
    if (points.length < 12) return null;
    const xs = points.map(({ x }) => x), ys = points.map(({ y }) => y);
    const left = Math.min(...xs), top = Math.min(...ys);
    const rx = (Math.max(...xs) - left) / 2, ry = (Math.max(...ys) - top) / 2;
    if (Math.min(rx, ry) <= 0) return null;
    const cx = left + rx, cy = top + ry;
    const radial = points.map(({ x, y }) => ({ x: (x - cx) / rx, y: (y - cy) / ry }));
    if (radial.some(({ x, y }) => Math.abs(Math.hypot(x, y) - 1) > 0.115)) return null;
    const turns = radial.map((a, index) => {
        const b = radial[(index + 1) % radial.length];
        return Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y);
    });
    const clockwise = turns[0] > 0;
    if (turns.some((angle) => (angle > 0) !== clockwise || Math.abs(angle) > Math.PI / 3)
        || Math.abs(Math.abs(turns.reduce((sum, angle) => sum + angle, 0)) - 2 * Math.PI) > 1e-6) return null;
    const args = `${rx} ${ry} 0 0 ${clockwise ? 1 : 0}`;
    return `M ${left} ${cy} A ${args} ${left + 2 * rx} ${cy} A ${args} ${left} ${cy} Z`;
}

function fitOpenCurve(points) {
    if (points.length < 7) return null;
    const start = points[0], end = points.at(-1);
    const dx = end.x - start.x, dy = end.y - start.y, length = Math.hypot(dx, dy);
    if (!length) return null;
    const monotonic = (positions) => positions.every((position, index) => index === 0 || position > positions[index - 1]);
    let along = ({ x, y }) => ((x - start.x) * dx + (y - start.y) * dy) / length ** 2;
    let positions = points.map(along);
    if (!monotonic(positions)) {
        along = Math.abs(dx) >= Math.abs(dy) ? ({ x }) => (x - start.x) / dx : ({ y }) => (y - start.y) / dy;
        positions = points.map(along);
        if (!monotonic(positions)) return null;
    }
    const turns = [];
    for (let i = 1; i < points.length - 1; i++) {
        const a = points[i - 1], b = points[i], c = points[i + 1];
        const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - b.x, vy = c.y - b.y;
        const sine = (ux * vy - uy * vx) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
        if (Math.abs(sine) > 0.2) turns.push(Math.sign(sine));
    }
    if (turns.filter((turn, i) => i > 0 && turn !== turns[i - 1]).length < 3) return null;
    // Keep endpoints fixed and fit the two control points against the sampled outline.
    let aa = 0, ab = 0, bb = 0, ax = 0, ay = 0, bx = 0, by = 0;
    for (const [index, t] of positions.entries()) {
        const u = 1 - t, a = 3 * u * u * t, b = 3 * u * t * t;
        const x = points[index].x - u ** 3 * start.x - t ** 3 * end.x;
        const y = points[index].y - u ** 3 * start.y - t ** 3 * end.y;
        aa += a * a; ab += a * b; bb += b * b;
        ax += a * x; ay += a * y; bx += b * x; by += b * y;
    }
    const determinant = aa * bb - ab * ab;
    if (determinant <= 1e-10) return null;
    const first = { x: (bb * ax - ab * bx) / determinant, y: (bb * ay - ab * by) / determinant };
    const second = { x: (aa * bx - ab * ax) / determinant, y: (aa * by - ab * ay) / determinant };
    if (!(along(first) > 0 && along(second) < 1 && along(first) <= along(second))) return null;
    const miss = positions.some((t, i) => {
        const u = 1 - t, a = 3 * u * u * t, b = 3 * u * t * t;
        const x = u ** 3 * start.x + a * first.x + b * second.x + t ** 3 * end.x;
        const y = u ** 3 * start.y + a * first.y + b * second.y + t ** 3 * end.y;
        return Math.hypot(x - points[i].x, y - points[i].y) > length * 0.085;
    });
    return miss ? null : `M ${point(start)} C ${point(first)} ${point(second)} ${point(end)}`;
}

export function planCurveSmoothing(parsed) {
    if (parsed.subpathCount !== 1 || parsed.commands.some(({ type }) => !["M", "L", "Z"].includes(type))
        || parsed.commands.slice(0, -1).some(({ type }) => type === "Z")) return null;
    const points = parsed.commands.filter(({ type }) => type !== "Z").map(({ end }) => end);
    if (parsed.hasClose && points[0].x === points.at(-1).x && points[0].y === points.at(-1).y) points.pop();
    const path = parsed.hasClose ? ellipseOutline(points) : fitOpenCurve(points);
    return path ? { path, reason: parsed.hasClose
        ? "This outline is close to an ellipse. Review the fitted curve against the original cut before applying."
        : "This open outline repeatedly changes direction. Review a fitted cubic that keeps both endpoints and smooths the turns." } : null;
}
