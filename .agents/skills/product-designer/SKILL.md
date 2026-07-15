---
name: product-designer
description: >-
  Product design thinking for builders with strong technical skills but weak
  product/UX/business intuition: framing the problem, scoping an MVP, mapping
  user flows, applying UX heuristics, and pitching the result. Use when
  starting a new product/feature/hackathon build, when the user has working
  code but an unclear "why", or when asked to scope, position, or pitch a
  product.
---

# Product Designer

Bridges the gap between "I can build it" and "people want it and get it in 10 seconds." Use this before writing code and again before demoing.

## 1. Frame the problem (5 min, do this first)

Answer these out loud or in a note, in order:

1. **Who** exactly is this for? (one specific person/persona, not "everyone")
2. **What pain** do they have right now, today, without your product?
3. **Why now** — why hasn't this been solved, or why does this moment (event, tech, trend) make it solvable?
4. **What's the one thing** your product does that removes the pain? (one sentence, no "and also")

If you can't fill in #1 and #2 concretely, you're not ready to build — go talk to one real person or pick a sharper niche.

## 2. Scope the MVP

For a build week / hackathon, ruthlessly cut to the **one flow** that proves the value prop.

- List every feature you're tempted to build.
- Mark each: **Core** (demo breaks without it), **Nice** (adds polish), **Cut** (someone else's problem).
- Build Core only. Fake/hardcode data for anything outside the core flow (a "Wizard of Oz" demo is fine for a hackathon).

Rule of thumb: if your pitch sentence has an "and", you have two products — pick one.

## 3. Map the user flow

Before any UI, write the flow as a numbered list of screens/states:

```
1. Landing → sees value prop + single CTA
2. [Action] → input/trigger
3. [System response] → loading/processing state
4. [Result] → the "aha" moment, shown as fast as possible
5. [Next step] → save/share/repeat
```

The "aha" moment (step 4) should happen in under 3 clicks from landing. If it takes longer, cut steps.

## 4. Apply UX heuristics (quick pass, not a full audit)

Check the flow against these, in priority order:

1. **Visibility of system status** — does the user always know what's happening (loading, saved, error)?
2. **Match real-world language** — no jargon the target user wouldn't use themselves.
3. **User control** — obvious way to undo/go back/cancel.
4. **Recognition over recall** — show options, don't make them remember commands or IDs.
5. **Error prevention + clear error messages** — say what went wrong and what to do next, in plain language.

For deeper visual/interaction polish, hand off to `impeccable`, `frontend-design`, or `ux-audit` skills — this skill is about *what* to build and *why*, those are about *how it looks*.

## 5. Position it (one paragraph, for the pitch)

Fill this template — it forces a business framing, not just a feature list:

> For **[who]**, who struggle with **[pain]**, **[product name]** is a **[category]** that **[key benefit]**. Unlike **[main alternative]**, it **[key differentiator]**.

Keep the differentiator concrete and comparable (faster, cheaper, works without X, no signup) — not "better" or "smarter."

## 6. Pitch structure for a demo (2-3 min)

1. **Hook** (15s): one sentence on the pain, ideally a relatable scenario.
2. **Demo** (90s): show the core flow live, narrate what the user is thinking at each step, not what the code is doing.
3. **Why it matters** (20s): who this helps and the "unlock" (why now/why this tech).
4. **Close** (10s): what you'd build next if you had another week.

Never open a pitch with the tech stack. Open with the person and the pain; mention the stack only if asked.

## Common traps for technical builders

- Building the hardest technical part first instead of the part that proves the value.
- Describing the product by its features ("it has auth, a dashboard, and export") instead of its benefit ("it saves you 2 hours a week").
- Skipping the "who" and defaulting to "everyone" — kills focus and the pitch.
- Polishing UI before the flow is validated with one real user reaction.
