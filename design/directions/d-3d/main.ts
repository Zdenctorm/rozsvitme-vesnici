/**
 * Direction D: a 3D night map. Prototype of the public map screen.
 *
 * URL `?scene=` picks the starting state for screenshots:
 * republika, vesnice, karta, navigovat, pred, let.
 */
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, LngLatLike, Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from '../../../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import './style.css';

import { sampleSnapshot, SAMPLE_EVENING } from '../../../src/domain/fixtures';
import type { Point, Snapshot, SnapshotCalendar, SnapshotHouse } from '../../../src/domain/snapshot';
import { nightStyle } from './night-style';
import { t } from './strings.cs';
import czOutline from './geo/cz.json';
import regionLines from './geo/hranice.json';

type Scene = 'republika' | 'vesnice' | 'karta' | 'navigovat' | 'pred' | 'let';

const params = new URLSearchParams(location.search);
const scene = (params.get('scene') ?? 'republika') as Scene;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 25 Nov 2026 evening in Prague: calendars wait, nothing is lit yet. */
const BEFORE_ADVENT = new Date('2026-11-25T17:00:00Z');
const now = scene === 'pred' ? BEFORE_ADVENT : SAMPLE_EVENING;
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

/** Mock device location on the edge of Rádlo. Never leaves the device in the real app. */
const USER: Point = { lat: 50.69652, lng: 15.11146 };
const USER_ACCURACY_M = 22;

const CZ_BOUNDS: [number, number, number, number] = [12.09, 48.55, 18.86, 51.06];
const WARM = '#ffb24d';
const WARM_CORE = '#fff0d2';

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

const walkMinutes = (m: number) => Math.max(1, Math.round(m / 75));

const dateLine = (() => {
  const s = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Prague' }).format(now);
  return s.charAt(0).toUpperCase() + s.slice(1);
})();

// ---------- data ----------

const calendarOf = (h: SnapshotHouse) => snapshot.calendars.find((c) => c.id === h.calendarId) as SnapshotCalendar;
const tonight = snapshot.houses.filter((h) => h.state !== 'past');
const past = snapshot.houses.filter((h) => h.state === 'past');
const byDistance = [...tonight].sort((a, b) => meters(USER, a.point) - meters(USER, b.point));
const radloTonight = tonight.find((h) => h.calendarId === 'cal-radlo') as SnapshotHouse | undefined;

function statusOf(h: SnapshotHouse): string {
  const hours = calendarOf(h).lightingHours;
  return h.state === 'lit' ? t.litUntil(hours.to) : t.litFrom(hours.from);
}

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

/** Custom window mark: a four-pane window, lit or waiting for its evening. */
function windowMark(lit: boolean, size = 22): string {
  return `<svg class="wmark ${lit ? 'is-lit' : 'is-dark'}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="3.5" width="16" height="17" rx="2.4" />
    <path d="M12 4v16M4.5 11.2h15" />
  </svg>`;
}

const CLOSE_ICON = '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg>';
const CHEVRON = '<svg class="icon chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5" /></svg>';
const ARROW_OUT = '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 13 13.5 6.5M8 6h6v6" /></svg>';

type SheetMode = { kind: 'list' } | { kind: 'peek'; house: SnapshotHouse } | { kind: 'card'; house: SnapshotHouse } | { kind: 'waiting' };
let mode: SheetMode = { kind: 'list' };

