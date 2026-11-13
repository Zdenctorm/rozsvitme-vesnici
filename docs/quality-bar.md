# Quality bar

Set by the owner on 13 Nov 2026: "Musíme to udělat fakt jako topovku, aby to nevypadalo levně." Earlier projects were rejected for looking cheap: code-drawn mascots, flat generic vector style. Treat this file as a release gate, not a wish list.

## Design

- **Skill:** `.claude/skills/impeccable`, pbakaus/impeccable@c4cd192, Apache 2.0. Run `impeccable init` once to create `PRODUCT.md` and `DESIGN.md`, then follow `reference/craft-floor.md` before every UI edit.
- **Direction first.** Before feature work, render 3 distinct visual directions of the main map screen and of the printable stamp card as screenshots. The owner picks one. It is recorded in `DESIGN.md` and nothing ships outside it.
- **Mood:** a winter night seen from above. Darkness is the canvas, warm window light is the only bright thing. The map must feel crafted and calm, not like a dashboard.
- **Banned:** emoji as icons, stock icon sets used as decoration, purple or blue AI gradients, glassmorphism by default, card grids, generic Tailwind look, default Leaflet or MapLibre controls left unstyled, placeholder illustrations, lorem ipsum.
- **Required:**
  - custom drawn window and house light marks
  - a typeface with full Czech diacritics, tested on ř, ů, ě, Ž
  - motion only where it means something, the window lighting up
  - `prefers-reduced-motion` respected
- **Devices:** designed at 390 px first, checked at 360, 430 and desktop. Touch targets at least 44 px. Readable outdoors at night on a dimmed phone.
- **Print:** the A5 stamp card, the A4 QR poster and the diploma pass the same bar. They print well in black and white too.

## Czech copy

- **Skill:** `.claude/skills/anti-ai-slop-cz`. Every user-facing Czech string, email, poster and legal text passes it.
- No parentheses, no long dashes, no marketing superlatives, no "Objevte", "Ponořte se", "jedinečný".
- Write like a neighbour inviting people over, concrete and warm. Example: "Dnes svítí U Novákových, svařák od šesti." not "Zažijte jedinečnou adventní atmosféru."
- All strings live in one file so they can be reviewed together.

## Review gate

A UI ticket is done only when:

1. `impeccable critique` and `impeccable audit` have run on screenshots of the change, and their findings are fixed or explained.
2. Every new Czech string has passed `anti-ai-slop-cz`.
3. Screenshots at 390 px are attached to the PR.
