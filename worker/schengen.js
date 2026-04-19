// Schengen Area member states (ISO 3166-1 alpha-2)
export const SCHENGEN_COUNTRIES = new Set([
  'AT', 'BE', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IS', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL',
  'PT', 'SK', 'SI', 'ES', 'SE', 'CH',
]);

export const COUNTRY_NAMES = {
  AT: 'Austria', BE: 'Belgium', CZ: 'Czech Republic', DK: 'Denmark',
  EE: 'Estonia', FI: 'Finland', FR: 'France', DE: 'Germany',
  GR: 'Greece', HU: 'Hungary', IS: 'Iceland', IT: 'Italy',
  LV: 'Latvia', LI: 'Liechtenstein', LT: 'Lithuania', LU: 'Luxembourg',
  MT: 'Malta', NL: 'Netherlands', NO: 'Norway', PL: 'Poland',
  PT: 'Portugal', SK: 'Slovakia', SI: 'Slovenia', ES: 'Spain',
  SE: 'Sweden', CH: 'Switzerland',
};

// Rough bounding boxes for quick country lookup
// [minLat, maxLat, minLon, maxLon, countryCode]
const BBOXES = [
  [46.37, 49.02, 9.53, 17.16, 'AT'],
  [49.50, 51.51, 2.54, 6.40, 'BE'],
  [48.55, 51.06, 12.09, 18.86, 'CZ'],
  [54.56, 57.75, 8.07, 15.19, 'DK'],
  [57.52, 59.68, 21.76, 28.21, 'EE'],
  [59.81, 70.09, 19.08, 31.59, 'FI'],
  [41.33, 51.12, -5.14, 9.56, 'FR'],
  [47.27, 55.06, 5.86, 15.04, 'DE'],
  [34.80, 41.75, 19.37, 29.65, 'GR'],
  [45.74, 48.58, 16.11, 22.90, 'HU'],
  [63.39, 66.54, -24.54, -13.50, 'IS'],
  [35.49, 47.09, 6.62, 18.52, 'IT'],
  [55.67, 57.97, 20.97, 28.24, 'LV'],
  [47.05, 47.27, 9.47, 9.64, 'LI'],
  [53.90, 56.45, 20.94, 26.84, 'LT'],
  [49.44, 50.18, 5.73, 6.53, 'LU'],
  [35.80, 36.08, 14.18, 14.58, 'MT'],
  [50.75, 53.55, 3.36, 7.23, 'NL'],
  [57.97, 71.18, 4.50, 31.17, 'NO'],
  [49.00, 54.84, 14.12, 24.15, 'PL'],
  [36.96, 42.15, -9.50, -6.19, 'PT'],
  [47.73, 49.61, 16.83, 22.57, 'SK'],
  [45.42, 46.88, 13.38, 16.61, 'SI'],
  [27.64, 43.79, -18.16, 4.33, 'ES'],
  [55.34, 69.06, 10.96, 24.17, 'SE'],
  [45.82, 47.81, 5.96, 10.49, 'CH'],
];

export function coordToCountry(lat, lon) {
  for (const [minLat, maxLat, minLon, maxLon, code] of BBOXES) {
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return code;
    }
  }
  return null;
}