function renderSheet(next: SheetMode) {
  mode = next;
  sheet.dataset.mode = next.kind;
  if (next.kind === 'list') {
    const rows = byDistance
      .map((h) => {
        const c = calendarOf(h);
        return `<li><button class="row" data-house="${h.id}" type="button">
          ${windowMark(h.state === 'lit', 26)}
          <span class="row-text"><span class="row-title">${esc(h.label)}</span>
          <span class="row-sub">${esc(c.municipality)}, ${fmtDistance(meters(USER, h.point))}</span></span>
          <span class="row-state ${h.state === 'lit' ? 'is-lit' : ''}">${h.state === 'lit' ? t.litShort : esc(statusOf(h))}</span>
        </button></li>`;
      })
      .join('');
    sheetBody.innerHTML = `<div class="sheet-head"><h1 class="h1">${t.tonightTitle}</h1>
      <p class="sub">${esc(dateLine)}, ${t.tonightCount(new Set(tonight.map((h) => h.calendarId)).size)}</p></div>
      <ul class="rows">${rows}</ul>`;
  } else if (next.kind === 'peek') {
    const h = next.house;
    const d = meters(USER, h.point);
    sheetBody.innerHTML = `<button class="peek" type="button" data-open="${h.id}">
      <span class="peek-mark">${windowMark(h.state === 'lit', 30)}</span>
      <span class="peek-text"><span class="peek-title">${esc(h.label)}</span>
      <span class="row-sub">${esc(t.windowOf(h.window, calendarOf(h).name))}</span>
      <span class="meta"><span class="live ${h.state === 'lit' ? 'is-lit' : ''}">${esc(statusOf(h))}</span><span>${fmtDistance(d)}</span><span>${t.walk(walkMinutes(d))}</span></span></span>
    </button>`;
  } else if (next.kind === 'card') {
    const h = next.house;
    const c = calendarOf(h);
    const d = meters(USER, h.point);
    const pastCount = past.filter((p) => p.calendarId === c.id).length;
    sheetBody.innerHTML = `<div class="card-head">
        <h1 class="title">${esc(h.label)}</h1>
        <button class="close" type="button" data-close aria-label="${t.close}">${CLOSE_ICON}</button>
      </div>
      <p class="row-sub card-of">${windowMark(h.state === 'lit', 18)}${esc(t.windowOf(h.window, c.name))}</p>
      <p class="meta meta-lg"><span class="live ${h.state === 'lit' ? 'is-lit' : ''}">${esc(statusOf(h))}</span><span>${fmtDistance(d)}</span><span>${t.walk(walkMinutes(d))}</span></p>
      ${h.program ? `<p class="program">${esc(h.program)}</p>` : ''}
      <button class="cta" type="button" data-nav="${h.id}">${t.navigate}</button>
      <p class="fine">${pastCount ? esc(t.pastSoFar(pastCount)) + ' ' : ''}${t.secret}</p>`;
  } else {
    const days = Math.round((Date.parse('2026-12-01T00:00:00+01:00') - now.getTime()) / 86_400_000 + 0.49);
    const rows = [...snapshot.calendars]
      .sort((a, b) => meters(USER, a.point) - meters(USER, b.point))
      .map(
        (c) => `<li><button class="row" data-cal="${c.id}" type="button">
          <span class="star" aria-hidden="true"></span>
          <span class="row-text"><span class="row-title">${esc(c.name)}</span>
          <span class="row-sub">${esc(c.municipality)}, ${fmtDistance(meters(USER, c.point))}</span></span>
          <span class="row-state row-count"><b>${c.filledWindows}</b>${t.windowsWord(c.filledWindows)}</span>
        </button></li>`,
      )
      .join('');
    sheetBody.innerHTML = `<div class="sheet-head"><h1 class="countdown">${t.countdownBig(days)}</h1>
      <p class="sub">${t.countdownSub}</p></div>
      <p class="list-title">${t.waitingTitle(snapshot.calendars.length)}</p>
      <ul class="rows">${rows}</ul>
      <p class="fine">${t.surprise}</p>`;
  }
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

const map: MlMap = new maplibregl.Map({
  container: 'map',
  style: nightStyle(),
  bounds: CZ_BOUNDS,
  fitBoundsOptions: { padding: { top: 90, bottom: 330, left: 8, right: 8 } },
  attributionControl: false,
  maxPitch: 70,
  canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true },
  fadeDuration: 200,
});
(window as unknown as { map: MlMap }).map = map;

const wide = () => innerWidth >= 760;

function sheetPad() {
  return sheet.getBoundingClientRect().height + 8;
}

function villageCamera(h: SnapshotHouse) {
  return {
    center: ll(h.point) as LngLatLike,
    zoom: 17.25,
    pitch: 60,
    bearing: 52,
    padding: wide() ? { top: 60, bottom: 0, left: 420, right: 0 } : { top: 120, bottom: sheetPad(), left: 0, right: 0 },
  };
}

function republicCamera() {
  const cam = map.cameraForBounds(CZ_BOUNDS, { padding: { top: 80, bottom: sheetPad() + 20, left: 6, right: 6 } });
  return { ...cam, pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 } };
}

