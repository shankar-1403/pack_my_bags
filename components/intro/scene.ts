import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import * as T from "./textures";
import { clock, travel, WALK_CLOCK } from "./timeline";

// Units are metres. The walk runs along +x; the camera sits on the +z side.
const CASE_W = 0.4;
const CASE_H = 0.6;
const CASE_D = 0.25;
const HALF = CASE_D / 2;
const SHELL_R = 0.035;
const WHEEL_H = 0.075;
const CASE_LANE = 0.1;
const CASE_LEAD = 0.45;
const LEG_LANE = -0.22;
const THIGH = 0.44;
const SHIN = 0.42;
const ANKLE = 0.08;
const STRIDE = 1.0;
const WALK_FROM = -4.2;

// Glass wall behind the pillars: one wide window per place, a pillar between each.
// A window is about one screen wide, so each frame shows a single place. The wall glides past a
// little faster than the traveller walks (like an airport walkway) so all three pass during the slow walk.
const FACADE_Z = -1.8;
const WINDOW = 5.2;
const FIRST_PILLAR = -7.85;
const FACADE_GLIDE = 2 * WINDOW + WALK_FROM + 0.25;
// Each view is rendered as if it stood this far outside the glass, so it shifts with real parallax.
const VIEW_DEPTH = 3;
// The camera looks at the wall from its right, so rays through a window land mostly left of it:
// the picture is widened and shifted left so every visible ray stays on the photo.
const VIEW_SIZE = new THREE.Vector2(WINDOW + 4, 2.4);
const VIEW_SHIFT = -1.5;
const VIEW_CENTRE_Y = 0.8;
const photo = (id: string) =>
  `/_next/image?url=${encodeURIComponent(`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2400&q=80`)}&w=2048&q=75`;
const VIEWS = [
  { src: photo("1432405972618-c60b0225b8f9"), lift: 0.06 }, // Meghalaya forest
  { src: photo("1624664929067-5bc278a7c57e"), lift: 0.12 }, // Thar dunes
  { src: photo("1659651117607-d2b397cf100f"), lift: 0.1 }, // Almaty skyline
];

