import { useMemo } from 'react';
import { ArrowLeftIcon } from './icons';
import './Dashboard.css';

const COUNTRY_NAMES = {
  AT: 'Austria', BE: 'Belgium', CZ: 'Czech Republic', DK: 'Denmark',
  EE: 'Estonia', FI: 'Finland', FR: 'France', DE: 'Germany',
  GR: 'Greece', HU: 'Hungary', IS: 'Iceland', IT: 'Italy',
  LV: 'Latvia', LI: 'Liechtenstein', LT: 'Lithuania', LU: 'Luxembourg',
  MT: 'Malta', NL: 'Netherlands', NO: 'Norway', PL: 'Poland',
  PT: 'Portugal', SK: 'Slovakia', SI: 'Slovenia', ES: 'Spain',
  SE: 'Sweden', CH: 'Switzerland',
};

// Dark blues to mid blues — distinct and readable on light bg
const PALETTE = [
  '#0d2137',
  '#1e3a5f',
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
  '#1a3a6e',
  '#0f4c8a',
  '#2d6aad',
  '#4a8fd0',
  '#6aaee8',
];

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatusBar({ total }) {
  const pct = Math.min((total / 90) * 100, 100);
  const color = total >= 90 ? '#0d2137' : total >= 75 ? '#1d4ed8' : '#888888';
  const label = total >= 90
    ? 'Limit reached'
    : total >= 75
    ? `${90 - total} days left — caution`
    : `${90 - total} days remaining`;
  return (
    <div className="status-bar-wrap">
      <div className="status-bar-track">
        <div className="status-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="status-bar-labels">
        <span style={{ color }}>{total} / 90 days used</span>
        <span className="status-bar-remain" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

export default function Dashboard({ data, onReset }) {
  const { days, countryTotals, totalSchengenDays } = data;

  const colorMap = useMemo(() => {
    const sorted = Object.entries(countryTotals).sort((a, b) => b[1] - a[1]);
    const map = {};
    sorted.forEach(([code], i) => { map[code] = PALETTE[i % PALETTE.length]; });
    return map;
  }, [countryTotals]);

  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 180; i += 30) rows.push(days.slice(i, i + 30));
    return rows;
  }, [days]);

  const legendEntries = useMemo(() =>
    Object.entries(countryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({
        code,
        name: COUNTRY_NAMES[code] ?? code,
        count,
        color: colorMap[code] ?? '#2563eb',
      })),
    [countryTotals, colorMap]
  );

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Schengen Activity — Last 180 Days</h2>
          <p className="dash-sub">
            {formatDate(days[0]?.date)} — {formatDate(days[179]?.date)}
          </p>
        </div>
        <button className="reset-btn" onClick={onReset}>
          <ArrowLeftIcon size={14} /> Upload new file
        </button>
      </div>

      <StatusBar total={totalSchengenDays} />

      {legendEntries.length > 0 && (
        <div className="legend">
          {legendEntries.map(({ code, name, count, color }) => (
            <div key={code} className="legend-item">
              <span className="legend-swatch" style={{ background: color }} />
              <span className="legend-name">{name}</span>
              <span className="legend-count">{count}d</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid-wrap">
        {weeks.map((row, ri) => (
          <div key={ri} className="grid-row">
            <span className="row-label">
              {formatDate(row[0]?.date).replace(/,.*/, '')}
            </span>
            <div className="grid-cells">
              {row.map((day) => {
                const primary = day.countries[0];
                const bg = primary
                  ? (colorMap[primary] ?? '#2563eb')
                  : 'var(--surface2)';
                const multi = day.countries.length > 1;
                return (
                  <div
                    key={day.date}
                    className={`grid-cell${primary ? ' active' : ''}${multi ? ' multi' : ''}`}
                    style={{ background: bg }}
                    title={
                      `${formatDate(day.date)}` +
                      (day.countries.length
                        ? ': ' + day.countries.map(c => COUNTRY_NAMES[c] ?? c).join(', ')
                        : ': No Schengen')
                    }
                  >
                    {multi && (
                      <div
                        className="grid-cell-stripe"
                        style={{ background: colorMap[day.countries[1]] ?? '#2563eb' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {legendEntries.length > 0 && (
        <div className="breakdown">
          <h3 className="breakdown-title">Country Breakdown</h3>
          <div className="breakdown-grid">
            {legendEntries.map(({ code, name, count, color }) => (
              <div key={code} className="breakdown-card" style={{ borderLeftColor: color }}>
                <div className="bc-code" style={{ borderColor: color, borderWidth: 2, borderStyle: 'solid' }}>
                  {code}
                </div>
                <div className="bc-info">
                  <div className="bc-name">{name}</div>
                  <div className="bc-days" style={{ color }}>{count} day{count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {legendEntries.length === 0 && (
        <div className="no-data">
          No Schengen Area visits detected in the last 180 days.
          <br />
          <small>Make sure your Timeline JSON includes location history with GPS data.</small>
        </div>
      )}
    </div>
  );
}
