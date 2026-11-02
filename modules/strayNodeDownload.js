export function cleanedSvgFilename(originalName) {
    const basename = String(originalName || "drawing.svg").split(/[\\/]/).pop();
    const stem = basename.replace(/\.svg$/i, "").replace(/[<>:"|?*\x00-\x1f]/g, "_").trim() || "drawing";
    return `${stem}-cleaned.svg`;
}

// Same browser Blob/anchor pattern as the existing tools; delay cleanup so the
// browser can consume the URL after the click. Only validated text enters here.
export function downloadCleanedSvg(svgText, originalName, {
    document = globalThis.document, URL = globalThis.URL,
    Blob = globalThis.Blob, schedule = globalThis.setTimeout,
} = {}) {
    const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    try {
        link.href = url;
        link.download = cleanedSvgFilename(originalName);
        document.body.append(link);
        link.click();
    } finally {
        link.remove();
        schedule(() => URL.revokeObjectURL(url), 1000);
    }
}
