import { useState } from 'react';
import { useNow } from '../hooks/useNow';
import { formatCoords, formatMeters, formatTime, timeAgo } from '../lib/format';
import { pb } from '../lib/pocketbase';
import { ChevronIcon, RefreshIcon } from './Icons';

const DeviceRow = ({ device, now, onLocate }) => {
  const { latest } = device;
  if (!latest) {
    return (
      <li className="device">
        <p className="muted">{device.name} hasn't sent a usable position yet.</p>
      </li>
    );
  }

  return (
    <li className="device">
      <p className="seen" title={formatTime(latest.time)}>
        Seen {timeAgo(latest.time, now)}
      </p>
      <button type="button" className="coords" onClick={() => onLocate(latest)} title="Center the map here">
        {formatCoords(latest.lat, latest.lon)}
      </button>
      <p className="meta">
        within {formatMeters(latest.acc)} · {formatMeters(latest.alt)} up · {device.positions.length} points
      </p>
      <p className="meta" title={device.lastUpdated ? formatTime(device.lastUpdated) : undefined}>
        {device.name}
        {device.lastUpdated && `, checked in ${timeAgo(device.lastUpdated, now)}`}
      </p>
    </li>
  );
};

const Panel = ({ user, devices, loading, error, onRefresh, onLocate }) => {
  const now = useNow();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`card panel${collapsed ? ' collapsed' : ''}`}>
      <header className="panel-head">
        <h1>Where's Piero?</h1>
        <button
          type="button"
          className="icon-button small"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshIcon />
        </button>
        <button
          type="button"
          className="icon-button small"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          aria-expanded={!collapsed}
        >
          <ChevronIcon up={!collapsed} />
        </button>
      </header>

      {!collapsed && (
        <div className="panel-body">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {devices.length > 0 ? (
            <ul className="devices">
              {devices.map((d) => (
                <DeviceRow key={d.id} device={d} now={now} onLocate={onLocate} />
              ))}
            </ul>
          ) : (
            !loading && !error && <p className="muted">Nothing here yet.</p>
          )}
          <footer className="panel-foot">
            <span className="muted" title={user.email}>
              {user.email}
            </span>
            <button type="button" className="link-button" onClick={() => pb.authStore.clear()}>
              Sign out
            </button>
          </footer>
        </div>
      )}
    </aside>
  );
};

export default Panel;
