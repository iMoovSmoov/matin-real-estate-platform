"use client";

/**
 * Premium animated "cash rain" backdrop for the Cash Is King page.
 * Styled $100 bills + gold coins fall + flip with depth-of-field blur.
 * All positions/timings are deterministic (index-based) → no hydration drift.
 */

function Bill({ i }: { i: number }) {
  const left = (i * 137) % 100;                 // spread across width
  const dur = 9 + (i % 6) * 1.6;                // 9–17s
  const delay = -((i * 1.7) % 12);              // staggered, already mid-flight
  const depth = i % 3;                          // 0 near, 2 far
  const scale = [1, 0.78, 0.58][depth];
  const blur = [0, 1.2, 2.6][depth];
  const opacity = [0.95, 0.7, 0.45][depth];
  const rz = ((i * 41) % 40) - 20;              // tilt
  return (
    <div
      className="absolute top-0 will-change-transform"
      style={{
        left: `${left}%`,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale})`,
        animation: `cashfall ${dur}s linear ${delay}s infinite`,
        ["--rz" as string]: `${rz}deg`,
      }}
    >
      <div className="relative h-[44px] w-[92px] rounded-[6px] border border-emerald-300/40 bg-gradient-to-br from-emerald-800 to-emerald-950 shadow-lg [transform-style:preserve-3d]">
        <span className="absolute left-1.5 top-1 text-[0.6rem] font-bold text-emerald-200/90">100</span>
        <span className="absolute bottom-1 right-1.5 text-[0.6rem] font-bold text-emerald-200/90">100</span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300/50 font-display text-[0.7rem] text-emerald-100">
            $
          </span>
        </span>
      </div>
    </div>
  );
}

function Coin({ i }: { i: number }) {
  const left = (i * 211 + 30) % 100;
  const dur = 11 + (i % 5) * 1.4;
  const delay = -((i * 2.3) % 14);
  const depth = i % 2;
  const scale = [0.9, 0.6][depth];
  const opacity = [0.9, 0.55][depth];
  const blur = [0, 1.8][depth];
  return (
    <div
      className="absolute top-0 will-change-transform"
      style={{
        left: `${left}%`,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale})`,
        animation: `cashfall ${dur}s linear ${delay}s infinite`,
      }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-200/70 bg-gradient-to-br from-amber-300 to-amber-600 font-display text-[0.85rem] font-bold text-amber-900 shadow-[0_4px_14px_rgba(217,180,120,.4)]">
        $
      </div>
    </div>
  );
}

export function CashRain() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <Bill key={`b${i}`} i={i} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <Coin key={`c${i}`} i={i} />
      ))}
    </div>
  );
}
