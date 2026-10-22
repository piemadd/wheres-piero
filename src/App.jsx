import { useCallback, useMemo, useRef } from 'react';
import LoginCard from './components/LoginCard';
import MapView from './components/MapView';
import Panel from './components/Panel';
import ThemeToggle from './components/ThemeToggle';
import { useAuth } from './hooks/useAuth';
import { useLocationData } from './hooks/useLocationData';
import { useTheme } from './hooks/useTheme';
import { parseDevices, toGeoJSON } from './lib/positions';

const App = () => {
  const [theme, toggleTheme] = useTheme();
  const user = useAuth();
  const { data, loading, error, live, refresh } = useLocationData(Boolean(user));
  const mapRef = useRef(null);

  const devices = useMemo(() => parseDevices(data), [data]);
  const geojson = useMemo(() => toGeoJSON(devices), [devices]);

  const locate = useCallback((p) => {
    mapRef.current?.flyTo({ center: [p.lon, p.lat], zoom: Math.max(mapRef.current.getZoom(), 15) });
  }, []);

  return (
    <>
      <MapView theme={theme} geojson={geojson} mapRef={mapRef} />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {user ? (
        <Panel
          user={user}
          devices={devices}
          loading={loading}
          error={error}
          live={live}
          onRefresh={refresh}
          onLocate={locate}
        />
      ) : (
        <LoginCard />
      )}
    </>
  );
};

export default App;
