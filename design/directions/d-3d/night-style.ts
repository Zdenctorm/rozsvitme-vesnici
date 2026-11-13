/**
 * Map style over OpenFreeMap vector tiles (OpenMapTiles schema), in two palettes.
 *
 * Night: deep blue-black ground, roads barely there, 3D buildings in slate blue.
 * Warm light is reserved for advent windows, added by main.ts on top.
 * Day: a pale wintry map for planning the evening, snow-white roads, frost-grey roofs.
 *
 * The globe projection lets the visitor zoom out past Czechia to Europe and the whole Earth.
 * Below zoom 7 only coastlines and country borders remain, barely visible.
 */
import type { StyleSpecification } from 'maplibre-gl';

export interface Palette {
  space: string;
  ground: string;
  /** Land and sea on the globe, a shade lifted from the deeper space around it. */
  globeLand: string;
  globeWater: string;
  groundCity: string;
  water: string;
  waterLine: string;
  coast: string;
  country: string;
  wood: string;
  roadMinor: string;
  roadMajor: string;
  roadMotorway: string;
  label: string;
  labelStrong: string;
  streetLabel: string;
  halo: string;
  bld0: string;
  bld1: string;
  bld2: string;
  bld3: string;
  sky: string;
  horizon: string;
  fog: string;
  /** Faint city lights abroad on the globe. Transparent by day. */
  city: string;
  /** Veil over the world outside Czechia. */
  veil: string;
  /** Czechia slightly lifted from its neighbours. */
  czFill: string;
  czBorder: string;
  region: string;
  /** Walls of neighbouring houses, unlit and fully warmed by a lit window. */
  wall0: string;
  wall1: string;
  wall2: string;
}

export const NIGHT: Palette = {
  space: '#02040a',
  ground: '#070b14',
  globeLand: '#0e1629',
  globeWater: '#080f1f',
  groundCity: '#0a0f1b',
  water: '#050a17',
  waterLine: '#0d1a33',
  coast: '#1a2949',
  country: '#1d2740',
  wood: '#060a12',
  roadMinor: '#141b2a',
  roadMajor: '#1b2437',
  roadMotorway: '#222d45',
  label: '#7f8aa3',
  labelStrong: '#b4bdd1',
  streetLabel: '#5d6880',
  halo: '#05080f',
  bld0: '#1a2236',
  bld1: '#1f2942',
  bld2: '#27334f',
  bld3: '#303e60',
  sky: '#03050b',
  horizon: '#101a33',
  fog: '#060a14',
  city: 'rgba(196, 206, 228, 0.32)',
  veil: '#020308',
  czFill: '#0c1324',
  czBorder: '#3b4868',
  region: '#26314b',
  wall0: '#1b2236',
  wall1: '#4a3a33',
  wall2: '#8a5f36',
};

export const DAY: Palette = {
  space: '#cfd8e3',
  ground: '#e8ecf1',
  globeLand: '#eef1f5',
  globeWater: '#c9d5e3',
  groundCity: '#e1e6ec',
  water: '#c3d0df',
  waterLine: '#aebfd3',
  coast: '#a9b8ca',
  country: '#b3bdcb',
  wood: '#dbe2e2',
  roadMinor: '#fbfcfd',
  roadMajor: '#ffffff',
  roadMotorway: '#f4ece1',
  label: '#5d6779',
  labelStrong: '#2c3442',
  streetLabel: '#7a8394',
  halo: '#f2f4f7',
  bld0: '#d5dbe3',
  bld1: '#ccd3dd',
  bld2: '#c2cad6',
  bld3: '#b7c0ce',
  sky: '#dde5ee',
  horizon: '#eef2f6',
  fog: '#e8edf2',
  city: 'rgba(196, 206, 228, 0)',
  veil: '#d3dae3',
  czFill: '#f3f5f8',
  czBorder: '#8f9bae',
  region: '#b9c2d0',
  wall0: '#d5dbe3',
  wall1: '#d5dbe3',
  wall2: '#d5dbe3',
};

/** Linear mix of two palettes, 0 = a, 1 = b. Drives the dusk transition. */
export function mixPalette(a: Palette, b: Palette, k: number): Palette {
  const out = {} as Palette;
  for (const key of Object.keys(a) as (keyof Palette)[]) out[key] = mixColor(a[key], b[key], k);
  return out;
}

function rgba(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = c.match(/[\d.]+/g) as string[];
  return [Number(m[0]), Number(m[1]), Number(m[2]), m[3] === undefined ? 1 : Number(m[3])];
}

export function mixColor(a: string, b: string, k: number): string {
  const x = rgba(a);
  const y = rgba(b);
  const v = x.map((n, i) => n + (y[i] - n) * k);
  return `rgba(${Math.round(v[0])}, ${Math.round(v[1])}, ${Math.round(v[2])}, ${v[3].toFixed(3)})`;
}

const NAME = ['coalesce', ['get', 'name:cs'], ['get', 'name:latin'], ['get', 'name']] as const;

/** Paint values that follow the palette; main.ts re-applies them during the dusk transition. */
export function themedPaint(P: Palette): Record<string, Record<string, unknown>> {
  return {
    bg: { 'background-color': ['interpolate', ['linear'], ['zoom'], 3, P.globeLand, 6, P.ground] },
    residential: { 'fill-color': P.groundCity },
    wood: { 'fill-color': P.wood },
    water: { 'fill-color': ['interpolate', ['linear'], ['zoom'], 3, P.globeWater, 6, P.water] },
    coast: { 'line-color': P.coast },
    'water-edge': { 'line-color': P.waterLine },
    waterway: { 'line-color': P.waterLine },
    'country-border': { 'line-color': P.country },
    'road-path': { 'line-color': P.roadMinor },
    'road-minor': { 'line-color': P.roadMinor },
    'road-major': { 'line-color': P.roadMajor },
    'road-motorway': { 'line-color': P.roadMotorway },
    buildings: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, P.bld0, 10, P.bld1, 40, P.bld2, 120, P.bld3],
    },
    'city-lights': { 'circle-color': P.city },
    'street-names': { 'text-color': P.streetLabel, 'text-halo-color': P.halo },
    'place-village': { 'text-color': P.label, 'text-halo-color': P.halo },
    'place-city': { 'text-color': P.labelStrong, 'text-halo-color': P.halo },
  };
}

