/**
 * All user-facing Czech copy lives here, so it can be reviewed in one place.
 * Every string must pass the anti-ai-slop-cz skill: no parentheses, no long dashes.
 */
export const strings = {
  appTitle: 'Adventní okénka',
} as const;

export type StringKey = keyof typeof strings;
