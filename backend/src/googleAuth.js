import { OAuth2Client } from 'google-auth-library';
import AdmZip from 'adm-zip';
import { parseTimelineJson } from './schengen.js';

// In-memory session store: sessionId -> { oauth2Client, tokens, status, result, error }
const sessions = new Map();

// Google Data Portability API scopes for Maps Timeline
const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/dataportability.maps.timeline',
];

// Fallback scope set if the above gets a scope error
const SCOPES_MINIMAL = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/dataportability.maps.commute_routes',
  'https://www.googleapis.com/auth/dataportability.maps.starred_places',
];

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createSession(clientId, clientSecret, redirectUri) {
  const id = makeId();
  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  sessions.set(id, { client, tokens: null, status: 'pending', result: null, error: null });
  return id;
}

export function getAuthUrl(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  return session.client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: sessionId,
    prompt: 'consent',
  });
}

export async function handleCallback(sessionId, code) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  const { tokens } = await session.client.getToken(code);
  session.client.setCredentials(tokens);
  session.tokens = tokens;
  session.status = 'authenticated';
}

export function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}

// Initiates a Data Portability archive and polls until done, then processes it.
export async function fetchTimeline(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  if (!session.tokens) throw new Error('Not authenticated');

  session.status = 'initiating';
  session.error = null;

  try {
    const accessToken = session.tokens.access_token;

    // Initiate the portability archive
    const initiateRes = await fetch(
      'https://dataportability.googleapis.com/v1/portabilityArchive:initiate',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resources: ['maps.timeline'] }),
      }
    );

    if (!initiateRes.ok) {
      const err = await initiateRes.json().catch(() => ({}));
      throw new Error(
        `Data Portability API error (${initiateRes.status}): ${err.error?.message ?? 'Unknown error'}. ` +
        'Make sure the Data Portability API is enabled in your Google Cloud project.'
      );
    }

    const operation = await initiateRes.json();
    // operation.name looks like "portabilityArchive/operations/abc123"
    session.status = 'generating';

    // Poll for completion
    const opName = operation.name ?? operation.archiveJobId;
    if (!opName) throw new Error('Unexpected response from Data Portability API: ' + JSON.stringify(operation));

    const result = await pollOperation(opName, accessToken, session);

    // result.response.archiveUri or urls array
    const archiveUrls = result.urls ?? result.response?.urls ?? (result.response?.archiveUri ? [result.response.archiveUri] : null);
    if (!archiveUrls?.length) throw new Error('Archive complete but no download URL found: ' + JSON.stringify(result));

    session.status = 'downloading';
    const timelineData = await downloadAndParse(archiveUrls[0], accessToken);
    session.result = timelineData;
    session.status = 'done';
  } catch (err) {
    session.status = 'error';
    session.error = err.message;
    throw err;
  }
}

async function pollOperation(opName, accessToken, session, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(
      `https://dataportability.googleapis.com/v1/${opName}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error(`Poll error: ${res.status}`);
    const op = await res.json();
    if (op.done) return op;
    session.status = `generating (${i + 1}/${maxAttempts})`;
  }
  throw new Error('Timed out waiting for archive to generate (5 min). Try again.');
}

async function downloadAndParse(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Archive download failed: ${res.status}`);

  const contentType = res.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await res.arrayBuffer());

  // If it's a zip, extract the first JSON timeline file
  if (contentType.includes('zip') || url.endsWith('.zip')) {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    for (const entry of entries) {
      const name = entry.entryName.toLowerCase();
      if (name.endsWith('.json') && (name.includes('semantic') || name.includes('timeline') || name.includes('location'))) {
        const raw = JSON.parse(entry.getData().toString('utf8'));
        return parseTimelineJson(raw);
      }
    }
    // Fallback: try first JSON file
    for (const entry of entries) {
      if (entry.entryName.toLowerCase().endsWith('.json')) {
        const raw = JSON.parse(entry.getData().toString('utf8'));
        return parseTimelineJson(raw);
      }
    }
    throw new Error('No timeline JSON found in the archive.');
  }

  // Otherwise treat as JSON directly
  const raw = JSON.parse(buffer.toString('utf8'));
  return parseTimelineJson(raw);
}
