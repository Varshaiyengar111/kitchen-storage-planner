// The storage rules engine. Plain code, no AI: the same input always gives the same plan,
// and every suggestion comes with the rule that produced it.
// Runs in the browser (so the online demo works on any input) and in Node (for tests).
//
// Input:  { kitchens: [{ name, baseWidths: [mm], tallWidths: [mm], items: [{ type, label, qty, weightKg, note }] }] }
// Output: { kitchens: [{ name, cabinets, wall, counter, other, unplaced, warnings }], questions }

// Assumptions a fitter must confirm. Kept in one place so they are easy to change.
export const RULES = {
  narrowMaxMm: 300, // base cabinets this wide or narrower become a narrow pull-out
  drawerMinMm: 400, // narrowest cabinet that is worth fitting with drawers
  hobMm: 900, // comfortable cabinet under a 3-burner hob
  hobTightMm: 750, // may fit, depending on the hob's cut-out
  sink1Mm: 600, // single-bowl sink
  sink2Mm: 900, // double-bowl sink; also where a U-shaped sink pull-out starts
  dishwasherMm: 600, // standard; 450 mm slim models exist
  dishwasherSlimMm: 450,
  wasteMm: 450, // two bins side by side, for dry and wet waste
  ovenMm: 600,
  pantryPulloutKg: 70, // as stated by Blum for SPACE TOWER inner pull-outs; confirm for the actual product
};

