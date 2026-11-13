---
name: Adventní okénka
description: A national map of living advent calendars, a pale winter map by day that turns to night at sunset in Prague, where only tonight's windows glow.
colors:
  night-page: "#070b14"
  night-space: "#02040a"
  night-ground: "#070b14"
  night-ground-city: "#0a0f1b"
  night-globe-land: "#0e1629"
  night-globe-water: "#080f1f"
  night-water: "#050a17"
  night-road-minor: "#141b2a"
  night-road-major: "#1b2437"
  night-building-low: "#1a2236"
  night-building-high: "#303e60"
  night-border: "#3b4868"
  night-region: "#26314b"
  night-coast: "#1a2949"
  night-veil: "#020308"
  night-ink: "#f2f4f8"
  night-ink-2: "#aab3c5"
  night-ink-3: "#7c869b"
  night-glass: "rgba(16, 21, 33, 0.74)"
  night-glass-solid: "rgba(28, 33, 46, 0.94)"
  night-line: "rgba(255, 255, 255, 0.08)"
  day-page: "#e8ecf1"
  day-space: "#cfd8e3"
  day-ground: "#e8ecf1"
  day-ground-city: "#e1e6ec"
  day-water: "#c3d0df"
  day-road: "#ffffff"
  day-building-low: "#d5dbe3"
  day-building-high: "#b7c0ce"
  day-cz-fill: "#f3f5f8"
  day-border: "#8f9bae"
  day-veil: "#d3dae3"
  day-ink: "#161c28"
  day-ink-2: "#485164"
  day-ink-3: "#5f6879"
  day-glass: "rgba(248, 250, 252, 0.84)"
  day-line: "rgba(22, 32, 52, 0.1)"
  candle: "#ffb24d"
  candle-high: "#ffd28a"
  candle-core: "#fff0d2"
  candle-pool: "#ff8a2a"
  candle-ink: "#1c1206"
  disc-ring: "#e0892e"
  disc-face: "#fffaf2"
  disc-number: "#8a4a0e"
  disc-number-lit: "#3a1d03"
  disc-lit: "#ffbd5c"
  warm-text-day: "#9a520c"
  you-blue: "#3d8bff"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Instrument Sans, ui-sans-serif, sans-serif"
    fontSize: "31px"
    fontWeight: 650
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, Instrument Sans, ui-sans-serif, sans-serif"
    fontSize: "25px"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.018em"
  title:
    fontFamily: "Bricolage Grotesque, Instrument Sans, ui-sans-serif, sans-serif"
    fontSize: "22px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  day-number:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 550
    lineHeight: 1.25
    fontVariation: "'wdth' 96"
  body-sm:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  chip: "12px"
  control: "16px"
  dialog: "18px"
  sheet: "28px"
  round: "50%"
spacing:
  hairline: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  gutter: "16px"
components:
  sheet-night:
    backgroundColor: "{colors.night-glass}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.sheet}"
    padding: "8px 20px 14px"
  sheet-day:
    backgroundColor: "{colors.day-glass}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.sheet}"
    padding: "8px 20px 14px"
  button-navigate:
    backgroundColor: "{colors.candle}"
    textColor: "{colors.candle-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "56px"
  search-field:
    backgroundColor: "{colors.night-glass}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 16px"
  locate-button:
    backgroundColor: "{colors.night-glass}"
    textColor: "{colors.you-blue}"
    rounded: "{rounded.round}"
    size: "48px"
  house-light-day:
    backgroundColor: "{colors.disc-face}"
    textColor: "{colors.disc-number}"
    typography: "{typography.day-number}"
    rounded: "{rounded.round}"
    size: "34px"
  house-light-lit:
    backgroundColor: "{colors.disc-lit}"
    textColor: "{colors.disc-number-lit}"
    typography: "{typography.day-number}"
    rounded: "{rounded.round}"
    size: "34px"
  pin-label:
    backgroundColor: "rgba(14, 18, 28, 0.86)"
    textColor: "{colors.night-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "6px 11px"
---

# Design System: Adventní okénka

## Overview

