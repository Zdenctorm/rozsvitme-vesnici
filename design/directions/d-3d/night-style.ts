/**
 * Night map style over OpenFreeMap vector tiles (OpenMapTiles schema).
 * Deep blue-black ground, roads barely there, 3D buildings in slate blue.
 * Warm light is reserved for advent windows, added by main.ts on top.
 */
import type { StyleSpecification } from 'maplibre-gl';

export const C = {
  ground: '#070b14',
  groundCity: '#0a0f1b',
  water: '#050a17',
  waterLine: '#0d1a33',
  wood: '#060a12',
  roadMinor: '#141b2a',
  roadMajor: '#1b2437',
  roadMotorway: '#222d45',
  label: '#7f8aa3',
  labelStrong: '#b4bdd1',
  halo: '#05080f',
  border: '#3a4560',
};

const NAME = ['coalesce', ['get', 'name:cs'], ['get', 'name:latin'], ['get', 'name']] as const;

export function nightStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
    },
    sky: {
      'sky-color': '#03050b',
      'horizon-color': '#101a33',
      'fog-color': '#060a14',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.7,
      'fog-ground-blend': 0.55,
      'atmosphere-blend': 0,
    },
    light: { anchor: 'map', position: [1.4, 200, 35], color: '#ffffff', intensity: 0.28 },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': C.ground } },
      {
        id: 'residential',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood', 'commercial', 'retail']]],
        paint: { 'fill-color': C.groundCity, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0, 12, 1] },
      },
      {
        id: 'wood',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
        paint: { 'fill-color': C.wood, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 11, 1] },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'omt',
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': C.water },
      },
      {
        id: 'water-edge',
        type: 'line',
        source: 'omt',
        'source-layer': 'water',
        minzoom: 12,
        paint: { 'line-color': C.waterLine, 'line-width': 1, 'line-opacity': 0.7 },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'omt',
        'source-layer': 'waterway',
        minzoom: 11,
        paint: { 'line-color': C.waterLine, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 17, 3] },
      },
      {
        id: 'road-path',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        minzoom: 15,
        filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]],
        paint: { 'line-color': C.roadMinor, 'line-width': 1, 'line-dasharray': [2, 2] },
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
          'line-color': C.roadMinor,
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
          'line-color': C.roadMajor,
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
          'line-color': C.roadMotorway,
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
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6],
            0, '#1a2236', 10, '#1f2942', 40, '#27334f', 120, '#303e60',
          ],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 0.96],
          'fill-extrusion-vertical-gradient': true,
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
        paint: { 'text-color': '#5d6880', 'text-halo-color': C.halo, 'text-halo-width': 1.2 },
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
        paint: { 'text-color': C.label, 'text-halo-color': C.halo, 'text-halo-width': 1.4 },
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
        paint: { 'text-color': C.labelStrong, 'text-halo-color': C.halo, 'text-halo-width': 1.4, 'text-opacity': 0.8 },
      },
    ],
  };
}
