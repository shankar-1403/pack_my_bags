// Where every print rests on the gallery table, in table pixels (x right, y down). Shared by the 3D intro,
// which lands the prints here, and the interactive table, which starts from here, so the hand-off is exact.

/** A Polaroid print is 88 × 107 mm. One "print width" (88 mm) is the 3D scene's unit of length. */
export const ASPECT = 107 / 88;

export type Spot = { x: number; y: number; angle: number };
export type TableLayout = { width: number; height: number; cardW: number; count: number; homes: Spot[] };

export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function layoutTable(width: number, height: number, total: number): TableLayout {
  const count = width < 640 ? Math.min(12, total) : total;
  // Prints cover a little under half the table, leaving room to throw them about.
  const cardW = clamp(Math.sqrt((0.4 * width * height) / (count * ASPECT)), 88, 220);
  const cardH = cardW * ASPECT;

  // A loose grid with jitter: spread out, never neat.
  const cols = Math.max(2, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = height / rows;
  const random = seeded(7);
  const homes = Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // A short last row spreads its prints across the full width.
    const inRow = row === rows - 1 ? count - row * cols : cols;
    const w = width / inRow;
    return {
      x: clamp(w * (col + 0.5) + (random() - 0.5) * cellW * 0.3, cardW * 0.55, width - cardW * 0.55),
      y: clamp(cellH * (row + 0.5) + (random() - 0.5) * cellH * 0.25, cardH * 0.55, height - cardH * 0.55),
      angle: (random() - 0.5) * 0.5,
    };
  });

  // No two prints may overlap and none may cross the edge, counting each one's tilted outline: the
  // interactive table starts exactly here, and any overlap would be shoved apart the moment it takes over.
  const gap = 8;
  const extent = homes.map((h) => {
    const c = Math.abs(Math.cos(h.angle));
    const s = Math.abs(Math.sin(h.angle));
    return { x: (cardW * c + cardH * s) / 2, y: (cardW * s + cardH * c) / 2 };
  });
  const fit = () =>
    homes.forEach((h, i) => {
      h.x = clamp(h.x, extent[i].x + gap, width - extent[i].x - gap);
      h.y = clamp(h.y, extent[i].y + gap, height - extent[i].y - gap);
    });
  fit();
  for (let pass = 0; pass < 40; pass++) {
    let moved = false;
    for (let i = 0; i < homes.length; i++)
      for (let j = i + 1; j < homes.length; j++) {
        const a = homes[i];
        const b = homes[j];
        const ox = extent[i].x + extent[j].x + gap - Math.abs(a.x - b.x);
        const oy = extent[i].y + extent[j].y + gap - Math.abs(a.y - b.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox < oy) {
          const push = (ox / 2) * Math.sign(a.x - b.x || 1);
          a.x += push;
          b.x -= push;
        } else {
          const push = (oy / 2) * Math.sign(a.y - b.y || 1);
          a.y += push;
          b.y -= push;
        }
      }
    fit();
    if (!moved) break;
  }
  return { width, height, cardW, count, homes };
}

