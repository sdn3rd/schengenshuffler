import { useState } from 'react';
import { GoogleIcon, KeyIcon, AlertIcon, CheckIcon } from './icons';
import './GoogleConnect.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const STATUS_LABELS = {
  authenticated: 'Authenticated — requesting archive...',
  initiating: 'Connecting to Google Data Portability API...',
  generating: 'Google is generating your timeline archive...',
  downloading: 'Downloading archive...',
  done: 'Done!',
};

export default function GoogleConnect({ onResult }) {
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState(null);
  const [pollStatus, setPollStatus] = useState(null);

  const connect = async () => {
    setError(null);
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both Client ID and Client Secret are required.');
      return;
    }
    try {
      const res = await fetch(`${API}/api/auth/google/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to get auth URL');
      // Store session ID so we can poll after redirect back
      sessionStorage.setItem('ss_session', data.sessionId);
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
    }
  };

  // Called by App when it detects ?session= in URL after OAuth callback
  GoogleConnect.pollSession = async (sessionId, onDone, onError) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/auth/google/status?session=${sessionId}`);
        const data = await res.json();
        if (data.status === 'done') { onDone(data.result); return; }
        if (data.status === 'error') { onError(data.error); return; }
        setPollStatus(data.status);
        setTimeout(poll, 4000);
      } catch (e) {
        onError(e.message);
      }
    };
    poll();
  };

  if (pollStatus) {
    return (
      <div className="gc-polling">
        <div className="gc-spinner" />
        <span className="gc-poll-label">{STATUS_LABELS[pollStatus] ?? pollStatus}</span>
        <p className="gc-poll-hint">
          Google is packaging your location history. This usually takes 30–90 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="gc-wrap">
      {!showForm ? (
        <button className="gc-btn-primary" onClick={() => setShowForm(true)}>
          <GoogleIcon size={18} />
          Connect with Google
        </button>
      ) : (
        <div className="gc-form">
          <div className="gc-form-header">
            <KeyIcon size={16} />
            <span>Google OAuth2 Credentials</span>
          </div>
          <p className="gc-form-hint">
            Create credentials at{' '}
            <strong>console.cloud.google.com</strong> →
            APIs &amp; Services → Credentials → OAuth 2.0 Client ID.
            Enable the <strong>Data Portability API</strong> and add{' '}
            <code>http://localhost:3001/api/auth/google/callback</code> as an
            authorized redirect URI.
          </p>
          <input
            className="gc-input"
            type="text"
            placeholder="Client ID"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <input
            className="gc-input"
            type="password"
            placeholder="Client Secret"
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            autoComplete="off"
          />
          {error && (
            <div className="gc-error">
              <AlertIcon size={14} />
              {error}
            </div>
          )}
          <div className="gc-form-actions">
            <button className="gc-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="gc-btn-primary" onClick={connect}>
              <GoogleIcon size={16} />
              Authorize &amp; Fetch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
