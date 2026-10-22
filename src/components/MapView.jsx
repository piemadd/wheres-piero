import { useEffect, useRef } from 'react';
import {
  Map as MapLibreMap,
  LngLatBounds,
  NavigationControl,
  Popup,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { buildStyle, OVERLAY_SOURCES } from '../lib/mapStyle';
import { formatMeters, formatTime } from '../lib/format';

// Vite pre-bundling breaks MapLibre's import.meta.url lookup of its worker.
setWorkerUrl(workerUrl);

// Dev only: send tile requests through the Vite proxy (see vite.config.js).
const transformRequest = import.meta.env.DEV
  ? (url) => {
      const match = url.match(/^https:\/\/(v4map[a-d]?)\.amtraker\.com(\/.*)$/);
      return match ? { url: `${location.origin}/__map/${match[1]}${match[2]}` } : undefined;
    }
  : undefined;

// Keep the track clear of the info panel: beside it on desktop, above it on phones.
const fitPadding = () => {
  const gap = 60;
  const panel = document.querySelector('.panel')?.getBoundingClientRect();
  if (!panel) return gap;
  return window.innerWidth > 720
    ? { top: gap, bottom: gap, right: gap, left: panel.right + gap }
    : { top: gap + 20, bottom: window.innerHeight - panel.top + 30, left: 30, right: 30 };
};

const popupHTML = ({ device, time, acc, alt }) => {
  const el = document.createElement('div');
  el.className = 'popup';
  const title = document.createElement('strong');
  title.textContent = device;
  const when = document.createElement('div');
  when.textContent = formatTime(time);
  const meta = document.createElement('div');
  meta.className = 'muted';
  meta.textContent = `±${formatMeters(acc)} · alt ${formatMeters(alt)}`;
  el.append(title, when, meta);
  return el;
};

const MapView = ({ theme, geojson, mapRef }) => {
  const containerRef = useRef(null);
  const latest = useRef({ theme, geojson });
  const hasFit = useRef(false);

  useEffect(() => {
    latest.current = { theme, geojson };
  });

  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildStyle(latest.current.theme, latest.current.geojson),
      center: [-87.65, 41.9],
      zoom: 3,
      attributionControl: { compact: true },
      transformRequest,
    });
    map.addControl(new NavigationControl(), 'bottom-right');
    map.addControl(new ScaleControl(), 'bottom-left');

    const popup = new Popup({ closeButton: false, offset: 10 });
    for (const layer of ['points', 'latest']) {
      map.on('click', layer, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        popup.setLngLat(feature.geometry.coordinates).setDOMContent(popupHTML(feature.properties)).addTo(map);
      });
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }

    mapRef.current = map;
    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [mapRef]);

  // Theme swaps rebuild the style; the overlay data rides along in it.
  const appliedTheme = useRef(theme);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedTheme.current === theme) return;
    appliedTheme.current = theme;
    map.setStyle(buildStyle(theme, latest.current.geojson));
  }, [theme, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      for (const id of OVERLAY_SOURCES) map.getSource(id)?.setData(geojson[id]);

      const coords = geojson.points.features.map((f) => f.geometry.coordinates);
      // Fit once per data session (sign-out empties the data and resets this).
      if (coords.length === 0) hasFit.current = false;
      if (hasFit.current || coords.length === 0) return;
      hasFit.current = true;
      if (coords.length === 1) {
        map.jumpTo({ center: coords[0], zoom: 15 });
        return;
      }
      const bounds = coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: fitPadding(), maxZoom: 16, duration: 0 });
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
    return () => map.off('load', apply);
  }, [geojson, mapRef]);

  return <div ref={containerRef} className="map" />;
};

export default MapView;
