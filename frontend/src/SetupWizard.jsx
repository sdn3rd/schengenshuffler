import { useState } from 'react';
import { CheckIcon, AlertIcon, KeyIcon } from './icons';
import './SetupWizard.css';

const STEPS = [
  {
    id: 'project',
    title: 'Create a Google Cloud Project',
    link: 'https://console.cloud.google.com/projectcreate',
    linkLabel: 'Open GCP → New Project',
    instructions: [
      'Click the link to open Google Cloud Console.',
      'Name the project anything — e.g. SchengenShuffler.',
      'Click Create and wait for it to finish.',
    ],
  },
  {
    id: 'api',
    title: 'Enable the Data Portability API',
    link: 'https://console.cloud.google.com/apis/library/dataportability.googleapis.com',
    linkLabel: 'Open Data Portability API page',
    instructions: [
      'Make sure your new project is selected in the top dropdown.',
      'Click Enable.',
      'Wait for the API to activate (a few seconds).',
    ],
  },
  {
    id: 'consent',
    title: 'Configure the OAuth Consent Screen',
    link: 'https://console.cloud.google.com/apis/credentials/consent',
    linkLabel: 'Open OAuth consent screen',
    instructions: [
      'Select External and click Create.',
      'Fill in App name (e.g. SchengenShuffler) and your email.',
      'On the Scopes step, click Add or Remove Scopes, search for "dataportability" and add dataportability.maps.timeline.',
      'On the Test users step, add your own Google account email.',
      'Save and continue through to the end.',
    ],
  },
  {
    id: 'credentials',
    title: 'Create OAuth 2.0 Credentials',
    link: 'https://console.cloud.google.com/apis/credentials',
    linkLabel: 'Open Credentials page',
    instructions: [
      'Click Create Credentials → OAuth client ID.',
      'Application type: Web application.',
      'Under Authorized redirect URIs, add exactly:',
    ],
    code: 'http://localhost:3001/api/auth/google/callback',
    codeLabel: 'Redirect URI (copy exactly)',
    trailingInstructions: [
      'Click Create.',
      'Copy the Client ID and Client Secret from the dialog that appears.',
    ],
  },
  {
    id: 'connect',
    title: 'Connect to SchengenShuffler',
    instructions: [
      'Paste your Client ID and Client Secret below.',
      'Click Authorize & Fetch — a Google sign-in window will open.',
      'After you approve, your timeline will be fetched automatically.',
    ],
    isFinal: true,
  },
];

export default function SetupWizard({ onCredentials }) {
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState({});
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [credError, setCredError] = useState(null);

  const current = STEPS[step];
  const allChecked = current.instructions.every((_, i) => checked[`${step}-${i}`]);
  const canAdvance = current.isFinal ? (clientId.trim() && clientSecret.trim()) : allChecked;

  const toggle = (key) => setChecked(c => ({ ...c, [key]: !c[key] }));

  const advance = () => {
    if (current.isFinal) {
      if (!clientId.trim() || !clientSecret.trim()) {
        setCredError('Both fields are required.');
        return;
      }
      onCredentials(clientId.trim(), clientSecret.trim());
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <div className="wizard">
      {/* Step progress */}
      <div className="wizard-progress">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`wp-dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
            onClick={() => i < step && setStep(i)}
            title={s.title}
          >
            {i < step ? <CheckIcon size={10} /> : i + 1}
          </div>
        ))}
        <div className="wp-track">
          <div className="wp-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="wizard-body">
        <div className="wizard-step-num">Step {step + 1} of {STEPS.length}</div>
        <h3 className="wizard-title">{current.title}</h3>

        {current.link && (
          <a className="wizard-link" href={current.link} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon size={14} />
            {current.linkLabel}
          </a>
        )}

        <ol className="wizard-instructions">
          {current.instructions.map((txt, i) => (
            <li key={i}>
              <label className="wi-row">
                <input
                  type="checkbox"
                  className="wi-check"
                  checked={!!checked[`${step}-${i}`]}
                  onChange={() => toggle(`${step}-${i}`)}
                />
                <span>{txt}</span>
              </label>
            </li>
          ))}
        </ol>

        {current.code && (
          <div className="wizard-code-block">
            <span className="wcb-label">{current.codeLabel}</span>
            <code className="wcb-code">{current.code}</code>
            <button
              className="wcb-copy"
              onClick={() => navigator.clipboard.writeText(current.code)}
              title="Copy"
            >
              <CopyIcon size={13} />
            </button>
          </div>
        )}

        {current.trailingInstructions?.map((txt, i) => (
          <label key={i} className="wi-row trailing">
            <input
              type="checkbox"
              className="wi-check"
              checked={!!checked[`${step}-trailing-${i}`]}
              onChange={() => toggle(`${step}-trailing-${i}`)}
            />
            <span>{txt}</span>
          </label>
        ))}

        {current.isFinal && (
          <div className="wizard-creds">
            <div className="wc-field">
              <KeyIcon size={13} />
              <input
                className="wc-input"
                type="text"
                placeholder="Client ID"
                value={clientId}
                onChange={e => { setClientId(e.target.value); setCredError(null); }}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="wc-field">
              <KeyIcon size={13} />
              <input
                className="wc-input"
                type="password"
                placeholder="Client Secret"
                value={clientSecret}
                onChange={e => { setClientSecret(e.target.value); setCredError(null); }}
              />
            </div>
            {credError && (
              <div className="wc-error"><AlertIcon size={13} /> {credError}</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-footer">
        {step > 0 && (
          <button className="wf-back" onClick={() => setStep(s => s - 1)}>
            Back
          </button>
        )}
        <button
          className={`wf-next ${!canAdvance ? 'disabled' : ''}`}
          onClick={advance}
          disabled={!canAdvance}
        >
          {current.isFinal ? 'Authorize & Fetch' : step === STEPS.length - 2 ? 'Final step' : 'Next step'}
        </button>
      </div>
    </div>
  );
}

function ExternalLinkIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function CopyIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
