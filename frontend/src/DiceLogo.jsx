export default function DiceLogo({ size = 36 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-label="SchengenShuffler">
      <defs>
        <linearGradient id="dFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="dTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="dSide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      <rect x="15" y="30" width="60" height="55" rx="7" fill="url(#dFace)" />
      <polygon points="15,30 75,30 92,13 32,13" fill="url(#dTop)" />
      <polygon points="75,30 92,13 92,68 75,85" fill="url(#dSide)" />
      <circle cx="31" cy="46" r="5.5" fill="white" opacity="0.95" />
      <circle cx="59" cy="46" r="5.5" fill="white" opacity="0.95" />
      <circle cx="31" cy="69" r="5.5" fill="white" opacity="0.95" />
      <circle cx="59" cy="69" r="5.5" fill="white" opacity="0.95" />
      <circle cx="52" cy="22" r="4" fill="white" opacity="0.7" />
      <circle cx="72" cy="22" r="4" fill="white" opacity="0.7" />
    </svg>
  );
}
