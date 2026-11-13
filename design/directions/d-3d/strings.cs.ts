/**
 * Czech copy of the 3D night map prototype, kept in one place for review.
 * Every string passed the anti-ai-slop-cz skill: no parentheses, no long dashes.
 */

/** Czech plural: one, two to four, five and more. */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

const okenek = (n: number) => plural(n, 'okénko', 'okénka', 'okének');

export const t = {
  pageTitle: 'Adventní okénka',
  search: 'Najít obec',
  searchEmpty: 'Tahle obec zatím kalendář nemá.',
  locate: 'Ukázat, kde jsem',
  close: 'Zavřít',

  tonightTitle: 'Dnešní okénka',
  tonightCount: (n: number) => `${n} ${plural(n, 'kalendář', 'kalendáře', 'kalendářů')} v Česku`,

  windowOf: (n: number, calendar: string) => `${n}. okénko, ${calendar}`,
  litUntil: (time: string) => `Svítí do ${time}`,
  litFrom: (time: string) => `Rozsvítí se v ${time}`,
  litShort: 'Svítí',
  walk: (min: number) => `pěšky ${min} min`,
  pastSoFar: (n: number) => `V tomhle kalendáři už ${plural(n, 'svítilo', 'svítila', 'svítilo')} ${n} ${okenek(n)}.`,
  secret: 'Zítřejší okénko se na mapě ukáže zítra v osm ráno.',

  navigate: 'Navigovat',
  navApps: { mapy: 'Mapy.com', google: 'Google Mapy', apple: 'Apple Mapy' },
  navSub: 'Vyberte aplikaci, trasa se otevře pro chůzi.',
  cancel: 'Zrušit',

  countdownBig: (days: number) => `Za ${days} ${plural(days, 'den', 'dny', 'dní')}`,
  countdownSub: 'První okénka se rozsvítí v úterý 1. prosince.',
  waitingTitle: (n: number) =>
    `${plural(n, 'Chystá se', 'Chystají se', 'Chystá se')} ${n} ${plural(n, 'kalendář', 'kalendáře', 'kalendářů')}`,
  windowsWord: (n: number) => okenek(n),
  surprise: 'Kde které okénko svítí, uvidíte vždy až v jeho den.',
} as const;