**Creative North Star: "The Window Left Open on a Winter Night"**

Direction D is binding. The owner chose it on 13 Nov 2026 from rendered variants and said "Super". It is a real map, built like a native night map on a phone: MapLibre over OpenFreeMap tiles, houses standing in 3D, controls in frosted sheets. Darkness is the canvas and warm candle light is the only bright thing on it. The advent calendar is carried by one object, a small round light with a day number: on the map it marks each house, in the sheet 24 of them show where in advent we are. Nothing else on screen counts or explains.

The map has two skies. By day it is a pale winter map for planning the evening: snow white roads, frost grey roofs, today's houses marked by a calm disc in a warm ring with the day number. At sunset in Prague the map darkens by itself in one slow move, the discs fade into a warm glow and the windows light up, spilling light onto the ground and the neighbours' walls. Zooming out never hits a wall: village, region, Czechia, Europe, the whole Earth as a globe, and only our windows glow on it.

The earlier directions A Dřevoryt, B Papírový betlém and C Atlas noci were rejected on 13 Nov 2026 as too illustrative and not modern. Geist, used in the first render of D, was rejected the same day as reading "too AI". Do not bring back their woodcut, paper cut or star chart vocabulary.

The advent door marker, a little calendar door that swung open at dusk, was rejected by the owner on 13 Nov 2026: "the doors look terrible, remake them or remove the doors entirely and keep the rest." The door metaphor was removed everywhere, on the map, in the sheet and in the day strip, and replaced by the round light described under Components. Everything else in D stayed as approved.

**Key Characteristics:**
- A real 3D map, not an illustration.
- Warm light means a window of an advent calendar, and nothing else is warm.
- The day number lives in the light, never in a sentence.
- Day and night switch by the sun in Prague, never by the system theme.
- One continuous zoom from a doorstep to the globe.

## Colors

Blue black night and a pale wintry day, both cool, so the one warm hue, candle amber, always means a lit or waiting window.

### Primary
- **Candle Amber** (`candle`, with `candle-high`, `candle-core` and `candle-pool`): the window light. Lit discs and their halo, the ground pool around a lit house, the bloom over its roof, the warmed walls of the neighbours, calendar glows on Czechia and the globe, the Navigovat button. Nowhere else.
- **Day Disc** (`disc-ring`, `disc-face`, `disc-number`): today's house by day, a cream disc in a warm ring with a brown number. Lit, it becomes `disc-lit` with `disc-number-lit`.

### Secondary
- **You Blue** (`you-blue`): only the visitor's own dot, its accuracy circle and the locate arrow. The one cool light on the map.

### Neutral, night
- **Night Ground** (`night-ground`) and **Space** (`night-space`): the map floor and the void around the globe. The globe disc is lifted a shade by `night-globe-land` and `night-globe-water` so it reads against space.
- **Slate Roofs** (`night-building-low` to `night-building-high`): 3D buildings, taller ones lighter.
- **Ink** (`night-ink`, `night-ink-2`, `night-ink-3`): text in three steps on frosted sheets.
- **Borders** (`night-border`, `night-region`, `night-coast`): Czechia's outline, its regions, coastlines and country borders abroad, all barely there.

### Neutral, day
- **Snow Ground** (`day-ground`), **Frost Roofs** (`day-building-low` to `day-building-high`), **Ice Water** (`day-water`), white roads, `day-ink` text on `day-glass` sheets. Czechia sits on `day-cz-fill`, a shade whiter than its veiled neighbours.

### Named Rules
**The One Warm Light Rule.** Warm hues mark advent windows only. City lights abroad are cold pin pricks; labels, borders and controls stay cool.

**The Sky Clock Rule.** The palette is chosen by `duskAt`, the sunset in Prague for the date from the snapshot. Before it the day palette, from it the night palette. The system light or dark setting is ignored. Organizer screens may use the day palette all the time.

**The Dusk Event Rule.** When sunset passes with the map open, the day palette mixes into the night one over 3.2 s with ease in out, the interface colours follow through registered CSS properties, and while the dark settles every disc of today fades from its cream face into the warm light, its halo rising over 2.4 s. Nothing moves or swings, only light changes. With reduced motion the switch is instant.