// Looks through the glass onto a picture VIEW_DEPTH metres outside: each pixel follows the camera ray
// to that far plane, so the view moves slower than the window frame. Beyond the picture fades to haze.
function outsideView() {
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      map: { value: null },
      crop: { value: new THREE.Vector4(0, 0, 1, 1) },
      depth: { value: VIEW_DEPTH },
      size: { value: VIEW_SIZE },
      shift: { value: VIEW_SHIFT },
      centreY: { value: VIEW_CENTRE_Y },
      haze: { value: new THREE.Color("#f3ebdf") },
      ready: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vOrigin;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vOrigin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform vec4 crop;
      uniform float depth;
      uniform vec2 size;
      uniform float shift;
      uniform float centreY;
      uniform vec3 haze;
      uniform float ready;
      varying vec3 vWorld;
      varying vec3 vOrigin;
      void main() {
        vec3 ray = vWorld - cameraPosition;
        float t = (vOrigin.z - depth - cameraPosition.z) / ray.z;
        vec3 hit = cameraPosition + ray * t;
        vec2 local = vec2((hit.x - vOrigin.x - shift) / size.x + 0.5, (hit.y - centreY) / size.y + 0.5);
        vec3 color = texture2D(map, crop.xy + local * crop.zw).rgb;
        float outside = max(max(-local.x, local.x - 1.0), max(-local.y, local.y - 1.0));
        color = mix(color, haze, smoothstep(0.15, 0.6, outside));
        color *= 1.06;
        float horizon = 1.0 - smoothstep(0.0, 0.6, local.y);
        color = mix(color, haze, 0.06 + 0.12 * horizon);
        gl_FragColor = vec4(mix(haze, color, ready), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}
const EXIT_DIST = 3.4;
const LAP_W = 0.3;
const SCREEN_W = 0.27;
const LAPTOP_OPEN = THREE.MathUtils.degToRad(108);
const FOV = 26;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const inCubic = (t: number) => t * t * t;
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const through = (points: THREE.Vector3[], t: number) => new THREE.CatmullRomCurve3(points, false, "centripetal").getPoint(t);

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const panel = (w: number, h: number, r: number) => new THREE.ShapeGeometry(roundedRect(w, h, r), 8);

function frameRing(ow: number, oh: number, iw: number, ih: number, r: number, depth: number) {
  const outer = roundedRect(ow, oh, r);
  outer.holes.push(roundedRect(iw, ih, Math.max(0.004, r - (ow - iw) / 2)));
  const geometry = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, curveSegments: 10 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function solid(geometry: THREE.BufferGeometry, material: THREE.Material) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function flat(geometry: THREE.BufferGeometry, material: THREE.Material) {
  const m = new THREE.Mesh(geometry, material);
  m.receiveShadow = true;
  return m;
}

function makeMaterials(screen: THREE.Texture, lapDepth: number) {
  const lining = T.liningTexture();
  lining.repeat.set(9, 9);
  const knit = T.knitTexture();
  knit.repeat.set(4, 4);
  const oxford = T.oxfordTexture();
  oxford.repeat.set(5, 5);
  const meshPanel = T.meshPanelTexture();
  meshPanel.repeat.set(7, 7);
  const fabric = (color: string, sheenColor: string, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.92, sheen: 0.7, sheenRoughness: 0.55, sheenColor: new THREE.Color(sheenColor), ...extra });

  return {
    shell: new THREE.MeshPhysicalMaterial({ color: "#24493f", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
    seam: new THREE.MeshStandardMaterial({ color: "#141917", roughness: 0.85 }),
    lining: new THREE.MeshStandardMaterial({ map: lining, roughness: 0.95 }),
    housing: new THREE.MeshStandardMaterial({ color: "#262a28", roughness: 0.45, metalness: 0.1 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#1b1d1c", roughness: 0.8 }),
    alu: new THREE.MeshStandardMaterial({ color: "#d2cec6", metalness: 1, roughness: 0.24 }),
    gilt: new THREE.MeshStandardMaterial({ color: "#caa56a", metalness: 1, roughness: 0.3 }),
    badge: new THREE.MeshStandardMaterial({ map: T.plateTexture("PACK MY BAGS", "#caa56a", "#6b5230"), metalness: 0.85, roughness: 0.34 }),
    sticker: new THREE.MeshStandardMaterial({ map: T.stickerTexture(), roughness: 0.55, transparent: true, alphaTest: 0.4 }),
    trouser: fabric("#3a3631", "#9a8f82", { roughness: 0.88 }),
    hem: fabric("#302c28", "#8a8074"),
    sock: fabric("#c65f2c", "#f2a47c"),
    leather: new THREE.MeshPhysicalMaterial({ color: "#f3efe7", roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.35 }),
    sole: new THREE.MeshStandardMaterial({ color: "#e2d7c2", roughness: 0.75 }),
    collar: new THREE.MeshStandardMaterial({ color: "#e7e0d4", roughness: 0.6 }),
    tab: new THREE.MeshStandardMaterial({ color: "#1b3a33", roughness: 0.55 }),
    knit: fabric("#ffffff", "#ffffff", { map: knit, roughness: 1, sheenRoughness: 0.8 }),
    oxford: fabric("#ffffff", "#ffffff", { map: oxford, sheen: 0.3 }),
    pouch: fabric("#2a4a41", "#6f9a8c"),
    roll: fabric("#c86a3f", "#f0b08c"),
    tee: fabric("#d8ccb6", "#ffffff"),
    meshPanel: new THREE.MeshStandardMaterial({ map: meshPanel, transparent: true, alphaTest: 0.2, roughness: 0.8, side: THREE.DoubleSide }),
    patch: new THREE.MeshStandardMaterial({ map: T.plateTexture("PACK MY BAGS", "#3b2a1f", "#d9bb86"), roughness: 0.7 }),
    passportCover: new THREE.MeshStandardMaterial({ color: "#1e2a44", roughness: 0.7 }),
    passport: new THREE.MeshStandardMaterial({ map: T.passportTexture(), roughness: 0.65 }),
    pass: new THREE.MeshStandardMaterial({ map: T.boardingPassTexture(), roughness: 0.85 }),
    ink: new THREE.MeshPhysicalMaterial({ color: "#16211e", roughness: 0.25, clearcoat: 0.8 }),
    gum: new THREE.MeshStandardMaterial({ color: "#b98a5c", roughness: 0.8 }),
    lace: new THREE.MeshStandardMaterial({ color: "#e9e3d7", roughness: 0.85 }),
    stitch: new THREE.MeshStandardMaterial({ color: "#d9d1c3", roughness: 0.8 }),
    laptop: new THREE.MeshStandardMaterial({ color: "#d6cec1", metalness: 0.85, roughness: 0.32 }),
    deck: new THREE.MeshStandardMaterial({ map: T.keyboardTexture(LAP_W, lapDepth), metalness: 0.5, roughness: 0.45 }),
    bezel: new THREE.MeshStandardMaterial({ color: "#0c0d0e", roughness: 0.25 }),
    screen: new THREE.MeshBasicMaterial({ map: screen, color: 0x000000, toneMapped: false, fog: false }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.04, transparent: true, opacity: 0.22, depthWrite: false }),
    column: new THREE.MeshStandardMaterial({ color: "#e7dfd2", roughness: 0.75 }),
    wallFace: new THREE.MeshStandardMaterial({ color: "#e6ddcf", roughness: 0.85 }),
    strip: new THREE.MeshStandardMaterial({ color: "#cfc4b3", roughness: 0.55 }),
    frame: new THREE.MeshStandardMaterial({ color: "#8f8a82", metalness: 0.7, roughness: 0.4 }),
    facadeGlass: new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      roughness: 0.06,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      envMapIntensity: 1.4,
    }),
    blob: new THREE.MeshBasicMaterial({ map: T.blobTexture(), transparent: true, depthWrite: false, opacity: 0.8 }),
  };
}

type Mats = ReturnType<typeof makeMaterials>;

// A leather sneaker around one footprint: u runs heel (-1) to toe (+1), relative to the ankle joint.
const SHOE_CENTRE = 0.065;
const SHOE_HALF = 0.135;
const SOLE_TOP = -ANKLE + 0.0245;
const shoeX = (u: number) => SHOE_CENTRE + u * SHOE_HALF;
// Superellipse tapers: a blunt, roomy toe that slopes down, and an upright heel counter.
const taper = (u: number, n: number) => Math.pow(Math.max(0, 1 - Math.abs(u) ** n), 1 / n);
const shoeRing = (u: number) => taper(u, u < 0 ? 3.2 : 2.6);
const shoeRise = (u: number) => taper(u, u < 0 ? 6 : 2.2);
const shoeWidth = (u: number) => 0.036 + 0.014 * Math.exp(-(((u - 0.25) / 0.55) ** 2));
const shoeHeight = (u: number) => 0.032 + 0.042 * Math.exp(-(((u + 0.45) / 0.5) ** 2));

/** Point on the upper at heel-to-toe position u and cross-section angle (0 = top, ±π/2 = sides). */
function shoeSurface(u: number, angle: number, lift = 0) {
  return new THREE.Vector3(
    shoeX(u),
    SOLE_TOP + Math.cos(angle) * shoeRise(u) * shoeHeight(u) + lift,
    Math.sin(angle) * shoeRing(u) * shoeWidth(u) * (1 + lift * 8),
  );
}

function sneakerUpper() {
  const geometry = new THREE.SphereGeometry(1, 72, 44);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const r = Math.hypot(y, z);
    const cy = r > 1e-6 ? y / r : 0;
    const cz = r > 1e-6 ? z / r : 0;
    const rise = cy >= 0 ? cy * shoeRise(u) * shoeHeight(u) : cy * shoeRing(u) * 0.004;
    position.setXYZ(i, shoeX(u), SOLE_TOP + rise, cz * shoeRing(u) * shoeWidth(u));
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Footprint outline grown by `margin`, extruded upward with a soft bevel. */
function sneakerSole(margin: number, depth: number, bevel: number) {
  const outline = new THREE.Shape();
  const steps = 64;
  const x = (u: number) => SHOE_CENTRE + u * (SHOE_HALF + margin);
  const w = (u: number) => shoeRing(u) * (shoeWidth(u) + margin);
  outline.moveTo(x(-1), 0);
  for (let i = 1; i <= steps; i++) outline.lineTo(x(-1 + (2 * i) / steps), w(-1 + (2 * i) / steps));
  for (let i = steps - 1; i >= 1; i--) outline.lineTo(x(-1 + (2 * i) / steps), -w(-1 + (2 * i) / steps));
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 4,
    curveSegments: 24,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function seam(points: THREE.Vector3[], radius: number, material: THREE.Material) {
  return solid(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length * 6, radius, 8, false), material);
}

function buildSneaker(m: Mats) {
  const shoe = new THREE.Group();
  const outsole = solid(sneakerSole(0.006, 0.003, 0.0025), m.gum);
  outsole.position.y = -ANKLE + 0.0025;
  shoe.add(outsole);
  const midsole = solid(sneakerSole(0.004, 0.01, 0.0035), m.sole);
  midsole.position.y = -ANKLE + 0.0115;
  shoe.add(midsole);
  shoe.add(solid(sneakerUpper(), m.leather));

  const range = (from: number, to: number, count: number) => Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
  for (const side of [-1, 1]) {
    shoe.add(seam(range(-0.95, 0.6, 18).map((u) => shoeSurface(u, side * 1.3, 0.0006)), 0.0012, m.stitch));
    shoe.add(seam(range(-0.34, 0.24, 9).map((u) => shoeSurface(u, side * 0.5, 0.0014)), 0.0026, m.collar));
  }
  shoe.add(seam(range(-1.35, 1.35, 12).map((a) => shoeSurface(0.6, a, 0.0006)), 0.0012, m.stitch));
  for (const u of [-0.28, -0.14, 0, 0.14]) {
    shoe.add(seam(range(-0.5, 0.5, 6).map((a) => shoeSurface(u, a, 0.0034)), 0.0028, m.lace));
  }

  // A tongue rising in front of the ankle.
  const opening = shoeSurface(-0.5, 0);
  const tongue = solid(new RoundedBoxGeometry(0.012, 0.03, 0.038, 3, 0.005), m.leather);
  tongue.position.set(opening.x + 0.036, opening.y + 0.004, 0);
  tongue.rotation.z = -0.5;
  shoe.add(tongue);
  const heel = shoeSurface(-0.97, 0);
  const tab = solid(new RoundedBoxGeometry(0.005, 0.024, 0.02, 2, 0.002), m.tab);
  tab.position.set(heel.x - 0.004, heel.y - 0.006, 0);
  tab.rotation.z = 0.18;
  shoe.add(tab);
  return shoe;
}

function buildLegs(m: Mats) {
  const root = new THREE.Group();
  const seat = solid(new THREE.CapsuleGeometry(0.115, 0.12, 8, 24), m.trouser);
  seat.rotation.x = Math.PI / 2;
  seat.scale.set(0.9, 1, 1);
  seat.position.y = 0.04;
  root.add(seat);

  const legs = [0.095, -0.095].map((z) => {
    const hip = new THREE.Group();
    hip.position.z = z;
    root.add(hip);
    hip.add(solid(new THREE.SphereGeometry(0.086, 28, 18), m.trouser));
    const thigh = solid(new THREE.CylinderGeometry(0.086, 0.066, THIGH, 32), m.trouser);
    thigh.position.y = -THIGH / 2;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -THIGH;
    hip.add(knee);
    knee.add(solid(new THREE.SphereGeometry(0.066, 28, 18), m.trouser));
    const shinLength = SHIN - 0.035;
    const shin = solid(new THREE.CylinderGeometry(0.064, 0.059, shinLength, 32), m.trouser);
    shin.position.y = -shinLength / 2;
    knee.add(shin);
    const hem = solid(new THREE.CylinderGeometry(0.0598, 0.0598, 0.014, 32), m.hem);
    hem.position.y = -shinLength + 0.007;
    knee.add(hem);
    const sock = solid(new THREE.CylinderGeometry(0.035, 0.034, 0.06, 24), m.sock);
    sock.position.y = -SHIN + 0.02;
    knee.add(sock);

    const ankle = new THREE.Group();
    ankle.position.y = -SHIN;
    knee.add(ankle);
    ankle.add(buildSneaker(m));
    return { hip, knee, ankle };
  });

  return { root, legs };
}

// Heel and toe of the sole relative to the ankle joint.
const SOLE_POINTS: [number, number][] = [
  [-0.08, -ANKLE],
  [0.21, -ANKLE],
];

/** Poses both legs for a gait phase and returns the pelvis height that keeps the lower foot on the floor. */
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const bump = (a: number, centre: number, width: number) => Math.exp(-((wrapAngle(a - centre) / width) ** 2));

// Gait phase: heel strike at φ = π/2, toe-off near φ = -1.3, swing in between (hip = 0 mid-swing).
// Timings follow real walking: heel strike at φ = π/2, push-off at φ ≈ -1, deepest knee bend early in
// the swing, ankle back to neutral mid-swing so the toe clears the floor.
function poseLegs(legs: ReturnType<typeof buildLegs>["legs"], phase: number, gait: number) {
  let lowest = Infinity;
  let rest = Infinity;
  legs.forEach((leg, i) => {
    const phi = wrapAngle(phase + (i ? Math.PI : 0));
    const hip = (0.24 * Math.sin(phi) + 0.1) * gait;
    const knee = -(0.04 + 1.1 * bump(phi, -0.2, 1.15) + 0.22 * bump(phi, 2.0, 0.45) + 0.12 * bump(phi, 2.9, 0.5)) * gait;
    // Planted: flat on the floor, heel peeling up steeply before push-off. Swinging: trails toe-down,
    // comes back to neutral, then tips toe-up ready for the next heel strike.
    const planted = -(hip + knee) + (-0.7 * bump(phi, -1.0, 0.45) + 0.2 * bump(phi, 1.57, 0.3)) * gait;
    const early = smooth(clamp01((phi + 1.05) / 1.0));
    const late = smooth(clamp01((phi - 0.6) / 0.8));
    const swingAnkle = (-0.3 + 0.5 * early) * (1 - late) + (0.2 - hip - knee) * late;
    const inSwing = smooth(clamp01((phi + 1.05) / 0.25)) * (1 - smooth(clamp01((phi - 1.25) / 0.25))) * gait;
    const ankle = planted * (1 - inSwing) + swingAnkle * inSwing;
    leg.hip.rotation.z = hip;
    leg.knee.rotation.z = knee;
    leg.ankle.rotation.z = ankle;
    const ankleY = -THIGH * Math.cos(hip) - SHIN * Math.cos(hip + knee);
    const pitch = hip + knee + ankle;
    let footLowest = Infinity;
    for (const [x, y] of SOLE_POINTS) footLowest = Math.min(footLowest, ankleY + x * Math.sin(pitch) + y * Math.cos(pitch));
    lowest = Math.min(lowest, footLowest);
    rest = Math.min(rest, footLowest + inSwing * 0.1);
  });
  // The body rests on the planted foot (a swinging toe never lifts it), and no foot may sink into the floor.
  return Math.max(-rest, -lowest);
}

function buildSuitcase(m: Mats, screenH: number, lapDepth: number) {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.set(0, WHEEL_H, -HALF);
  root.add(pivot);
  const body = new THREE.Group();
  body.position.z = HALF;
  pivot.add(body);

  const shell = new RoundedBoxGeometry(CASE_W, CASE_H, HALF, 6, SHELL_R);
  const base = solid(shell, m.shell);
  base.position.set(0, CASE_H / 2, -HALF / 2);
  body.add(base);
  const zip = solid(frameRing(CASE_W + 0.004, CASE_H + 0.004, CASE_W - 0.024, CASE_H - 0.024, SHELL_R, 0.012), m.seam);
  zip.position.y = CASE_H / 2;
  body.add(zip);
  const lining = flat(panel(CASE_W - 0.03, CASE_H - 0.03, 0.02), m.lining);
  lining.position.set(0, CASE_H / 2, 0.0008);
  body.add(lining);

  const plate = solid(new RoundedBoxGeometry(0.29, 0.01, 0.052, 2, 0.004), m.housing);
  plate.position.set(0, CASE_H + 0.002, -HALF + 0.036);
  body.add(plate);
  const tubes = new THREE.Group();
  tubes.position.set(0, CASE_H, -HALF + 0.036);
  body.add(tubes);
  for (const sx of [-1, 1]) {
    const tube = solid(new THREE.CylinderGeometry(0.0085, 0.0085, 0.5, 16), m.alu);
    tube.position.set(sx * 0.115, -0.25, 0);
    tubes.add(tube);
  }
  const grip = solid(new RoundedBoxGeometry(0.27, 0.03, 0.038, 3, 0.013), m.housing);
  grip.position.y = 0.015;
  tubes.add(grip);

  const carry = new THREE.Group();
  carry.position.set(0, CASE_H, -0.035);
  body.add(carry);
  const bar = solid(new RoundedBoxGeometry(0.13, 0.016, 0.028, 3, 0.007), m.housing);
  bar.position.y = 0.03;
  carry.add(bar);
  for (const sx of [-1, 1]) {
    const post = solid(new RoundedBoxGeometry(0.018, 0.03, 0.024, 2, 0.005), m.housing);
    post.position.set(sx * 0.058, 0.014, 0);
    carry.add(post);
  }

  const wheels: THREE.Mesh[] = [];
  const wheelGeometry = new THREE.CylinderGeometry(0.027, 0.027, 0.013, 28);
  wheelGeometry.rotateX(Math.PI / 2);
  const hubGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.015, 16);
  hubGeometry.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const unit = new THREE.Group();
      unit.position.set(sx * (CASE_W / 2 - 0.042), 0, sz * (HALF - 0.04));
      body.add(unit);
      const housing = solid(new RoundedBoxGeometry(0.052, 0.03, 0.05, 2, 0.01), m.housing);
      housing.position.y = -0.012;
      unit.add(housing);
      for (const oz of [-0.0125, 0.0125]) {
        const wheel = solid(wheelGeometry, m.rubber);
        wheel.position.set(0, -WHEEL_H + 0.027, oz);
        wheel.add(solid(hubGeometry, m.alu));
        unit.add(wheel);
        wheels.push(wheel);
      }
    }
  }

  // Lid swings on the long +x edge; after the case lies down it opens flat onto the floor.
  const hinge = new THREE.Group();
  hinge.position.set(CASE_W / 2, 0, 0);
  body.add(hinge);
  const lid = solid(shell, m.shell);
  lid.position.set(-CASE_W / 2, CASE_H / 2, HALF / 2);
  hinge.add(lid);
  for (const x of [-0.1, -0.034, 0.034, 0.1]) {
    const rib = solid(new RoundedBoxGeometry(0.016, CASE_H - 0.2, 0.01, 2, 0.004), m.shell);
    rib.position.set(x, -0.01, HALF / 2 + 0.001);
    lid.add(rib);
  }
  const badgeFrame = solid(new RoundedBoxGeometry(0.1, 0.026, 0.004, 2, 0.0015), m.gilt);
  badgeFrame.position.set(0, 0.245, HALF / 2 + 0.001);
  lid.add(badgeFrame);
  const badge = flat(new THREE.PlaneGeometry(0.094, 0.022), m.badge);
  badge.position.set(0, 0.245, HALF / 2 + 0.0032);
  lid.add(badge);

  const lidLining = flat(panel(CASE_W - 0.03, CASE_H - 0.03, 0.02), m.lining);
  lidLining.position.set(-CASE_W / 2, CASE_H / 2, -0.0008);
  lidLining.rotation.y = Math.PI;
  hinge.add(lidLining);
  const tee = solid(new RoundedBoxGeometry(0.33, 0.5, 0.02, 3, 0.008), m.tee);
  tee.position.set(-CASE_W / 2, CASE_H / 2 - 0.01, -0.007);
  hinge.add(tee);
  const net = flat(panel(0.35, 0.54, 0.02), m.meshPanel);
  net.position.set(-CASE_W / 2, CASE_H / 2, -0.019);
  net.rotation.y = Math.PI;
  hinge.add(net);
  const netZip = solid(new RoundedBoxGeometry(0.34, 0.007, 0.006, 2, 0.002), m.seam);
  netZip.position.set(-CASE_W / 2, CASE_H / 2 + 0.268, -0.019);
  hinge.add(netZip);
  const patch = flat(new THREE.PlaneGeometry(0.11, 0.028), m.patch);
  patch.position.set(-CASE_W / 2, CASE_H / 2 - 0.22, -0.021);
  patch.rotation.y = Math.PI;
  hinge.add(patch);

  // Packed contents sit on the base's seam face; anything below it is hidden inside the shell.
  const sweater = solid(new RoundedBoxGeometry(0.34, 0.27, 0.05, 4, 0.02), m.knit);
  sweater.position.set(0, 0.43, 0.006);
  body.add(sweater);
  const shirt = solid(new RoundedBoxGeometry(0.345, 0.25, 0.036, 4, 0.014), m.oxford);
  shirt.position.set(0, 0.155, 0);
  body.add(shirt);
  const pouch = solid(new RoundedBoxGeometry(0.14, 0.085, 0.05, 4, 0.022), m.pouch);
  pouch.position.set(-0.1, 0.075, 0.02);
  body.add(pouch);
  const pouchZip = solid(new RoundedBoxGeometry(0.12, 0.004, 0.004, 1, 0.0015), m.gilt);
  pouchZip.position.set(-0.1, 0.1, 0.045);
  body.add(pouchZip);
  const roll = solid(new THREE.CapsuleGeometry(0.027, 0.13, 8, 24), m.roll);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0.085, 0.07, 0.035);
  body.add(roll);
  const passportCover = solid(new RoundedBoxGeometry(0.088, 0.125, 0.006, 2, 0.003), m.passportCover);
  passportCover.position.set(-0.098, 0.205, 0.021);
  passportCover.rotation.z = 0.14;
  body.add(passportCover);
  const passport = flat(new THREE.PlaneGeometry(0.084, 0.121), m.passport);
  passport.position.set(0, 0, 0.0031);
  passportCover.add(passport);
  const pass = flat(new THREE.PlaneGeometry(0.2, 0.08), m.pass);
  pass.position.set(0.075, 0.2, 0.0192);
  pass.rotation.z = -0.09;
  body.add(pass);

  const pen = new THREE.Group();
  pen.position.set(0.015, 0.128, 0.0225);
  pen.rotation.z = Math.PI / 2 + 0.2;
  body.add(pen);
  const barrel = solid(new THREE.CylinderGeometry(0.0045, 0.0045, 0.12, 20), m.ink);
  pen.add(barrel);
  const cap = solid(new THREE.CylinderGeometry(0.0048, 0.0048, 0.045, 20), m.gilt);
  cap.position.y = 0.04;
  pen.add(cap);
  const clip = solid(new RoundedBoxGeometry(0.002, 0.034, 0.003, 1, 0.0008), m.gilt);
  clip.position.set(0, 0.038, 0.0055);
  pen.add(clip);

  // Laptop lying on the sweater; its lid hinges on the far edge and lifts toward the wheel end.
  const laptop = new THREE.Group();
  laptop.position.set(0, 0.435, 0.031);
  body.add(laptop);
  const lapBase = solid(new RoundedBoxGeometry(LAP_W, lapDepth, 0.011, 3, 0.004), m.laptop);
  lapBase.position.z = 0.0055;
  laptop.add(lapBase);
  const deck = flat(new THREE.PlaneGeometry(LAP_W - 0.006, lapDepth - 0.006), m.deck);
  deck.position.z = 0.0111;
  laptop.add(deck);
  const lapHinge = new THREE.Group();
  lapHinge.position.set(0, lapDepth / 2, 0.011);
  laptop.add(lapHinge);
  const lapLid = solid(new RoundedBoxGeometry(LAP_W, lapDepth, 0.005, 3, 0.0024), m.laptop);
  lapLid.position.set(0, -lapDepth / 2, 0.0025);
  lapHinge.add(lapLid);
  const lapSticker = flat(new THREE.CircleGeometry(0.024, 40), m.sticker);
  lapSticker.position.set(0.07, -lapDepth / 2 + 0.03, 0.0051);
  lapHinge.add(lapSticker);
  const bezel = flat(new THREE.PlaneGeometry(LAP_W - 0.006, lapDepth - 0.006), m.bezel);
  bezel.position.set(0, -lapDepth / 2, -0.0002);
  bezel.rotation.y = Math.PI;
  lapHinge.add(bezel);
  // Faces the keyboard when closed; its top edge is the lid's free edge, away from the hinge.
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, screenH), m.screen);
  screen.position.set(0, -(0.017 + screenH / 2), -0.0004);
  screen.rotation.set(0, Math.PI, Math.PI);
  lapHinge.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(LAP_W - 0.01, lapDepth - 0.01), m.glass);
  glass.position.set(0, -lapDepth / 2, -0.0007);
  glass.rotation.y = Math.PI;
  lapHinge.add(glass);
  const glow = new THREE.PointLight("#e3efe9", 0, 1.4, 2);
  glow.position.set(0, -lapDepth / 2, -0.14);
  lapHinge.add(glow);

  return { root, pivot, hinge, tubes, wheels, lapHinge, screen, glow };
}