function toDateStr(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function parseTimelineJson(raw) {
  // Google Maps Timeline JSON can come in two shapes:
  // 1. { timelineObjects: [...] }  (older export)
  // 2. { semanticSegments: [...] } (newer "day-based" export)
  // Also handle array of objects directly.

  const now = Date.now();
  const cutoff = now - 180 * 24 * 60 * 60 * 1000;

  // Map: dateStr -> Set of country codes seen that day
  const dayCountryMap = {};

  function recordDay(dateStr, countryCode) {
    if (!dayCountryMap[dateStr]) dayCountryMap[dateStr] = new Set();
    dayCountryMap[dateStr].add(countryCode);
  }

  function processPlaceVisit(obj) {
    const loc = obj.location;
    if (!loc) return;
    const startMs = Number(obj.duration?.startTimestampMs ?? obj.startTimestampMs ?? 0);
    const endMs = Number(obj.duration?.endTimestampMs ?? obj.endTimestampMs ?? 0);
    if (endMs < cutoff) return;
    const lat = (loc.latitudeE7 ?? 0) / 1e7;
    const lon = (loc.longitudeE7 ?? 0) / 1e7;
    const country = coordToCountry(lat, lon);
    if (!country || !SCHENGEN_COUNTRIES.has(country)) return;
    // mark every calendar day touched
    const start = Math.max(startMs, cutoff);
    let cursor = start;
    while (cursor <= endMs) {
      recordDay(toDateStr(cursor), country);
      cursor += 24 * 60 * 60 * 1000;
    }
    recordDay(toDateStr(endMs), country);
  }

  function processActivitySegment(obj) {
    // For transit segments we just use start/end coords and duration
    const startMs = Number(obj.duration?.startTimestampMs ?? obj.startTimestampMs ?? 0);
    const endMs = Number(obj.duration?.endTimestampMs ?? obj.endTimestampMs ?? 0);
    if (endMs < cutoff) return;
    const sp = obj.startLocation;
    const ep = obj.endLocation;
    for (const loc of [sp, ep]) {
      if (!loc) continue;
      const lat = (loc.latitudeE7 ?? 0) / 1e7;
      const lon = (loc.longitudeE7 ?? 0) / 1e7;
      const country = coordToCountry(lat, lon);
      if (!country || !SCHENGEN_COUNTRIES.has(country)) continue;
      recordDay(toDateStr(startMs), country);
      recordDay(toDateStr(endMs), country);
    }
  }

  function processTimelineObjects(objects) {
    for (const obj of objects) {
      if (obj.placeVisit) processPlaceVisit(obj.placeVisit);
      if (obj.activitySegment) processActivitySegment(obj.activitySegment);
    }
  }

  // Raw locations array (older formats)
  function processLocations(locations) {
    for (const loc of locations) {
      const ts = Number(loc.timestampMs ?? 0);
      if (ts < cutoff) continue;
      const lat = (loc.latitudeE7 ?? 0) / 1e7;
      const lon = (loc.longitudeE7 ?? 0) / 1e7;
      const country = coordToCountry(lat, lon);
      if (!country || !SCHENGEN_COUNTRIES.has(country)) continue;
      recordDay(toDateStr(ts), country);
    }
  }

  if (Array.isArray(raw)) {
    // Could be array of timeline objects or locations
    if (raw[0]?.placeVisit || raw[0]?.activitySegment) {
      processTimelineObjects(raw);
    } else {
      processLocations(raw);
    }
  } else if (raw.timelineObjects) {
    processTimelineObjects(raw.timelineObjects);
  } else if (raw.locations) {
    processLocations(raw.locations);
  } else if (raw.semanticSegments) {
    for (const seg of raw.semanticSegments) {
      if (seg.visit) processPlaceVisit(seg.visit);
      if (seg.timelinePath) {
        for (const pt of seg.timelinePath) {
          const ts = new Date(pt.time).getTime();
          if (ts < cutoff) continue;
          const [lat, lon] = pt.point.split(',').map(Number);
          const country = coordToCountry(lat, lon);
          if (!country || !SCHENGEN_COUNTRIES.has(country)) continue;
          recordDay(toDateStr(ts), country);
        }
      }
    }
  }

  // Build array of { date, countries[] } for the past 180 days
  const days = [];
  for (let i = 179; i >= 0; i--) {
    const ts = now - i * 24 * 60 * 60 * 1000;
    const dateStr = toDateStr(ts);
    const countries = dayCountryMap[dateStr] ? [...dayCountryMap[dateStr]] : [];
    days.push({ date: dateStr, countries });
  }

  // Aggregate per country
  const countryTotals = {};
  for (const { countries } of days) {
    for (const c of countries) {
      countryTotals[c] = (countryTotals[c] ?? 0) + 1;
    }
  }

  // Schengen total: any day with at least one Schengen country
  const totalSchengenDays = days.filter(d => d.countries.length > 0).length;

  return { days, countryTotals, totalSchengenDays };
}
