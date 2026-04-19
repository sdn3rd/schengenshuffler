import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parseTimelineJson, COUNTRY_NAMES, SCHENGEN_COUNTRIES } from './schengen.js';
import {
  createSession,
  getAuthUrl,
  handleCallback,
  getSession,
  fetchTimeline,
} from './googleAuth.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '500mb' }));

const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Schengen reference ─────────────────────────────────────────────────────
app.get('/api/schengen-countries', (_req, res) => {
  const list = [...SCHENGEN_COUNTRIES].map(code => ({ code, name: COUNTRY_NAMES[code] ?? code }));
  res.json(list);
});

// ── Manual file upload (fallback) ──────────────────────────────────────────
app.post('/api/analyze', upload.single('timeline'), (req, res) => {
  try {
    let raw;
    if (req.file) {
      raw = JSON.parse(req.file.buffer.toString('utf8'));
    } else if (req.body && Object.keys(req.body).length > 0) {
      raw = req.body;
    } else {
      return res.status(400).json({ error: 'No timeline data provided.' });
    }
    res.json(parseTimelineJson(raw));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to parse timeline JSON: ' + err.message });
  }
});

// ── Google OAuth — step 1: get auth URL ───────────────────────────────────
// POST /api/auth/google/url  body: { clientId, clientSecret }
app.post('/api/auth/google/url', (req, res) => {
  const { clientId, clientSecret } = req.body ?? {};
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'clientId and clientSecret are required.' });
  }
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  try {
    const sessionId = createSession(clientId, clientSecret, redirectUri);
    const url = getAuthUrl(sessionId);
    res.json({ sessionId, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Google OAuth — step 2: callback ──────────────────────────────────────
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state: sessionId, error } = req.query;
  if (error) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(error)}`);
  }
  if (!code || !sessionId) {
    return res.redirect(`${FRONTEND_URL}?auth_error=missing_code`);
  }
  try {
    await handleCallback(sessionId, code);
    // Kick off async timeline fetch — frontend polls for status
    fetchTimeline(sessionId).catch(err => console.error('Timeline fetch error:', err.message));
    res.redirect(`${FRONTEND_URL}?session=${sessionId}`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(err.message)}`);
  }
});

// ── Poll session status ───────────────────────────────────────────────────
app.get('/api/auth/google/status', (req, res) => {
  const { session: sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'session query param required' });
  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status === 'done') {
    return res.json({ status: 'done', result: session.result });
  }
  if (session.status === 'error') {
    return res.json({ status: 'error', error: session.error });
  }
  res.json({ status: session.status });
});

app.listen(PORT, () => console.log(`SchengenShuffler backend :${PORT}`));
