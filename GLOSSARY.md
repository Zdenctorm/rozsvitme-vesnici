# Glossary

Domain terms for Adventní okénka. Czech term first, as shown in the UI; English identifier for code in backticks.

**Kalendář**, `calendar`:
One living advent calendar run by one **Organizátor** in one municipality. A village or town may have several. Has a name, a public slug and a QR poster.
_Avoid_: vesnice, obec, village, as the unit. A municipality is only the calendar's location.

**Okénko**, `window`:
One day of a **Kalendář**, numbered 1 to 24, December 2026. Can be empty: then nothing lights up in that calendar that evening.

**Domeček**, `house`:
A place that lights up its decorated window on a given **Okénko**. Has an exact map point and a short label, never a street address. One per **Okénko** by default.

**Hostitel**, `host`:
The household behind a **Domeček**. Never logs in. Their consent is confirmed by the **Organizátor** with a checkbox, recorded with who and when.

**Organizátor**, `organizer`:
The person who creates and edits a **Kalendář**. Logs in with an email magic link.

**Svítí**, `lit`:
A **Domeček** on its **Okénko** day from dusk until Prague midnight. Dusk is sunset in Prague that day, the same for every **Kalendář**: at about 16:00 the map turns to night and today's houses light up. There are no per-calendar times; hosts prepare the window in the afternoon and people come whenever they like.

**Dnes**, `today`:
A **Domeček** on its **Okénko** day from 08:00 until dusk: visible at its exact point with navigation and a warm mark on the day map, not yet glowing.

**Doutná**, `past`:
A **Domeček** whose **Okénko** is over. Stays on the map as a faint light at its exact point until 24 Dec. All data is deleted in January 2027.

**Čeká**, `upcoming`:
A **Kalendář** before 1 Dec, shown as a small star with its number of filled windows. Future houses are never shown.

**Karta na razítka**, `stamp card`:
Printable A5 card per **Kalendář** with 24 fields and a QR code. Children collect a stamp from each **Hostitel**.

**Správce**, `admin`:
The site owner. Can hide any **Kalendář**.
