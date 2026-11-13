/**
 * Direction D: a 3D night map. Prototype of the public map screen.
 *
 * Without `?scene=` the map asks for the device location and opens in 3D around it,
 * or on the whole of Czechia when the location is denied or slow.
 * URL `?scene=` picks a fixed starting state for screenshots:
 * republika, vesnice, karta, navigovat, pred, evropa, zeme, let.
 */
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, LngLatLike, Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from '../../../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import './style.css';

import { sampleSnapshot, SAMPLE_EVENING } from '../../../src/domain/fixtures';
import type { Point, Snapshot, SnapshotCalendar, SnapshotHouse } from '../../../src/domain/snapshot';
import { DAY, mapStyle, mixColor, mixPalette, NIGHT, skyOf, themedPaint, type Palette } from './night-style';
import { t } from './strings.cs';
import czOutline from './geo/cz.json';
import regionLines from './geo/hranice.json';

type Scene =
  | 'start'
  | 'republika'
  | 'vesnice'
  | 'karta'
  | 'navigovat'
  | 'pred'
  | 'evropa'
  | 'zeme'
  | 'let'
  | 'den'
  | 'den-republika'
  | 'soumrak'
  | 'znacka';

const params = new URLSearchParams(location.search);
const scene = (params.get('scene') ?? 'start') as Scene;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 25 Nov 2026 evening in Prague: calendars wait, nothing is lit yet. */
const BEFORE_ADVENT = new Date('2026-11-25T17:00:00Z');
/** 12 Dec 2026 late morning in Prague: families plan the evening, the map is in its day palette. */
const DAYTIME = new Date('2026-12-12T10:30:00Z');
/** 12 Dec 2026 ten minutes before sunset in Prague, start of the dusk clip. */
const BEFORE_DUSK = new Date('2026-12-12T14:50:00Z');
const now =
  scene === 'pred' ? BEFORE_ADVENT : scene === 'den' || scene === 'den-republika' ? DAYTIME : scene === 'soumrak' ? BEFORE_DUSK : SAMPLE_EVENING;
/** Night mode follows only the sunset in Prague for the date, `duskAt` in the snapshot. */
/**
 * The fixture spreads houses around a calendar point that sits in the industrial
 * edge of Jeřmanice. For the prototype, Rádlo is shifted onto its real village
 * centre by the church, so tonight's house lands among real houses.
 */
const SHIFT: Record<string, Point> = { 'cal-radlo': { lat: 0.0002, lng: 0.01 } };
const shift = (id: string, p: Point): Point => (SHIFT[id] ? { lat: p.lat + SHIFT[id].lat, lng: p.lng + SHIFT[id].lng } : p);
const raw = sampleSnapshot(now);
/** Tonight's Rádlo house pinned to the roof the shifted point falls next to. */
const ROOF: Record<string, Point> = { 'radlo-12': { lat: 50.697084, lng: 15.112389 } };
const snapshot: Snapshot = {
  ...raw,
  calendars: raw.calendars.map((c) => ({ ...c, point: shift(c.id, c.point) })),
  houses: raw.houses.map((h) => ({ ...h, point: ROOF[h.id] ?? shift(h.calendarId, h.point) })),
};

/** Mock device location on the edge of Rádlo for the fixed scenes. */
const MOCK_USER: Point = { lat: 50.69652, lng: 15.11146 };
/**
 * Device location. Asked for on load in the `start` scene and never leaves the device.
 * Null until known, and for good when denied: the map then stays on the whole of Czechia.
 */
let user: Point | null = scene === 'start' ? null : MOCK_USER;
let userAccuracyM = 22;
/** How long the map waits for a location before it settles on Czechia. */
const LOCATE_TIMEOUT_MS = 3500;
/** Lit houses within this distance count as near: the map opens in 3D around the visitor. */
const NEAR_M = 6000;

const CZ_BOUNDS: [number, number, number, number] = [12.09, 48.55, 18.86, 51.06];
const WARM = '#ffb24d';
const WARM_CORE = '#fff0d2';
/** Camera above Europe, still on the globe. */
const EUROPE = { center: [14.2, 49.2] as LngLatLike, zoom: 3.3, pitch: 0, bearing: 0 };
/** The whole Earth as a globe, Czechia turned towards the viewer. */
const EARTH = { center: [15.4, 38] as LngLatLike, zoom: 0.55, pitch: 0, bearing: 0 };

// ---------- geometry helpers ----------

const ll = (p: Point): [number, number] => [p.lng, p.lat];

function meters(a: Point, b: Point): number {
  const k = Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  const dx = (a.lng - b.lng) * 111_320 * k;
  const dy = (a.lat - b.lat) * 110_574;
  return Math.hypot(dx, dy);
}

/** Paint value that keeps a circle at a fixed ground radius in meters at every zoom. */
function groundRadius(m: number, lat: number) {
  const perPx0 = 78_271.5 * Math.cos((lat * Math.PI) / 180);
  return ['interpolate', ['exponential', 2], ['zoom'], 8, (m * 2 ** 8) / perPx0, 22, (m * 2 ** 22) / perPx0];
}