function addData() {
  // Neighbouring countries sink into the night.
  const czGeoms = 'geometries' in czOutline ? (czOutline as GeoJSON.GeometryCollection).geometries : (czOutline as GeoJSON.FeatureCollection).features.map((f) => f.geometry);
  const holes = czGeoms.flatMap(outerRings);
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

  map.addLayer(
    {
      id: 'mask',
      type: 'fill',
      source: 'mask',
      paint: { 'fill-color': '#020308', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.82, 10, 0.55, 13, 0] },
    },
    'buildings',
  );
  map.addLayer(
    {
      id: 'cz-fill',
      type: 'fill',
      source: 'cz',
      maxzoom: 11,
      paint: { 'fill-color': '#0c1324', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.9, 10, 0] },
    },
    'buildings',
  );
  map.addLayer(
    {
      id: 'regions',
      type: 'line',
      source: 'regions',
      paint: { 'line-color': '#26314b', 'line-width': 0.8, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.9, 10, 0] },
    },
    'buildings',
  );
  map.addLayer(
    {
      id: 'cz-border',
      type: 'line',
      source: 'cz',
      paint: {
        'line-color': '#3b4868',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 10, 1.6],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.9, 12, 0.25],
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
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 13.5, 0.28],
    },
  });
  map.addLayer({
    id: 'past-core',
    type: 'circle',
    source: 'past',
    minzoom: 12,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1.4, 17, 3],
      'circle-color': '#ffd59a',
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 13.5, 0.6],
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
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'glow'], 0, '#1b2236', 0.5, '#4a3a33', 1, '#8a5f36'],
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

  // Republic: each calendar is one light. Fades out as the village takes over.
  map.addSource('calendars', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: snapshot.calendars.map((c) => {
        const house = tonight.find((h) => h.calendarId === c.id);
        const state = snapshot.phase === 'upcoming' ? 'waiting' : (house?.state ?? 'none');
        return {
          type: 'Feature',
          properties: { id: c.id, name: c.municipality, state, filled: String(c.filledWindows) },
          geometry: { type: 'Point', coordinates: ll(house?.point ?? c.point) },
        };
      }),
    },
  });
  const fadeOut = (v: number) => ['interpolate', ['linear'], ['zoom'], 9.5, v, 12, 0];
  map.addLayer({
    id: 'cal-halo',
    type: 'circle',
    source: 'calendars',
    filter: ['==', ['get', 'state'], 'lit'],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 34, 10, 60],
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
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 11, 10, 18],
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
      'circle-radius': ['match', ['get', 'state'], 'lit', 3.6, 'today', 4, 2.6],
      'circle-color': ['match', ['get', 'state'], 'lit', WARM_CORE, 'today', '#0c1324', '#e9e2d4'],
      'circle-stroke-width': ['match', ['get', 'state'], 'today', 1.6, 0],
      'circle-stroke-color': '#d9a868',
      'circle-opacity': fadeOut(1) as never,
    },
  });
  map.addLayer({
    id: 'cal-waiting-halo',
    type: 'circle',
    source: 'calendars',
    filter: ['==', ['get', 'state'], 'waiting'],
    paint: {
      'circle-radius': 9,
      'circle-color': '#d7c8ae',
      'circle-blur': 1,
      'circle-opacity': fadeOut(0.35) as never,
    },
  });
  map.addLayer({
    id: 'cal-label',
    type: 'symbol',
    source: 'calendars',
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
  map.addSource('user-acc', { type: 'geojson', data: circlePolygon(USER, USER_ACCURACY_M) });
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
}

const snapped = new Set<string>();
const markers = new Map<string, maplibregl.Marker>();

function tonightData(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: tonight.map((h) => ({ type: 'Feature', properties: { id: h.id, state: h.state }, geometry: { type: 'Point', coordinates: ll(h.point) } })),
  };
}