function buildWorld(scene: THREE.Scene, m: Mats, width: number, height: number, onPhoto: () => void) {
  const floorGeometry = new THREE.PlaneGeometry(60, 60);
  const mirror = new Reflector(floorGeometry, {
    textureWidth: Math.round(width * 0.5),
    textureHeight: Math.round(height * 0.5),
    color: 0x9d968c,
    clipBias: 0.003,
  });
  mirror.rotation.x = -Math.PI / 2;
  scene.add(mirror);

  const floor = new THREE.Mesh(
    floorGeometry,
    new THREE.MeshStandardMaterial({ map: T.floorTexture(25), roughness: 0.42, transparent: true, opacity: 0.93 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.0008;
  floor.receiveShadow = true;
  scene.add(floor);

  // The whole wall (views, glass, pillars, and the stone strip they stand on) moves as one piece.
  const facade = new THREE.Group();
  scene.add(facade);
  const paneH = 2.68;
  const wallH = 7;
  const lastPillar = FIRST_PILLAR + VIEWS.length * WINDOW;
  const loader = new THREE.TextureLoader();
  VIEWS.forEach((view, i) => {
    const centre = FIRST_PILLAR + (i + 0.5) * WINDOW;
    const material = outsideView();
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW, paneH), material);
    pane.position.set(centre, 0.07 + paneH / 2, FACADE_Z - 0.02);
    facade.add(pane);
    loader.load(view.src, (map) => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      map.wrapS = map.wrapT = THREE.MirroredRepeatWrapping;
      const image = map.image as HTMLImageElement;
      const imageAspect = image.width / image.height;
      const viewAspect = VIEW_SIZE.x / VIEW_SIZE.y;
      const crop = material.uniforms.crop.value as THREE.Vector4;
      if (imageAspect > viewAspect) crop.set((1 - viewAspect / imageAspect) / 2, 0, viewAspect / imageAspect, 1);
      else crop.set(0, Math.min(1 - imageAspect / viewAspect, view.lift), 1, imageAspect / viewAspect);
      material.uniforms.map.value = map;
      material.uniforms.ready.value = 1;
      onPhoto();
    });
    for (const at of [1 / 3, 2 / 3]) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.045, paneH, 0.07), m.frame);
      mullion.position.set(centre - WINDOW / 2 + WINDOW * at, 0.07 + paneH / 2, FACADE_Z + 0.02);
      facade.add(mullion);
    }

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW, wallH), m.facadeGlass);
    glass.position.set(centre, wallH / 2, FACADE_Z);
    facade.add(glass);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(WINDOW, 0.07, 0.12), m.frame);
    sill.position.set(centre, 0.035, FACADE_Z);
    facade.add(sill);
    for (const y of [2.75, 5.2]) {
      const transom = new THREE.Mesh(new THREE.BoxGeometry(WINDOW, 0.06, 0.1), m.frame);
      transom.position.set(centre, y, FACADE_Z);
      facade.add(transom);
    }
  });
  for (let i = 0; i <= VIEWS.length; i++) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 10, 40), m.column);
    pillar.position.set(FIRST_PILLAR + i * WINDOW, 5, FACADE_Z + 0.26);
    facade.add(pillar);
  }
  for (const [from, to] of [
    [FIRST_PILLAR - 20, FIRST_PILLAR],
    [lastPillar, lastPillar + 20],
  ]) {
    const wall = flat(new THREE.PlaneGeometry(to - from, wallH), m.wallFace);
    wall.position.set((from + to) / 2, wallH / 2, FACADE_Z);
    facade.add(wall);
  }
  const strip = flat(new THREE.PlaneGeometry(lastPillar - FIRST_PILLAR + 44, 0.9), m.strip);
  strip.rotation.x = -Math.PI / 2;
  strip.position.set((FIRST_PILLAR + lastPillar) / 2, 0.002, FACADE_Z + 0.4);
  facade.add(strip);

  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m.blob);
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.0015;
  blob.renderOrder = 1;
  scene.add(blob);
  return { mirror, blob, facade };
}