function circlePolygon(c: Point, radiusM: number, steps = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring: [number, number][] = [];
  const k = Math.cos((c.lat * Math.PI) / 180);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([c.lng + (radiusM * Math.cos(a)) / (111_320 * k), c.lat + (radiusM * Math.sin(a)) / 110_574]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

function inRing(pt: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function centroid(ring: number[][]): Point {
  let x = 0;
  let y = 0;
  for (const [a, b] of ring) {
    x += a;
    y += b;
  }
  return { lng: x / ring.length, lat: y / ring.length };
}

function outerRings(g: GeoJSON.Geometry): number[][][] {
  if (g.type === 'Polygon') return [g.coordinates[0]];
  if (g.type === 'MultiPolygon') return g.coordinates.map((p) => p[0]);
  return [];
}

// ---------- formatting ----------

function fmtDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  if (m < 10_000) return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
  return `${Math.round(m / 1000)} km`;
}


// ---------- data ----------

const calendarOf = (h: SnapshotHouse) => snapshot.calendars.find((c) => c.id === h.calendarId) as SnapshotCalendar;
const tonight = snapshot.houses.filter((h) => h.state !== 'past');
const past = snapshot.houses.filter((h) => h.state === 'past');
/** After sunset in Prague today's houses glow and the map is in its night palette; before, it is day. */
let night = now.getTime() >= Date.parse(snapshot.duskAt);
const away = (p: Point) => (user ? meters(user, p) : 0);
const byDistance = () => (user ? [...tonight].sort((a, b) => away(a.point) - away(b.point)) : tonight);
/** Day of December in Prague, 1 to 24, or 0 before advent. */
const today = snapshot.phase === 'advent' ? Number(snapshot.today.slice(8, 10)) : 0;

/** Only two words, no times: hosts light up in the afternoon and people come when they like. */
const statusOf = (h: SnapshotHouse): string => (h.state === 'lit' ? t.lit : t.today);

// ---------- DOM ----------

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const sheet = $('#sheet');
const sheetBody = $('#sheet-body');
const nav = $('#nav');
const scrim = $('#scrim');
const search = $<HTMLInputElement>('#search');
const results = $('#results');
const locateBtn = $<HTMLButtonElement>('#locate');

search.placeholder = t.search;
search.setAttribute('aria-label', t.search);
locateBtn.setAttribute('aria-label', t.locate);
document.title = t.pageTitle;

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

/**
 * The house mark: a small advent calendar door with its day number.
 * By day it is shut with a warm frame; after sunset it stands open and the window glows;
 * past days are small dim open doors. The number stays readable in every state.
 */
function doorMark(day: number, state: SnapshotHouse['state'], size: 'pin' | 'row' | 'past'): string {
  return `<span class="door door-${size} is-${state}" aria-hidden="true"><span class="door-leaf"></span><b>${day}</b></span>`;
}

const CLOSE_ICON = '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg>';
const CHEVRON = '<svg class="icon chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5" /></svg>';
const ARROW_OUT = '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 13 13.5 6.5M8 6h6v6" /></svg>';

/**
 * Advent day strip: 24 small windows, today glowing. Replaces any "12. okénko" copy.
 * With a calendar, past days that had a house smoulder and empty days stay hollow.
 * Days after today all look alike, so the strip never tells what comes tomorrow.
 */
function dayStrip(calendarId?: string): string {
  const had = new Set(past.filter((p) => p.calendarId === calendarId).map((p) => p.window));
  const cells = Array.from({ length: 24 }, (_, i) => {
    const d = i + 1;
    const cls = d === today ? `is-today${performance.now() < 2500 ? ' is-opening' : ''}` : d < today ? (!calendarId || had.has(d) ? 'is-past' : 'is-empty') : 'is-ahead';
    return `<i class="${cls}"><b>${d}</b></i>`;
  }).join('');
  const label = today ? t.dayLabel(today) : t.dayBefore;
  return `<span class="days" role="img" aria-label="${esc(label)}">${cells}</span>`;
}

const distanceSpan = (p: Point) => (user ? `<span>${fmtDistance(away(p))}</span>` : '');

type SheetMode =
  | { kind: 'list' }
  | { kind: 'peek'; house: SnapshotHouse }
  | { kind: 'card'; house: SnapshotHouse }
  | { kind: 'nearest'; house: SnapshotHouse }
  | { kind: 'waiting' };
let mode: SheetMode = { kind: 'list' };

function renderSheet(next: SheetMode) {
  mode = next;
  sheet.dataset.mode = next.kind;
  if (next.kind === 'list') {
    const rows = byDistance()
      .map((h) => houseRow(h))
      .join('');
    sheetBody.innerHTML = `<div class="sheet-head"><h1 class="h1">${t.tonightTitle}</h1>${dayStrip()}</div>
      <ul class="rows">${rows}</ul>`;
  } else if (next.kind === 'nearest') {
    const h = next.house;
    const where = calendarOf(h).municipality;
    const line = (h.state === 'lit' ? t.nearestLit : t.nearestToday)(where, fmtDistance(away(h.point)));
    sheetBody.innerHTML = `<div class="sheet-head"><h1 class="h1">${esc(line)}</h1>${dayStrip()}</div>
      <ul class="rows">${houseRow(h)}</ul>`;
  } else if (next.kind === 'peek') {
    const h = next.house;
    sheetBody.innerHTML = `<button class="peek" type="button" data-open="${h.id}">
      <span class="peek-mark">${doorMark(h.window, h.state, 'pin')}</span>
      <span class="peek-text"><span class="peek-title">${esc(h.label)}</span>
      <span class="meta"><span class="live is-${h.state}">${esc(statusOf(h))}</span><span>${esc(calendarOf(h).municipality)}</span>${distanceSpan(h.point)}</span></span>
    </button>`;
  } else if (next.kind === 'card') {
    const h = next.house;
    const c = calendarOf(h);
    sheetBody.innerHTML = `<div class="card-head">
        <h1 class="title">${esc(h.label)}</h1>
        <button class="close" type="button" data-close aria-label="${t.close}">${CLOSE_ICON}</button>
      </div>
      <p class="card-days">${dayStrip(c.id)}</p>
      <p class="meta meta-lg"><span class="live is-${h.state}">${esc(statusOf(h))}</span><span>${esc(c.municipality)}</span>${distanceSpan(h.point)}</p>
      ${h.program ? `<p class="program">${esc(h.program)}</p>` : ''}
      <button class="cta" type="button" data-nav="${h.id}">${t.navigate}</button>`;
  } else {
    const rows = [...snapshot.calendars]
      .sort((a, b) => away(a.point) - away(b.point))
      .map(
        (c) => `<li><button class="row" data-cal="${c.id}" type="button">
          <span class="star" aria-hidden="true"></span>
          <span class="row-text"><span class="row-title">${esc(c.name)}</span>
          <span class="row-sub">${esc(c.municipality)}${user ? `, ${fmtDistance(away(c.point))}` : ''}</span></span>
        </button></li>`,
      )
      .join('');
    sheetBody.innerHTML = `<div class="sheet-head"><h1 class="h1">${t.waitingTitle}</h1>${dayStrip()}</div>
      <p class="list-title">${t.waitingList}</p>
      <ul class="rows">${rows}</ul>
      <p class="fine">${t.surprise}</p>`;
  }
}

function houseRow(h: SnapshotHouse): string {
  const c = calendarOf(h);
  return `<li><button class="row" data-house="${h.id}" type="button">
    ${doorMark(h.window, h.state, 'row')}
    <span class="row-text"><span class="row-title">${esc(h.label)}</span>
    <span class="row-sub">${esc(c.municipality)}${user ? `, ${fmtDistance(away(h.point))}` : ''}</span></span>
    <span class="row-state ${h.state === 'lit' ? 'is-lit' : 'is-today'}">${statusOf(h)}</span>
  </button></li>`;
}

function openNav(h: SnapshotHouse) {
  const [lat, lng] = [h.point.lat, h.point.lng];
  const links = [
    [t.navApps.mapy, `https://mapy.com/fnc/v1/route?end=${lat},${lng}&routeType=foot_fast`],
    [t.navApps.google, `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`],
    [t.navApps.apple, `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`],
  ];
  nav.innerHTML = `<div class="nav-group glass-solid">
      <div class="nav-head"><p id="nav-title" class="nav-title">${esc(h.label)}</p><p class="nav-sub">${t.navSub}</p></div>
      ${links.map(([name, href]) => `<a class="nav-row" href="${href}" target="_blank" rel="noopener">${name}${ARROW_OUT}</a>`).join('')}
    </div>
    <button class="nav-cancel glass-solid" type="button" data-cancel>${t.cancel}</button>`;
  nav.hidden = false;
  scrim.hidden = false;
  document.body.classList.add('is-nav');
  requestAnimationFrame(() => {
    nav.classList.add('is-open');
    scrim.classList.add('is-open');
  });
  nav.focus({ preventScroll: true });
}

function closeNav() {
  nav.classList.remove('is-open');
  document.body.classList.remove('is-nav');
  scrim.classList.remove('is-open');
  setTimeout(() => {
    nav.hidden = true;
    scrim.hidden = true;
  }, reducedMotion ? 0 : 260);
}


// ---------- map ----------

// Vite pre-bundling moves the library away from its worker file; point it back.
maplibregl.setWorkerUrl(workerUrl);

const czPolygon = (czOutline as GeoJSON.GeometryCollection).geometries[0] as GeoJSON.Polygon;

/** 0 is the day palette, 1 the approved night. Moves only at dusk, as one gentle event. */
let nightK = night ? 1 : 0;
/** How far tonight's windows have come on, 0 to 1. Fades the glow in when a house lights up. */
let lightK = 1;
const palette = (): Palette => mixPalette(DAY, NIGHT, nightK);
/** Sets the palette name for CSS and the browser chrome colour. */
function setTheme(name: 'day' | 'night') {
  document.documentElement.dataset.theme = name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', name === 'day' ? DAY.ground : NIGHT.ground);
}
setTheme(night ? 'night' : 'day');

const map: MlMap = new maplibregl.Map({
  container: 'map',
  style: mapStyle(palette(), czPolygon),
  bounds: CZ_BOUNDS,
  fitBoundsOptions: { padding: { top: 90, bottom: 330, left: 8, right: 8 } },
  attributionControl: false,
  maxPitch: 70,
  canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true },
  fadeDuration: 200,
});
(window as unknown as { map: MlMap }).map = map;
$('#map').style.background = palette().space;

const wide = () => innerWidth >= 760;

function sheetPad() {
  return sheet.getBoundingClientRect().height + 8;
}

const sheetPadding = () => (wide() ? { top: 60, bottom: 0, left: 420, right: 0 } : { top: 120, bottom: sheetPad(), left: 0, right: 0 });

function villageCamera(h: SnapshotHouse) {
  return { center: ll(h.point) as LngLatLike, zoom: 17.25, pitch: 60, bearing: 52, padding: sheetPadding() };
}

function republicCamera() {
  const cam = map.cameraForBounds(CZ_BOUNDS, { padding: { top: 80, bottom: sheetPad() + 20, left: 6, right: 6 } });
  return { ...cam, pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 } };
}

