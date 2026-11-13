/**
 * Public snapshot: the only data the public map reads.
 *
 * A scheduled job runs `buildSnapshot` every few minutes and publishes the result
 * as static JSON on the CDN. It holds only what may be seen right now in
 * Europe/Prague: calendars with their number of filled windows, and houses that
 * are visible today or lit or past. Future houses, hidden calendars, emails,
 * organizer names and consent records never get in.
 */

/** A WGS84 point. */
export interface Point {
  lat: number;
  lng: number;
}

/**
 * Where the season stands.
 * - `upcoming`: before 1 Dec, calendars only, no houses.
 * - `advent`: 1 to 24 Dec.
 * - `over`: after 24 Dec, every house is past and stays so until data deletion.
 */
export type SnapshotPhase = 'upcoming' | 'advent' | 'over';

/**
 * State of a house in the snapshot.
 * - `today`: its window is today, visible from 08:00 until dusk.
 * - `lit`: its window is today, from dusk until Prague midnight.
 * - `past`: its window is over. Shown as a faint light at its exact point.
 */
export type HouseState = 'today' | 'lit' | 'past';

export interface SnapshotCalendar {
  id: string;
  /** Public slug, e.g. `radlo` for adventniokenka.cz/radlo. */
  slug: string;
  name: string;
  /** Municipality the calendar runs in. Only a location, not the unit. */
  municipality: string;
  /** Where the calendar's star sits on the map before 1 Dec. */
  point: Point;
  /** Number of windows 1 to 24 that have at least one house. */
  filledWindows: number;
}

export interface SnapshotHouse {
  id: string;
  calendarId: string;
  /** Window number 1 to 24, i.e. its day in December. */
  window: number;
  /** Exact map point. Never a street address. */
  point: Point;
  label: string;
  /** Optional free text from the organizer, e.g. "svařák od 18:00". */
  program?: string;
  state: HouseState;
}

export interface Snapshot {
  /** Format version. Bump on breaking change. 2: no per-calendar lighting hours, adds `duskAt`. */
  version: 2;
  /** Instant the snapshot was built, ISO 8601 UTC. */
  generatedAt: string;
  /** Date in Europe/Prague the snapshot was built on, "YYYY-MM-DD". */
  today: string;
  /**
   * Dusk on `today`: sunset in Prague, ISO 8601 UTC. Today's house is lit from this instant
   * until Prague midnight, and the map switches to night mode.
   */
  duskAt: string;
  phase: SnapshotPhase;
  /** Every calendar that is not hidden, sorted by slug. */
  calendars: SnapshotCalendar[];
  /** Visible houses only, sorted by calendar id and window. Always empty in the `upcoming` phase. */
  houses: SnapshotHouse[];
}
