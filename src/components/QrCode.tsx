import { useMemo } from 'react';

const SIZE = 29;

/** Decorative (non-scannable) QR, stable per seed. Payments are simulated in this MVP. */
export function QrCode({ seed, label }: { seed: number; label: string }) {
  const cells = useMemo(() => {
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > SIZE - 9 && y < 8) || (x < 8 && y > SIZE - 9);
    const out: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (!inFinder(x, y) && rnd() > 0.52) out.push({ x, y });
      }
    }
    return out;
  }, [seed]);

  const finders: Array<[number, number]> = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} shapeRendering="crispEdges" role="img" aria-label={label} className="mx-auto mb-3 block h-44 w-44">
      <rect width={SIZE} height={SIZE} className="fill-surface" />
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className="fill-ink" />
      ))}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" className="fill-ink" />
          <rect x={x + 1} y={y + 1} width="5" height="5" className="fill-surface" />
          <rect x={x + 2} y={y + 2} width="3" height="3" className="fill-ink" />
        </g>
      ))}
      <rect x="11" y="11" width="7" height="7" rx="1.5" className="fill-surface" />
      <rect x="11.8" y="11.8" width="5.4" height="5.4" rx="1.2" className="fill-action" />
    </svg>
  );
}