/** Above the globe the sheet still covers the lower half, so the Earth sits in the upper half. */
const globeCamera = (cam: typeof EUROPE) => ({ ...cam, padding: { top: 60, bottom: sheetPad(), left: 0, right: 0 } });

/**
 * The visitor's surroundings in 3D: the visitor and the nearest house of tonight both in view.
 * Closer houses give a lower, closer camera; the zoom stays where buildings stand in 3D.
 */
function surroundCamera(u: Point, h: SnapshotHouse) {
  const d = Math.max(meters(u, h.point), 90);
  const zoom = Math.min(17.2, Math.max(14.8, 17.4 - Math.log2(d / 90)));
  const mid: Point = { lat: (u.lat + h.point.lat) / 2, lng: (u.lng + h.point.lng) / 2 };
  return { center: ll(mid) as LngLatLike, zoom, pitch: 58, bearing: 40, padding: sheetPadding() };
}

/** Far from any light: the visitor and the nearest lit window both on screen, flat. */
function nearestCamera(u: Point, h: SnapshotHouse) {
  const b: [number, number, number, number] = [
    Math.min(u.lng, h.point.lng),
    Math.min(u.lat, h.point.lat),
    Math.max(u.lng, h.point.lng),
    Math.max(u.lat, h.point.lat),
  ];
  const cam = map.cameraForBounds(b, { padding: { top: 140, bottom: sheetPad() + 60, left: 60, right: 60 }, maxZoom: 13 });
  return { ...cam, pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 } };
}

