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
  const scale = [1.05, 0.82, 0.64][depth];
  const blur = [0, 0.6, 1.7][depth];
  const opacity = [0.98, 0.86, 0.6][depth];
  const rz = ((i * 47) % 44) - 22;
  const bx = 8 + ((i * 37) % 70);           // bias toward bill faces
  const by = 8 + ((i * 61) % 70);
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
        className="h-[64px] w-[150px] rounded-[5px] bg-cover shadow-[0_10px_26px_rgba(0,0,0,.5)] ring-1 ring-black/20 [transform-style:preserve-3d]"
        style={{ backgroundImage: `url('${CASH}')`, backgroundSize: "165%", backgroundPosition: `${bx}% ${by}%` }}
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
