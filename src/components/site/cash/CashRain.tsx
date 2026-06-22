"use client";

/**
 * Falling cash — detailed, realistic $100 banknotes drawn in SVG (no photos).
 * Correct 2.61:1 proportion, cream center panel + federal-green frame, Franklin
 * oval portrait, corner denominations, seals, micro-line guilloché — reads as
 * real currency, not a flat green rectangle. Each bill flutters (a sway wrapper)
 * while it falls and tumbles in 3D (cashfall + per-bill --ry/--rx/--rz/--sway).
 * Deterministic per-index → no hydration drift. Pure CSS motion.
 */

function Banknote({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 261 110" className="h-[58px] w-[138px]" role="img" aria-hidden>
      <defs>
        <linearGradient id={`paper-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef0e0" />
          <stop offset="0.5" stopColor="#e3e7d2" />
          <stop offset="1" stopColor="#d9ddc6" />
        </linearGradient>
        <linearGradient id={`green-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f7a52" />
          <stop offset="1" stopColor="#0e5c3b" />
        </linearGradient>
        <radialGradient id={`oval-${id}`} cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor="#f3f4e6" />
          <stop offset="1" stopColor="#cdd2b6" />
        </radialGradient>
      </defs>

      {/* Note paper */}
      <rect x="1" y="1" width="259" height="108" rx="6" fill={`url(#paper-${id})`} stroke="#0e5c3b" strokeWidth="1.4" />

      {/* Ornate engraved frame (double rule) */}
      <rect x="6.5" y="6.5" width="248" height="97" rx="4" fill="none" stroke={`url(#green-${id})`} strokeWidth="1.6" />
      <rect x="10" y="10" width="241" height="90" rx="3" fill="none" stroke="#2f7d57" strokeWidth="0.5" opacity="0.55" />

      {/* Guilloché corner rosettes */}
      {[
        [22, 24], [239, 24], [22, 86], [239, 86],
      ].map(([cx, cy], k) => (
        <g key={k} opacity="0.5">
          <circle cx={cx} cy={cy} r="11" fill="none" stroke="#1f7a52" strokeWidth="0.5" />
          <circle cx={cx} cy={cy} r="7.5" fill="none" stroke="#1f7a52" strokeWidth="0.4" />
          <circle cx={cx} cy={cy} r="4" fill="none" stroke="#1f7a52" strokeWidth="0.4" />
        </g>
      ))}

      {/* Corner numerals */}
      <text x="22" y="28.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="11" fontWeight="700" fill="#0e5c3b">100</text>
      <text x="239" y="90.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="11" fontWeight="700" fill="#0e5c3b">100</text>

      {/* Top + bottom legend bands */}
      <text x="130.5" y="20" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" letterSpacing="0.5" fill="#0e5c3b" opacity="0.92">THE UNITED STATES OF AMERICA</text>
      <text x="130.5" y="98" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" letterSpacing="0.6" fontWeight="600" fill="#0e5c3b" opacity="0.9">ONE HUNDRED DOLLARS</text>

      {/* Center portrait oval (Franklin) */}
      <ellipse cx="130.5" cy="56" rx="30" ry="30" fill={`url(#oval-${id})`} stroke="#0e5c3b" strokeWidth="0.8" />
      <ellipse cx="130.5" cy="56" rx="30" ry="30" fill="none" stroke="#1f7a52" strokeWidth="0.4" opacity="0.5" transform="scale(0.9)" transform-origin="130.5 56" />
      {/* portrait silhouette hint */}
      <g fill="#9aa17e" opacity="0.7">
        <circle cx="130.5" cy="50" r="8.5" />
        <path d="M118 70 q12.5 -13 25 0 q-2 4 -12.5 4 q-10.5 0 -12.5 -4 z" />
      </g>
      {/* fine portrait line shading */}
      {Array.from({ length: 7 }).map((_, k) => (
        <line key={k} x1={113 + k * 2.5} y1="42" x2={113 + k * 2.5} y2="70" stroke="#0e5c3b" strokeWidth="0.25" opacity="0.25" />
      ))}

      {/* Left seal + right $100 medallion */}
      <g opacity="0.85">
        <circle cx="62" cy="56" r="14" fill="none" stroke="#1f7a52" strokeWidth="0.8" />
        <circle cx="62" cy="56" r="9.5" fill="#2f7d57" opacity="0.18" />
        <text x="62" y="59" textAnchor="middle" fontFamily="Georgia, serif" fontSize="6" fontWeight="700" fill="#0e5c3b">USA</text>
      </g>
      <g>
        <circle cx="199" cy="56" r="16" fill="#13714a" opacity="0.92" />
        <circle cx="199" cy="56" r="16" fill="none" stroke="#bfe0cd" strokeWidth="0.6" />
        <text x="199" y="61" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fontWeight="700" fill="#eaf3ec">$100</text>
      </g>

      {/* micro-line ground (engraved texture) */}
      {Array.from({ length: 16 }).map((_, k) => (
        <line key={`g${k}`} x1="12" y1={14 + k * 5.2} x2="249" y2={14 + k * 5.2} stroke="#1f7a52" strokeWidth="0.18" opacity="0.1" />
      ))}
    </svg>
  );
}

function Bill({ i }: { i: number }) {
  const left = (i * 129 + i * i * 7) % 100;
  const dur = 12 + (i % 6) * 2.2; // 12–23s fall
  const delay = -((i * 2.3) % 18);
  const depth = i % 3; // 0 near → 2 far
  const scale = [1.08, 0.82, 0.62][depth];
  const blur = [0, 0.5, 1.3][depth];
  const opacity = [0.98, 0.84, 0.6][depth];
  const rz = ((i * 47) % 50) - 25;
  const ry = 540 + ((i * 53) % 4) * 180; // 540–1080° flip
  const rx = ((i % 2) ? 1 : -1) * (120 + ((i * 31) % 160)); // tumble fwd/back
  const sway = 10 + ((i * 17) % 22); // px horizontal flutter
  const swayDur = 2.6 + (i % 5) * 0.7;
  return (
    <div
      className="absolute top-0 will-change-transform"
      style={{
        left: `${left}%`,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        animation: `cashfall ${dur}s linear ${delay}s infinite`,
        ["--rz" as string]: `${rz}deg`,
        ["--ry" as string]: `${ry}deg`,
        ["--rx" as string]: `${rx}deg`,
      }}
    >
      {/* sway wrapper = horizontal flutter independent of the vertical tumble */}
      <div
        className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
        style={{
          transform: `scale(${scale})`,
          animation: `cashsway ${swayDur}s ease-in-out ${delay}s infinite`,
          ["--sway" as string]: `${sway}px`,
        }}
      >
        <Banknote id={String(i)} />
      </div>
    </div>
  );
}

export function CashRain({ count = 16 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [perspective:900px]">
      {Array.from({ length: count }).map((_, i) => (
        <Bill key={i} i={i} />
      ))}
    </div>
  );
}
