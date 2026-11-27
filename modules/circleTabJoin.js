// Build the boundary of one circle and horizontal rectangular tabs.
// Each rectangle must enter the circle at one vertical side and exit at the other.
export function buildCircleTabOutline({ cx, cy, r }, tabs) {
    if (!tabs.length) return null;
    const revolution = 2 * Math.PI;
    const intervals = [];
    const atHeight = (y, side) => {
        const dy = y - cy;
        return { x: cx + side * Math.sqrt((r - dy) * (r + dy)), y };
    };
    for (const { x, y, width, height } of tabs) {
        const right = x + width, bottom = y + height;
        const side = x > cx && right > cx + r ? 1 : right < cx && x < cx - r ? -1 : 0;
        if (!side || y <= cy - r || bottom >= cy + r) return null;
        const top = atHeight(y, side), lower = atHeight(bottom, side);
        const inner = side === 1 ? x : right;
        if (side * (top.x - inner) <= 0 || side * (lower.x - inner) <= 0) return null;
        const start = side === 1 ? top : lower;
        const end = side === 1 ? lower : top;
        const startAngle = (Math.atan2(start.y - cy, start.x - cx) + revolution) % revolution;
        const endAngle = (Math.atan2(end.y - cy, end.x - cx) + revolution) % revolution;
        intervals.push({ start, end, startAngle, endAngle: endAngle <= startAngle ? endAngle + revolution : endAngle,
            outside: side === 1 ? right : x });
    }
    intervals.sort((a, b) => a.startAngle - b.startAngle);
    const point = ({ x, y }) => `${x} ${y}`;
    const parts = [`M ${point(intervals[0].start)}`];
    for (const [index, tab] of intervals.entries()) {
        const next = intervals[(index + 1) % intervals.length];
        const nextAngle = next.startAngle + (index === intervals.length - 1 ? revolution : 0);
        const sweep = nextAngle - tab.endAngle;
        if (sweep <= 1e-9) return null; // Overlapping or touching tabs need a different union.
        parts.push(`L ${tab.outside} ${tab.start.y} L ${tab.outside} ${tab.end.y} L ${point(tab.end)}`,
            `A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${point(next.start)}`);
    }
    return `${parts.join(" ")} Z`;
}
