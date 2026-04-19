import { useState } from 'react';
import { GoogleIcon, AlertIcon } from './icons';
import SetupWizard from './SetupWizard';
import './GoogleConnect.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function GoogleConnect({ onResult }) {
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const connect = async (clientId, clientSecret) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/google/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to get auth URL');
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (showWizard) {
    return (
      <div className="gc-wrap">
        <SetupWizard onCredentials={connect} />
        {loading && (
          <div className="gc-polling" style={{ marginTop: 12 }}>
            <div className="gc-spinner" />
            <span className="gc-poll-label">Redirecting to Google…</span>
          </div>
        )}
        {error && (
          <div className="gc-error" style={{ marginTop: 8 }}>
            <AlertIcon size={14} />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="gc-wrap">
      <button className="gc-btn-primary" onClick={() => setShowWizard(true)}>
        <GoogleIcon size={18} />
        Connect with Google
      </button>
      {error && (
        <div className="gc-error">
          <AlertIcon size={14} />
          {error}
        </div>
      )}
    </div>
  );
}
