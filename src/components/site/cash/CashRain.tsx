"use client";

/**
 * Falling cash — clean, hand-drawn SVG $100 banknotes (no photos).
 * Reads instantly as money at any size or motion blur, looks intentional,
 * and stays crisp on every screen. Deterministic per-index positions/timings
 * → no hydration drift. Pure CSS motion via the `cashfall` keyframe.
 */

function Banknote({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 150 64"
      className="h-[62px] w-[146px]"
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={`bill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f9b72" />
          <stop offset="0.55" stopColor="#357d56" />
          <stop offset="1" stopColor="#235f41" />
        </linearGradient>
        <radialGradient id={`seal-${id}`} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#cdeada" />
          <stop offset="1" stopColor="#2f7050" />
        </radialGradient>
      </defs>

      {/* Bill body */}
      <rect x="1" y="1" width="148" height="62" rx="7" fill={`url(#bill-${id})`} stroke="#1d4a33" strokeWidth="1.2" />

      {/* Decorative inner frame */}
      <rect x="6" y="6" width="138" height="52" rx="5" fill="none" stroke="#a9d8bd" strokeWidth="0.8" opacity="0.55" />
      <rect x="9" y="9" width="132" height="46" rx="4" fill="none" stroke="#a9d8bd" strokeWidth="0.5" opacity="0.3" />

      {/* Guilloché hairlines */}
      <path d="M10 14 H140 M10 50 H140" stroke="#bfe4cf" strokeWidth="0.4" opacity="0.3" />

      {/* Center portrait medallion */}
      <ellipse cx="75" cy="32" rx="18" ry="20" fill="#2c6a49" opacity="0.85" />
      <ellipse cx="75" cy="32" rx="18" ry="20" fill="none" stroke="#bfe4cf" strokeWidth="0.7" opacity="0.6" />
      <circle cx="75" cy="28" r="5" fill="#bfe4cf" opacity="0.5" />
      <path d="M67.5 41 q7.5 -8 15 0 z" fill="#bfe4cf" opacity="0.45" />

      {/* Corner numerals — classic note layout */}
      <text x="13" y="19" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" fontWeight="700" fill="#dff1e6" opacity="0.92">100</text>
      <text x="116" y="55" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" fontWeight="700" fill="#dff1e6" opacity="0.92">100</text>

      {/* Corner seals */}
      <circle cx="26" cy="46" r="7" fill={`url(#seal-${id})`} opacity="0.7" />
      <circle cx="26" cy="46" r="7" fill="none" stroke="#dff1e6" strokeWidth="0.6" opacity="0.6" />
      <text x="118" y="20" fontFamily="Georgia, serif" fontSize="6.5" letterSpacing="0.5" fill="#dff1e6" opacity="0.65">USA</text>

      {/* "$" accents flanking the portrait */}
      <text x="44" y="37" fontFamily="Georgia, serif" fontSize="13" fontWeight="700" fill="#dff1e6" opacity="0.55">$</text>
      <text x="100" y="37" fontFamily="Georgia, serif" fontSize="13" fontWeight="700" fill="#dff1e6" opacity="0.55">$</text>
    </svg>
  );
}

function Bill({ i }: { i: number }) {
  const left = (i * 129 + i * i * 7) % 100;
  const dur = 11 + (i % 6) * 1.8; // 11–20s
  const delay = -((i * 1.9) % 16); // already mid-flight, staggered
  const depth = i % 3; // 0 near → 2 far
  const scale = [1.06, 0.84, 0.66][depth];
  const blur = [0, 0.5, 1.4][depth];
  const opacity = [0.97, 0.82, 0.58][depth];
  const rz = ((i * 47) % 46) - 23;
  return (
    <div
      className="absolute top-0 will-change-transform drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
      style={{
        left: `${left}%`,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale})`,
        animation: `cashfall ${dur}s linear ${delay}s infinite`,
        ["--rz" as string]: `${rz}deg`,
      }}
    >
      <Banknote id={String(i)} />
    </div>
  );
}

export function CashRain({ count = 16 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Bill key={i} i={i} />
      ))}
    </div>
  );
}
