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

// Handles "lat°, lon°" strings (new export) and plain "lat, lon"
function parseLatLng(str) {
  if (!str) return [NaN, NaN];
  const parts = str.split(',');
  return [parseFloat(parts[0]), parseFloat(parts[1])];
}

// Handles ISO-8601 strings and numeric ms values
function parseMs(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const n = Number(val);
  return isNaN(n) ? new Date(val).getTime() : n;
}

// Activity types that represent aerial transit — GPS traces these routes
// through countries the traveller never actually entered on the ground.
const SKIP_ACTIVITY_TYPES = new Set([
  'FLYING', 'IN_FERRY',
]);

function toDateStr(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function parseTimelineJson(raw) {
  const now = Date.now();
  // Parse 2 years so the UI slider can explore any 180-day window within that range.
  const cutoff = now - 730 * 24 * 60 * 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;

  const dayCountryMap = {};
  function recordDay(dateStr, countryCode) {
    if (!dayCountryMap[dateStr]) dayCountryMap[dateStr] = new Set();
    dayCountryMap[dateStr].add(countryCode);
  }

  // Iterates by UTC midnight boundaries — no floating cursor drift.
  function markDaysInRange(startMs, endMs, country) {
    const startMidnight = startMs - (startMs % DAY);
    const endMidnight = endMs - (endMs % DAY);
    const from = Math.max(startMidnight, cutoff - (cutoff % DAY));
    for (let d = from; d <= endMidnight; d += DAY) {
      recordDay(toDateStr(d), country);
    }
  }

  // Old-format placeVisit: { location: { latitudeE7, longitudeE7 }, duration: {...} }
  function processPlaceVisit(obj) {
    const loc = obj.location;
    if (!loc) return;
    const startMs = parseMs(obj.duration?.startTimestampMs ?? obj.startTimestampMs ?? 0);
    const endMs = parseMs(obj.duration?.endTimestampMs ?? obj.endTimestampMs ?? 0);
    if (endMs < cutoff) return;
    const lat = (loc.latitudeE7 ?? 0) / 1e7;
    const lon = (loc.longitudeE7 ?? 0) / 1e7;
    const country = coordToCountry(lat, lon);
    if (!country || !SCHENGEN_COUNTRIES.has(country)) return;
    markDaysInRange(startMs, endMs, country);
  }

  // Old-format activitySegment: { startLocation/endLocation: { latitudeE7 }, duration: {...} }
  function processActivitySegment(obj) {
    if (SKIP_ACTIVITY_TYPES.has(obj.activityType)) return;
    const startMs = parseMs(obj.duration?.startTimestampMs ?? obj.startTimestampMs ?? 0);
    const endMs = parseMs(obj.duration?.endTimestampMs ?? obj.endTimestampMs ?? 0);
    if (endMs < cutoff) return;
    for (const loc of [obj.startLocation, obj.endLocation]) {
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

  function processLocations(locations) {
    for (const loc of locations) {
      const ts = parseMs(loc.timestampMs ?? 0);
      if (ts < cutoff) continue;
      const lat = (loc.latitudeE7 ?? 0) / 1e7;
      const lon = (loc.longitudeE7 ?? 0) / 1e7;
      const country = coordToCountry(lat, lon);
      if (!country || !SCHENGEN_COUNTRIES.has(country)) continue;
      recordDay(toDateStr(ts), country);
    }
  }

  if (Array.isArray(raw)) {
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
      const segStartMs = parseMs(seg.startTime);
      const segEndMs = parseMs(seg.endTime);
      if (segEndMs < cutoff) continue;

      // New-format visit: topCandidate.placeLocation.latLng "lat°, lon°"
      if (seg.visit) {
        const latLng = seg.visit.topCandidate?.placeLocation?.latLng;
        if (latLng) {
          const [lat, lon] = parseLatLng(latLng);
          const country = coordToCountry(lat, lon);
          if (country && SCHENGEN_COUNTRIES.has(country)) {
            markDaysInRange(segStartMs, segEndMs, country);
          }
        } else if (seg.visit.location) {
          processPlaceVisit({ ...seg.visit, duration: { startTimestampMs: segStartMs, endTimestampMs: segEndMs } });
        }
      }

      // New-format activity: start.latLng / end.latLng — skip aerial transit
      if (seg.activity) {
        const type = seg.activity.topCandidate?.type ?? '';
        if (SKIP_ACTIVITY_TYPES.has(type)) continue;
        for (const endpoint of [seg.activity.start, seg.activity.end]) {
          if (!endpoint?.latLng) continue;
          const [lat, lon] = parseLatLng(endpoint.latLng);
          const country = coordToCountry(lat, lon);
          if (!country || !SCHENGEN_COUNTRIES.has(country)) continue;
          recordDay(toDateStr(segStartMs), country);
          recordDay(toDateStr(segEndMs), country);
        }
      }

      // timelinePath: { point: "lat°, lon°", time: ISO-string }
      if (seg.timelinePath) {
        for (const pt of seg.timelinePath) {
          const ts = parseMs(pt.time);
          if (ts < cutoff) continue;
          const [lat, lon] = parseLatLng(pt.point);
          if (isNaN(lat) || isNaN(lon)) continue;
          const country = coordToCountry(lat, lon);
          if (!country || !SCHENGEN_COUNTRIES.has(country)) continue;
          recordDay(toDateStr(ts), country);
        }
      }
    }
  }

  // Build full 2-year array so the frontend slider can explore any window.
  const days = [];
  for (let i = 729; i >= 0; i--) {
    const ts = now - i * DAY;
    const dateStr = toDateStr(ts);
    const countries = dayCountryMap[dateStr] ? [...dayCountryMap[dateStr]] : [];
    days.push({ date: dateStr, countries });
  }

  // Summary over the most recent 180 days (default window)
  const recent = days.slice(days.length - 180);
  const countryTotals = {};
  for (const { countries } of recent) {
    for (const c of countries) countryTotals[c] = (countryTotals[c] ?? 0) + 1;
  }
  const totalSchengenDays = recent.filter(d => d.countries.length > 0).length;

  return { days, countryTotals, totalSchengenDays };
}
