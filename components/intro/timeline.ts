// Scroll progress (p) drives a choreography clock (t). The walk gets a larger share of the scroll
// than the rest of the film, so it plays slower without changing the pacing of anything after it.

export const RUNWAY_VH = 580;
export const WALK_SHARE = 0.45;
export const WALK_CLOCK = 0.27;

export function clock(p: number) {
  if (p <= WALK_SHARE) return (p / WALK_SHARE) * WALK_CLOCK;
  return WALK_CLOCK + ((p - WALK_SHARE) / (1 - WALK_SHARE)) * (1 - WALK_CLOCK);
}

export function progress(t: number) {
  if (t <= WALK_CLOCK) return (t / WALK_CLOCK) * WALK_SHARE;
  return WALK_SHARE + ((t - WALK_CLOCK) / (1 - WALK_CLOCK)) * (1 - WALK_SHARE);
}

/** Share of the walk distance covered: an even pace, then an unhurried stop. */
export function travel(w: number) {
  if (w < 0.75) return (w / 0.75) * 0.85;
  const u = (w - 0.75) / 0.25;
  return 0.85 + 0.15 * (1 - (1 - u) ** 2);
}

/** Scroll progress at which the walk has covered a given share of its distance. */
export function progressAtTravel(d: number) {
  const w = d <= 0.85 ? (d * 0.75) / 0.85 : 0.75 + 0.25 * (1 - Math.sqrt(1 - (d - 0.85) / 0.15));
  return progress(w * WALK_CLOCK);
}
