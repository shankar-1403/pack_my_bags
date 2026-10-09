import * as THREE from "three";

// Organic shapes from signed distance fields: soft unions of capsules and ellipsoids, polygonised
// with surface nets. Used for the hand, which needs to read as one continuous piece of skin.

type Vec = [number, number, number];
type Shape = { d: (x: number, y: number, z: number) => number; c: Vec; r: number; k: number };

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mid = (a: Vec, b: Vec): Vec => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const len = (a: Vec) => Math.sqrt(dot(a, a));

/** Polynomial smooth minimum: surfaces closer than k melt into each other. */
function smin(a: number, b: number, k: number) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** A capsule whose radius runs from r1 at a to r2 at b (Inigo Quilez's round cone). */
export function cone(a: Vec, b: Vec, r1: number, r2: number, k: number): Shape {
  const ba = sub(b, a);
  const l2 = dot(ba, ba);
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  return {
    c: mid(a, b),
    r: Math.sqrt(l2) / 2 + Math.max(r1, r2),
    k,
    d(x, y, z) {
      const pa: Vec = [x - a[0], y - a[1], z - a[2]];
      const t = dot(pa, ba);
      const u = t - l2;
      const q: Vec = [pa[0] * l2 - ba[0] * t, pa[1] * l2 - ba[1] * t, pa[2] * l2 - ba[2] * t];
      const x2 = dot(q, q);
      const y2 = t * t * l2;
      const z2 = u * u * l2;
      const s = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(u) * a2 * z2 > s) return Math.sqrt(x2 + z2) * il2 - r2;
      if (Math.sign(t) * a2 * y2 < s) return Math.sqrt(x2 + y2) * il2 - r1;
      return (Math.sqrt(x2 * a2 * il2) + t * rr) * il2 - r1;
    },
  };
}

export const ball = (c: Vec, r: number, k: number) => cone(c, [c[0], c[1] - 1e-5, c[2]], r, r, k);

export function ellipsoid(c: Vec, radii: Vec, k: number): Shape {
  return {
    c,
    r: Math.max(...radii),
    k,
    d(x, y, z) {
      const p: Vec = [(x - c[0]) / radii[0], (y - c[1]) / radii[1], (z - c[2]) / radii[2]];
      const q: Vec = [p[0] / radii[0], p[1] / radii[1], p[2] / radii[2]];
      const k0 = len(p);
      const k1 = len(q);
      return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(...radii);
    },
  };
}

export function roundBox(c: Vec, half: Vec, round: number, k: number): Shape {
  return {
    c,
    r: len(half) + round,
    k,
    d(x, y, z) {
      const qx = Math.abs(x - c[0]) - half[0] + round;
      const qy = Math.abs(y - c[1]) - half[1] + round;
      const qz = Math.abs(z - c[2]) - half[2] + round;
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
      return outside + Math.min(Math.max(qx, qy, qz), 0) - round;
    },
  };
}

/** Soft union of shapes in order; shapes too far away to matter are skipped. */
export function union(shapes: Shape[]) {
  return (x: number, y: number, z: number) => {
    let d = Infinity;
    for (const s of shapes) {
      const dx = x - s.c[0];
      const dy = y - s.c[1];
      const dz = z - s.c[2];
      const bound = Math.sqrt(dx * dx + dy * dy + dz * dz) - s.r;
      if (bound > d + s.k) continue;
      d = smin(d, s.d(x, y, z), s.k);
    }
    return d;
  };
}

const CORNERS: Vec[] = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

/**
 * Polygonises the union with surface nets. `tint` returns a colour multiplier for each vertex (given the
 * position, its normal and the field), for creases and skin tone variation.
 */
export type SculptData = { position: Float32Array; normal: Float32Array; color: Float32Array; index: Uint32Array };

export function sculpt(...args: Parameters<typeof sculptData>) {
  return toGeometry(sculptData(...args));
}

export function toGeometry(data: SculptData) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data.position, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(data.normal, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(data.color, 3));
  geometry.setIndex(new THREE.BufferAttribute(data.index, 1));
  return geometry;
}