/** Paint of our own layers that follows the palette and the evening. */
function ownPaint(P: Palette): Record<string, Record<string, unknown>> {
  const k = nightK;
  return {
    mask: { 'fill-color': P.veil },
    'cz-fill': { 'fill-color': P.czFill },
    regions: { 'line-color': P.region },
    'cz-border': { 'line-color': P.czBorder },
    'warm-walls': { 'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'glow'], 0, P.wall0, 0.5, P.wall1, 1, P.wall2] },
    'past-glow': { 'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 13.5, 0.28 * k] },
    'cal-core': {
      'circle-color': ['match', ['get', 'state'], 'lit', WARM_CORE, 'today', P.czFill, mixColor('#9a8a70', '#e9e2d4', k)],
      'circle-stroke-color': mixColor('#c47a2c', '#d9a868', k),
    },
    'cal-label': {
      'text-color': ['match', ['get', 'state'], 'lit', '#f3dcb8', mixColor('#3d4452', '#a9b1c4', k)],
      'text-halo-color': P.halo,
    },
  };
}

function applyTheme() {
  const P = palette();
  for (const set of [themedPaint(P), ownPaint(P)]) {
    for (const [layer, props] of Object.entries(set)) {
      if (!map.getLayer(layer)) continue;
      for (const [prop, value] of Object.entries(props)) map.setPaintProperty(layer, prop as never, value as never);
    }
  }
  map.setSky(skyOf(P) as never);
  $('#map').style.background = P.space;
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Runs `step` from 0 to 1 over `ms` on animation frames. */
function tween(ms: number, step: (k: number) => void): Promise<void> {
  if (reducedMotion || ms <= 0) {
    step(1);
    return Promise.resolve();
  }
  return new Promise((done) => {
    const t0 = performance.now();
    const tick = () => {
      const x = Math.min(1, (performance.now() - t0) / ms);
      step(easeInOut(x));
      if (x < 1) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
}

/** Dusk as an event: the day map darkens into the night one, the interface follows in CSS. */
async function toNight(ms = 3200) {
  setTheme('night');
  night = true;
  await tween(ms, (k) => {
    nightK = k;
    applyTheme();
  });
}

/** Sunset: every house of today lights its window at once and the glow spreads. */
async function lightUp(ms = 2400) {
  lightK = 0;
  for (const h of tonight) {
    h.state = 'lit';
    const el = markers.get(h.id)?.getElement();
    el?.classList.replace('is-today', 'is-lit');
    el?.setAttribute('aria-label', `${h.label}, ${statusOf(h)}`);
    el?.querySelector('.door')?.classList.replace('is-today', 'is-lit');
  }
  (map.getSource('tonight') as GeoJSONSource).setData(tonightData());
  (map.getSource('calendars') as GeoJSONSource).setData(calendarData());
  renderSheet(mode);
  lightBuildings();
  await tween(ms, (k) => {
    lightK = k;
    glow();
  });
}

function addData() {
  // The world beyond Czechia stays in the dark but readable, so zooming out is one continuous move.
  const holes = [czPolygon.coordinates[0]];
  map.addSource('mask', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], ...holes] },
    },
  });
  map.addSource('cz', { type: 'geojson', data: czOutline as GeoJSON.GeoJSON });
  map.addSource('regions', { type: 'geojson', data: regionLines as GeoJSON.GeoJSON });
  const P = palette();

  map.addLayer(
    {
      id: 'mask',
      type: 'fill',
      source: 'mask',
      paint: { 'fill-color': P.veil, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 2.5, 0, 4.5, 0.32, 7, 0.4, 10, 0.3, 13, 0] },
    },
    'buildings',
  );
  map.addLayer(
    {
      id: 'cz-fill',
      type: 'fill',
      source: 'cz',
      maxzoom: 11,
      paint: { 'fill-color': P.czFill, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.9, 10, 0] },
    },
    'buildings',
  );
  map.addLayer(
    {
      id: 'regions',
      type: 'line',
      source: 'regions',
      paint: { 'line-color': P.region, 'line-width': 0.8, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 0, 6, 0.9, 10, 0] },
    },
    'buildings',
  );
  map.addLayer(
    {
      id: 'cz-border',
      type: 'line',
      source: 'cz',
      paint: {
        'line-color': P.czBorder,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 5, 1, 10, 1.6],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.35, 4, 0.7, 6, 0.9, 12, 0.25],
      },
    },
    'buildings',
  );

  // Ground light pool around tonight's lit houses, beneath the buildings.
  map.addSource('tonight', { type: 'geojson', data: tonightData() });
  const lat0 = 50;
  map.addLayer(
    {
      id: 'pool-wide',
      type: 'circle',
      source: 'tonight',
      minzoom: 11,
      filter: ['==', ['get', 'state'], 'lit'],
      paint: {
        'circle-radius': groundRadius(120, lat0) as never,
        'circle-color': '#ff8a2a',
        'circle-blur': 1,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 13, 0.24],
        'circle-pitch-alignment': 'map',
      },
    },
    'buildings',
  );
  map.addLayer(
    {
      id: 'pool-core',
      type: 'circle',
      source: 'tonight',
      minzoom: 11,
      filter: ['==', ['get', 'state'], 'lit'],
      paint: {
        'circle-radius': groundRadius(48, lat0) as never,
        'circle-color': '#ffc46e',
        'circle-blur': 0.9,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 13, 0.7],
        'circle-pitch-alignment': 'map',
      },
    },
    'buildings',
  );

  // Past houses: faint warm embers at their exact points.
  map.addSource('past', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: past.map((h) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: ll(h.point) } })),
    },
  });
  map.addLayer({
    id: 'past-glow',
    type: 'circle',
    source: 'past',
    minzoom: 12,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 17, 16],
      'circle-color': WARM,
      'circle-blur': 1,
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 13.5, 0.28 * nightK],
    },
  });

  // Lit building and warm walls around it, filled once tiles are in.
  map.addSource('warm-walls', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('lit-building', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'warm-walls',
    type: 'fill-extrusion',
    source: 'warm-walls',
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'glow'], 0, P.wall0, 0.5, P.wall1, 1, P.wall2],
      'fill-extrusion-height': ['get', 'h'],
      'fill-extrusion-base': ['get', 'b'],
      'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 0.96],
      'fill-extrusion-vertical-gradient': true,
    },
  });
  map.addLayer({
    id: 'lit-building',
    type: 'fill-extrusion',
    source: 'lit-building',
    paint: {
      'fill-extrusion-color': '#ffa646',
      'fill-extrusion-height': ['get', 'h'],
      'fill-extrusion-base': ['get', 'b'],
      'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 1],
      'fill-extrusion-vertical-gradient': false,
    },
  });
  // Bloom: the window light spilling into the air, drawn over the roofs.
  map.addLayer({
    id: 'bloom',
    type: 'circle',
    source: 'tonight',
    minzoom: 13,
    filter: ['==', ['get', 'state'], 'lit'],
    paint: {
      'circle-radius': groundRadius(22, 50) as never,
      'circle-color': '#ffd391',
      'circle-blur': 1,
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 15, 0.5],
      'circle-pitch-alignment': 'viewport',
    },
  });

  // Republic, Europe and the globe: each calendar is one light. Fades out as the village takes over.
  map.addSource('calendars', { type: 'geojson', data: calendarData() });
  const fadeOut = (v: number) => ['interpolate', ['linear'], ['zoom'], 9.5, v, 12, 0];
  map.addLayer({
    id: 'cal-halo',
    type: 'circle',
    source: 'calendars',
    filter: ['==', ['get', 'state'], 'lit'],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 7, 3, 16, 5, 34, 10, 60],
      'circle-color': '#ff8f2c',
      'circle-blur': 1,
      'circle-opacity': fadeOut(0.38) as never,
    },
  });
  map.addLayer({
    id: 'cal-glow',
    type: 'circle',
    source: 'calendars',
    filter: ['==', ['get', 'state'], 'lit'],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 2.5, 3, 6, 5, 11, 10, 18],
      'circle-color': '#ffc370',
      'circle-blur': 0.8,
      'circle-opacity': fadeOut(0.9) as never,
    },
  });
  map.addLayer({
    id: 'cal-core',
    type: 'circle',
    source: 'calendars',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, ['match', ['get', 'state'], 'lit', 1.4, 'today', 1.6, 1], 5, ['match', ['get', 'state'], 'lit', 3.6, 'today', 4, 2.6]],
      'circle-color': ['match', ['get', 'state'], 'lit', WARM_CORE, 'today', P.czFill, '#e9e2d4'],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, ['match', ['get', 'state'], 'today', 1, 0], 5, ['match', ['get', 'state'], 'today', 1.6, 0]],
      'circle-stroke-color': '#d9a868',
      'circle-opacity': fadeOut(1) as never,
      'circle-stroke-opacity': fadeOut(1) as never,
    },
  });
  map.addLayer({
    id: 'cal-waiting-halo',
    type: 'circle',
    source: 'calendars',
    filter: ['==', ['get', 'state'], 'waiting'],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 5, 9],
      'circle-color': '#d7c8ae',
      'circle-blur': 1,
      'circle-opacity': fadeOut(0.35) as never,
    },
  });
  map.addLayer({
    id: 'cal-label',
    type: 'symbol',
    source: 'calendars',
    minzoom: 5.2,
    maxzoom: 11,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 12.5,
      'text-anchor': 'left',
      'text-offset': [1.1, 0],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': ['match', ['get', 'state'], 'lit', '#f3dcb8', '#a9b1c4'],
      'text-halo-color': '#05080f',
      'text-halo-width': 1.4,
      'text-opacity': fadeOut(1) as never,
    },
  });

  // User location: blue dot with accuracy halo, the only cool light on the map.
  map.addSource('user-acc', { type: 'geojson', data: userAccData() });
  map.addLayer({
    id: 'user-acc',
    type: 'fill',
    source: 'user-acc',
    minzoom: 12,
    paint: { 'fill-color': '#3d8bff', 'fill-opacity': 0.14 },
  });
  map.addLayer({
    id: 'user-acc-line',
    type: 'line',
    source: 'user-acc',
    minzoom: 12,
    paint: { 'line-color': '#3d8bff', 'line-opacity': 0.35, 'line-width': 1 },
  });
  applyTheme();
}

