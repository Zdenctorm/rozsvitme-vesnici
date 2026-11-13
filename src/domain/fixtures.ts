/**
 * Sample calendars and houses for map development and e2e tests.
 * Fictional houses around three real municipalities known for living advent calendars.
 */
import type { Point, Snapshot } from './snapshot';
import { buildSnapshot, type CalendarRecord, type HouseRecord } from './visibility';

interface SampleCalendar {
  calendar: CalendarRecord;
  /** Index 0 is window 1. `null` leaves the window empty. */
  windows: (string | [label: string, program: string] | null)[];
}

const samples: SampleCalendar[] = [
  {
    calendar: {
      id: 'cal-radlo',
      slug: 'radlo',
      name: 'Adventní Rádlo',
      municipality: 'Rádlo',
      point: { lat: 50.6985, lng: 15.1063 },
      hidden: false,
      organizer: { email: 'organizator@radlo.example.org', name: 'Ukázkový organizátor' },
    },
    windows: [
      ['Obecní úřad', 'Rozsvícení stromu a koledy v 17:00'],
      'Hasičská zbrojnice',
      null,
      'Dům u rybníčka',
      ['Mateřská škola', 'Děti zazpívají v 17:30'],
      'Fara',
      'Roubenka pod kostelem',
      null,
      'Statek na návsi',
      'Knihovna',
      'Dům s modrými okenicemi',
      ['Hospoda na návsi', 'Svařák od 18:00'],
      null,
      'Chalupa u lesa',
      'Škola',
      'Dům u kapličky',
      'Zahradnictví',
      null,
      'Sokolovna',
      'Dům u hřiště',
      'Bytovky u zastávky',
      'Stará kovárna',
      'Kaple',
      ['Kostel', 'Půlnoční začíná ve 22:00'],
    ],
  },
  {
    calendar: {
      id: 'cal-straznice',
      slug: 'straznice',
      name: 'Živý adventní kalendář Strážnice',
      municipality: 'Strážnice',
      point: { lat: 48.8999, lng: 17.3171 },
      hidden: false,
      organizer: { email: 'advent@straznice.example.org' },
    },
    windows: [
      ['Masarykovo náměstí', 'Cimbálka hraje od 17:00'],
      'Radnice',
      'Vinný sklep pod Bludníkem',
      null,
      'Skanzen, vstupní budova',
      'Dům u Starobranské brány',
      null,
      'Základní umělecká škola',
      ['Fara u kostela Nanebevzetí', 'Teplý čaj pro děti'],
      'Dům na Předměstí',
      null,
      'Zámecký park, vrátnice',
      'Dům u Baťova kanálu',
      'Knihovna',
      null,
      'Dům v Kovářské ulici',
      'Gymnázium',
      null,
      'Dům u Veselské brány',
      ['Muzeum', 'Výstava betlémů do 19:00'],
      null,
      'Mateřská škola Kollárova',
      'Dům u přístaviště',
      'Kostel svatého Martina',
    ],
  },
  {
    calendar: {
      id: 'cal-rouchovany',
      slug: 'rouchovany',
      name: 'Rouchovanský advent',
      municipality: 'Rouchovany',
      point: { lat: 49.0705, lng: 16.1078 },
      hidden: false,
      organizer: { email: 'okenka@rouchovany.example.org', name: 'Ukázková organizátorka' },
    },
    windows: [
      'Obecní úřad',
      null,
      'Dům na Hradišti',
      'Hasičárna',
      null,
      ['Fara', 'Mikulášská nadílka v 17:30'],
      'Dům u rybníka',
      'Mateřská škola',
      null,
      null,
      'Dům pod kostelem',
      'Pekárna',
      'Sokolovna',
      null,
      'Dům u hřbitova',
      'Škola',
      null,
      'Dům na kopci',
      'Knihovna',
      null,
      'Hospoda u hřiště',
      null,
      'Dům u Dukovanské silnice',
      ['Kostel svatého Martina', 'Zpívání u jesliček v 16:00'],
    ],
  },
];

/** Deterministic spread of houses around the calendar's point, within about 600 m. */
function around(center: Point, window: number): Point {
  const angle = window * 2.39996;
  const radius = 0.0012 + (window / 24) * 0.004;
  const round = (n: number) => Math.round(n * 1e5) / 1e5;
  return {
    lat: round(center.lat + radius * Math.sin(angle)),
    lng: round(center.lng + radius * 1.5 * Math.cos(angle)),
  };
}

export const sampleCalendars: CalendarRecord[] = samples.map((s) => s.calendar);

export const sampleHouses: HouseRecord[] = samples.flatMap(({ calendar, windows }) =>
  windows.flatMap((entry, i): HouseRecord[] => {
    if (entry === null) return [];
    const window = i + 1;
    const [label, program] = typeof entry === 'string' ? [entry, undefined] : entry;
    return [
      {
        id: `${calendar.slug}-${window}`,
        calendarId: calendar.id,
        window,
        point: around(calendar.point, window),
        label,
        ...(program ? { program } : {}),
        consent: { confirmedBy: calendar.organizer.email, confirmedAt: '2026-11-22T19:00:00Z' },
      },
    ];
  }),
);

/** 12 Dec 2026, 17:15 in Prague, after dusk at about 16:00: window 12 lit, earlier windows past. */
export const SAMPLE_EVENING = new Date('2026-12-12T16:15:00Z');

/** The public snapshot of the sample data at `now`. Defaults to a December evening. */
export function sampleSnapshot(now: Date = SAMPLE_EVENING): Snapshot {
  return buildSnapshot(sampleCalendars, sampleHouses, now);
}
