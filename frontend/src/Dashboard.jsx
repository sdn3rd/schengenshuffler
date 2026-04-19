import { useMemo } from 'react';
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

// Up to 10 distinct colors — vivid but accessible
const PALETTE = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#a855f7', // purple
  '#84cc16', // lime
];

const NON_SCHENGEN_COLOR = '#64748b';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatusBar({ total }) {
  const pct = Math.min((total / 90) * 100, 100);
  const color = total >= 90 ? '#ef4444' : total >= 75 ? '#f59e0b' : '#22c55e';
  return (
    <div className="status-bar-wrap">
      <div className="status-bar-track">
        <div
          className="status-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
        <div className="status-bar-limit" style={{ left: '100%' }} />
      </div>
      <div className="status-bar-labels">
        <span style={{ color }}>
          {total} / 90 days used
        </span>
        <span className="status-bar-remain" style={{ color }}>
          {total >= 90
            ? '⛔ Limit reached'
            : total >= 75
            ? `⚠️ ${90 - total} days left`
            : `✅ ${90 - total} days remaining`}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ data, onReset }) {
  const { days, countryTotals, totalSchengenDays } = data;

  // Assign colors — top countries by days first, max 10
  const colorMap = useMemo(() => {
    const sorted = Object.entries(countryTotals).sort((a, b) => b[1] - a[1]);
    const map = {};
    sorted.forEach(([code], i) => {
      map[code] = PALETTE[i % PALETTE.length];
    });
    return map;
  }, [countryTotals]);

  // Split 180 days into 6 rows of 30 for the grid
  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 180; i += 30) {
      rows.push(days.slice(i, i + 30));
    }
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
        color: colorMap[code] ?? NON_SCHENGEN_COLOR,
      })),
    [countryTotals, colorMap]
  );

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Schengen Activity — Last 180 Days</h2>
          <p className="dash-sub">
            {formatDate(days[0]?.date)} → {formatDate(days[179]?.date)}
          </p>
        </div>
        <button className="reset-btn" onClick={onReset}>↩ Upload new file</button>
      </div>

      <StatusBar total={totalSchengenDays} />

      {/* Legend */}
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

      {/* 180-day grid */}
      <div className="grid-wrap">
        {weeks.map((row, ri) => (
          <div key={ri} className="grid-row">
            <span className="row-label">
              {formatDate(row[0]?.date).replace(/,.*/, '')}
            </span>
            <div className="grid-cells">
              {row.map((day) => {
                const primary = day.countries[0];
                const bg = primary ? (colorMap[primary] ?? NON_SCHENGEN_COLOR) : 'var(--surface2)';
                const multi = day.countries.length > 1;
                return (
                  <div
                    key={day.date}
                    className={`grid-cell${primary ? ' active' : ''}${multi ? ' multi' : ''}`}
                    style={{ background: bg }}
                    title={`${formatDate(day.date)}${day.countries.length ? ': ' + day.countries.map(c => COUNTRY_NAMES[c] ?? c).join(', ') : ': No Schengen'}`}
                  >
                    {multi && (
                      <div
                        className="grid-cell-stripe"
                        style={{ background: colorMap[day.countries[1]] ?? NON_SCHENGEN_COLOR }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Per-country breakdown */}
      {legendEntries.length > 0 && (
        <div className="breakdown">
          <h3 className="breakdown-title">Country Breakdown</h3>
          <div className="breakdown-grid">
            {legendEntries.map(({ code, name, count, color }) => (
              <div key={code} className="breakdown-card" style={{ borderLeftColor: color }}>
                <div className="bc-flag">{getFlagEmoji(code)}</div>
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
          <small>Make sure you exported a full Timeline JSON with location history.</small>
        </div>
      )}
    </div>
  );
}

function getFlagEmoji(countryCode) {
  const base = 0x1F1E6;
  const chars = [...countryCode.toUpperCase()].map(c =>
    String.fromCodePoint(base + c.charCodeAt(0) - 65)
  );
  return chars.join('');
}