const snapped = new Set<string>();
const markers = new Map<string, maplibregl.Marker>();
let meMarker: maplibregl.Marker | null = null;

function tonightData(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: tonight.map((h) => ({ type: 'Feature', properties: { id: h.id, state: h.state }, geometry: { type: 'Point', coordinates: ll(h.point) } })),
  };
}

function calendarData(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: snapshot.calendars.map((c) => {
      const house = tonight.find((h) => h.calendarId === c.id);
      const state = snapshot.phase === 'upcoming' ? 'waiting' : (house?.state ?? 'none');
      return {
        type: 'Feature',
        properties: { id: c.id, name: c.municipality, state },
        geometry: { type: 'Point', coordinates: ll(house?.point ?? c.point) },
      };
    }),
  };
}

function userAccData(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: user ? [circlePolygon(user, userAccuracyM)] : [] };
}

/** Snaps tonight's house to the building it sits in, or the nearest one, and warms its neighbours. */
function lightBuildings() {
  if (map.getZoom() < 14.5) return;
  const feats = map.querySourceFeatures('omt', { sourceLayer: 'building' });
  if (!feats.length) return;
  const lit: GeoJSON.Feature[] = [];
  const walls: GeoJSON.Feature[] = [];
  for (const h of tonight) {
    const p = ll(h.point);
    let best: { f: GeoJSON.Feature; d: number; ring: number[][] } | null = null;
    for (const f of feats) {
      for (const ring of outerRings(f.geometry)) {
        const d = inRing(p, ring) ? 0 : meters(h.point, centroid(ring));
        if (d < 80 && (!best || d < best.d)) best = { f: f as GeoJSON.Feature, d, ring };
      }
    }
    const litRing = best?.ring;
    if (best && best.d > 0 && !snapped.has(h.id)) {
      // Prototype only: fixture points are synthetic, so move the house onto the nearest real roof.
      snapped.add(h.id);
      h.point = centroid(best.ring);
      markers.get(h.id)?.setLngLat(ll(h.point));
      (map.getSource('tonight') as GeoJSONSource).setData(tonightData());
      renderSheet(mode);
    }
    if (h.state !== 'lit') continue;
    if (best) {
      const pr = best.f.properties ?? {};
      lit.push({ type: 'Feature', properties: { h: (pr.render_height ?? 6) + 0.3, b: pr.render_min_height ?? 0 }, geometry: { type: 'Polygon', coordinates: [best.ring] } });
    } else {
      // No footprint in the tiles: a small cottage at the exact point.
      const sq = circlePolygon(h.point, 6, 4);
      lit.push({ ...sq, properties: { h: 6, b: 0 } });
    }
    const seen = new Set<string>();
    for (const f of feats) {
      for (const ring of outerRings(f.geometry)) {
        if (ring === litRing) continue;
        const c = centroid(ring);
        const key = `${c.lng.toFixed(6)},${c.lat.toFixed(6)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const d = meters(h.point, c);
        if (d > 130) continue;
        const pr = f.properties ?? {};
        walls.push({
          type: 'Feature',
          properties: { glow: Math.pow(1 - d / 130, 1.6), h: (pr.render_height ?? 6) + 0.15, b: pr.render_min_height ?? 0 },
          geometry: { type: 'Polygon', coordinates: [ring] },
        });
      }
    }
  }
  (map.getSource('lit-building') as GeoJSONSource).setData({ type: 'FeatureCollection', features: lit });
  (map.getSource('warm-walls') as GeoJSONSource).setData({ type: 'FeatureCollection', features: walls });
}

/** HTML marks for tonight's houses and the user, so they stay crisp and tappable. */
function addMarkers() {
  for (const h of tonight) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `pin ${h.state === 'lit' ? 'is-lit' : 'is-today'}`;
    el.setAttribute('aria-label', `${h.label}, ${statusOf(h)}`);
    el.innerHTML = `<span class="pin-inner"><span class="pin-head">${doorMark(h.window, h.state, 'pin')}<span class="pin-label">${esc(h.label)}</span></span><span class="pin-stem" aria-hidden="true"></span><span class="pin-dot" aria-hidden="true"></span></span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      renderSheet({ kind: 'card', house: h });
    });
    markers.set(h.id, new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(h.point)).addTo(map));
  }
  // Past houses: small dim open doors with their day, shown only close in.
  for (const h of past) {
    const el = document.createElement('div');
    el.className = 'pin pin-past';
    el.innerHTML = `<span class="pin-inner">${doorMark(h.window, 'past', 'past')}<span class="pin-stem" aria-hidden="true"></span></span>`;
    new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(h.point)).addTo(map);
  }
  placeMe();

  const syncPins = () => {
    document.body.classList.toggle('is-near', map.getZoom() > 12.2);
    document.body.classList.toggle('is-close', map.getZoom() > 14.6);
  };
  map.on('zoom', syncPins);
  syncPins();
}