/** Snaps tonight's house to the building it sits in, or the nearest one, and warms its neighbours. */
function lightBuildings() {
  if (map.getZoom() < 14.5) return;
  const feats = map.querySourceFeatures('omt', { sourceLayer: 'building' });
  if (!feats.length) return;
  const lit: GeoJSON.Feature[] = [];
  const walls: GeoJSON.Feature[] = [];
  for (const h of tonight.filter((x) => x.state === 'lit')) {
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
    el.innerHTML = `<span class="pin-inner"><span class="pin-label">${windowMark(h.state === 'lit', 16)}${esc(h.label)}</span><span class="pin-stem" aria-hidden="true"></span><span class="pin-dot" aria-hidden="true"></span></span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      renderSheet({ kind: 'card', house: h });
    });
    markers.set(h.id, new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(h.point)).addTo(map));
  }
  const me = document.createElement('div');
  me.className = 'me-wrap';
  me.innerHTML = '<span class="me"></span>';
  new maplibregl.Marker({ element: me }).setLngLat(ll(USER)).addTo(map);

  const syncPins = () => document.body.classList.toggle('is-near', map.getZoom() > 12.2);
  map.on('zoom', syncPins);
  syncPins();
}

/** Breathing light pool: the one authored motion, tied to the window being lit. */
function pulse() {
  if (reducedMotion) return;
  const base = [0.24, 0.7];
  const tick = (ms: number) => {
    const k = 0.84 + 0.16 * Math.sin((ms / 3400) * Math.PI * 2);
    if (map.getZoom() > 11) {
      map.setPaintProperty('pool-wide', 'circle-opacity', ['interpolate', ['linear'], ['zoom'], 11, 0, 13, base[0] * k]);
      map.setPaintProperty('pool-core', 'circle-opacity', ['interpolate', ['linear'], ['zoom'], 11, 0, 13, base[1] * (0.9 + 0.1 * k)]);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
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
    renderSheet(radloTonight ? { kind: 'peek', house: radloTonight } : { kind: 'list' });
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

locateBtn.addEventListener('click', () => {
  map.flyTo({ center: ll(USER), zoom: 16.8, pitch: 60, bearing: 52, duration: reducedMotion ? 0 : 2400 });
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

function initialSheet(): SheetMode {
  if (scene === 'pred') return { kind: 'waiting' };
  if (!radloTonight) return { kind: 'list' };
  if (scene === 'vesnice') return { kind: 'peek', house: radloTonight };
  if (scene === 'karta' || scene === 'navigovat') return { kind: 'card', house: radloTonight };
  return { kind: 'list' };
}

renderSheet(initialSheet());
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--sheet-h', `${sheet.getBoundingClientRect().height}px`);
}).observe(sheet);

const status = window as unknown as { __ready?: boolean; __flightDone?: boolean };

/** Resolves on the next idle, or right away when the map already is. */
const idle = () => new Promise<void>((r) => (map.loaded() && map.areTilesLoaded() ? r() : map.once('idle', () => r())));

let lightTimer = 0;
const scheduleLight = () => {
  clearTimeout(lightTimer);
  lightTimer = window.setTimeout(lightBuildings, 250);
};

map.on('load', async () => {
  addData();
  addMarkers();

  if (scene === 'pred' || scene === 'republika' || scene === 'let') {
    map.jumpTo(republicCamera());
  } else if (radloTonight) {
    map.jumpTo(villageCamera(radloTonight));
  }

  map.on('moveend', scheduleLight);
  map.on('sourcedata', (e) => {
    if (e.sourceId === 'omt' && e.isSourceLoaded) scheduleLight();
  });

  await idle();
  lightBuildings();
  if (radloTonight && ['vesnice', 'karta', 'navigovat'].includes(scene)) map.jumpTo(villageCamera(radloTonight));
  await idle();
  lightBuildings();
  await idle();
  if (scene === 'navigovat' && radloTonight) openNav(radloTonight);

  if (scene === 'let' && radloTonight) {
    const h = radloTonight;
    status.__ready = true;
    await new Promise((r) => setTimeout(r, 1200));
    const cam = villageCamera(h);
    renderSheet({ kind: 'peek', house: h });
    map.flyTo({ ...cam, padding: wide() ? cam.padding : { ...cam.padding, bottom: sheetPad() }, duration: 7200, curve: 1.5, essential: true });
    await new Promise((r) => map.once('moveend', r));
    await idle();
    lightBuildings();
    await idle();
    status.__flightDone = true;
    pulse();
    return;
  }
  status.__ready = true;
  pulse();
});
