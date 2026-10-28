import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import { buildTool3LocalBundle, outputPath } from "../scripts/build-tool3-local.mjs";

test("direct-file entry uses a classic script containing the current Tool 3 module graph", async () => {
    const page = await readFile(new URL("../stray-node-cleaner.html", import.meta.url), "utf8");
    assert.match(page, /<script defer src="stray-node-cleaner\.local\.js\?[^" ]+"><\/script>/);
    assert.doesNotMatch(page, /<script[^>]+type="module"/);
    const bundle = await readFile(outputPath, "utf8");
    assert.equal(bundle.replace(/\r\n/g, "\n"), await buildTool3LocalBundle(), "Regenerate the local entry after changing Tool 3 source modules.");
    assert.doesNotMatch(bundle, /^\s*(?:import|export)\s/m);
    assert.doesNotThrow(() => new Script(bundle));
    assert.match(bundle, /fileInput\.addEventListener\("change"/);
    const listeners = new Map();
    new Script(bundle).runInNewContext({
        document: { querySelector: (selector) => ({ addEventListener: (event, handler) => listeners.set(`${selector}:${event}`, handler) }) },
    });
    assert.equal(typeof listeners.get("#stray-node-file:change"), "function", "The direct-file bundle must register the upload handler.");
});
