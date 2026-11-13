/**
 * Sunset for a place and date, after the NOAA solar calculator.
 * Pure and dependency free. Accurate to about a minute for latitudes below 60°.
 */
import type { Point } from './snapshot';

/** Prague city centre. The map turns to night when the sun sets here. */
export const PRAGUE: Point = { lat: 50.0755, lng: 14.4378 };

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Sun's declination in degrees and the equation of time in minutes at a Julian day. */
function solarPosition(julianDay: number): { declination: number; equationOfTime: number } {
  const t = (julianDay - 2451545) / 36525;
  const meanLong = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const m = rad(meanAnomaly);
  const center =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const apparentLong = meanLong + center - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(rad(omega));
  const declination = deg(Math.asin(Math.sin(rad(obliquity)) * Math.sin(rad(apparentLong))));

  const y = Math.tan(rad(obliquity / 2)) ** 2;
  const l0 = rad(meanLong);
  const equationOfTime =
    4 *
    deg(
      y * Math.sin(2 * l0) -
        2 * eccentricity * Math.sin(m) +
        4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
        0.5 * y * y * Math.sin(4 * l0) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * m),
    );
  return { declination, equationOfTime };
}

/** Upper limb touching the horizon, with standard refraction. */
const ZENITH = 90.833;

/**
 * Instant of sunset at `lat`, `lng` (degrees, east positive) on the calendar date `date` ("YYYY-MM-DD"),
 * where the date is the local day the sun sets on.
 * Throws for polar day or night, which never happens in Czechia.
 */
export function sunset(lat: number, lng: number, date: string): Date {
  const midnightUtc = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(midnightUtc)) throw new Error(`Invalid date: ${date}`);
  const julianMidnight = midnightUtc / 86_400_000 + 2440587.5;

  // Start from local solar noon, then refine twice at the sunset estimate.
  let minutesUtc = 720 - 4 * lng;
  for (let i = 0; i < 3; i++) {
    const { declination, equationOfTime } = solarPosition(julianMidnight + minutesUtc / 1440);
    const cosHourAngle =
      Math.cos(rad(ZENITH)) / (Math.cos(rad(lat)) * Math.cos(rad(declination))) -
      Math.tan(rad(lat)) * Math.tan(rad(declination));
    if (cosHourAngle < -1 || cosHourAngle > 1) throw new Error(`No sunset at ${lat}, ${lng} on ${date}`);
    const hourAngle = deg(Math.acos(cosHourAngle));
    minutesUtc = 720 - 4 * lng - equationOfTime + 4 * hourAngle;
  }
  return new Date(midnightUtc + Math.round(minutesUtc * 60) * 1000);
}

/** Dusk on the map: sunset in Prague on the Prague date `date` ("YYYY-MM-DD"). */
export function pragueDusk(date: string): Date {
  return sunset(PRAGUE.lat, PRAGUE.lng, date);
}
