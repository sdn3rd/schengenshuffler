import { useState, useCallback, useRef, useEffect } from 'react';
import DiceLogo from './DiceLogo';
import Dashboard from './Dashboard';
import GoogleConnect from './GoogleConnect';
import LavaLamp from './LavaLamp';
import { SunIcon, MoonIcon, FileJsonIcon, AlertIcon } from './icons';
import './App.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function App() {
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [pollStatus, setPollStatus] = useState(null);
  const fileRef = useRef();

  // Handle OAuth return — URL has ?session=... or ?auth_error=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    const authError = params.get('auth_error');

    if (authError) {
      setError('Google auth failed: ' + decodeURIComponent(authError));
      window.history.replaceState({}, '', '/');
      return;
    }

    if (sessionId) {
      window.history.replaceState({}, '', '/');
      setPollStatus('authenticated');
      const poll = async () => {
        try {
          const res = await fetch(`${API}/api/auth/google/status?session=${sessionId}`);
          const data = await res.json();
          if (data.status === 'done') { setResult(data.result); setPollStatus(null); return; }
          if (data.status === 'error') { setError(data.error); setPollStatus(null); return; }
          setPollStatus(data.status);
          setTimeout(poll, 4000);
        } catch (e) {
          setError(e.message);
          setPollStatus(null);
        }
      };
      setTimeout(poll, 2000);
    }
  }, []);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const analyze = useCallback(async (file) => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('timeline', file);
      const res = await fetch(`${API}/api/analyze`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Server error');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const STATUS_LABELS = {
    authenticated: 'Connected — requesting archive...',
    initiating: 'Contacting Google Data Portability API...',
    generating: 'Google is packaging your timeline...',
    downloading: 'Downloading archive...',
  };

  const isPolling = pollStatus && !result;

  return (
    <div data-theme={theme} className="app">
      <LavaLamp />

      <header className="header">
        <div className="header-left">
          <DiceLogo size={36} />
          <span className="app-title">SchengenShuffler</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </header>

      <main className="main">
        {!result && !isPolling && (
          <section className="hero">
            <h1 className="hero-title">Know your Schengen days</h1>
            <p className="subtitle">
              Connect your Google account — any hour spent in a Schengen country
              counts as a full day against your 90-day allowance.
            </p>

            <div className="connect-or-upload">
              <GoogleConnect onResult={setResult} />

              <div className="divider">or upload file</div>

              <div
                className={`dropzone${dragging ? ' dragging' : ''}`}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) analyze(f); }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current.click()}
              >
                <FileJsonIcon size={22} className="dropzone-icon" />
                <div>
                  <p className="dropzone-text">Drop your <strong>Timeline JSON</strong> here</p>
                  <p className="dropzone-hint">
                    Google Maps → Your timeline → Export timeline data
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) analyze(f); }}
                />
              </div>

              {loading && (
                <div className="loading-msg">
                  <div className="spinner" />
                  Analyzing your timeline...
                </div>
              )}
              {error && (
                <div className="error-msg">
                  <AlertIcon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}
            </div>
          </section>
        )}

        {isPolling && (
          <section className="hero">
            <h1 className="hero-title">Fetching your timeline</h1>
            <div className="poll-status">
              <div className="poll-spinner" />
              <p className="poll-label">{STATUS_LABELS[pollStatus] ?? pollStatus}</p>
              <p className="poll-hint">
                Google packages your location history in the background.
                This typically takes 30–120 seconds.
              </p>
            </div>
          </section>
        )}

        {result && (
          <Dashboard
            data={result}
            onReset={() => { setResult(null); setError(null); setPollStatus(null); }}
          />
        )}
      </main>
    </div>
  );
}
