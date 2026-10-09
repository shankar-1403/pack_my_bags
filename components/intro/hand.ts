import * as THREE from "three";
import { ball, cone, ellipsoid, occlusion, roundBox, sculptData, toGeometry } from "./sculpt";

// A right hand in the wrist's frame: fingers run along -y, the palm faces +x, the thumb is on the +z side.
// "grip" closes round a handle bar lying along z through GRIP_BAR; "loose" is the softly curled hand of
// a hanging, swinging arm.

type Vec = [number, number, number];

/** Centre of the handle bar the gripping hand closes round. */
export const GRIP_BAR: Vec = [0.0365, -0.09, 0];
/**
 * The bar crosses the palm diagonally, as a handle does in a real power grip: from the base of the index
 * finger toward the heel of the hand. This is its direction in the hand's frame.
 */
export const GRIP_TILT = 0.63;
export const GRIP_AXIS: Vec = [0, -Math.sin(GRIP_TILT), Math.cos(GRIP_TILT)];
/** Where the bar's centre line crosses a finger's plane (z): further toward the fingertips on the index side. */
const barAt = (z: number): Vec => [GRIP_BAR[0], GRIP_BAR[1] - z * Math.tan(GRIP_TILT), z];

// Index → little: knuckle height across the hand, phalanx lengths, finger thickness.
const FINGERS = [
  { z: 0.026, knuckle: 0, bones: [0.041, 0.025, 0.02], r: 0.0085 },
  { z: 0.0085, knuckle: 0.002, bones: [0.045, 0.028, 0.021], r: 0.0088 },
  { z: -0.009, knuckle: 0, bones: [0.042, 0.026, 0.02], r: 0.0083 },
  { z: -0.0255, knuckle: -0.007, bones: [0.033, 0.02, 0.018], r: 0.0072 },
];
// Half the bar's thickness, plus a hair of air.
const BAR_REACH = 0.0195;

/** Joint positions walking along a finger, bending toward the palm (+x) by the given angles. */
function curl(start: Vec, bones: number[], bends: number[], z: number): Vec[] {
  const points: Vec[] = [start];
  let angle = 0;
  bones.forEach((length, i) => {
    angle += bends[i];
    const p = points[points.length - 1];
    points.push([p[0] + Math.sin(angle) * length, p[1] - Math.cos(angle) * length, z]);
  });
  return points;
}

/**
 * Joints of a finger wrapped round the bar like a rope round a post: each straight phalanx is laid
 * tangent to the bar (never cutting into it), bending at the joints. `turn` is +1 to wrap the way the
 * fingers do, -1 the way the thumb does. Crossing the finger on the diagonal, the bar's section is an
 * ellipse stretched along y; the wrap is worked out with y squeezed so it is a circle again.
 */
function hug(start: Vec, centre: Vec, clearance: number, bones: number[], turn = 1): Vec[] {
  const squeeze = Math.cos(GRIP_TILT);
  let p: [number, number] = [start[0], start[1] * squeeze];
  const c: [number, number] = [centre[0], centre[1] * squeeze];
  const points: Vec[] = [start];
  for (const length of bones) {
    const wx = c[0] - p[0];
    const wy = c[1] - p[1];
    const distance = Math.hypot(wx, wy);
    const beta = -turn * Math.asin(Math.min(1, clearance / distance));
    const ux = (wx * Math.cos(beta) - wy * Math.sin(beta)) / distance;
    const uy = (wx * Math.sin(beta) + wy * Math.cos(beta)) / distance;
    // A real bone of this length spans less of the squeezed plane the more it runs along y.
    const step = length / Math.hypot(ux, uy / squeeze);
    p = [p[0] + ux * step, p[1] + uy * step];
    points.push([p[0], p[1] / squeeze, start[2]]);
  }
  return points;
}

/** A smooth path through the joints, evenly sampled, so a finger curls rather than kinks. */
function smoothPath(joints: Vec[], samples: number): Vec[] {
  const curve = new THREE.CatmullRomCurve3(joints.map((j) => new THREE.Vector3(...j)), false, "centripetal");
  return curve.getSpacedPoints(samples).map((p) => [p.x, p.y, p.z]);
}

/** Unit vector across the back of the finger at joint i (away from the palm side of the curl). */
function dorsal(joints: Vec[], i: number): Vec {
  const a = joints[Math.max(0, i - 1)];
  const b = joints[Math.min(joints.length - 1, i + 1)];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l, 0];
}

const offset = (p: Vec, d: Vec, by: number): Vec => [p[0] + d[0] * by, p[1] + d[1] * by, p[2] + d[2] * by];

export function handGeometry(pose: "grip" | "loose") {
  return toGeometry(handData(pose));
}

