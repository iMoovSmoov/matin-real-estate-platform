"use client";

const CASH_IMAGES = Array.from({ length: 15 }, (_, n) =>
  `/matin/cash/cash-${String(n).padStart(2, "0")}.jpg`
);

function Bill({ i }: { i: number }) {
  const src = CASH_IMAGES[i % CASH_IMAGES.length];
  const left = (i * 129 + i * i * 7) % 100;
  const dur = 10 + (i % 6) * 1.9;
  const delay = -((i * 1.9) % 15);
  const depth = i % 3;
  const scale = [1.05, 0.82, 0.64][depth];
  const blur = [0, 0.6, 1.7][depth];
  const opacity = [0.98, 0.86, 0.6][depth];
  const rz = ((i * 47) % 44) - 22;
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
        className="h-[64px] w-[150px] rounded-[5px] shadow-[0_10px_26px_rgba(0,0,0,.5)] ring-1 ring-black/20"
        style={{ backgroundImage: `url('${src}')`, backgroundSize: "cover", backgroundPosition: "center" }}
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
