import { layers, namedFlavor } from '@protomaps/basemaps';

const TILEJSON = 'https://v4map.amtraker.com/20251018.json';
const ASSETS = 'https://protomaps.github.io/basemaps-assets';

export const OVERLAY_SOURCES = ['tracks', 'points', 'latest', 'accuracy'];

const overlayLayers = (theme) => {
  const halo = theme === 'dark' ? '#0e1116' : '#ffffff';
  return [
    {
      id: 'accuracy-fill',
      type: 'fill',
      source: 'accuracy',
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.12 },
    },
    {
      id: 'accuracy-outline',
      type: 'line',
      source: 'accuracy',
      paint: { 'line-color': ['get', 'color'], 'line-opacity': 0.5, 'line-width': 1 },
    },
    {
      id: 'tracks-casing',
      type: 'line',
      source: 'tracks',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': halo, 'line-width': 6, 'line-opacity': 0.6 },
    },
    {
      id: 'tracks',
      type: 'line',
      source: 'tracks',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 3 },
    },
    {
      id: 'points',
      type: 'circle',
      source: 'points',
      minzoom: 12,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 16, 4.5],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': halo,
        'circle-stroke-width': 1.5,
      },
    },
    {
      id: 'latest-halo',
      type: 'circle',
      source: 'latest',
      paint: { 'circle-radius': 16, 'circle-color': ['get', 'color'], 'circle-opacity': 0.25 },
    },
    {
      id: 'latest',
      type: 'circle',
      source: 'latest',
      paint: {
        'circle-radius': 8,
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    },
  ];
};

export const buildStyle = (theme, geojson) => ({
  version: 8,
  glyphs: `${ASSETS}/fonts/{fontstack}/{range}.pbf`,
  sprite: `${ASSETS}/sprites/v4/${theme}`,
  sources: {
    protomaps: { type: 'vector', url: TILEJSON },
    ...Object.fromEntries(
      OVERLAY_SOURCES.map((id) => [id, { type: 'geojson', data: geojson[id] }]),
    ),
  },
  layers: [...layers('protomaps', namedFlavor(theme), { lang: 'en' }), ...overlayLayers(theme)],
});
