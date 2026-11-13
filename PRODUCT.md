# Product

<!-- impeccable:product-schema 1 -->

Written from spec #1 and `docs/quality-bar.md` on 13 Nov 2026. No interview round ran: the init was done by a subagent without an answer channel, so every line below is taken from those two sources and nothing is invented beyond them.

## Platform

web

## Stack

Vite SPA, static files on Cloudflare. MapLibre GL JS with a custom night style over OpenFreeMap vector tiles, PMTiles on Cloudflare R2 as fallback. Supabase Free in Frankfurt for organizer data, magic link login, email through Resend. The public map reads a static snapshot on the CDN, never the database. Decided in spec #1.

## Users

- **Rodina**, primary: parents with children on a December evening, outdoors or about to leave home, phone dimmed, one hand free. Job: find out what lights up near them tonight and get there.
- **Organizátor**: one volunteer per calendar, usually from the municipality or a local association. Creates the calendar, enters 24 houses with consent, prints the QR poster and the stamp card.
- **Hostitel**: the household behind a lit window. Never logs in, wants no address or name shown.
- **Dítě**: collects a stamp from each host on the printed A5 card.

## Product Purpose

Adventní okénka on adventniokenka.cz: one national night map of living advent calendars in Czech villages and towns. Every evening from 1 to 24 December a different decorated window lights up and neighbours gather there. Today each village announces it alone on Facebook and leaflets; families do not know where to go tonight and people from the next village never hear of it. Success: a family opens the map, sees the nearest window that lights up tonight, and walks or drives there.

## Positioning

The only place that shows tonight's lit windows across the whole country, with exact points and one tap navigation, while keeping tomorrow's windows secret.

## Operating Context

- Launch 20 Nov 2026, organizers enter data until 30 Nov, lighting 1 to 24 Dec, all data deleted in January 2027.
- States per house: hidden, today visible from 8:00, Svítí from dusk, sunset in Prague, until midnight, Doutná after its day until 24 Dec. No per-calendar lighting times. Calendars before 1 Dec are Čeká, shown as small stars with the number of filled windows.
- Navigation opens Mapy.com, Google Maps or Apple Maps through plain links.
- Print: A4 QR poster and A5 stamp card, two per A4 sheet, 24 fields, generated in the browser as PDF, same look for every calendar, must print in black and white.
- Known real examples: Rádlo, Strážnice, Rouchovany.

## Capabilities and Constraints

- Terms from `GLOSSARY.md`: Kalendář, Okénko, Domeček, Hostitel, Organizátor, Svítí, Doutná, Čeká, Karta na razítka, Správce.
- A house has an exact point and a short label, never an address.
- Future houses are never shown and never leave the server.
- Visitor location never leaves the device.
- No analytics, no cookie banner, no external embeds.
- Out of scope: host sign up, QR stamp check in, photos, diplomas, other languages, native apps.

## Brand Commitments

- Name: Adventní okénka. The earlier name Rozsviťme vesnici was dropped.
- Mood set by the owner: a winter night seen from above. Darkness is the canvas, warm window light is the only bright thing. Crafted and calm, not a dashboard.
- Voice: a neighbour inviting people over, concrete and warm. "Dnes svítí U Novákových, svařák od šesti." No parentheses, no long dashes, no superlatives.
- Banned by the owner: emoji icons, stock icon sets as decoration, purple or blue AI gradients, glassmorphism by default, card grids, generic Tailwind look, unstyled map controls, placeholder illustrations, lorem ipsum.
- Required: custom drawn window and house light marks, a typeface with full Czech diacritics, motion only for the window lighting up, reduced motion respected.

## Evidence on Hand

No real calendar data, photos, logos or partner names yet. Mockups use illustrative houses in Rádlo, Strážnice and Rouchovany and must not be read as confirmed participants.

## Product Principles

1. Tonight first: the answer to where to go tonight is visible without a tap.
2. Darkness is the interface: only light carries information.
3. Surprise is a feature: never reveal tomorrow.
4. Hosts stay private: a label and a point, nothing more.
5. Paper matters as much as the screen: the stamp card is the object children keep.

## Accessibility & Inclusion

Readable outdoors at night on a dimmed phone. Touch targets at least 44 px. Designed at 390 px, checked at 360, 430 and desktop. `prefers-reduced-motion` respected. Print legible in black and white.
