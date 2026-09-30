---
name: organize-space
description: Turn photos of a messy room, corner, desk, closet, or shelf into a time-boxed organizing plan. It asks how long the user wants to spend, sorts every visible item into five piles, gives each kept item a home using furniture already in the room, and lists safety items first. Use when the user shares one or more images of a space and asks to organize, declutter, tidy, clean, or arrange it, asks "where should this go?" or "help me clean my room", or sends a photo of a cluttered space with no other request.
argument-hint: "[image paths] [optional: what the space is for, time available]"
---

Make an organizing plan from photos of a space. The user is a student learning to think like an IT professional, so give the reason for each decision in one short clause, and define any term the first time you use it. [example.md](example.md) shows a finished plan for an invented room.

Input: `$ARGUMENTS` (image paths, and optionally what the space is for or how much time the user has). Images attached to the chat count as input too.

The method is the same one IT uses for any messy system: **look before you touch, handle safety first, triage (sort by what needs to happen to each thing), give everything a known location, then prevent the mess from coming back.**

## 1. Look at every photo

View every image before writing anything. Several photos are usually different angles of one space, so merge them into one mental map and don't count the same item twice.

Build an inventory for yourself, grouped by location: floor, furniture tops, under furniture, walls and outlets. Note each item's state only when it matters (open, spilled, leaning, tangled).

- **Describe only what is visible.** For unclear items write "looks like a ..." and list them later under *What I couldn't tell*. Never guess what's inside closed bags, boxes, or drawers.
- **Count existing storage as a resource.** Baskets, drawers, shelves, hooks, and empty surfaces in the photos are free storage. Plan with them before suggesting anything to buy.
- **Work out what the space is for** (sleeping, studying, gaming, storage). The plan should make that use easier.
- **Keep privacy.** Don't describe people. Don't read out text on medication, mail, IDs, screens, or documents. Say "a medication box" or "a paper with a label".
- **Scan for hazards while you look.** Step 4 uses this list.

## 2. Ask how long they want to spend, then wait

Unless the user already gave a time, ask: **"How long do you want to spend cleaning?"** The answer decides how big the plan is, so write no plan until you have it.

- If you have the AskUserQuestion tool, use it with these options: **15 minutes** (quick rescue), **30 minutes**, **1 hour**, **2+ hours** (full reset). The user can also type their own number.
- Otherwise ask in chat, list the same four choices, and **end your turn**. Don't write the plan in the same message.
- In the same question you may ask **one** more thing, but only if the answer would change the plan (what the room is for, or whether the space is shared). Skip it if the photos make it obvious.
- Before asking, say in one line what you see ("A bedroom corner with clothes and school supplies on the floor"), so the user knows you read the photos.

Assume a default only when the user says "just go" or "you pick", or when you can't wait for an answer (running non-interactively). The default is **30 minutes**. Say that you assumed it.

## 3. Sort every item into five piles

Every visible item goes in exactly one pile. This is triage: five fast decisions instead of one overwhelming mess.

| Pile | What goes in it | Why this pile exists |
|---|---|---|
| **Trash / recycle** | Packaging, scraps, used paper, empties | It's the fastest visible progress |
| **Clothes** | Worn items to the hamper, clean items to put away | Clothes are usually the biggest floor pile |
| **Belongs elsewhere** | Things whose home is another room (dishes, towels, borrowed items) | Carry them out in one trip instead of many |
| **Keep here** | Things used in this space | These need a home in step 5 |
| **Ask first** | Anything possibly valuable, personal, sentimental, or someone else's | Never tell the user to throw these out |

When you can't tell which pile an item belongs in, put it in **Ask first**.

## 4. Flag safety items first

List only the hazards you actually saw, each with a short fix:

