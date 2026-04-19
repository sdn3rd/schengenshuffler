export default function DiceLogo({ size = 36 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-label="SchengenShuffler">
      <defs>
        <linearGradient id="dFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="dTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="dSide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
      </defs>
      <rect x="15" y="30" width="60" height="55" rx="7" fill="url(#dFace)" />
      <polygon points="15,30 75,30 92,13 32,13" fill="url(#dTop)" />
      <polygon points="75,30 92,13 92,68 75,85" fill="url(#dSide)" />
      <circle cx="31" cy="46" r="5.5" fill="white" opacity="0.95" />
      <circle cx="59" cy="46" r="5.5" fill="white" opacity="0.95" />
      <circle cx="31" cy="69" r="5.5" fill="white" opacity="0.95" />
      <circle cx="59" cy="69" r="5.5" fill="white" opacity="0.95" />
      <circle cx="52" cy="22" r="4" fill="white" opacity="0.75" />
      <circle cx="72" cy="22" r="4" fill="white" opacity="0.75" />
    </svg>
  );
}
