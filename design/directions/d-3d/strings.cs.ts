/**
 * Czech copy of the 3D night map prototype, kept in one place for review.
 * Every string passed the anti-ai-slop-cz skill: no parentheses, no long dashes.
 * No window numbers and no lighting times: the advent day shows in the door strip,
 * and hosts light up in the afternoon, so people come whenever they like.
 */

export const t = {
  pageTitle: 'Adventní okénka',
  search: 'Najít obec',
  searchEmpty: 'Tahle obec zatím kalendář nemá.',
  locate: 'Ukázat, kde jsem',
  close: 'Zavřít',

  tonightTitle: 'Dnešní okénka',
  /** House shown during the day, before sunset. */
  today: 'Dnes',
  /** House after sunset. */
  lit: 'Svítí',
  nearestLit: (place: string, distance: string) => `Nejblíž svítí ${place}, ${distance}`,
  nearestToday: (place: string, distance: string) => `Dnes nejblíž ${place}, ${distance}`,

  /** Captions of the door close-up. */
  stateToday: 'Dnes přes den',
  stateDusk: 'Při západu slunce',
  statePast: 'Doutná',

  /** Read aloud for the door strip, never shown. */
  dayLabel: (day: number) => `Dnes je ${day}. prosince`,
  dayBefore: 'Advent začne 1. prosince',

  navigate: 'Navigovat',
  navApps: { mapy: 'Mapy.com', google: 'Google Mapy', apple: 'Apple Mapy' },
  navSub: 'Vyberte aplikaci, trasa se otevře pro chůzi.',
  cancel: 'Zrušit',

  waitingTitle: 'První okénka se rozsvítí 1. prosince',
  waitingList: 'Chystají se',
  surprise: 'Kde které okénko svítí, uvidíte vždy až v jeho den.',
} as const;
