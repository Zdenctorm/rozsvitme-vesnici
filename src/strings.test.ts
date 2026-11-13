import { describe, expect, it } from 'vitest';
import { strings } from './strings.cs';

describe('Czech strings', () => {
  const entries = Object.entries(strings);

  it('has the app title', () => {
    expect(strings.appTitle).toBe('Adventní okénka');
  });

  it.each(entries)('%s has no parentheses or long dashes', (_key, value) => {
    expect(value).not.toMatch(/[()–—]/);
  });

  it.each(entries)('%s is not empty and has no stray whitespace', (_key, value) => {
    expect(value.trim()).toBe(value);
    expect(value.length).toBeGreaterThan(0);
  });
});
