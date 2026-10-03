import { seeded } from "./layout";

/** Smooth value noise in 2D, for grain that wanders like real growth rings. */
function noise(seed: number) {
  const random = seeded(seed);
  const table = Array.from({ length: 512 }, () => random());
  const at = (x: number, y: number) => table[((x & 15) + (y & 31) * 16) & 511];
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const bottom = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return top + (bottom - top) * sy;
  };
}

/**
 * Oiled walnut planks, 1600 × 1000: each board its own tone, grain flowing round in long figure, pores,
 * bevelled seams between boards. Painted once; the interactive table shows it as a cover-fit background
 * and the 3D table maps the same canvas the same way.
 */
export function walnut() {
  const w = 1600;
  const h = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  const image = g.createImageData(w, h);
  const n1 = noise(11);
  const n2 = noise(23);
  const n3 = noise(37);
  const fbm = (x: number, y: number) => n1(x, y) * 0.55 + n2(x * 2.1, y * 2.1) * 0.3 + n3(x * 4.3, y * 4.3) * 0.15;
  const plank = 190;
  for (let y = 0; y < h; y++) {
    const board = Math.floor(y / plank);
    const within = (y % plank) / plank;
    const tone = 0.82 + 0.3 * n3(board * 3.7, 0.5);
    const shift = board * 431;
    for (let x = 0; x < w; x++) {
      // Grain runs along the board; its lines are bent by low-frequency noise into long flowing figure.
      const warp = fbm((x + shift) / 260, y / 120) * 6;
      const rings = Math.sin((y / plank) * 38 + warp * 3.2 + board * 5);
      const figure = Math.pow(0.5 + 0.5 * rings, 3);
      const streak = n2((x + shift) / 9, y / 1.6);
      const pore = n1((x + shift) / 2.2, y / 1.1) > 0.86 ? 0.82 : 1;
      let v = tone * (0.62 + 0.28 * fbm((x + shift) / 400, y / 90) - 0.22 * figure + 0.1 * streak) * pore;
      const edge = Math.min(within, 1 - within) * plank;
      if (edge < 2.2) v *= 0.35 + 0.25 * edge;
      else if (edge < 6) v *= 0.92 + 0.016 * edge;
      const i = (x + y * w) * 4;
      image.data[i] = Math.min(255, 92 * v + 10);
      image.data[i + 1] = Math.min(255, 58 * v + 6);
      image.data[i + 2] = Math.min(255, 36 * v + 4);
      image.data[i + 3] = 255;
    }
  }
  g.putImageData(image, 0, 0);
  const sheen = g.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, "rgba(255,230,200,0)");
  sheen.addColorStop(0.45, "rgba(255,230,200,0.07)");
  sheen.addColorStop(0.6, "rgba(255,230,200,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, w, h);
  return canvas;
}