## Typography

**Display Font:** Bricolage Grotesque, variable with optical size, OFL, self-hosted woff2 latin and latin-ext.
**Body Font:** Instrument Sans, variable with width, OFL, self-hosted woff2 latin and latin-ext.

**Character:** Bricolage Grotesque has ink traps and a slightly bookish, hand-set grotesk feel at heading sizes, so place names and day numbers read warm and crafted rather than like a startup UI. Instrument Sans is quiet and exact at 14 to 17 px, with clear Czech diacritics, so lists and distances stay calm under the headings.

### Hierarchy
- **Display** (650, 31 px, 1.06): the house name on the open card.
- **Headline** (650, 25 px, 1.12): sheet titles such as "Dnešní okénka" and "Nejblíž svítí Rádlo, 162 km".
- **Title** (650, 22 px, 1.2): the house name in the collapsed sheet.
- **Day number** (Bricolage 650, 16 px on the map, 19 px in the collapsed sheet, 13.5 px in rows, 11.5 px on past discs; Instrument Sans 600, 10 px in the strip).
- **Body** (Instrument Sans 550, 17 px): row titles, search text.
- **Body small** (400, 14 px): municipality and distance, status line.
- **Label** (600, 14 px): the house name chip beside a light on the map. Map labels from the tiles stay in Noto Sans, which the tile server provides.

### Named Rules
**The No Counting Rule.** No "12. okénko", no countdowns, no "už svítilo 7 okének", no lighting times. The day is the number in the light. A sheet says a place, Dnes or Svítí, and a distance.

## Layout

Mobile first at 390 px with a 16 px gutter; checked at 360, 430 and desktop. The map is full bleed. Search sits on top, the sheet docks to the bottom edge, the locate button floats 12 px above the sheet on the right. From 760 px the search and the sheet become a 380 px column on the left, floating 16 px from the edges.

Every camera move keeps the subject above the sheet by passing the sheet height as bottom padding.

### Camera by zoom
- **Doorstep, zoom 14.8 to 17.25, pitch 58 to 60, bearing 40 to 52:** houses in 3D, lights and labels shown. Opening near the visitor uses this view with the visitor and the nearest house of tonight both in frame.
- **Village and region, zoom 11 to 14:** pins fade out below 12.2, ground pools fade below 13, past discs appear only above 14.6.
- **Czechia, zoom about 6, pitch 0:** one glow per calendar, regions and the Czech border, neighbours under a light veil.
- **Europe, zoom about 3.3 on the globe:** coastlines and country borders as hairlines, faint cold city dots, Czechia still glowing.
- **Earth, zoom about 0.55:** the globe with Czechia turned towards the viewer. Panning is free everywhere.

### Opening
The map asks for the location on load and shows Czechia at once. A location within 3.5 s flies to the visitor's surroundings in 3D if a window of tonight is within 6 km, with that house in the sheet. Farther away it frames the visitor and the nearest light flat, under the headline "Nejblíž svítí X, N km". Denied, unavailable or slow: the map stays on Czechia and lists tonight's windows without distances. The location never leaves the device.

## Elevation & Depth

Depth comes from the map itself: extruded buildings under a single soft map light, a sky and horizon fog when pitched, the globe against deeper space. Interface layers float as frosted glass with one ambient shadow. Light is the other depth cue: the lit house is extruded in amber, neighbours' walls warm with distance up to 130 m, a ground pool of 120 m and 48 m radius breathes slowly under the roofs, and a bloom sits over them.

MapLibre's atmosphere is off: it is daylight scattering tied to the map light, and on a night globe it washed the Earth blue with a day and night band.

### Shadow Vocabulary
- **Float** (`inset 0 0.5px 0 rgba(255,255,255,0.1), 0 10px 30px -8px rgba(0,0,0,0.6)`): sheet, search, locate. By day `0 10px 30px -10px rgba(30,44,70,0.28)` with a white top edge.
- **Candle halo**: a radial layer behind a lit disc, 2.1 times its diameter, amber at 50 percent fading to nothing; only a lit disc and today in the strip. The disc itself keeps a small offset shadow `0 2px 6px -1px rgba(0,0,0,0.5)`.
- **CTA** (`0 8px 24px -8px rgba(255,150,40,0.6)`): the Navigovat button.