function placeMe() {
  if (!user) return;
  if (!meMarker) {
    const me = document.createElement('div');
    me.className = 'me-wrap';
    me.innerHTML = '<span class="me"></span>';
    meMarker = new maplibregl.Marker({ element: me }).setLngLat(ll(user)).addTo(map);
  } else meMarker.setLngLat(ll(user));
  (map.getSource('user-acc') as GeoJSONSource | undefined)?.setData(userAccData());
}

/** Glow strength of tonight's windows, breathing slowly like a candle and faded in at lighting start. */
let breath = 1;
function glow() {
  const k = breath * lightK;
  map.setPaintProperty('pool-wide', 'circle-opacity', ['interpolate', ['linear'], ['zoom'], 11, 0, 13, 0.24 * k]);
  map.setPaintProperty('pool-core', 'circle-opacity', ['interpolate', ['linear'], ['zoom'], 11, 0, 13, 0.7 * (0.9 + 0.1 * breath) * lightK]);
  map.setPaintProperty('bloom', 'circle-opacity', ['interpolate', ['linear'], ['zoom'], 13, 0, 15, 0.5 * lightK]);
  map.setPaintProperty('lit-building', 'fill-extrusion-opacity', ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 0.25 + 0.75 * lightK]);
}

/** Breathing light pool: the one authored motion, tied to the window being lit. */
function pulse() {
  if (reducedMotion) return;
  const tick = (ms: number) => {
    breath = 0.84 + 0.16 * Math.sin((ms / 3400) * Math.PI * 2);
    if (map.getZoom() > 11) glow();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------- location ----------

/**
 * Asks the device for its location once. Resolves null when denied, unavailable or slower
 * than the timeout, so the map never waits on a blank screen. The point stays on the device.
 */
function askLocation(timeoutMs = LOCATE_TIMEOUT_MS): Promise<GeolocationPosition | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    // The browser's own timeout does not count the time a permission prompt stays open.
    const guard = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(guard);
        resolve(p);
      },
      () => {
        clearTimeout(guard);
        resolve(null);
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: timeoutMs },
    );
  });
}

