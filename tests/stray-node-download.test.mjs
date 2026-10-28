import test from "node:test";
import assert from "node:assert/strict";
import { cleanedSvgFilename, downloadCleanedSvg } from "../modules/strayNodeDownload.js";

test("cleaned SVG filenames preserve the uploaded basename", () => {
    assert.equal(cleanedSvgFilename("drawing.svg"), "drawing-cleaned.svg");
    assert.equal(cleanedSvgFilename("My Part.SVG"), "My Part-cleaned.svg");
    assert.equal(cleanedSvgFilename("part"), "part-cleaned.svg");
    assert.equal(cleanedSvgFilename("C:\\fakepath\\part.svg"), "part-cleaned.svg");
    assert.equal(cleanedSvgFilename(""), "drawing-cleaned.svg");
});

test("download creates an SVG Blob, attaches/clicks the named link and cleans up later", async () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const events = [];
    let blob;
    let cleanup;
    const link = { click() { events.push("click"); }, remove() { events.push("remove"); } };
    downloadCleanedSvg(source, "part.svg", {
        document: { createElement: () => link, body: { append: () => events.push("append") } },
        URL: { createObjectURL(value) { blob = value; return "blob:test"; }, revokeObjectURL: (url) => events.push(url) },
        Blob,
        schedule: (callback, delay) => { cleanup = callback; assert.equal(delay, 1000); },
    });
    assert.equal(await blob.text(), source);
    assert.equal(blob.type, "image/svg+xml");
    assert.equal(link.download, "part-cleaned.svg");
    assert.equal(link.href, "blob:test");
    assert.deepEqual(events, ["append", "click", "remove"]);
    cleanup();
    assert.deepEqual(events, ["append", "click", "remove", "blob:test"]);
});
