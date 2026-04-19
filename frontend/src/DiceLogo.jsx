export default function DiceLogo({ size = 36 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-label="SchengenShuffler">
      <defs>
        <linearGradient id="cBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#172554" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="cMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="cFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* Back card — rotated left */}
      <g transform="rotate(-18, 50, 70)">
        <rect x="22" y="14" width="46" height="62" rx="5" fill="url(#cBack)" />
        <rect x="25" y="17" width="40" height="56" rx="3" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
      </g>

      {/* Middle card — slightly left */}
      <g transform="rotate(-7, 50, 70)">
        <rect x="22" y="14" width="46" height="62" rx="5" fill="url(#cMid)" />
        <rect x="25" y="17" width="40" height="56" rx="3" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" />
      </g>

      {/* Front card — upright, face up */}
      <rect x="22" y="14" width="46" height="62" rx="5" fill="url(#cFront)" />
      {/* Card face — white background */}
      <rect x="24" y="16" width="42" height="58" rx="4" fill="white" opacity="0.93" />
      {/* Spade silhouette — top-left pip */}
      <text x="28.5" y="30" fontFamily="serif" fontSize="10" fontWeight="bold" fill="#1d4ed8">A</text>
      {/* Center spade symbol */}
      <path
        d="M50 38 C50 38 41 46 41 52 C41 55.5 43.5 57 46.5 56.5 C45.5 58.5 44 60 43 61.5 L57 61.5 C56 60 54.5 58.5 53.5 56.5 C56.5 57 59 55.5 59 52 C59 46 50 38 50 38Z"
        fill="#1d4ed8"
      />
      {/* Bottom-right A (upside down corner) */}
      <text x="62.5" y="69" fontFamily="serif" fontSize="10" fontWeight="bold" fill="#1d4ed8" transform="rotate(180, 66, 66)">A</text>
    </svg>
  );
}
