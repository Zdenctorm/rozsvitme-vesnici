import { describe, expect, it } from 'vitest';
import { PRAGUE, pragueDusk, sunset } from './sun';

/** Reference values from sunrise-sunset.org for 50.0755 N, 14.4378 E, fetched 13 Nov 2026. */
const minutesApart = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60_000;

describe('sunset', () => {
  it('in Prague on 1 Dec is at 16:03 local, within 2 minutes', () => {
    const s = sunset(PRAGUE.lat, PRAGUE.lng, '2026-12-01');
    expect(minutesApart(s, new Date('2026-12-01T15:03:17Z'))).toBeLessThan(2);
  });

  it('in Prague on 24 Dec is at 16:04 local, within 2 minutes', () => {
    const s = sunset(PRAGUE.lat, PRAGUE.lng, '2026-12-24');
    expect(minutesApart(s, new Date('2026-12-24T15:03:53Z'))).toBeLessThan(2);
  });

  it('in Prague on 12 Dec, the earliest sunset of the year, is at 16:00 local, within 2 minutes', () => {
    const s = sunset(PRAGUE.lat, PRAGUE.lng, '2026-12-12');
    expect(minutesApart(s, new Date('2026-12-12T15:00:05Z'))).toBeLessThan(2);
  });

  it('moves east to west: Strážnice sets earlier than Prague on the same day', () => {
    const straznice = sunset(48.8999, 17.3171, '2026-12-01');
    expect(straznice.getTime()).toBeLessThan(sunset(PRAGUE.lat, PRAGUE.lng, '2026-12-01').getTime());
  });
});

describe('pragueDusk', () => {
  it('is sunset at Prague coordinates for that Prague date', () => {
    expect(pragueDusk('2026-12-03')).toEqual(sunset(50.0755, 14.4378, '2026-12-03'));
    expect(minutesApart(pragueDusk('2026-12-03'), new Date('2026-12-03T15:02:14Z'))).toBeLessThan(2);
  });
});
