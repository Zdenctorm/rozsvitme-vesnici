import { describe, expect, it } from 'vitest';
import { pragueDusk } from './sun';
import { buildSnapshot, type CalendarRecord, type HouseRecord } from './visibility';

const radlo: CalendarRecord = {
  id: 'cal-radlo',
  slug: 'radlo',
  name: 'Adventní Rádlo',
  municipality: 'Rádlo',
  point: { lat: 50.698, lng: 15.109 },
  hidden: false,
  organizer: { email: 'starosta@radlo.example', name: 'Jana Organizátorová' },
};

function house(window: number, extra: Partial<HouseRecord> = {}): HouseRecord {
  return {
    id: `h-${window}`,
    calendarId: radlo.id,
    window,
    point: { lat: 50.69 + window / 1000, lng: 15.1 },
    label: `Domeček ${window}`,
    consent: { confirmedBy: 'starosta@radlo.example', confirmedAt: '2026-11-21T10:00:00Z' },
    ...extra,
  };
}

/** Prague is UTC+1 all of November and December. */
const prague = (local: string) => new Date(`${local}+01:00`);

const visible = (now: Date, houses: HouseRecord[], calendars = [radlo]) =>
  buildSnapshot(calendars, houses, now).houses.map((h) => [h.window, h.state]);

describe('dusk', () => {
  it("is in the snapshot as today's Prague sunset, so the map can switch to night", () => {
    const snapshot = buildSnapshot([radlo], [], prague('2026-12-24T09:00:00'));
    expect(snapshot.duskAt).toBe(pragueDusk('2026-12-24').toISOString());
    const reference = Date.parse('2026-12-24T15:03:53Z');
    expect(Math.abs(Date.parse(snapshot.duskAt) - reference)).toBeLessThan(2 * 60_000);
  });

  it('follows the Prague date, not the UTC date, just after Prague midnight', () => {
    // 23:30 UTC on 5 Dec is 00:30 on 6 Dec in Prague.
    expect(buildSnapshot([radlo], [], new Date('2026-12-05T23:30:00Z')).duskAt).toBe(pragueDusk('2026-12-06').toISOString());
  });
});

describe('before 1 Dec', () => {
  it('shows calendars as upcoming with their filled window count and no houses', () => {
    const snapshot = buildSnapshot([radlo], [house(1), house(2), house(5)], prague('2026-11-25T19:00:00'));

    expect(snapshot.phase).toBe('upcoming');
    expect(snapshot.houses).toEqual([]);
    expect(snapshot.calendars).toEqual([
      {
        id: 'cal-radlo',
        slug: 'radlo',
        name: 'Adventní Rádlo',
        municipality: 'Rádlo',
        point: { lat: 50.698, lng: 15.109 },
        filledWindows: 3,
      },
    ]);
  });
});

describe("today's house", () => {
  it('is not visible before 08:00', () => {
    expect(visible(prague('2026-12-03T07:59:59'), [house(3)])).toEqual([]);
  });

  it('is visible from 08:00, not yet lit', () => {
    expect(visible(prague('2026-12-03T08:00:00'), [house(3)])).toEqual([[3, 'today']]);
  });

  it('is lit from dusk, sunset in Prague, to the minute', () => {
    const dusk = pragueDusk('2026-12-03');
    const minute = 60_000;
    expect(visible(new Date(dusk.getTime() - minute), [house(3)])).toEqual([[3, 'today']]);
    expect(visible(dusk, [house(3)])).toEqual([[3, 'lit']]);
    expect(visible(new Date(dusk.getTime() + minute), [house(3)])).toEqual([[3, 'lit']]);
  });

  it('dusk on 3 Dec falls at about 16:02 in Prague', () => {
    expect(visible(prague('2026-12-03T15:55:00'), [house(3)])).toEqual([[3, 'today']]);
    expect(visible(prague('2026-12-03T16:10:00'), [house(3)])).toEqual([[3, 'lit']]);
  });

  it('stays lit until Prague midnight, then turns past', () => {
    expect(visible(prague('2026-12-03T23:59:59'), [house(3)])).toEqual([[3, 'lit']]);
    expect(visible(prague('2026-12-04T00:00:00'), [house(3)])).toEqual([[3, 'past']]);
  });

  it('carries its public fields', () => {
    const snapshot = buildSnapshot(
      [radlo],
      [house(3, { label: 'Fara', program: 'svařák od 18:00', point: { lat: 50.7, lng: 15.11 } })],
      prague('2026-12-03T18:00:00'),
    );
    expect(snapshot.houses).toEqual([
      {
        id: 'h-3',
        calendarId: 'cal-radlo',
        window: 3,
        point: { lat: 50.7, lng: 15.11 },
        label: 'Fara',
        program: 'svařák od 18:00',
        state: 'lit',
      },
    ]);
  });
});