export function skyOf(P: Palette) {
  return {
    'sky-color': P.sky,
    'horizon-color': P.horizon,
    'fog-color': P.fog,
    'sky-horizon-blend': 0.6,
    'horizon-fog-blend': 0.7,
    'fog-ground-blend': 0.55,
    // MapLibre's atmosphere is daylight scattering lit by the map light: on a night globe it
    // washes the Earth blue and draws a day-night band. Off; the globe reads by its lifted disc.
    'atmosphere-blend': 0,
  };
}

export function mapStyle(P: Palette, czPolygon: GeoJSON.Polygon): StyleSpecification {
  const paint = themedPaint(P);
  return {
    version: 8,
    projection: { type: 'globe' },
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
    },
    sky: skyOf(P) as never,
    light: { anchor: 'map', position: [1.4, 200, 35], color: '#ffffff', intensity: 0.28 },
    layers: [
      { id: 'bg', type: 'background', paint: paint.bg as never },
      {
        id: 'residential',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood', 'commercial', 'retail']]],
        paint: { ...(paint.residential as object), 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0, 12, 1] },
      },
      {
        id: 'wood',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
        paint: { ...(paint.wood as object), 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 11, 1] },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'omt',
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: paint.water as never,
      },
      {
        // Coastlines on the globe and over Europe, a hairline that fades as the land takes over.
        id: 'coast',
        type: 'line',
        source: 'omt',
        'source-layer': 'water',
        maxzoom: 9,
        filter: ['==', ['get', 'class'], 'ocean'],
        paint: {
          ...(paint.coast as object),
          'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 6, 0.8],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 6, 0.7, 9, 0],
        },
      },
      {
        id: 'water-edge',
        type: 'line',
        source: 'omt',
        'source-layer': 'water',
        minzoom: 12,
        paint: { ...(paint['water-edge'] as object), 'line-width': 1, 'line-opacity': 0.7 },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'omt',
        'source-layer': 'waterway',
        minzoom: 11,
        paint: { ...(paint.waterway as object), 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 17, 3] },
      },
      {
        id: 'country-border',
        type: 'line',
        source: 'omt',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1], ['!=', ['get', 'disputed'], 1]],
        paint: {
          ...(paint['country-border'] as object),
          'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.4, 6, 0.8, 10, 1.2],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.7, 7, 0.8, 11, 0.4],
        },
      },
      {
        id: 'road-path',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        minzoom: 15,
        filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]],
        paint: { ...(paint['road-path'] as object), 'line-width': 1, 'line-dasharray': [2, 2] },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        minzoom: 12,
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          ...(paint['road-minor'] as object),
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 0.5, 15, 3, 18, 16],
        },
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        minzoom: 8,
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          ...(paint['road-major'] as object),
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 11, 1],
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 8, 0.4, 13, 2, 18, 22],
        },
      },
      {
        id: 'road-motorway',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        minzoom: 6,
        filter: ['==', ['get', 'class'], 'motorway'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          ...(paint['road-motorway'] as object),
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.25, 10, 0.9],
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 6, 0.4, 13, 3, 18, 26],
        },
      },
      {
        id: 'buildings',
        type: 'fill-extrusion',
        source: 'omt',
        'source-layer': 'building',
        minzoom: 13,
        paint: {
          ...(paint.buildings as object),
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 0.96],
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        // Big cities abroad as cold pin-pricks, so the globe is not empty. Never warm, never inside Czechia.
        id: 'city-lights',
        type: 'circle',
        source: 'omt',
        'source-layer': 'place',
        minzoom: 1.5,
        maxzoom: 8,
        filter: ['all', ['==', ['get', 'class'], 'city'], ['<=', ['coalesce', ['get', 'rank'], 99], 6], ['!', ['within', czPolygon as never]]],
        paint: {
          ...(paint['city-lights'] as object),
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 0.7, 7, 1.5],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 1.5, 0, 3, 1, 6.5, 1, 8, 0],
          'circle-pitch-alignment': 'map',
        },
      },
      {
        id: 'street-names',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'transportation_name',
        minzoom: 15.5,
        layout: {
          'symbol-placement': 'line',
          'text-field': NAME as never,
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
          'text-max-angle': 30,
          'symbol-spacing': 300,
        },
        paint: { ...(paint['street-names'] as object), 'text-halo-width': 1.2 },
      },
      {
        id: 'place-village',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'place',
        minzoom: 10,
        maxzoom: 15,
        filter: ['in', ['get', 'class'], ['literal', ['village', 'town', 'suburb', 'hamlet']]],
        layout: {
          'text-field': NAME as never,
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 14, 14],
          'text-letter-spacing': 0.02,
        },
        paint: { ...(paint['place-village'] as object), 'text-halo-width': 1.4 },
      },
      {
        id: 'place-city',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'place',
        minzoom: 8.5,
        maxzoom: 13,
        filter: ['==', ['get', 'class'], 'city'],
        layout: {
          'text-field': NAME as never,
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 12, 12, 16],
        },
        paint: { ...(paint['place-city'] as object), 'text-halo-width': 1.4, 'text-opacity': 0.8 },
      },
    ],
  };
}
