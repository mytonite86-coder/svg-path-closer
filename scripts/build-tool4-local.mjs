import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildLocalBundle } from "./build-tool3-local.mjs";

export const outputPath = fileURLToPath(new URL("../overlapping-shape-repair.local.js", import.meta.url));
export function buildTool4LocalBundle() {
    return buildLocalBundle("overlapping-shape-repair.js", "node scripts/build-tool4-local.mjs");
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    await writeFile(outputPath, await buildTool4LocalBundle());
}