/** Opens the map where the visitor stands: 3D around them when a light is near, else out to the nearest light. */
function arrive(p: GeolocationPosition, animate: boolean) {
  user = { lat: p.coords.latitude, lng: p.coords.longitude };
  userAccuracyM = Math.min(Math.max(p.coords.accuracy || 30, 8), 300);
  placeMe();
  const nearest = byDistance().find((h) => h.state === 'lit') ?? byDistance()[0];
  if (!nearest) {
    renderSheet(snapshot.phase === 'upcoming' ? { kind: 'waiting' } : { kind: 'list' });
    map.flyTo({ center: ll(user), zoom: 15.5, pitch: 55, bearing: 40, duration: animate && !reducedMotion ? 2800 : 0 });
    return;
  }
  const near = away(nearest.point) <= NEAR_M;
  // Far from any light the visitor's dot stays on even at this zoom, so both ends of the distance show.
  document.body.classList.toggle('is-far', !near);
  renderSheet(near ? { kind: 'peek', house: nearest } : { kind: 'nearest', house: nearest });
  const cam = near ? surroundCamera(user, nearest) : nearestCamera(user, nearest);
  if (animate && !reducedMotion) map.flyTo({ ...cam, duration: 3200, curve: 1.4, essential: true });
  else map.jumpTo(cam);
}

// ---------- wiring ----------

sheet.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const house = target.closest<HTMLElement>('[data-house],[data-open]');
  if (house) {
    const h = tonight.find((x) => x.id === (house.dataset.house ?? house.dataset.open)) as SnapshotHouse;
    renderSheet({ kind: 'card', house: h });
    map.flyTo({ ...villageCamera(h), duration: reducedMotion ? 0 : 4200, essential: true });
    return;
  }
  const cal = target.closest<HTMLElement>('[data-cal]');
  if (cal) {
    const c = snapshot.calendars.find((x) => x.id === cal.dataset.cal) as SnapshotCalendar;
    map.flyTo({ center: ll(c.point), zoom: 13, pitch: 45, bearing: -15, duration: reducedMotion ? 0 : 3200 });
    return;
  }
  if (target.closest('[data-close]')) {
    const back = byDistance()[0];
    renderSheet(back && user ? { kind: 'peek', house: back } : { kind: 'list' });
    return;
  }
  const navBtn = target.closest<HTMLElement>('[data-nav]');
  if (navBtn) openNav(tonight.find((x) => x.id === navBtn.dataset.nav) as SnapshotHouse);
});

nav.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-cancel]')) closeNav();
});
scrim.addEventListener('click', closeNav);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !nav.hidden) closeNav();
});

