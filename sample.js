// The built-in example: the author's own dry and wet kitchen list, tidied.
// Cabinet widths are SAMPLE values for the demo, not measurements.

export const sampleNotes = `Cooker, Pan, cutlery, Pots, cutting boards, masala storage, lentil storage, maja storage, mugs, ceramic plates/cups storage, cups, coffe pots

Dry Kitchen: Cutlery, Pots/lids, pans/lids, cutting board, masla storage, daily use cooker, mugs/cermaic/guest plates, Daily useplates, mix items, oil pull out, ro water, 3 burner hob, 2 induction, salad bowl, noodle bowl, daily use groceery storage, oven, fridge, 1 bin sink

Wet kitchen: big groceery boxes - rice/dal/atta 5kg- max 20kg, small grocery storage - salt/lentils/sugar/other spices 2kg, vegetable storage, fruit storage, cutting board, cutlery, coffee maker, toast maker, water heater, 3 burner hob, 2 bin sink, dish washer, dry and wet waste garbage`;

export const sampleWidths = {
  dry: { baseWidths: [900, 900, 600, 600, 600, 450, 300, 150], tallWidths: [600] },
  wet: { baseWidths: [900, 900, 600, 450, 600, 300], tallWidths: [600] },
};

// What the AI should produce from the notes above. Used in demo mode and as the AI's target format.
export const sampleItems = {
  dry: [
    { type: "cutlery", label: "Cutlery" },
    { type: "pots", label: "Pots and lids" },
    { type: "pans", label: "Pans and lids" },
    { type: "cutting_boards", label: "Cutting boards" },
    { type: "spices", label: "Masala" },
    { type: "cooker", label: "Daily-use pressure cooker", note: "Is the cooker a pressure cooker, rice cooker or something else? Its size sets the drawer depth." },
    { type: "guestware", label: "Mugs, ceramics and guest plates" },
    { type: "plates", label: "Daily-use plates" },
    { type: "mixed", label: "Mixed items", note: "What goes in the mixed-items drawer? Its contents set the drawer size." },
    { type: "oil", label: "Oil bottles" },
    { type: "ro", label: "RO water purifier" },
    { type: "hob", label: "3-burner hob" },
    { type: "induction", label: "2 induction cooktops", qty: 2 },
    { type: "bowls", label: "Salad and noodle bowls" },
    { type: "groceries_daily", label: "Daily-use groceries" },
    { type: "oven", label: "Oven" },
    { type: "fridge", label: "Fridge" },
    { type: "sink1", label: "Single-bowl sink" },
    { type: "coffee_pots", label: "Coffee pots", note: "Coffee pots are in the first list but the coffee maker is in the wet kitchen. Which kitchen do they belong in?" },
    { type: "unclear", label: "Maja storage" },
  ],
  wet: [
    { type: "groceries_bulk", label: "Rice, dal and atta boxes", weightKg: 20, note: "How many boxes, and is 20 kg the maximum per box? The load check uses 20 kg each." },
    { type: "groceries_small", label: "Salt, lentils, sugar and spices", weightKg: 2, note: "Is 2 kg per container or the total?" },
    { type: "vegetables", label: "Vegetables" },
    { type: "fruit", label: "Fruit" },
    { type: "cutting_boards", label: "Cutting board" },
    { type: "cutlery", label: "Cutlery" },
    { type: "coffee_maker", label: "Coffee maker" },
    { type: "toaster", label: "Toaster" },
    { type: "kettle", label: "Water heater" },
    { type: "hob", label: "3-burner hob" },
    { type: "sink2", label: "Double-bowl sink" },
    { type: "dishwasher", label: "Dishwasher" },
    { type: "waste", label: "Dry and wet waste bins" },
  ],
};

export function sampleInput() {
  return {
    kitchens: [
      { name: "Dry kitchen", ...sampleWidths.dry, items: sampleItems.dry },
      { name: "Wet kitchen", ...sampleWidths.wet, items: sampleItems.wet },
    ],
  };
}