// What each kind of item needs. `wants` is tried in order.
// Slots: narrow, top (shallow top drawer), mid / bottom (deep drawers), tall (pantry), wall (upper cabinet).
// Fixed: sink1, sink2, hob, dishwasher, waste, oven. Counter: needs worktop space and a socket.
export const TYPES = {
  cutlery: { label: "Cutlery", wants: ["top"], minMm: 450, near: "prep",
    generic: "Shallow top drawer with an adjustable cutlery insert", eg: "AMBIA-LINE or ORGA-LINE insert" },
  spices: { label: "Masala / spices", wants: ["narrow", "top"], near: "hob",
    generic: "Narrow pull-out or tiered spice insert in a top drawer", eg: "SPACE TWIN" },
  oil: { label: "Oil bottles", wants: ["narrow", "mid"], near: "hob",
    generic: "Narrow pull-out next to the hob, with a wipeable base", eg: "SPACE TWIN" },
  cutting_boards: { label: "Cutting boards", wants: ["narrow", "mid"], near: "prep",
    generic: "Narrow vertical pull-out or a divided slot in a deep drawer", eg: "SPACE TWIN" },
  pots: { label: "Pots and lids", wants: ["bottom", "mid"], minMm: 600, near: "hob", heavy: true,
    generic: "Deep full-extension drawer with a lid divider", eg: "LEGRABOX or TANDEMBOX deep drawer" },
  pans: { label: "Pans and lids", wants: ["bottom", "mid"], minMm: 600, near: "hob", heavy: true,
    generic: "Wide deep drawer with pan and lid dividers", eg: "LEGRABOX or TANDEMBOX deep drawer" },
  cooker: { label: "Pressure cooker", wants: ["bottom", "mid"], minMm: 450, near: "hob", heavy: true,
    generic: "Deep full-extension drawer sized for the cooker and its parts", eg: "LEGRABOX deep drawer" },
  plates: { label: "Daily-use plates", wants: ["mid", "bottom"], minMm: 600, near: "prep",
    generic: "Deep drawer with adjustable plate pegs (easier than lifting from a wall cabinet)", eg: "AMBIA-LINE plate holder" },
  bowls: { label: "Bowls", wants: ["mid", "bottom"], minMm: 450,
    generic: "Deep drawer with adjustable dividers; heavier bowls lower down", eg: "ORGA-LINE dividers" },
  mugs: { label: "Mugs and cups", wants: ["top", "wall"], near: "drinks",
    generic: "Shallow drawer with dividers near the tea and coffee area", eg: "AMBIA-LINE" },
  guestware: { label: "Ceramics and guest plates", wants: ["wall", "mid"],
    generic: "Upper cabinet with plate racks; used rarely, so it can sit higher", eg: "AVENTOS lift-up door" },
  coffee_pots: { label: "Coffee pots", wants: ["wall", "top"], near: "drinks",
    generic: "Shelf or small drawer next to the coffee maker", eg: "AVENTOS lift-up door" },
  groceries_daily: { label: "Daily-use groceries", wants: ["mid", "bottom", "tall"], minMm: 450, near: "prep",
    generic: "Deep drawer with labelled airtight containers", eg: "LEGRABOX deep drawer" },
  groceries_small: { label: "Small groceries (salt, lentils, sugar)", wants: ["tall", "mid"], minMm: 450,
    generic: "Pantry pull-out or deep drawer with labelled containers", eg: "SPACE TOWER" },
  groceries_bulk: { label: "Bulk groceries (rice, dal, atta)", wants: ["tall", "bottom"], minMm: 600, heavy: true, bulk: true,
    generic: "Tall pantry with full-extension inner pull-outs; heaviest boxes on the lowest pull-out", eg: "SPACE TOWER" },
  vegetables: { label: "Vegetables", wants: ["bottom", "mid"], minMm: 450, ventilated: true,
    generic: "Ventilated pull-out basket, away from the sink splash and hob heat", eg: "wire basket in a deep drawer frame" },
  fruit: { label: "Fruit", wants: ["mid", "bottom"], minMm: 450, ventilated: true,
    generic: "Ventilated pull-out basket, separate from vegetables", eg: "wire basket in a deep drawer frame" },
  mixed: { label: "Mixed items", wants: ["mid", "top"],
    generic: "One labelled utility drawer with adjustable dividers", eg: "ORGA-LINE dividers" },
  cleaning: { label: "Cleaning supplies", wants: ["undersink", "mid"],
    generic: "Under-sink pull-out that wraps around the plumbing", eg: "Blum sink-cabinet pull-out" },
  hob: { label: "3-burner hob", fixed: "hob" },
  sink1: { label: "Single-bowl sink", fixed: "sink1" },
  sink2: { label: "Double-bowl sink", fixed: "sink2" },
  dishwasher: { label: "Dishwasher", fixed: "dishwasher" },
  waste: { label: "Dry and wet waste bins", fixed: "waste" },
  oven: { label: "Built-in oven", fixed: "oven" },
  fridge: { label: "Fridge", space: "Own floor space next to the cabinets, with a landing counter beside it",
    question: "Which fridge model? Its width, door swing and ventilation gap decide the space needed." },
  ro: { label: "RO water purifier", space: "Under the sink or on the wall beside it, with filter access",
    question: "Is the RO purifier wall-mounted or under the sink? Under-sink units take space from the cleaning pull-out." },
  induction: { label: "Induction cooktop", counter: true,
    question: "Are the induction cooktops built in or portable? Each needs its own socket on a suitable circuit." },
  coffee_maker: { label: "Coffee maker", counter: true, near: "drinks" },
  toaster: { label: "Toaster", counter: true, near: "drinks" },
  kettle: { label: "Water heater / kettle", counter: true, near: "drinks" },
  unclear: { label: "Unclear item" },
};

export const TYPE_KEYS = Object.keys(TYPES);

const mm = (n) => `${n} mm`;