export type IntroScene = ReturnType<typeof createIntroScene>;

export function createIntroScene(canvas: HTMLCanvasElement, width: number, height: number, onPhoto: () => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const haze = new THREE.Color("#eee7db");
  scene.background = haze;
  scene.fog = new THREE.Fog(haze, 5.5, 17);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.45;
  room.dispose();

  const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.01, 60);

  // The laptop screen matches the viewport's shape so the final frame lines up with the real hero.
  const screenAspect = Math.min(2, Math.max(1.45, width / height));
  const screenH = SCREEN_W / screenAspect;
  const lapDepth = screenH + 0.026;
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 2560;
  screenCanvas.height = Math.round(2560 / screenAspect);
  const screenCtx = screenCanvas.getContext("2d")!;
  screenCtx.fillStyle = "#1b3a33";
  screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  let regionH = screenH;

  const m = makeMaterials(screenTexture, lapDepth);
  const world = buildWorld(scene, m, width * renderer.getPixelRatio(), height * renderer.getPixelRatio(), onPhoto);
  const legs = buildLegs(m);
  scene.add(legs.root);
  const suitcase = buildSuitcase(m, screenH, lapDepth);
  scene.add(suitcase.root);

  scene.add(new THREE.HemisphereLight("#fff3e2", "#d8cbb6", 0.9));
  const sun = new THREE.DirectionalLight("#ffdcb0", 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -2.4;
  sun.shadow.camera.right = 2.4;
  sun.shadow.camera.top = 2.4;
  sun.shadow.camera.bottom = -2.4;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 18;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 5;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#fff8ef", 0.55);
  fill.position.set(3, 4, 8);
  scene.add(fill);
  const sunOffset = v3(-3.2, 4.6, -5.2);

  const walkX = (p: number) => WALK_FROM - WALK_FROM * travel(seg(p, 0, WALK_CLOCK));
  const legsX = (p: number) => walkX(p) + EXIT_DIST * inCubic(seg(p, 0.33, 0.47));
  const screenCenter = new THREE.Vector3();
  const screenNormal = new THREE.Vector3();
  const screenUp = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const target = new THREE.Vector3();

  const shotB = { pos: v3(1.5, 1.15, 1.7), tgt: v3(0.5, 0.12, -0.25) };
  const shotC = { pos: v3(0.5, 2.45, 0.34), tgt: v3(0.5, 0.05, -0.32) };
  // Aimed high enough that the opened screen sits well below the site header.
  const shotD = { pos: v3(0.47, 0.86, 0.6), tgt: v3(0.45, 0.3, -0.5) };

  function render(scroll: number) {
    const p = clock(scroll);
    const x = legsX(p);
    const speed = Math.abs(legsX(p + 0.002) - legsX(p - 0.002)) / 0.004;
    const gait = smooth(clamp01(speed / 6));
    const phase = ((x - WALK_FROM) / STRIDE) * Math.PI * 2;
    legs.root.position.set(x, poseLegs(legs.legs, phase, gait), LEG_LANE);
    legs.root.visible = x < 4.5;

    const caseX = walkX(p) + CASE_LEAD;
    suitcase.root.position.set(caseX, 0, CASE_LANE);
    suitcase.wheels.forEach((wheel) => (wheel.rotation.z = -(caseX - WALK_FROM - CASE_LEAD) / 0.027));
    suitcase.root.rotation.x = p < 0.3 ? 0.007 * Math.sin(phase * 2) * gait : 0;
    suitcase.tubes.position.y = CASE_H + 0.012 + 0.44 * (1 - inOut(seg(p, 0.28, 0.34)));

    const t = seg(p, 0.43, 0.53);
    const fall = t < 0.8 ? inCubic(t / 0.8) : 1 - 0.045 * Math.sin(((t - 0.8) / 0.2) * Math.PI) * (1 - (t - 0.8) / 0.2);
    suitcase.pivot.rotation.x = (-Math.PI / 2) * fall;
    suitcase.pivot.position.y = WHEEL_H * (1 - (t < 0.8 ? fall : 1));
    const open = inOut(seg(p, 0.54, 0.65));
    suitcase.hinge.rotation.y = Math.PI * open;
    suitcase.lapHinge.rotation.x = -LAPTOP_OPEN * inOut(seg(p, 0.67, 0.77));
    const on = inOut(seg(p, 0.72, 0.8));
    m.screen.color.setScalar(on);
    m.glass.opacity = 0.22 * (1 - seg(p, 0.84, 0.92));
    suitcase.glow.intensity = 0.7 * on;

    const lying = t < 0.8 ? fall : 1;
    world.blob.position.set(
      THREE.MathUtils.lerp(caseX, caseX + 0.2 * open, lying),
      0.0015,
      THREE.MathUtils.lerp(CASE_LANE, CASE_LANE - 0.43, lying),
    );
    world.blob.scale.set(0.62 + 0.4 * open * lying, THREE.MathUtils.lerp(0.42, 0.82, lying), 1);

    // Camera rig: tracking walk → crane over the case → flat lay → laptop → into the screen.
    const track = THREE.MathUtils.lerp(Math.min(walkX(p), 0) + 0.25, CASE_LEAD, smooth(seg(p, 0.24, 0.4)));
    // Framed so the whole case clears the header while the hips stay above the top edge.
    const lead = 0.24 + 0.24 * clamp01((camera.aspect - 1.3) / 0.5);
    const shotA = { pos: v3(track + 0.7, 0.4, 2.24), tgt: v3(track - lead, 0.33, -0.04) };
    const position = new THREE.Vector3();
    up.set(0, 1, 0);
    if (p < 0.38) {
      position.copy(shotA.pos);
      target.copy(shotA.tgt);
    } else if (p < 0.66) {
      const c = inOut(seg(p, 0.38, 0.63));
      position.copy(through([shotA.pos, shotB.pos, shotC.pos], c));
      target.copy(through([shotA.tgt, shotB.tgt, shotC.tgt], c));
      const drift = seg(p, 0.63, 0.66);
      position.x += 0.02 * drift;
    } else if (p < 0.78) {
      const d = inOut(seg(p, 0.66, 0.78));
      position.lerpVectors(v3(shotC.pos.x + 0.02, shotC.pos.y, shotC.pos.z), shotD.pos, d);
      target.lerpVectors(shotC.tgt, shotD.tgt, d);
    } else {
      scene.updateMatrixWorld();
      suitcase.screen.getWorldPosition(screenCenter);
      suitcase.screen.getWorldDirection(screenNormal);
      suitcase.screen.getWorldQuaternion(quaternion);
      screenUp.set(0, 1, 0).applyQuaternion(quaternion);
      const finalDistance = regionH / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
      const approach = screenCenter.clone().addScaledVector(screenNormal, 0.75).addScaledVector(screenUp, 0.06);
      const end = screenCenter.clone().addScaledVector(screenNormal, finalDistance);
      const e = inOut(seg(p, 0.78, 0.965));
      position.copy(through([shotD.pos, approach, end], e));
      target.lerpVectors(shotD.tgt, screenCenter, smooth(clamp01(e * 1.5)));
      up.lerp(screenUp, smooth(seg(e, 0.35, 1))).normalize();
    }
    camera.position.copy(position);
    camera.up.copy(up);
    camera.lookAt(target);

    world.facade.position.x = -FACADE_GLIDE * travel(seg(p, 0, WALK_CLOCK));

    sun.target.position.set(target.x, 0, target.z);
    sun.position.copy(sun.target.position).add(sunOffset);
    renderer.render(scene, camera);
  }

  function setScreen(shot: HTMLCanvasElement) {
    const cw = screenCanvas.width;
    const ch = screenCanvas.height;
    const shotAspect = shot.width / shot.height;
    const drawW = shotAspect >= screenAspect ? cw : ch * shotAspect;
    const drawH = shotAspect >= screenAspect ? cw / shotAspect : ch;
    screenCtx.fillStyle = "#1b3a33";
    screenCtx.fillRect(0, 0, cw, ch);
    screenCtx.drawImage(shot, (cw - drawW) / 2, (ch - drawH) / 2, drawW, drawH);
    screenTexture.needsUpdate = true;
    regionH = shotAspect >= screenAspect ? SCREEN_W / shotAspect : screenH;
  }

  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    world.mirror.getRenderTarget().setSize(Math.round(w * renderer.getPixelRatio() * 0.5), Math.round(h * renderer.getPixelRatio() * 0.5));
  }

  function dispose() {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
          material.dispose();
        }
      }
    });
    world.mirror.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  return { render, setScreen, resize, dispose };
}
