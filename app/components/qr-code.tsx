/** Deterministic QR-looking module field (decorative). */
export function QrCode() {
  const N = 21;
  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  const modules: [number, number][] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (inFinder(x, y)) continue;
      if ((x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0) modules.push([x, y]);
    }
  }
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`}>
      <rect x={fx} y={fy} width={7} height={7} fill="currentColor" />
      <rect x={fx + 1} y={fy + 1} width={5} height={5} fill="#fdfefd" />
      <rect x={fx + 2} y={fy + 2} width={3} height={3} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="h-full w-full" aria-hidden="true">
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
      {modules.map(([x, y]) => (
        <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}
