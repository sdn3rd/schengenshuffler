import { useState, useCallback, useRef } from 'react';
import { Bolt } from './DiceLogo';
import Dashboard from './Dashboard';
import LavaLamp from './LavaLamp';
import { SunIcon, MoonIcon, FileJsonIcon, AlertIcon } from './icons';
import './App.css';

const API = import.meta.env.VITE_API_URL ?? '';

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

  return (
    <div data-theme={theme} className="app">
      <LavaLamp />

      <header className="header">
        <div className="header-left">
          <Bolt size={16} className="title-bolt" />
          <span className="app-title">Schengenerator</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </header>

      <main className="main">
        {!result && (
          <section className="hero">
            <h1 className="hero-title">Schengenerator</h1>
            <p className="catchphrase">Know your count.</p>

            <div
              className={`dropzone${dragging ? ' dragging' : ''}`}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) analyze(f); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current.click()}
            >
              <FileJsonIcon size={24} className="dropzone-icon" />
              <div>
                <p className="dropzone-text">Drop your <strong>Timeline JSON</strong> here or click to browse</p>
                <p className="dropzone-hint">
                  Google Maps → profile photo → Your Timeline → ⋮ → Export timeline data
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
          </section>
        )}

        {result && (
          <Dashboard
            data={result}
            onReset={() => { setResult(null); setError(null); }}
          />
        )}
      </main>
    </div>
  );
}
