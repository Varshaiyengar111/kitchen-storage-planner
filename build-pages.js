// Builds the free online demo for GitHub Pages into ./docs.
// The storage rules run for real in the visitor's browser. Only the notes-to-list step is pre-made:
// the online copy never calls the AI and contains no key.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import task from "./task.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.join(here, "docs");
fs.mkdirSync(docs, { recursive: true });
fs.copyFileSync(path.join(here, "public", "index.html"), path.join(docs, "index.html"));
for (const f of ["planner.js", "sample.js"]) fs.copyFileSync(path.join(here, f), path.join(docs, f));

const sample = task.sampleInput;
const demo = {
  status: { live: false, model: null, sample },
  run: { demo: true, result: task.postCheck(sample, structuredClone(task.demoOutput)) },
};
fs.writeFileSync(path.join(docs, "demo.json"), JSON.stringify(demo, null, 2));
fs.writeFileSync(path.join(docs, ".nojekyll"), "");
console.log("Online demo built in docs/");
