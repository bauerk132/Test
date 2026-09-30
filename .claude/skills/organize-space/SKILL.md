---
name: organize-space
description: Look at photos of a room, corner, desk, closet, or other space and turn them into a practical, step-by-step organizing plan with zones, "where does each thing live" decisions, and a time-boxed cleanup order. Use when the user shares one or more images of a messy or cluttered space and asks to organize, declutter, tidy, clean up, or arrange it, or asks "where should this go?".
argument-hint: "[image paths, optional: what the space is for]"
---

Make an organizing plan from photos of a space. The user is a student learning to think like an IT/dev person, so explain the *why* behind each decision in one short sentence (a sort order, a "home" for each item, a habit) and define any term you use.

Input: `$ARGUMENTS` (image paths, and optionally what the space is for). If the images are attached to the chat rather than passed as paths, work from those.

## 1. Look before you plan

View every image before writing anything. Photos are often different angles of one space, so merge them into a single picture of the room.

Write a short inventory for yourself, grouped by where things are (floor, furniture tops, under furniture, hanging). For each item note what it is and, if it matters, its state (open, spilled, broken, dirty).

- **Only describe what is visible.** If an item is unclear, say "looks like a ..." or "not sure what this is". Never invent contents of closed bags or drawers.
- **Treat the existing furniture and containers as resources.** Baskets, drawers, shelves, and bins already in the photos are the cheapest storage. Plan around them before suggesting anything to buy.
- **Notice what the space is used for** (sleeping, studying, storage, hobby). The plan should serve that use.
- **Don't identify or comment on people**, and don't read out personal text (labels on medication, mail, IDs). Refer to them generically ("a medication box", "a paper with a label").

## 2. Ask how long they want to spend

**Always ask this first**, unless the user already said how much time they have: "How long do you want to spend cleaning?" The answer decides how much of the plan you write, so a 15-minute plan and a 2-hour plan look very different.

Offer quick choices (use the AskUserQuestion tool if you have it, otherwise ask in chat): about **15 minutes**, about **30 minutes**, about **1 hour**, or **2+ hours** (a full reset). The user can always type their own number.

If a missing fact would also change the plan a lot (what the room is for, whether the user shares the space, whether there's a closet or a trash bag nearby), you may add at most **one** more short question. Otherwise don't stop: state your assumptions in one line and proceed. The user can correct you.

If the user doesn't answer or you can't ask, assume **30 minutes** and say so.

## 3. Sort everything into five piles

Every visible item goes in exactly one pile. This is the core method, since it turns "a mess" into five small decisions.

| Pile | Meaning |
|---|---|
| **Trash / recycle** | Empty packaging, loose scraps, used paper |
| **Laundry** | Clothes and linens that need washing |
| **Belongs elsewhere** | Real items whose home is in a different room or container |
| **Keep here** | Belongs in this space, needs a home *within* it |
| **Ask first** | Might be valuable, personal, or someone else's. Never suggest discarding these |

## 4. Give each "Keep here" item a home

Group the remaining items into **zones** by how they are used, not by what they look like (for example a "school/go zone", a "clothes zone", a "tech and cables zone", a "bedding zone").

For each zone name:
- **Where it lives**, using furniture and containers already in the photos when possible.
- **What goes in it.**
- **Why there** (near where it's used, reachable, off the floor, protected).

Rules for homes:
- Off the floor beats everything else. Anything on the carpet is either laundry, trash, or needs a home.
- Frequently used items go at hand height. Rarely used items go low or high.
- One container per category. Mixed "misc" bins turn back into piles.
- If nothing suitable exists, suggest at most 2-3 cheap additions (a hamper, a hook, a small tray) and mark them **optional**.

## 5. Flag safety and care items first

Call these out in a short **Do first** list, before the general plan:

- **Medication and chemicals**: put them in one closed spot, out of reach of children and pets, away from heat and sunlight.
- **Sharp or small hazards** on the floor (loose screws, pins, blades, batteries, broken glass): pick up first, and never with bare feet or hands if sharp.
- **Cords and power**: tangled, pinched, or overloaded outlets and strips. Unplug before moving anything, and don't run cords under rugs.
- **Electronics and paper documents** on the floor, where they can be stepped on or spilled on.
- **Spill risk** (open bottles, uncapped lotion).

## 6. Write the plan

Keep the reply scannable. Use this order and drop sections that don't apply:

1. **What I see**: 2-3 sentences plus a compact inventory.
2. **Do first (safety)**: only if there is something to flag.
3. **Zones and homes**: a table with columns *Zone | Home | Contents | Why*.
4. **The five piles**: which visible items go in each, as short lists.
5. **Order of work**: a numbered list, each step with a rough time, ordered like this, and **cut down to the time the user chose in step 2**:
   1. Safety items (about 2 minutes)
   2. Trash and recycle (about 5 minutes)
   3. Laundry in one sweep (about 5 minutes)
   4. Floor items to their zone homes, biggest first (about 10-20 minutes)
   5. Clear furniture tops and reset (about 10 minutes)
   6. Quick final look from the doorway for anything missed (about 2 minutes)

   | Time chosen | Do |
   |---|---|
   | About 15 min | Steps 1-3 only, plus "stuff the rest of the floor items into one basket to sort later" |
   | About 30 min | Steps 1-4, biggest floor items only |
   | About 1 hour | Steps 1-6 |
   | 2+ hours | Steps 1-6, then deeper work: sort the contents of bags, drawers, and baskets, and add labels or optional storage |

   Put a running total next to each step so the user can check they're on pace. End the list with a "**If you run out of time**" line that says which step is safe to stop after (the floor is clear and nothing is left in a hazardous spot).
6. **Keep it that way**: one or two tiny habits (for example "backpack goes to its hook when you walk in", "a 5-minute reset before bed"). Habits should attach to something the user already does.
7. **What I couldn't tell**: things you weren't sure about in the photos, plus any assumptions.
8. **Suggested next steps**: 2-4 items, some small and some optional stretch goals (such as a follow-up photo after cleanup to compare).

Tone: encouraging, concrete, and never shaming. A cluttered room is a logistics problem, not a character flaw.

## 7. Offer a checkpoint

End by offering to look at an "after" photo, adjust the plan for a different budget or room use, or turn the steps into a checklist. If the user sends an after photo, compare it to the plan, say what improved, and name the next one or two things only.

## Don'ts

- Don't tell the user to discard personal, sentimental, or possibly valuable items. Put them in **Ask first**.
- Don't suggest buying a large storage system as step one. Use what's there.
- Don't produce a plan longer than the work it describes. A small corner gets a short plan.
- Don't create files or commit anything unless the user asks. The plan is a chat reply by default.