function planKitchen(k, questions) {
  const warnings = [];
  const unplaced = [];
  const wall = [];
  const counter = [];
  const other = [];
  const items = k.items.map((it, i) => ({ ...it, id: i, spec: TYPES[it.type] || TYPES.unclear }));
  const label = (it) => it.label || it.spec.label;

  // 1. Cabinets as entered, widest last so "smallest that fits" is a simple find.
  let free = (k.baseWidths || []).filter((w) => w > 0).map((w, i) => ({ w, n: i + 1, tall: false }));
  let freeTall = (k.tallWidths || []).filter((w) => w > 0).map((w, i) => ({ w, n: i + 1, tall: true }));
  const cabinets = [];
  const take = (list, minW) => {
    const fit = list.filter((c) => c.w >= minW).sort((a, b) => a.w - b.w)[0];
    if (fit) list.splice(list.indexOf(fit), 1);
    return fit;
  };
  const add = (c, kind, title, extra = {}) => {
    const cab = { width: c.w, tall: c.tall, kind, title, slots: [], ...extra };
    cabinets.push(cab);
    return cab;
  };

  // 2. Fixed appliances and sinks first: they have the strictest size needs.
  const fixed = items.filter((it) => it.spec.fixed);
  const order = ["sink2", "sink1", "hob", "dishwasher", "oven", "waste"];
  fixed.sort((a, b) => order.indexOf(a.spec.fixed) - order.indexOf(b.spec.fixed));
  let sinkCab = null;
  let hobCab = null;
  for (const it of fixed) {
    const f = it.spec.fixed;
    if (f === "sink1" || f === "sink2") {
      const need = f === "sink2" ? RULES.sink2Mm : RULES.sink1Mm;
      const c = take(free, need);
      if (!c) { unplaced.push({ label: label(it), why: `needs a base cabinet of at least ${mm(need)}` }); continue; }
      sinkCab = add(c, "sink", label(it), {
        why: `Sink cabinets need at least ${mm(need)} for this bowl.`,
        slots: [{ pos: "under", item: null, fit: c.w >= RULES.sink2Mm
          ? "U-shaped pull-out around the plumbing (e.g. Blum sink-cabinet pull-out)"
          : "Door with a small cleaning caddy (U-shaped pull-outs need 900 mm or more)" }],
      });
    } else if (f === "hob") {
      let c = take(free, RULES.hobMm);
      if (!c) {
        c = take(free, RULES.hobTightMm);
        if (c) warnings.push(`The hob sits on a ${mm(c.w)} cabinet. Many 3-burner hobs need about 750 to 900 mm; check the hob's cut-out size.`);
      }
      if (!c) { unplaced.push({ label: label(it), why: `needs a base cabinet of at least ${mm(RULES.hobTightMm)}` }); continue; }
      hobCab = add(c, "drawers", `${label(it)} above`, { nearHob: true,
        why: "Drawers under the hob keep pots, pans and the cooker one step from where they are used." });
    } else if (f === "dishwasher") {
      let c = take(free, RULES.dishwasherMm);
      let slim = false;
      if (!c) { c = take(free, RULES.dishwasherSlimMm); slim = Boolean(c); }
      if (!c) { unplaced.push({ label: label(it), why: `needs a ${mm(RULES.dishwasherMm)} space (or 450 mm for a slim model)` }); continue; }
      add(c, "appliance", label(it), { why: slim ? "Only a 450 mm space is free, so this needs a slim dishwasher." : "Standard 600 mm dishwasher space." });
      if (!items.some((x) => x.spec.fixed === "sink1" || x.spec.fixed === "sink2")) {
        warnings.push("The dishwasher has no sink in this kitchen. It should sit next to a sink for plumbing and drainage.");
      } else if (!sinkCab) {
        warnings.push("The sink has no cabinet yet. Once it does, the dishwasher must go right next to it.");
      } else {
        warnings.push("Place the dishwasher right next to the sink cabinet (plumbing, drainage and loading).");
      }
    } else if (f === "oven") {
      const c = take(freeTall, RULES.ovenMm) || take(free, RULES.ovenMm);
      if (!c) { unplaced.push({ label: label(it), why: `needs a ${mm(RULES.ovenMm)} tall unit or base cabinet` }); continue; }
      add(c, "appliance", label(it), { why: c.tall ? "Oven at eye level in a tall unit: no bending to lift hot trays." : "Oven under the counter, in a 600 mm base cabinet." });
      questions.push(`${k.name}: which oven model? Check its ventilation gap and the cut-out size.`);
    } else if (f === "waste") {
      const c = take(free, RULES.wasteMm);
      if (c) {
        add(c, "waste", label(it), { why: "Two removable bins side by side, so dry and wet waste stay apart.",
          slots: [{ pos: "pull-out", item: null, fit: "Pull-out frame with separate dry and wet bins" }] });
      } else if (sinkCab && sinkCab.width >= RULES.sink2Mm) {
        sinkCab.slots.push({ pos: "under", item: label(it), fit: "Bins share the under-sink pull-out" });
        warnings.push("No free cabinet for the waste bins, so they share the sink cabinet. A separate 450 mm cabinet would be easier.");
      } else {
        unplaced.push({ label: label(it), why: `needs a base cabinet of at least ${mm(RULES.wasteMm)}` });
      }
    }
  }

  // 3. Turn the remaining cabinets into narrow pull-outs, drawer stacks and pantries.
  const narrow = free.filter((c) => c.w <= RULES.narrowMaxMm).map((c) => add(c, "narrow", "Narrow pull-out",
    { why: `Cabinets ${mm(RULES.narrowMaxMm)} wide or less work best as one tall pull-out.`, slots: [{ pos: "pull-out", item: null }] }));
  free.filter((c) => c.w > RULES.narrowMaxMm && c.w < RULES.drawerMinMm).forEach((c) => {
    add(c, "shelf", "Shelves behind a door", { why: `Too narrow for useful drawers (under ${mm(RULES.drawerMinMm)}).`, slots: [{ pos: "shelves", item: null }] });
  });
  const stacks = free.filter((c) => c.w >= RULES.drawerMinMm).map((c) => add(c, "drawers", "Drawer stack",
    { why: "Three drawers: one shallow at the top, two deep below. You see everything without bending into the back of a cabinet." }));
  for (const cab of [hobCab, ...stacks].filter(Boolean)) {
    cab.slots = [{ pos: "top", item: null }, { pos: "mid", item: null }, { pos: "bottom", item: null }];
  }
  const pantries = freeTall.map((c) => add(c, "pantry", "Tall pantry",
    { why: "Full-extension inner pull-outs: reach every box from the front and side.", slots: [{ pos: "pull-outs", item: null, items: [] }] }));

  const drawerCabs = [hobCab, ...stacks].filter(Boolean);
  // `zone`: "hob" = only the drawers under the hob, "away" = only the others, "any" = all.
  const place = (it, pos, zone = "any") => {
    const s = it.spec;
    if (pos === "narrow") {
      const cab = narrow.find((c) => !c.slots[0].item);
      if (!cab) return false;
      Object.assign(cab.slots[0], { item: label(it), fit: s.generic, eg: s.eg });
      return true;
    }
    if (pos === "top" || pos === "mid" || pos === "bottom") {
      const cab = drawerCabs
        .filter((c) => (zone === "any" || (zone === "hob") === Boolean(c.nearHob)))
        .filter((c) => c.width >= (s.minMm || 0) && !c.slots.find((x) => x.pos === pos).item)
        .sort((a, b) => a.width - b.width)[0];
      if (!cab) return false;
      Object.assign(cab.slots.find((x) => x.pos === pos), { item: label(it), fit: s.generic, eg: s.eg });
      if (s.ventilated && cab.nearHob) warnings.push(`${label(it)} ended up under the hob. Move them away from the heat if you can.`);
      if (s.bulk) {
        const total = (it.qty || 1) * (it.weightKg || 0);
        warnings.push(`${label(it)} are in a drawer because there is no tall pantry. ${total ? `That is about ${total} kg, so the drawer` : "The drawer"} needs heavy-duty runners rated for the full load.`);
      }
      return true;
    }
    if (pos === "tall") {
      const cab = pantries.find((c) => c.width >= (s.minMm || 0)) || pantries[0];
      if (!cab) return false;
      cab.slots[0].items.push(label(it));
      cab.slots[0].item = cab.slots[0].items.join(", ");
      cab.slots[0].fit = TYPES.groceries_bulk.generic;
      cab.slots[0].eg = "SPACE TOWER";
      if (s.bulk) checkLoad(it, cab);
      return true;
    }
    if (pos === "wall") {
      wall.push({ label: label(it), fit: s.generic, eg: s.eg });
      return true;
    }
    if (pos === "undersink") {
      if (!sinkCab) return false;
      sinkCab.slots[0].item = label(it);
      return true;
    }
    return false;
  };

  const checkLoad = (it, cab) => {
    if (!it.weightKg) {
      questions.push(`${k.name}: how heavy is each ${label(it).toLowerCase()} box, and how many are there? The pantry pull-outs must be rated for the full weight.`);
      return;
    }
    const qty = it.qty || 1;
    const total = qty * it.weightKg;
    const pullouts = Math.ceil(total / RULES.pantryPulloutKg);
    cab.load = `${qty} × ${it.weightKg} kg = ${total} kg when full. At ${RULES.pantryPulloutKg} kg per pull-out, spread it over at least ${pullouts} pull-out${pullouts > 1 ? "s" : ""}, heaviest at the bottom.`;
    if (!it.qty && !it.note) questions.push(`${k.name}, ${label(it)}: how many containers? The load check assumed 1.`);
  };

  // 4. Place storage items. Heavy and hob-side items choose first, so they get the low drawers near the hob.
  const rank = (it) => (it.spec.heavy ? 0 : 2) + (it.spec.near === "hob" ? 0 : 1);
  const storage = items.filter((it) => it.spec.wants).sort((a, b) => rank(a) - rank(b) || a.id - b.id);
  for (const it of storage) {
    const tried = it.spec.wants;
    // Items used at the hob try the hob drawers first. Everything else tries the other drawers first,
    // so the space beside the hob stays free for cooking things.
    const zones = it.spec.near === "hob" ? ["hob", "any"] : ["away", "any"];
    if (zones.some((z) => tried.some((pos) => place(it, pos, z)))) continue;
    const why = `no free ${tried.map(slotName).join(" or ")}${it.spec.minMm ? ` at least ${mm(it.spec.minMm)} wide` : ""}`;
    if (!it.spec.heavy && !tried.includes("wall")) {
      // Light items can go in an upper cabinet as a last resort; heavy ones should not be lifted overhead.
      wall.push({ label: label(it), fit: it.spec.generic, eg: it.spec.eg, fallback: true });
      warnings.push(`${label(it)}: ${why}, so it moved to an upper cabinet. A drawer would be easier to reach.`);
    } else {
      unplaced.push({ label: label(it), why });
    }
  }

  // 5. Counter appliances and items with their own space.
  for (const it of items) {
    const s = it.spec;
    if (s.counter) {
      counter.push({ label: label(it), note: s.near === "drinks" ? "Group with mugs and coffee pots as a drinks corner" : "Needs its own socket" });
    } else if (s.space) {
      other.push({ label: label(it), note: s.space });
      if (s.question) questions.push(`${k.name}: ${s.question}`);
    }
    if (s.counter && s.question) questions.push(`${k.name}: ${s.question}`);
    if (it.type === "unclear" || !TYPES[it.type]) {
      questions.push(`${k.name}: what is "${label(it)}"? No cabinet is planned for it until it is identified.`);
    }
    if (it.note) questions.push(`${k.name}, ${label(it)}: ${it.note}`);
  }
  const sockets = items.filter((it) => it.spec.counter).reduce((n, it) => n + (it.qty || 1), 0);
  if (sockets) warnings.push(`Plan at least ${sockets} worktop socket${sockets > 1 ? "s" : ""} for the counter appliances, away from the sink.`);
  if (sinkCab && items.some((it) => it.type === "ro")) {
    warnings.push("If the RO purifier goes under the sink, leave room for its tank beside the pull-out.");
  }

  for (const cab of [...narrow, ...stacks, ...pantries]) {
    cab.empty = cab.slots.every((s) => !s.item);
  }
  const spare = cabinets.filter((c) => c.kind === "drawers").flatMap((c) => c.slots).filter((s) => !s.item).length
    + narrow.filter((c) => !c.slots[0].item).length;

  return { name: k.name, cabinets, wall, counter, other, unplaced, warnings, spare };
}

