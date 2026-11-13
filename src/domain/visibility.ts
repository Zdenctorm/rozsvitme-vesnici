import type {
  HouseState,
  LightingHours,
  Point,
  Snapshot,
  SnapshotCalendar,
  SnapshotHouse,
  SnapshotPhase,
} from './snapshot';

/** A calendar as stored by the organizer side. Contains private fields that never reach the snapshot. */
export interface CalendarRecord {
  id: string;
  slug: string;
  name: string;
  municipality: string;
  point: Point;
  /** Hidden by the admin. A hidden calendar and its houses never reach the snapshot. */
  hidden: boolean;
  /** Per-calendar setting. Defaults to 17:00 to 20:00. */
  lightingHours?: LightingHours;
  organizer: { email: string; name?: string };
}

/** A house as stored by the organizer side. */
export interface HouseRecord {
  id: string;
  calendarId: string;
  /** Window number 1 to 24. */
  window: number;
  point: Point;
  label: string;
  program?: string;
  /** Host consent, confirmed by the organizer. Private. */
  consent: { confirmedBy: string; confirmedAt: string };
}

export const DEFAULT_LIGHTING_HOURS: LightingHours = { from: '17:00', to: '20:00' };

/** December of this year holds windows 1 to 24. */
export const ADVENT_YEAR = 2026;

const TIME_ZONE = 'Europe/Prague';

const pragueParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Wall-clock date and time in Europe/Prague. Safe across DST since it never adds offsets by hand. */
function pragueClock(now: Date): { date: string; minutes: number } {
  const parts = Object.fromEntries(pragueParts.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

const isWindow = (n: number) => Number.isInteger(n) && n >= 1 && n <= 24;

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const dayOf = (window: number) => `${ADVENT_YEAR}-12-${String(window).padStart(2, '0')}`;

/** Today's house shows up on the map from this time, so families can plan the evening. */
const VISIBLE_FROM = 8 * 60;

const minutesOf = (time: string) => {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
};

/** State of a house at the given Prague clock, or null when it must not be in the snapshot. */
function houseState(window: number, hours: LightingHours, clock: { date: string; minutes: number }): HouseState | null {
  const day = dayOf(window);
  if (clock.date > day) return 'past';
  if (clock.date !== day || clock.minutes < VISIBLE_FROM) return null;
  const lit = clock.minutes >= minutesOf(hours.from) && clock.minutes < minutesOf(hours.to);
  return lit ? 'lit' : 'today';
}

function phaseOn(date: string): SnapshotPhase {
  if (date < dayOf(1)) return 'upcoming';
  if (date > dayOf(24)) return 'over';
  return 'advent';
}

/**
 * Turns calendars, houses and the current instant into the public snapshot.
 * Pure: same input, same output.
 */
export function buildSnapshot(calendars: CalendarRecord[], houses: HouseRecord[], now: Date): Snapshot {
  const clock = pragueClock(now);
  const shown = calendars.filter((c) => !c.hidden).sort((a, b) => byText(a.slug, b.slug));
  const placed = houses
    .filter((h) => isWindow(h.window))
    .sort((a, b) => byText(a.calendarId, b.calendarId) || a.window - b.window || byText(a.id, b.id));

  const hoursOf = (c: CalendarRecord): LightingHours => {
    const { from, to } = c.lightingHours ?? DEFAULT_LIGHTING_HOURS;
    return { from, to };
  };

  const toPublic = (c: CalendarRecord): SnapshotCalendar => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    municipality: c.municipality,
    point: { lat: c.point.lat, lng: c.point.lng },
    lightingHours: hoursOf(c),
    filledWindows: new Set(placed.filter((h) => h.calendarId === c.id).map((h) => h.window)).size,
  });

  return {
    version: 1,
    generatedAt: now.toISOString(),
    today: clock.date,
    phase: phaseOn(clock.date),
    calendars: shown.map(toPublic),
    houses: placed.flatMap((h): SnapshotHouse[] => {
      const calendar = shown.find((c) => c.id === h.calendarId);
      if (!calendar) return [];
      const state = houseState(h.window, hoursOf(calendar), clock);
      if (!state) return [];
      return [
        {
          id: h.id,
          calendarId: h.calendarId,
          window: h.window,
          point: { lat: h.point.lat, lng: h.point.lng },
          label: h.label,
          ...(h.program ? { program: h.program } : {}),
          state,
        },
      ];
    }),
  };
}
