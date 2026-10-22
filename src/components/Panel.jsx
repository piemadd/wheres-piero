import { useState } from 'react';
import { useNow } from '../hooks/useNow';
import { formatCoords, formatMeters, formatTime, timeAgo } from '../lib/format';
import { pb } from '../lib/pocketbase';
import { ChevronIcon, CrosshairIcon, RefreshIcon } from './Icons';

const DeviceCard = ({ device, now, onLocate }) => {
  const { latest } = device;
  return (
    <li className="device">
      <div className="device-head">
        <span className="device-name">{device.name}</span>
        {latest && (
          <button
            type="button"
            className="icon-button small"
            onClick={() => onLocate(latest)}
            aria-label={`Center map on ${device.name}`}
            title="Center map"
          >
            <CrosshairIcon />
          </button>
        )}
      </div>
      {latest ? (
        <>
          <dl className="stats">
            <div>
              <dt>Position</dt>
              <dd>{formatCoords(latest.lat, latest.lon)}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>±{formatMeters(latest.acc)}</dd>
            </div>
            <div>
              <dt>Altitude</dt>
              <dd>{formatMeters(latest.alt)}</dd>
            </div>
            <div>
              <dt>Points</dt>
              <dd>{device.positions.length}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="muted">No mappable positions yet.</p>
      )}
      {device.lastUpdated && (
        <p className="muted small-text" title={formatTime(device.lastUpdated)}>
          Device reported {timeAgo(device.lastUpdated, now)}
        </p>
      )}
    </li>
  );
};

const Panel = ({ user, devices, loading, error, live, onRefresh, onLocate }) => {
  const now = useNow();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`card panel${collapsed ? ' collapsed' : ''}`}>
      <header className="panel-head">
        <div>
          <h1>Where's Piero?</h1>
        </div>
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
                <DeviceCard key={d.id} device={d} now={now} onLocate={onLocate} />
              ))}
            </ul>
          ) : (
            !loading && !error && <p className="muted">No location data yet.</p>
          )}
          <footer className="panel-foot">
            <span className="muted small-text" title={user.email}>
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