function slotName(pos) {
  return { narrow: "narrow pull-out", top: "top drawer", mid: "deep drawer", bottom: "bottom drawer", tall: "tall pantry", wall: "upper cabinet", undersink: "sink cabinet" }[pos] || pos;
}

export function plan(input) {
  const questions = [];
  const kitchens = input.kitchens.map((k) => planKitchen(k, questions));

  // Checks across both kitchens.
  const has = (k, t) => input.kitchens[k].items.some((it) => it.type === t);
  if (input.kitchens.length === 2) {
    const [a, b] = input.kitchens.map((k) => k.name);
    if (has(0, "hob") && has(1, "hob")) questions.unshift(`A 3-burner hob is listed in both the ${a.toLowerCase()} and the ${b.toLowerCase()}. Are there really two hobs?`);
    if (["sink1", "sink2"].some((t) => has(0, t)) && ["sink1", "sink2"].some((t) => has(1, t))) {
      questions.unshift(`There is a sink in both kitchens. Confirm both are needed, and that "bin" in the notes means sink bowl.`);
    }
    for (const t of ["cutlery", "cutting_boards"]) {
      if (has(0, t) && has(1, t)) questions.push(`Both kitchens list ${TYPES[t].label.toLowerCase()}. Is that two separate sets?`);
    }
  }
  return { kitchens, questions: [...new Set(questions)], rules: RULES };
}
