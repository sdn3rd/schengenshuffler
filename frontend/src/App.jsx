import { useState, useCallback, useRef } from 'react';
import DiceLogo from './DiceLogo';
import Dashboard from './Dashboard';
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
  const fileRef = useRef();

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

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) analyze(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) analyze(f);
  };

  return (
    <div data-theme={theme} className="app">
      <header className="header">
        <div className="header-left">
          <DiceLogo size={38} />
          <span className="app-title">SchengenShuffler</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="main">
        {!result && (
          <section className="hero">
            <h1 className="hero-title">Know your Schengen days</h1>
            <p className="subtitle">
              Upload your Google Maps Timeline JSON — any hour spent in a Schengen
              country counts as a full day against your 90-day allowance.
            </p>
            <div
              className={`dropzone${dragging ? ' dragging' : ''}`}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current.click()}
            >
              <div className="dropzone-icon">📂</div>
              <p className="dropzone-text">Drop your <strong>Timeline JSON</strong> here</p>
              <p className="dropzone-hint">
                Android: Google Maps → ☰ → Your timeline → ⋮ → Export timeline data
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
            </div>
            {loading && <div className="loading-msg">Analyzing your timeline…</div>}
            {error && <div className="error-msg">⚠️ {error}</div>}
          </section>
        )}

        {result && (
          <Dashboard data={result} onReset={() => { setResult(null); setError(null); }} />
        )}
      </main>
    </div>
  );
}
