"use client";

/**
 * Falling REAL cash — each bill is a crop of an actual $100-bill photo,
 * so it reads as real money (no coins, no stylized rectangles).
 * Positions/timings are deterministic (index-based) → no hydration drift.
 */
const CASH = "/matin/cash/cash-09.jpg";

function Bill({ i }: { i: number }) {
  const left = (i * 129 + i * i * 7) % 100;
  const dur = 10 + (i % 6) * 1.9;          // 10–19s
  const delay = -((i * 1.9) % 15);         // already mid-flight, staggered
  const depth = i % 3;                      // 0 near → 2 far
  const scale = [1.08, 0.84, 0.62][depth];
  const blur = [0, 1.1, 2.6][depth];
  const opacity = [0.97, 0.82, 0.55][depth];
  const rz = ((i * 47) % 50) - 25;
  const bx = (i * 37) % 100;
  const by = (i * 61) % 100;
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
      <div
        className="h-[46px] w-[108px] rounded-[4px] bg-cover shadow-[0_8px_22px_rgba(0,0,0,.45)] ring-1 ring-black/20 [transform-style:preserve-3d]"
        style={{ backgroundImage: `url('${CASH}')`, backgroundSize: "260%", backgroundPosition: `${bx}% ${by}%` }}
      />
    </div>
  );
}

export function CashRain({ count = 18 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Bill key={i} i={i} />
      ))}
    </div>
  );
}