/** The surface as plain arrays: transferable, so the hands can be sculpted off the main thread. */
export function sculptData(shapes: Shape[], step: number, tint: (p: Vec, n: Vec, field: (x: number, y: number, z: number) => number) => Vec) {
  const field = union(shapes);
  const lo: Vec = [Infinity, Infinity, Infinity];
  const hi: Vec = [-Infinity, -Infinity, -Infinity];
  for (const s of shapes) {
    for (let a = 0; a < 3; a++) {
      lo[a] = Math.min(lo[a], s.c[a] - s.r - 2 * step);
      hi[a] = Math.max(hi[a], s.c[a] + s.r + 2 * step);
    }
  }
  const n = [0, 1, 2].map((a) => Math.ceil((hi[a] - lo[a]) / step) + 1);
  const [nx, ny, nz] = n;
  // A coarse pass first: far from the surface the nearest coarse sample already settles the sign, so
  // only a thin shell round the surface needs the full field.
  const C = 4;
  const [cx, cy, cz] = n.map((v) => Math.ceil((v - 1) / C) + 1);
  const coarse = new Float32Array(cx * cy * cz);
  for (let k = 0; k < cz; k++)
    for (let j = 0; j < cy; j++)
      for (let i = 0; i < cx; i++) coarse[i + cx * (j + cy * k)] = field(lo[0] + i * C * step, lo[1] + j * C * step, lo[2] + k * C * step);
  const values = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const ci = Math.round(i / C);
        const cj = Math.round(j / C);
        const ck = Math.round(k / C);
        const near = coarse[Math.min(ci, cx - 1) + cx * (Math.min(cj, cy - 1) + cy * Math.min(ck, cz - 1))];
        const gap = Math.sqrt((i - ci * C) ** 2 + (j - cj * C) ** 2 + (k - ck * C) ** 2) * step;
        values[i + nx * (j + ny * k)] =
          Math.abs(near) > gap + step * 2 ? near - Math.sign(near) * gap : field(lo[0] + i * step, lo[1] + j * step, lo[2] + k * step);
      }

  const cells = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cellAt = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const positions: number[] = [];
  const corner = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0;
        for (let c = 0; c < 8; c++) {
          corner[c] = values[i + CORNERS[c][0] + nx * (j + CORNERS[c][1] + ny * (k + CORNERS[c][2]))];
          if (corner[c] < 0) inside++;
        }
        if (inside === 0 || inside === 8) continue;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let count = 0;
        for (const [e0, e1] of EDGES) {
          const v0 = corner[e0];
          const v1 = corner[e1];
          if (v0 < 0 === v1 < 0) continue;
          const t = v0 / (v0 - v1);
          sx += CORNERS[e0][0] + (CORNERS[e1][0] - CORNERS[e0][0]) * t;
          sy += CORNERS[e0][1] + (CORNERS[e1][1] - CORNERS[e0][1]) * t;
          sz += CORNERS[e0][2] + (CORNERS[e1][2] - CORNERS[e0][2]) * t;
          count++;
        }
        cells[cellAt(i, j, k)] = positions.length / 3;
        positions.push(lo[0] + (i + sx / count) * step, lo[1] + (j + sy / count) * step, lo[2] + (k + sz / count) * step);
      }

  const indices: number[] = [];
  const axisStep = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const here = values[i + nx * (j + ny * k)];
        const g = [i, j, k];
        for (let axis = 0; axis < 3; axis++) {
          const s = axisStep[axis];
          const there = values[i + s[0] + nx * (j + s[1] + ny * (k + s[2]))];
          if (here < 0 === there < 0) continue;
          const u = (axis + 1) % 3;
          const v = (axis + 2) % 3;
          const cell = (du: number, dv: number) => {
            const c = [...g];
            c[u] -= du;
            c[v] -= dv;
            return cells[cellAt(c[0], c[1], c[2])];
          };
          const a = cell(0, 0);
          const b = cell(1, 0);
          const c = cell(1, 1);
          const d = cell(0, 1);
          if (a < 0 || b < 0 || c < 0 || d < 0) continue;
          if (here < 0) indices.push(a, b, c, a, c, d);
          else indices.push(a, c, b, a, d, c);
        }
      }

  const normals = new Float32Array(positions.length);
  const colors = new Float32Array(positions.length);
  const e = step * 0.5;
  for (let v = 0; v < positions.length; v += 3) {
    const [x, y, z] = [positions[v], positions[v + 1], positions[v + 2]];
    const nrm: Vec = [field(x + e, y, z) - field(x - e, y, z), field(x, y + e, z) - field(x, y - e, z), field(x, y, z + e) - field(x, y, z - e)];
    const l = len(nrm) || 1;
    nrm[0] /= l;
    nrm[1] /= l;
    nrm[2] /= l;
    normals.set(nrm, v);
    colors.set(tint([x, y, z], nrm, field), v);
  }
  return { position: new Float32Array(positions), normal: normals, color: colors, index: new Uint32Array(indices) };
}

/** Ambient occlusion from the field: how much the surface is crowded within a few millimetres. */
export function occlusion(p: Vec, n: Vec, field: (x: number, y: number, z: number) => number) {
  let occ = 0;
  for (let i = 1; i <= 4; i++) {
    const h = 0.0025 * i;
    occ += (h - field(p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h)) / 2 ** i;
  }
  return Math.min(1, Math.max(0, 1 - 90 * occ));
}
