// Checks that the storage rules behave as promised. Run with: npm test
import assert from "node:assert/strict";
import { plan, TYPES } from "./planner.js";
import { sampleInput } from "./sample.js";
import task from "./task.js";

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log("✓", name); };
const where = (k, label) => k.cabinets.find((c) => c.slots.some((s) => (s.item || "").includes(label)));

const sample = plan(sampleInput());
const [dry, wet] = sample.kitchens;

test("the example kitchen fits with nothing left over", () => {
  assert.equal(dry.unplaced.length + wet.unplaced.length, 0);
});
test("pots and pans go in the drawers under the hob", () => {
  assert.ok(where(dry, "Pots").nearHob);
  assert.ok(where(dry, "Pans").nearHob);
});
test("non-cooking items leave the hob drawers free", () => {
  assert.ok(!where(dry, "groceries").nearHob);
  assert.ok(!where(dry, "plates").nearHob);
});
test("bulk groceries go in the tall pantry with a load check", () => {
  const cab = where(wet, "Rice");
  assert.equal(cab.kind, "pantry");
  assert.match(cab.load, /20 kg/);
});
test("vegetables and fruit are never put under the hob", () => {
  for (const k of sample.kitchens) for (const l of ["Vegetables", "Fruit"]) assert.ok(!where(k, l)?.nearHob);
});
test("unclear items and duplicates become questions, not cabinets", () => {
  assert.ok(sample.questions.some((q) => q.includes("Maja")));
  assert.ok(sample.questions.some((q) => q.includes("two hobs")));
  assert.ok(!where(dry, "Maja"));
});

const small = plan({ kitchens: [{ name: "Kitchen", baseWidths: [800, 600, 450], tallWidths: [], items: [
  { type: "sink2" }, { type: "hob" }, { type: "pots" }, { type: "pans" }, { type: "cooker" },
  { type: "groceries_bulk", weightKg: 20, qty: 4 }, { type: "mugs" }, { type: "cutlery" }, { type: "waste" },
] }] }).kitchens[0];

test("a double sink is not squeezed into a cabinet that is too small", () => {
  assert.ok(small.unplaced.some((u) => u.label === TYPES.sink2.label));
});
test("a tight hob space gives a warning instead of failing silently", () => {
  assert.ok(small.warnings.some((w) => w.includes("800 mm")));
});
test("heavy items are never moved to upper cabinets", () => {
  const heavy = Object.values(TYPES).filter((t) => t.heavy).map((t) => t.label);
  assert.ok(!small.wall.some((w) => heavy.includes(w.label)));
});
test("everything entered is either placed or reported", () => {
  const shown = JSON.stringify(small);
  for (const t of ["sink2", "hob", "pots", "pans", "cooker", "groceries_bulk", "mugs", "cutlery", "waste"]) {
    assert.ok(shown.includes(TYPES[t].label), t);
  }
});
test("the AI's answer is cleaned: unknown types become 'unclear'", () => {
  const r = task.postCheck({}, { kitchens: [{ name: "Kitchen", items: [{ type: "spaceship", label: "Tiffin boxes", qty: 0, weight_kg: 0, note: "" }] }] });
  assert.deepEqual(r.kitchens[0].items[0], { type: "unclear", label: "Tiffin boxes" });
});

console.log(`\n${passed} checks passed`);