### Named Rules
**The Glass Has A Reason Rule.** Frosted sheets exist so the map stays readable under every control; this is the brief's choice, not decoration. No other glass surfaces.

## Shapes

Soft rectangles at three radii: 12 px chips, 16 px controls, 28 px sheet top corners. Circles for the house lights and the day strip, the visitor's dot, the locate button and calendar glows.

## Components

### House light
The signature. A round light with its day number in Bricolage Grotesque, set like a premium map pin: the disc floats above the house on a hairline stem to a dot on the ground, the name chip hangs to its right. Flat fills only, no bevel, no glossy gradient, no 3D.
- **Dnes, by day:** a cream disc `disc-face` in a 2 px warm ring `disc-ring`, brown number, a soft offset shadow.
- **Svítí, from sunset:** the disc itself is the light, flat `disc-lit` with a pale 1.5 px rim and a dark brown number, a soft amber halo behind it. At dusk the face, ring and number cross fade and the halo rises over 2.4 s.
- **Doutná, past days:** a 22 px dark ember disc with a thin warm ring and a light number, short stem, no halo, no label, shown only close in.
- Sizes: 34 px on the map, 42 px in the collapsed sheet, 30 px in list rows, 22 px for past houses.

### Advent day strip
The 24 days as small round lights in two rows of twelve, 22 px with 5 px gaps, each with its number. Past days glow dimly if the calendar had a house that day and stay dark if not. Today is a lit disc with a halo. Days ahead are empty hairline rings, all alike, so the strip never tells what comes tomorrow. Today's light fades up once when the sheet first appears. Screen readers hear "Dnes je 12. prosince".

### Sheet
- **Collapsed:** light, house name, then Dnes or Svítí, the municipality and the distance.
- **List, "Dnešní okénka":** headline, day strip, rows sorted by distance, each with a row light, house name, municipality and distance, and the state word in warm text.
- **Card:** display name, close button, day strip of that calendar, status line, the host's own program line if any, and Navigovat.
- **Before advent:** "První okénka se rozsvítí 1. prosince", a strip of empty rings, calendars in waiting as small stars.

### Buttons
- **Navigovat:** full width, 56 px, amber gradient `#ffc067` to `#ffa83a`, dark brown text, presses to 98.5 percent. Opens a native style chooser of Mapy.com, Google Mapy and Apple Mapy with walking routes.
- **Locate:** 48 px round glass button with the blue arrow.
- **Close:** 44 px hit area around a 30 px tinted circle.

### Search
48 px glass field, 17 px text, amber caret, focus shows a faint amber inner ring.

## Do's and Don'ts

### Do:
- **Do** keep the night palette exactly as approved; day is a second palette, not a reinterpretation.
- **Do** put the day number in the light and in the strip, and nowhere in a sentence.
- **Do** switch day and night only at `duskAt`, the sunset in Prague, and animate it as one event.
- **Do** keep zooming continuous down to the globe, and keep panning free.
- **Do** respect reduced motion: no fade up of today's light, no breathing pool, instant dusk, camera jumps instead of flights.
- **Do** keep touch targets at least 44 px and text at least 4.5:1 on both palettes.

### Don't:
- **Don't** show lighting times, "zhasne", countdowns or window numbers as text.
- **Don't** use warm colour for anything that is not an advent window.
- **Don't** add Santa, clip art stars, red and green, snowflake emoji or falling snow; winter shows as the pale snowy day map.
- **Don't** return to the illustrative looks of A, B and C, or to Geist, Inter, Roboto, Poppins, Montserrat, DM Sans or Space Grotesk.
- **Don't** bring back the advent door, its swinging leaf or any other skeuomorphic marker, glossy gradient or heavy shadow on the lights.
- **Don't** let neighbouring countries go pitch black; they sit under a light veil so the zoom out stays one move.