locateBtn.addEventListener('click', async () => {
  if (user) {
    map.flyTo({ center: ll(user), zoom: 16.8, pitch: 60, bearing: 52, duration: reducedMotion ? 0 : 2400 });
    return;
  }
  // A tap is a clear request, so the visitor may take their time with the permission prompt.
  const p = await askLocation(20_000);
  if (p) arrive(p, true);
});

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
search.addEventListener('input', () => {
  const q = fold(search.value.trim());
  if (!q) {
    results.hidden = true;
    return;
  }
  const hits = snapshot.calendars.filter((c) => fold(c.municipality).startsWith(q) || fold(c.name).includes(q));
  results.innerHTML = hits.length
    ? hits.map((c) => `<li><button type="button" class="result" data-cal="${c.id}"><span>${esc(c.municipality)}</span><span class="row-sub">${esc(c.name)}</span></button></li>`).join('')
    : `<li class="result-empty">${t.searchEmpty}</li>`;
  results.hidden = false;
});
results.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-cal]');
  if (!b) return;
  const c = snapshot.calendars.find((x) => x.id === b.dataset.cal) as SnapshotCalendar;
  const h = tonight.find((x) => x.calendarId === c.id);
  results.hidden = true;
  search.value = c.municipality;
  search.blur();
  if (h) {
    renderSheet({ kind: 'peek', house: h });
    map.flyTo({ ...villageCamera(h), duration: reducedMotion ? 0 : 5000 });
  } else {
    map.flyTo({ center: ll(c.point), zoom: 13, duration: reducedMotion ? 0 : 3000 });
  }
});

// ---------- scenes ----------

const radloTonight = tonight.find((h) => h.calendarId === 'cal-radlo');
const strazniceTonight = tonight.find((h) => h.calendarId === 'cal-straznice');

function initialSheet(): SheetMode {
  if (snapshot.phase === 'upcoming') return { kind: 'waiting' };
  if (!radloTonight) return { kind: 'list' };
  if (['vesnice', 'den', 'soumrak', 'let'].includes(scene)) return { kind: 'peek', house: radloTonight };
  if (scene === 'karta' || scene === 'navigovat') return { kind: 'card', house: radloTonight };
  return { kind: 'list' };
}

renderSheet(initialSheet());

/** Close-up of the house door in its states, for the design record. */
if (scene === 'znacka') {
  const tiles: [string, string, string, number][] = [
    ['day', 'today', t.stateToday, 12],
    ['dusk', 'dusk', t.stateDusk, 12],
    ['night', 'lit', t.lit, 12],
    ['night', 'past', t.statePast, 7],
  ];
  const el = document.createElement('section');
  el.className = 'specimen';
  el.innerHTML = tiles
    .map(
      ([sky, state, name, day]) => `<figure class="spec spec-${sky}" data-theme="${sky === 'day' ? 'day' : 'night'}">
        <span class="spec-pin pin is-${state === 'lit' ? 'lit' : 'today'}">${doorMark(day, state as SnapshotHouse['state'], state === 'past' ? 'past' : 'pin')}<span class="pin-stem"></span>${state === 'past' ? '' : '<span class="pin-dot"></span>'}</span>
        <figcaption>${name}</figcaption></figure>`,
    )
    .join('');
  document.body.append(el);
  void document.fonts.ready.then(() => ((window as unknown as { __ready: boolean }).__ready = true));
}
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--sheet-h', `${sheet.getBoundingClientRect().height}px`);
}).observe(sheet);

const status = window as unknown as { __ready?: boolean; __flightDone?: boolean };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resolves on the next idle, or right away when the map already is. */
const idle = () => new Promise<void>((r) => (map.loaded() && map.areTilesLoaded() ? r() : map.once('idle', () => r())));

let lightTimer = 0;
const scheduleLight = () => {
  clearTimeout(lightTimer);
  lightTimer = window.setTimeout(lightBuildings, 250);
};

// The location is asked for right away, in parallel with the style and tiles.
const located = scene === 'start' ? askLocation() : Promise.resolve(null);
const loadedAt = performance.now();

map.on('load', async () => {
  addData();
  addMarkers();

  const village = ['vesnice', 'karta', 'navigovat', 'den', 'soumrak', 'let'].includes(scene) && radloTonight;
  if (scene === 'evropa') map.jumpTo(globeCamera(EUROPE));
  else if (scene === 'zeme') map.jumpTo(globeCamera(EARTH));
  else if (village) map.jumpTo(villageCamera(radloTonight));
  else map.jumpTo(republicCamera());

  map.on('moveend', scheduleLight);
  map.on('sourcedata', (e) => {
    if (e.sourceId === 'omt' && e.isSourceLoaded) scheduleLight();
  });

  if (scene === 'start') {
    // Czechia is already on screen; the location, when it comes, takes over from there.
    const p = await located;
    if (p) arrive(p, performance.now() - loadedAt > 1200);
  }

  await idle();
  lightBuildings();
  if (village) map.jumpTo(villageCamera(radloTonight));
  await idle();
  lightBuildings();
  await idle();
  if (scene === 'navigovat' && radloTonight) openNav(radloTonight);

  if (scene === 'let' && radloTonight && strazniceTonight) {
    // From the visitor's village out to the whole Earth and back down into Strážnice.
    status.__ready = true;
    pulse();
    await wait(1000);
    map.flyTo({ ...globeCamera(EARTH), duration: 4800, curve: 1.2, essential: true });
    await new Promise((r) => map.once('moveend', r));
    await wait(700);
    renderSheet({ kind: 'peek', house: strazniceTonight });
    map.flyTo({ ...villageCamera(strazniceTonight), bearing: -28, duration: 5600, curve: 1.2, essential: true });
    await new Promise((r) => map.once('moveend', r));
    await idle();
    lightBuildings();
    await idle();
    status.__flightDone = true;
    return;
  }

  if (scene === 'soumrak' && radloTonight) {
    // Sunset compressed: the map darkens and, as the dark settles, the windows come on.
    status.__ready = true;
    await wait(1200);
    const dark = toNight(3200);
    await wait(2000);
    await Promise.all([dark, lightUp(2600)]);
    pulse();
    await wait(400);
    status.__flightDone = true;
    return;
  }

  status.__ready = true;
  pulse();
});