/** The sculpted hand as plain arrays (see hand-worker.ts). */
export function handData(pose: "grip" | "loose") {
  const { shapes, knuckles, nails } = handShapes(pose);
  return sculptData(shapes, 0.0017, (p, n, field) => {
    // Creases between fingers and in the palm fall into soft shadow.
    const ao = occlusion(p, n, field);
    let r = 0.42 + 0.58 * ao;
    let g = r;
    let b = r;
    // Knuckles run a little warmer and ruddier.
    for (const k of knuckles) {
      const d = Math.hypot(p[0] - k[0], p[1] - k[1], p[2] - k[2]);
      if (d < 0.016) {
        const w = 1 - d / 0.016;
        r *= 1 - 0.04 * w;
        g *= 1 - 0.12 * w;
        b *= 1 - 0.12 * w;
      }
    }
    // Nails: paler and pinker.
    for (const nail of nails) {
      const d = Math.hypot(p[0] - nail.at[0], p[1] - nail.at[1], p[2] - nail.at[2]);
      const facing = n[0] * nail.out[0] + n[1] * nail.out[1];
      if (d < 0.0068 && facing > 0.3) {
        const w = Math.min(1, (0.0068 - d) / 0.002) * Math.min(1, (facing - 0.3) / 0.3);
        r *= 1 + 0.32 * w;
        g *= 1 + 0.28 * w;
        b *= 1 + 0.3 * w;
      }
    }
    return [r, g, b];
  });
}

export function handShapes(pose: "grip" | "loose") {
  const shapes = [];
  const knuckles: Vec[] = [];
  const nails: { at: Vec; out: Vec }[] = [];
  const fingers = FINGERS.map((finger) => {
    const joints =
      pose === "grip"
        ? hug([0.002, -0.093 - finger.knuckle, finger.z], barAt(finger.z), BAR_REACH + finger.r, finger.bones)
        : curl([0.002, -0.093 - finger.knuckle, finger.z], finger.bones, [0.34, 0.5, 0.28], finger.z);
    knuckles.push(joints[0]);
    return { finger, joints };
  });

  // Wrist and palm: four metacarpals melt into a gently domed back of the hand.
  shapes.push(ellipsoid([-0.001, 0.006, 0], [0.019, 0.026, 0.027], 0.012));
  fingers.forEach(({ finger, joints }, i) => {
    const base: Vec = [-0.001, -0.014, finger.z * 0.62];
    shapes.push(cone(base, joints[0], 0.0102 - i * 0.0004, finger.r * 1.12, 0.014));
  });
  shapes.push(roundBox([0.006, -0.052, -0.001], [0.0085, 0.034, 0.029], 0.008, 0.01));
  shapes.push(ellipsoid([0.013, -0.036, 0.022], [0.013, 0.025, 0.014], 0.012));
  shapes.push(ellipsoid([0.0045, -0.058, -0.025], [0.0095, 0.03, 0.011], 0.009));

  // Fingers: one smoothly curling, tapering tube each, pressed side by side, with the knuckles rising
  // softly on the back rather than swelling all round.
  fingers.forEach(({ finger, joints }) => {
    const path = smoothPath(joints, 10);
    const last = path.length - 1;
    const radius = (t: number) => finger.r * (1.05 - 0.22 * t);
    // Segments of one finger join exactly (blending them would ripple); only its root melts into the palm.
    for (let s = 0; s < last; s++) shapes.push(cone(path[s], path[s + 1], radius(s / last), radius((s + 1) / last), s ? 0 : 0.004));
    shapes.push(ball(path[last], radius(1), 0));
    shapes.push(ball(offset(joints[0], dorsal(joints, 0), finger.r * 0.3), finger.r * 0.92, 0.006));
    for (const j of [1, 2]) shapes.push(ball(offset(joints[j], dorsal(joints, j), finger.r * 0.42), finger.r * 0.6, 0.0045));
    // The nail sits on the back of the last joint.
    const out = dorsal(joints, 3);
    const nailAt: Vec = [joints[2][0] + (joints[3][0] - joints[2][0]) * 0.6, joints[2][1] + (joints[3][1] - joints[2][1]) * 0.6, finger.z];
    nails.push({ at: offset(nailAt, out, radius(0.9) * 0.85), out });
  });

  // Thumb: from the base of the palm round the near side of the bar (or resting along the index finger).
  const thumb: Vec[] =
    pose === "grip"
      ? [[0.009, -0.016, 0.026] as Vec, ...hug([0.024, -0.043, 0.04], barAt(0.04), BAR_REACH + 0.012, [0.032, 0.027], -1)]
      : [
          [0.009, -0.016, 0.026],
          [0.017, -0.043, 0.041],
          [0.018, -0.066, 0.039],
          [0.016, -0.085, 0.033],
        ];
  const thumbPath = smoothPath(thumb, 9);
  thumbPath.forEach((p, s) => {
    if (!s) return;
    const r = (t: number) => 0.0118 - 0.0034 * t;
    shapes.push(cone(thumbPath[s - 1], p, r((s - 1) / 9), r(s / 9), s === 1 ? 0.012 : 0));
  });
  shapes.push(ball(thumbPath[9], 0.0084, 0));
  const thumbTip = thumb[thumb.length - 1];
  const thumbPrev = thumb[thumb.length - 2];
  const thumbAlong: Vec = [thumbTip[0] - thumbPrev[0], thumbTip[1] - thumbPrev[1], thumbTip[2] - thumbPrev[2]];
  const tl = Math.hypot(...thumbAlong);
  nails.push({
    at: [thumbPrev[0] + thumbAlong[0] * 0.6 - 0.007, thumbPrev[1] + thumbAlong[1] * 0.6, thumbPrev[2] + thumbAlong[2] * 0.6 + 0.004],
    out: [-thumbAlong[1] / tl, thumbAlong[0] / tl, 0],
  });

  return { shapes, knuckles, nails };
}
