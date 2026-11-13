import { describe, expect, it } from 'vitest';
import { sampleCalendars, sampleHouses, sampleSnapshot } from './fixtures';

describe('sample snapshot for map development', () => {
  it('covers Rádlo, Strážnice and Rouchovany inside Czechia', () => {
    const { calendars } = sampleSnapshot(new Date('2026-11-25T12:00:00Z'));
    expect(calendars.map((c) => c.municipality).sort()).toEqual(['Rouchovany', 'Rádlo', 'Strážnice']);
    for (const { point } of calendars) {
      expect(point.lat).toBeGreaterThan(48.55);
      expect(point.lat).toBeLessThan(51.06);
      expect(point.lng).toBeGreaterThan(12.09);
      expect(point.lng).toBeLessThan(18.86);
    }
  });

  it('on a December afternoon shows today and past houses, nothing lit before dusk', () => {
    const { houses } = sampleSnapshot(new Date('2026-12-12T13:00:00Z'));
    expect(new Set(houses.map((h) => h.state))).toEqual(new Set(['today', 'past']));
  });

  it('on a December evening shows lit and past houses, with some empty windows', () => {
    const { houses, phase } = sampleSnapshot(new Date('2026-12-12T16:15:00Z'));
    expect(phase).toBe('advent');
    expect(new Set(houses.map((h) => h.state))).toEqual(new Set(['lit', 'past']));
    expect(houses.every((h) => h.window <= 12)).toBe(true);
    for (const c of sampleCalendars) {
      expect(c.hidden).toBe(false);
    }
    const filled = new Set(sampleHouses.map((h) => `${h.calendarId}:${h.window}`));
    expect(filled.size).toBeLessThan(3 * 24);
  });

  it('defaults to a December evening when no time is given', () => {
    expect(sampleSnapshot().houses.some((h) => h.state === 'lit')).toBe(true);
  });

  it('house labels pass the Czech copy rule: no parentheses or long dashes', () => {
    for (const h of sampleHouses) {
      expect(h.label).not.toMatch(/[()–—]/);
      expect(h.program ?? '').not.toMatch(/[()–—]/);
    }
  });
});