describe('past houses', () => {
  it('stay at their exact point after their day', () => {
    const snapshot = buildSnapshot([radlo], [house(1, { point: { lat: 50.6912, lng: 15.1034 } })], prague('2026-12-10T12:00:00'));
    expect(snapshot.houses).toEqual([expect.objectContaining({ window: 1, state: 'past', point: { lat: 50.6912, lng: 15.1034 } })]);
  });

  it('turn past at midnight, before the next window becomes visible', () => {
    expect(visible(prague('2026-12-04T00:00:00'), [house(3), house(4)])).toEqual([[3, 'past']]);
  });

  it('are still past on the evening of 24 Dec, next to the lit last window', () => {
    expect(visible(prague('2026-12-24T18:00:00'), [house(1), house(23), house(24)])).toEqual([
      [1, 'past'],
      [23, 'past'],
      [24, 'lit'],
    ]);
  });
});

describe('future houses', () => {
  const all = Array.from({ length: 24 }, (_, i) => house(i + 1));

  it('never get into the snapshot', () => {
    const windows = visible(prague('2026-12-12T19:00:00'), all).map(([w]) => w);
    expect(windows).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('stay out one second before Prague midnight, even though it is already the next day in UTC+2 and beyond', () => {
    // 22:59:59 UTC is 23:59:59 in Prague and 00:59:59 next day in Kyiv.
    const windows = visible(new Date('2026-12-05T22:59:59Z'), all).map(([w]) => w);
    expect(windows).toEqual([1, 2, 3, 4, 5]);
  });

  it('stay out after Prague midnight until 08:00, even though UTC is still on the previous day', () => {
    // 23:30 UTC on 5 Dec is 00:30 on 6 Dec in Prague.
    expect(visible(new Date('2026-12-05T23:30:00Z'), all).map(([w]) => w)).toEqual([1, 2, 3, 4, 5]);
    // 07:00 UTC is 08:00 in Prague, 06:59 UTC is 07:59.
    expect(visible(new Date('2026-12-06T06:59:59Z'), all).map(([w]) => w)).toEqual([1, 2, 3, 4, 5]);
    expect(visible(new Date('2026-12-06T07:00:00Z'), all).map(([w]) => w)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('stay out on 1 Dec before 08:00, the first night of the season', () => {
    const snapshot = buildSnapshot([radlo], all, new Date('2026-11-30T23:00:00Z'));
    expect(snapshot.phase).toBe('advent');
    expect(snapshot.today).toBe('2026-12-01');
    expect(snapshot.houses).toEqual([]);
  });

  it('stay out on the day clocks go back, a month before the season', () => {
    // 25 Oct 2026, 02:30 CET after the switch from CEST.
    const snapshot = buildSnapshot([radlo], all, new Date('2026-10-25T01:30:00Z'));
    expect(snapshot.phase).toBe('upcoming');
    expect(snapshot.today).toBe('2026-10-25');
    expect(snapshot.houses).toEqual([]);
  });
});

describe('after 24 Dec', () => {
  it('keeps the final state: every house past, calendars still listed', () => {
    const all = Array.from({ length: 24 }, (_, i) => house(i + 1));
    for (const now of [prague('2026-12-25T00:00:00'), prague('2027-01-10T20:00:00')]) {
      const snapshot = buildSnapshot([radlo], all, now);
      expect(snapshot.phase).toBe('over');
      expect(snapshot.houses).toHaveLength(24);
      expect(snapshot.houses.every((h) => h.state === 'past')).toBe(true);
      expect(snapshot.calendars).toHaveLength(1);
    }
  });
});

describe('hidden calendars', () => {
  const hidden: CalendarRecord = { ...radlo, id: 'cal-hidden', slug: 'skryty', hidden: true };
  const hiddenHouse = house(2, { id: 'h-hidden', calendarId: 'cal-hidden' });

  it('never get into the snapshot before 1 Dec', () => {
    const snapshot = buildSnapshot([radlo, hidden], [house(1), hiddenHouse], prague('2026-11-28T12:00:00'));
    expect(snapshot.calendars.map((c) => c.id)).toEqual(['cal-radlo']);
  });

  it('take their houses with them, lit or past', () => {
    const snapshot = buildSnapshot([radlo, hidden], [house(1), hiddenHouse], prague('2026-12-02T18:00:00'));
    expect(snapshot.calendars.map((c) => c.id)).toEqual(['cal-radlo']);
    expect(snapshot.houses.map((h) => h.id)).toEqual(['h-1']);
    expect(JSON.stringify(snapshot)).not.toContain('hidden');
  });

  it('houses of an unknown calendar never get in either', () => {
    const orphan = house(1, { id: 'h-orphan', calendarId: 'cal-deleted' });
    expect(buildSnapshot([radlo], [orphan], prague('2026-12-02T18:00:00')).houses).toEqual([]);
  });
});

describe('empty windows', () => {
  it('light nothing and do not count as filled', () => {
    const snapshot = buildSnapshot([radlo], [house(1), house(3)], prague('2026-12-02T18:00:00'));
    expect(snapshot.houses.map((h) => [h.window, h.state])).toEqual([[1, 'past']]);
    expect(snapshot.calendars[0]?.filledWindows).toBe(2);
  });

  it('a window with two houses counts once', () => {
    const snapshot = buildSnapshot([radlo], [house(1), house(1, { id: 'h-1b' })], prague('2026-11-20T12:00:00'));
    expect(snapshot.calendars[0]?.filledWindows).toBe(1);
  });

  it('a house outside windows 1 to 24 is ignored', () => {
    const odd = [house(0, { id: 'h-0' }), house(25, { id: 'h-25' }), house(2.5, { id: 'h-2.5' })];
    expect(buildSnapshot([radlo], odd, prague('2026-12-31T18:00:00')).houses).toEqual([]);
    expect(buildSnapshot([radlo], odd, prague('2026-11-20T12:00:00')).calendars[0]?.filledWindows).toBe(0);
  });
});

describe('privacy', () => {
  it('leaks no emails, organizer names or consent data', () => {
    const json = JSON.stringify(
      buildSnapshot([radlo], [house(1), house(2), house(3)], prague('2026-12-03T18:00:00')),
    );
    expect(json).toContain('Domeček 1');
    expect(json).not.toContain('@');
    expect(json).not.toContain('Jana Organizátorová');
    expect(json).not.toMatch(/organizer|consent|confirmed|email/i);
    expect(json).not.toContain('2026-11-21T10:00:00Z');
  });
});

describe('ordering', () => {
  it('lists houses by calendar and window, whatever the input order', () => {
    const rouchovany: CalendarRecord = { ...radlo, id: 'cal-rouchovany', slug: 'rouchovany' };
    const snapshot = buildSnapshot(
      [rouchovany, radlo],
      [house(2), house(1, { id: 'r-1', calendarId: 'cal-rouchovany' }), house(1)],
      prague('2026-12-05T12:00:00'),
    );
    expect(snapshot.houses.map((h) => h.id)).toEqual(['h-1', 'h-2', 'r-1']);
    expect(snapshot.calendars.map((c) => c.id)).toEqual(['cal-radlo', 'cal-rouchovany']);
  });
});