- **Medication and chemicals**: one closed spot, out of reach of children and pets, away from heat and direct sun.
- **Small or sharp things on the floor** (screws, pins, batteries, blades, glass): pick them up first. Use a dustpan or gloves for anything sharp.
- **Cords and outlets**: tangled cords, pinched cords, cords under rugs, or an overloaded power strip. Unplug before you move anything connected.
- **Electronics and documents on the floor**, where they can be stepped on or spilled on.
- **Spill risks**: open or tipped bottles and uncapped containers.

If there is nothing to flag, leave this section out. Don't invent hazards.

## 5. Give every "Keep here" item a home

A **home** is the one place an item always goes back to. It works like a file path: if everything has a known location, finding it and putting it back both take seconds.

Group items into **zones** by how they are used, not by what they look like. Example zones: *go zone* (things you leave with), *study*, *clothes*, *tech and cables*, *bedding*, *personal care*.

Rules:
1. **Off the floor comes first.** By the end, the floor holds only furniture and containers.
2. **Home goes near use.** Put things where they get picked up and put down.
3. **Reach matches frequency.** Daily items go at hand height. Rare items go high, low, or under things.
4. **One category per container.** A mixed "misc" bin turns back into a pile.
5. **Use what's there, then buy small.** Suggest at most 2-3 cheap additions (hamper, hook, tray, cable ties), all marked **optional**.

## 6. Build the time-boxed order of work

Estimate each step's time **from what you saw** (how many items, how spread out), not from a fixed table. Then fit the steps to the user's budget and leave about 10% spare.

Always use this order. Earlier steps give the most improvement per minute:

1. **Safety** (the list from step 4)
2. **Trash**: one bag, one sweep
3. **Clothes**: one sweep, sorted into hamper or put-away
4. **Belongs elsewhere**: one carry-out trip
5. **Floor to homes**: biggest items first
6. **Surfaces**: clear and reset table and desk tops
7. **Doorway check**: stand at the door and look for anything missed
8. **Deep work** (2+ hours only): sort inside bags, drawers, and baskets, and add labels

| Budget | Steps to include |
|---|---|
| 15 min | 1-3, then put the remaining floor items in one basket to sort later |
| 30 min | 1-5 |
| 1 hour | 1-7 |
| 2+ hours | 1-8 |

Give each step a time and a **running total** (for example "5 min, total 12") so the user can check their pace. End with a **Safe to stop after step N** line: the earliest step after which the floor is clear of hazards and nothing risky is left out.

## 7. Write the plan

Match the reply's size to the job. A 15-minute plan for one corner should fit on one screen. Use these sections in this order and leave out any that are empty:

1. **What I see**: 1-2 sentences, then the inventory as a compact list grouped by location.
2. **Do first (safety)**
3. **The five piles**: short lists of the actual items
4. **Zones and homes**: a table with columns *Zone | Home | What goes there | Why*
5. **Order of work**: the time-boxed list from step 6
6. **Keep it that way**: 1-2 habits tied to something the user already does ("backpack goes on its hook as you walk in", "a 5-minute reset before bed")
7. **What I couldn't tell**: unclear items and your assumptions
8. **Next steps**: 2-4 items, mixing small ones with optional stretch goals

Tone: encouraging, concrete, and never shaming. A cluttered room is a logistics problem, not a character flaw.

Before you send it, check that:
- every item in the inventory appears in exactly one pile
- every **Keep here** item has a zone
- the step times add up to no more than the budget
- nothing from **Ask first** is marked for trash

## 8. Follow up

Offer three things: to review an "after" photo, to adjust the plan for a different time budget, or to turn the steps into a checklist.

If the user sends an after photo, compare it with the plan. Name what improved, then give only the next one or two things to do. Don't rebuild the whole plan.

## Don'ts

- Don't write the plan before the user answers the time question (see step 2 for the only exceptions).
- Don't tell the user to throw out anything personal, sentimental, possibly valuable, or someone else's.
- Don't make buying a storage system the first step.
- Don't create files or commit anything unless the user asks. The plan is a chat reply.
