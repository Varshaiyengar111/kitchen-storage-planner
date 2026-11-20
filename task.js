// What the AI does in Kitchen Storage Planner: turn a client's messy notes into a clean item list.
// The AI never decides where things go. The rules in planner.js do that, so the plan is explainable.

import { TYPES, TYPE_KEYS } from "./planner.js";
import { sampleNotes, sampleItems } from "./sample.js";

const typeList = TYPE_KEYS.map((k) => `- ${k}: ${TYPES[k].label}`).join("\n");

export default {
  name: "Kitchen Storage Planner",
  port: 3005,
  sampleInput: { notes: sampleNotes },

  validate(input) {
    if (typeof input.notes !== "string" || input.notes.trim().length < 10) {
      return "Please paste the list of things you want to store in the kitchen.";
    }
    if (input.notes.length > 8000) return "Please keep the notes under 8,000 characters.";
    return null;
  },

  system: `You help a kitchen designer in India read a client's requirement notes.
The client lists what they want to store or fit in a dry kitchen and a wet kitchen. The notes are rough: typos, slashes, repeated items, quantities in odd places.
Turn them into a clean item list for each kitchen.

Rules:
- Use only these item types. Pick the closest one; if nothing fits or you cannot tell what the item is, use "unclear" and keep the client's wording as the label:
${typeList}
- Use the client's words for the label, with spelling fixed. Combine pairs the client wrote together (e.g. "pots/lids" is one item).
- If the same item appears in a general list and in a kitchen list, keep only the kitchen entry. If a general item is not in either kitchen list, put it in the kitchen it most likely belongs to and say so in "note".
- qty: a count only if the client gave one, otherwise 0. weight_kg: weight per container if the client gave one (use the maximum of a range), otherwise 0.
- note: a short question for the client when something is ambiguous (a range, "per container or total?", an unknown word, an item in the wrong kitchen). Otherwise an empty string.
- Never invent items, sizes or brands the client did not mention.
- If the notes mention only one kitchen, return only that kitchen.`,

  userMessage(input) {
    return `Here are the client's kitchen notes:\n\n<notes>\n${input.notes}\n</notes>\n\nMake the item list.`;
  },

  schema: {
    type: "object",
    additionalProperties: false,
    required: ["kitchens"],
    properties: {
      kitchens: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "items"],
          properties: {
            name: { type: "string", enum: ["Dry kitchen", "Wet kitchen", "Kitchen"] },
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["type", "label", "qty", "weight_kg", "note"],
                properties: {
                  type: { type: "string", enum: TYPE_KEYS },
                  label: { type: "string" },
                  qty: { type: "integer" },
                  weight_kg: { type: "number" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },

  // The pre-made answer for the example notes, in the same format the AI returns.
  demoOutput: {
    kitchens: [
      { name: "Dry kitchen", items: sampleItems.dry },
      { name: "Wet kitchen", items: sampleItems.wet },
    ].map((k) => ({
      name: k.name,
      items: k.items.map((it) => ({ type: it.type, label: it.label, qty: it.qty || 0, weight_kg: it.weightKg || 0, note: it.note || "" })),
    })),
  },

  // Plain-code clean-up of the AI's answer: known types only, no empty numbers.
  postCheck(_input, result) {
    for (const k of result.kitchens) {
      k.items = k.items.map((it) => ({
        type: TYPES[it.type] ? it.type : "unclear",
        label: String(it.label || "").slice(0, 80),
        ...(it.qty > 0 ? { qty: Math.round(it.qty) } : {}),
        ...(it.weight_kg > 0 ? { weightKg: it.weight_kg } : {}),
        ...(it.note ? { note: it.note } : {}),
      }));
    }
    return result;
  },
};
