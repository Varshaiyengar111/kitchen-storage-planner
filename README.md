# Kitchen Storage Planner

**Turn a client's "what I need to store" list into a cabinet-by-cabinet storage plan, plus the questions to ask before anything is made.**

### ▶ [Try the online demo](https://varshaiyengar111.github.io/kitchen-storage-planner/)
No install needed. Click **Make item list**, then change the items or cabinet widths and watch the plan update.

A small product prototype for home interiors. A client writes what they need in their dry kitchen and wet kitchen. The AI tidies those rough notes into a clean item list. Plain rules then suggest where each item should go (which drawer, pull-out, pantry or upper cabinet) and check it against the cabinet widths available. The rules also list everything that still needs the client's answer.

> Portfolio demo. The example list is my own dry and wet kitchen requirements. The cabinet widths in the example are sample values, not measurements.

---

## The problem

In Indian homes with a separate dry and wet kitchen, the storage brief usually starts as a rough list, like "pots/lids, masala, rice/dal/atta 5kg max 20kg, 2 bin sink". The designer turns it into cabinets by experience, often over several site visits. Things go wrong in predictable ways:
- 20 kg grocery boxes on runners that are not rated for them
- pots stored far from the hob
- a double sink in a cabinet that is too narrow
- a question like "what is that item?" only coming up after the carcass is built

## Who it's for

| User | What they need |
|---|---|
| **Kitchen designer / modular kitchen sales** (primary) | A first storage layout and a list of questions, minutes after the first meeting |
| **Home owner** | To see where their things will go, and why, before paying for cabinets |
| **Carpenter / installer** | Clear specifications: drawer type, width and load per cabinet |

## Scope (v0.1)

**In scope**
- Paste rough notes. The AI turns them into an item list per kitchen, with a type, a name, a count, the weight per container, and a question wherever something is unclear. This step is optional: the list can also be typed in directly.
- Enter base cabinet widths and tall unit widths (mm) for each kitchen.
- **The rules engine** (`planner.js`, plain code):
  - places sinks, the hob, the dishwasher, the oven and the waste bins first
  - turns narrow cabinets into pull-outs, wider ones into 3-drawer stacks, and tall units into pantries
  - places items so that heavy and hob-side items go low and next to the hob
- **Fit and safety checks**: cabinet too narrow for the sink or hob, loaded weight per pantry pull-out, a dishwasher without a sink next to it, heavy items never moved overhead.
- **Questions to confirm**: unknown items, duplicates across kitchens, ranges such as 5 to 20 kg, appliance models, socket count.
- A drawn front view (to scale), the reason behind every suggestion, and the option to copy the questions or print the plan.
- Suggestions are generic fitting types, with Blum products named as examples.

**Out of scope (for now)**
- Measuring the room, wall layout or corner units (the order along the wall is left to the designer)
- Wall cabinet sizing
- Prices, quotes or ordering
- Any real client data on the server (nothing is saved)

## Product decisions

- **The AI reads, the rules decide.** Language models are good at turning "masla storage, 2kg" into a clean item, and unreliable at weight limits and millimetres. So the AI only produces the list, and the plan comes from rules anyone can read and test. The same input always gives the same plan.
- **Every suggestion carries its reason.** For example: "Drawers under the hob keep pots, pans and the cooker one step from where they are used." The designer can disagree with a rule instead of with a black box.
- **Unclear means a question, not a guess.** "Maja storage" gets no cabinet until someone knows what it is. 20 kg boxes with no count trigger a load question. A hob listed in both kitchens asks "are there really two?".
- **Heavy stays low.** Rice and atta boxes, pots and the cooker are never moved to upper cabinets, even when space runs out. They show up as "no space" instead.
- **Brand-neutral first.** The plan names the fitting type (for example "tall pantry with inner pull-outs"). Blum products appear only as examples, so the tool is useful whichever hardware the client buys.
- **Assumptions live in one place.** Minimum widths and load ratings are in `RULES` at the top of `planner.js`, marked as values to confirm with the supplier.

## Success metrics

| Metric | Target for a pilot | How to measure |
|---|---|---|
| Time to first storage plan | < 15 minutes from the client's notes, vs a day or more | Designer timing on 10 projects |
| Plan accepted | ≥ 70% of cabinet suggestions kept in the final design | Compare the plan with the final drawing |
| Questions caught early | ≥ 80% of clarifications raised before the design is signed off | Count late questions in the project log |
| Notes read correctly | ≥ 95% of items in the client's notes appear in the list with the right type | Review against the original notes |
| Rework | Fewer cabinet changes after production starts | Change orders per project |

**Guardrail metric:** zero plans that put a load above the stated rating on a pull-out, or a heavy item in an upper cabinet. This is covered by the automatic tests and the load check.

## Try the demo

You need [Node.js](https://nodejs.org) 20.12 or newer.

```bash
npm install
npm start
```

Open http://localhost:3005, click **Use example kitchen**, then **Make item list**. Change a width or remove a cabinet and watch items move or get flagged.

- **Demo mode (free):** with no key, "Make item list" shows the pre-made list for the example notes. The storage plan always runs for real.
- **Live AI mode:** copy `.env.example` to `.env`, paste an [Anthropic API key](https://console.anthropic.com) after `ANTHROPIC_API_KEY=`, and restart. Then any notes can be turned into a list. The key stays on the server and is never sent to the browser. `.env` is in `.gitignore`, so it is never uploaded.

**Tests:** `npm test` runs 11 checks on the rules. For example, pots go under the hob, a double sink is never squeezed into a narrow cabinet, and heavy items never go overhead.

**Online demo:** `npm run build:pages` copies the page and the rules into `docs/` for GitHub Pages. The rules run in the visitor's browser. Only the notes-to-list step uses the pre-made example.

## How it works

```
Client notes ──POST /api/run──▶ server.js ──▶ Claude (structured JSON item list)
                                      │
        item list + widths ◀──────────┘   (unknown types cleaned up in code)
               │
               ▼
         planner.js rules (in the browser) ──▶ cabinet plan, warnings, questions
```

- `planner.js`: the storage rules, the item types and the assumptions (`RULES`)
- `task.js`: the instructions for the AI and the item-list format
- `sample.js`: the example notes, the example list and the sample widths
- `test.js`: automatic checks on the rules
- `server.js`: a tiny Node server with no framework; keeps the key server-side
- `public/index.html`: the whole interface in one file

## What I'd do next

1. **Wall order and the work triangle**: let the designer drag cabinets into order, and check fridge–sink–hob distances and landing space beside the hob.
2. **Real container sizes**: enter the actual dabbas and boxes to size drawer heights and pantry pull-out counts, not just widths.
3. **Hindi and regional-language notes**, since many clients describe their kitchen in their own language.
4. **Designer feedback loop**: record which suggestions designers change, and use that to tune the rules.
5. **Hardware catalogue as data**: swap the example fittings for any brand's catalogue, with real load ratings and sizes.
