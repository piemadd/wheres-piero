export const DEVICE_COLORS = ['#cc1d1d'];

const toPosition = (p) => {
  if (p?.lat == null || p?.lon == null) return null;
  const lat = Number(p.lat);
  const lon = Number(p.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    id: p.positionID,
    time: p.time,
    lat,
    lon,
    alt: p.alt,
    acc: p.acc,
    heading: p.heading,
  };
};

const sameSpot = (a, b) => a.lat === b.lat && a.lon === b.lon && a.time === b.time;

const parseDevice = ([key, device], index) => {
  const raw = Array.isArray(device?.positions) ? device.positions : [];
  const valid = raw.map(toPosition).filter(Boolean);
  valid.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));

  // The tracker sometimes logs the same fix more than once.
  const positions = valid.filter((p, i) => i === 0 || !sameSpot(p, valid[i - 1]));

  // `mostRecentPositon` is spelled that way in the source data.
  const reported = device?.mostRecentPositon ?? device?.mostRecentPosition;
  const latest =
    (reported && toPosition(reported)) ??
    positions.find((p) => p.id === device?.latestPositionID) ??
    positions.at(-1) ??
    null;

  return {
    id: device?.uid ?? key,
    name: device?.name ?? key,
    lastUpdated: device?.lastUpdated ?? null,
    color: DEVICE_COLORS[index % DEVICE_COLORS.length],
    positions,
    latest,
    skipped: raw.length - valid.length,
  };
};

export const parseDevices = (data) =>
  data && typeof data === 'object' && !Array.isArray(data)
    ? Object.entries(data).map(parseDevice)
    : [];

const circleRing = (lon, lat, radiusMeters, steps = 64) => {
  const dLat = radiusMeters / 111320;
  const dLon = dLat / Math.cos((lat * Math.PI) / 180);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)];
  });
};

const collection = (features) => ({ type: 'FeatureCollection', features });

const pointProps = (device, p) => ({
  device: device.name,
  color: device.color,
  time: p.time,
  acc: p.acc ?? null,
  alt: p.alt ?? null,
});

export const toGeoJSON = (devices) => ({
  tracks: collection(
    devices
      .filter((d) => d.positions.length > 1)
      .map((d) => ({
        type: 'Feature',
        properties: { device: d.name, color: d.color },
        geometry: { type: 'LineString', coordinates: d.positions.map((p) => [p.lon, p.lat]) },
      })),
  ),
  points: collection(
    devices.flatMap((d) =>
      d.positions.map((p) => ({
        type: 'Feature',
        properties: pointProps(d, p),
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      })),
    ),
  ),
  latest: collection(
    devices
      .filter((d) => d.latest)
      .map((d) => ({
        type: 'Feature',
        properties: pointProps(d, d.latest),
        geometry: { type: 'Point', coordinates: [d.latest.lon, d.latest.lat] },
      })),
  ),
  accuracy: collection(
    devices
      .filter((d) => d.latest?.acc > 0)
      .map((d) => ({
        type: 'Feature',
        properties: { color: d.color },
        geometry: {
          type: 'Polygon',
          coordinates: [circleRing(d.latest.lon, d.latest.lat, d.latest.acc)],
        },
      })),
  ),
});

export const EMPTY_GEOJSON = toGeoJSON([]);
