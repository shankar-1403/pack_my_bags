import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { GRIP_AXIS, GRIP_BAR } from "./hand";
import { sculptHandsAsync, type HandJob } from "./hands-async";
import { toGeometry } from "./sculpt";
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

// Portrait screens get a taller frame: the shoulders sit just under the site header, the floor at the
// bottom, and the camera swings further round to the front so walker and case fit across the width.
// The traveller walks a little wider of the case there, so the right arm reaches out to the handle.
const PORTRAIT_FOV = 34;
const PORTRAIT_LANE = -0.3;
const PORTRAIT_SHOULDERS = 1.47;
const PORTRAIT_FLOOR = -0.3;
const PORTRAIT_YAW = 0.47;

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
// Straight from Unsplash, which allows cross-origin use, so WebGL can read the pixels; sized to the screen
// (a phone shows each view at well under 1024 px, so it is not sent a 2048 px one).
const photo = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;
const VIEWS = [
  { id: "1432405972618-c60b0225b8f9", lift: 0.06 }, // Meghalaya forest
  { id: "1624664929067-5bc278a7c57e", lift: 0.12 }, // Thar dunes
  { id: "1659651117607-d2b397cf100f", lift: 0.1 }, // Almaty skyline
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
  const wool = T.knitMaps("body");
  const ribbing = T.knitMaps("band");
  const knitwear = (maps: ReturnType<typeof T.knitMaps>, depth: number) =>
    new THREE.MeshPhysicalMaterial({
      color: "#9a9893",
      map: maps.color,
      normalMap: maps.normal,
      normalScale: new THREE.Vector2(depth, depth),
      roughness: 0.96,
      sheen: 0.85,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color("#e4e2dd"),
    });
  const skin = (extra: THREE.MeshPhysicalMaterialParameters = {}) =>
    new THREE.MeshPhysicalMaterial({
      color: "#8a5e46",
      roughness: 0.64,
      specularIntensity: 0.28,
      sheen: 0.18,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color("#c9806a"),
      ...extra,
    });
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
    sweater: knitwear(wool, 0.9),
    rib: knitwear(ribbing, 1),
    skin: skin(),
    // The sculpted hand carries its own crease shading and nail tint as vertex colours.
    hand: skin({ vertexColors: true }),
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

// Heel and toe of the sole relative to the ankle joint (forward along x).
const HEEL = 0.08;
const TOE = 0.21;

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const bump = (a: number, centre: number, width: number) => Math.exp(-((wrapAngle(a - centre) / width) ** 2));
/** Bisection for the root of an increasing function between lo and hi. */
function root(f: (m: number) => number, lo: number, hi: number) {
  for (let i = 0; i < 32; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
}

// Gait phase: heel strike at φ = π/2, mid-stance at φ ≈ -2.71 (leg under the hip), toe-off near
// φ = -1.05, swing in between. Deepest knee bend early in the swing, a soft knee after heel strike.
const MID_STANCE = -2.71;
const HEEL_REACH = 0.02;
const PELVIS_SMOOTH = 0.3;
const ANKLE_SMOOTH = 0.05;
const TAPS = [-2, -1, 0, 1, 2].map((k) => ({ k, w: Math.exp(-((k / 1.5) ** 2) / 2) }));

function legAngles(phi: number, gait: number) {
  const hip = (0.24 * Math.sin(phi) + 0.1) * gait;
  const knee = -(0.04 + 1.1 * bump(phi, -0.2, 1.15) + 0.22 * bump(phi, 2.0, 0.45) + 0.12 * bump(phi, 2.9, 0.5)) * gait;
  const swing = smooth(clamp01((phi + 1.05) / 0.25)) * (1 - smooth(clamp01((phi - 1.25) / 0.25)));
  return { hip, knee, swing, inSwing: swing * gait };
}

// Past mid-stance a foot may roll onto its toe, once the other foot is down to take the weight.
const trailing = (phi: number) => {
  const t = wrapAngle(phi - MID_STANCE);
  return smooth(clamp01(t / 0.6)) * (1 - smooth(clamp01((t - 1.9) / 0.4)));
};
// Just after heel strike the leading foot lands heel first, so it reaches a little further.
const heelFirst = (phi: number) => {
  const t = wrapAngle(phi - Math.PI / 2);
  return smooth(clamp01((t + 0.5) / 0.3)) * (1 - smooth(clamp01((t - 0.2) / 0.9)));
};

/** Pelvis height carried by whichever leg bears the weight: the trailing foot never vaults the body. */
function support(phase: number, gait: number) {
  const legs = [0, Math.PI].map((offset) => {
    const phi = wrapAngle(phase + offset);
    return { phi, ...legAngles(phi, gait) };
  });
  let sum = 0;
  let weight = 0;
  legs.forEach((leg, i) => {
    const other = legs[1 - i];
    const ankleY = -THIGH * Math.cos(leg.hip) - SHIN * Math.cos(leg.hip + leg.knee);
    const height = ANKLE - ankleY + HEEL_REACH * heelFirst(leg.phi) * gait;
    const w = (1 - leg.swing) * (1 - trailing(leg.phi) * (1 - other.swing)) + 1e-4;
    sum += w * height;
    weight += w;
  });
  return sum / weight;
}

/** Smoothed over the stride so the body rises and settles in one soft wave per step. */
function pelvisHeight(phase: number, gait: number) {
  let sum = 0;
  let weight = 0;
  for (const { k, w } of TAPS) {
    sum += w * support(phase + (k * PELVIS_SMOOTH) / 1.5, gait);
    weight += w;
  }
  return sum / weight;
}

/** Joint angles for one leg with the pelvis at height y: planted feet meet the floor exactly. */
function legPose(phi: number, y: number, gait: number) {
  const { hip, inSwing } = legAngles(phi, gait);
  let { knee } = legAngles(phi, gait);
  const stance = 1 - inSwing;
  // Swinging: trails toe-down, comes back to neutral, then tips toe-up ready for the next heel strike.
  const early = smooth(clamp01((phi + 1.05) / 1.0));
  const late = smooth(clamp01((phi - 0.6) / 0.8));
  const swingAnkle = (-0.3 + 0.5 * early) * (1 - late) + (0.2 - hip - knee) * late;

  // A planted leg softens its knee rather than push the foot through the floor.
  const reach = (y - ANKLE - THIGH * Math.cos(hip)) / SHIN;
  if (reach < 1.2) {
    const need = -Math.acos(THREE.MathUtils.clamp(reach, -1, 1)) - hip;
    const soft = (knee + need - Math.sqrt((knee - need) ** 2 + 0.0036)) / 2;
    knee += (soft - knee) * stance;
  }
  const ankleHeight = y - THIGH * Math.cos(hip) - SHIN * Math.cos(hip + knee);
  const heelAt = (pitch: number) => ankleHeight - HEEL * Math.sin(pitch) - ANKLE * Math.cos(pitch);
  const toeAt = (pitch: number) => ankleHeight + TOE * Math.sin(pitch) - ANKLE * Math.cos(pitch);

  // A planted foot that is lifted stays in touch: heel down before mid-stance, rolling onto the toe after.
  let contact = 0;
  if (ankleHeight > ANKLE) {
    const t = wrapAngle(phi - MID_STANCE);
    const onToe = t > 0 ? smooth(clamp01(t / 0.1)) * (1 - smooth(clamp01((t - 1.8) / 1.3))) : 0;
    const toePitch = onToe > 0 ? root(toeAt, -Math.atan(TOE / ANKLE), 0) : 0;
    const heelPitch = onToe < 1 ? root((m) => -heelAt(m), 0, 0.75) : 0;
    contact = toePitch * onToe + heelPitch * (1 - onToe);
  }
  let ankle = (contact - hip - knee) * stance + swingAnkle * inSwing;
  // A swinging heel never brushes the floor, and a lifting toe never digs in as the foot rolls off it.
  if (inSwing > 0 && hip + knee + ankle > 0 && heelAt(hip + knee + ankle) < 0) {
    ankle = root((a) => -heelAt(hip + knee + a), -(hip + knee), ankle);
  }
  if (inSwing > 0 && hip + knee + ankle < 0 && toeAt(hip + knee + ankle) < 0 && toeAt(contact) >= -1e-6) {
    ankle = root((a) => toeAt(hip + knee + a), ankle, contact - hip - knee);
  }
  return { hip, knee, ankle };
}

/** Poses both legs for a gait phase and returns the pelvis height. */
function poseLegs(legs: ReturnType<typeof buildLegs>["legs"], phase: number, gait: number) {
  const y = pelvisHeight(phase, gait);
  legs.forEach((leg, i) => {
    const offset = i ? Math.PI : 0;
    const pose = legPose(wrapAngle(phase + offset), y, gait);
    // The ankle is eased over a sliver of the stride so the roll off the toe never snaps.
    let ankle = 0;
    let weight = 0;
    for (const { k, w } of TAPS) {
      const at = phase + (k * ANKLE_SMOOTH) / 1.5;
      ankle += w * (k ? legPose(wrapAngle(at + offset), pelvisHeight(at, gait), gait).ankle : pose.ankle);
      weight += w;
    }
    leg.hip.rotation.z = pose.hip;
    leg.knee.rotation.z = pose.knee;
    leg.ankle.rotation.z = ankle / weight;
  });
  return y;
}

// Upper body, framed only on portrait screens: a heather-grey rib-knit crew-neck over the trousers,
// the right hand on the case handle and the left arm swinging with the stride. Built in the pelvis frame (origin
// between the hips, +x forward, +z to the traveller's right).
const UPPER_ARM = 0.31;
const FOREARM = 0.26;
const SHOULDER = new THREE.Vector3(0.01, 0.44, 0.165);
// Knit scale: courses per metre up the garment (16 to a texture tile).
const COURSES = 180 / 16;
type Row = [y: number, halfWidth: number, halfDepth: number, centreX: number, squareness: number];
// The body, from just inside the hem band to the neckline.
const TORSO_ROWS: Row[] = [
  [-0.03, 0.188, 0.126, 0.004, 2.3],
  [-0.008, 0.195, 0.132, 0.005, 2.3],
  [0.014, 0.201, 0.137, 0.005, 2.3],
  [0.05, 0.2, 0.136, 0.005, 2.4],
  [0.13, 0.192, 0.128, 0.008, 2.5],
  [0.23, 0.191, 0.128, 0.01, 2.6],
  [0.32, 0.194, 0.129, 0.011, 2.8],
  [0.4, 0.193, 0.127, 0.011, 3.0],
  [0.44, 0.188, 0.123, 0.012, 3.1],
  [0.468, 0.175, 0.116, 0.012, 3.0],
  [0.492, 0.154, 0.104, 0.012, 2.7],
  [0.512, 0.124, 0.088, 0.01, 2.4],
  [0.528, 0.095, 0.074, 0.004, 2.1],
  [0.543, 0.071, 0.062, -0.004, 2.0],
];
// Ribbed hem band hugging the hips, its lower edge turned in.
const HEM_ROWS: Row[] = [
  [-0.046, 0.19, 0.13, 0.004, 2.3],
  [-0.06, 0.192, 0.132, 0.004, 2.3],
  [-0.058, 0.194, 0.134, 0.004, 2.3],
  [-0.03, 0.195, 0.135, 0.004, 2.3],
  [-0.004, 0.196, 0.136, 0.004, 2.3],
];
// Crew neck: a ribbed band rolled over at the top and back down inside.
const COLLAR_ROWS: Row[] = [
  [0.53, 0.09, 0.068, -0.006, 2.1],
  [0.546, 0.079, 0.064, -0.006, 2.0],
  [0.558, 0.074, 0.06, -0.006, 2.0],
  [0.562, 0.069, 0.056, -0.006, 2.0],
  [0.556, 0.063, 0.051, -0.006, 2.0],
  [0.54, 0.061, 0.05, -0.006, 2.0],
];

/** Catmull-Rom through evenly indexed values, sampled at fractional index t. */
function spline(values: number[], t: number) {
  const i = Math.min(values.length - 2, Math.floor(t));
  const f = t - i;
  const p0 = values[Math.max(0, i - 1)];
  const p1 = values[i];
  const p2 = values[i + 1];
  const p3 = values[Math.min(values.length - 1, i + 2)];
  return 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
}

/**
 * A knitted tube through horizontal rows (rounded-rectangle cross sections), with the seam at the back.
 * `wales` is texture tiles round the tube (8 wales each), `fineness` scales the stitch height to match,
 * and `fold` swells or tucks the cloth at (y, angle).
 */
function knitTube(rows: Row[], samples: number, wales: number, fineness: number, fold?: (y: number, a: number) => number) {
  const around = 64;
  const columns = [0, 1, 2, 3, 4].map((k) => rows.map((row) => row[k]));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let run = 0;
  let last: number[] | null = null;
  for (let j = 0; j <= samples; j++) {
    const [y, w, d, c, n] = columns.map((values) => spline(values, (j / samples) * (rows.length - 1)));
    // Distance along the cloth, so courses keep their size where the tube turns back on itself.
    if (last) run += Math.hypot(y - last[0], w - last[1]);
    last = [y, w];
    for (let i = 0; i <= around; i++) {
      const a = Math.PI + (i / around) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const s = 1 + (fold ? fold(y, a) : 0);
      positions.push(c + d * s * Math.sign(ca) * Math.abs(ca) ** (2 / n), y, w * s * Math.sign(sa) * Math.abs(sa) ** (2 / n));
      uvs.push((i / around) * wales, run * COURSES * fineness);
    }
  }
  for (let j = 0; j < samples; j++) {
    for (let i = 0; i < around; i++) {
      const a = j * (around + 1) + i;
      const b = a + around + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** How the body of the sweater drapes: bloused over the hem band, hanging folds, creases under the arms. */
function torsoFolds(y: number, a: number) {
  const blouse = Math.max(0, 1 - ((y - 0.035) / 0.05) ** 2);
  const hang = clamp01(1 - (y - 0.02) / 0.3) * clamp01((y + 0.01) / 0.03);
  const side = Math.abs(Math.sin(a)) ** 4 * Math.max(0, 1 - ((y - 0.39) / 0.05) ** 2);
  return (
    0.016 * blouse * Math.sin((2 * Math.PI * y) / 0.042 + 0.9 * Math.sin(3 * a) + 0.4) * (0.7 + 0.3 * Math.sin(5 * a)) +
    0.011 * hang * Math.sin(11 * a + 1.7 * Math.sin(2 * a) + 0.6) +
    0.012 * side * Math.sin(70 * (y - 0.08 * Math.cos(a)))
  );
}

/**
 * The sleeve as one skinned tube, hanging from the shoulder joint at the origin. Bones: 0 stays with the
 * torso (the sleeve head), 1 the upper arm, 2 the forearm, 3 the hand (the cuff edge follows the wrist).
 */
function sleeveGeometry() {
  const around = 40;
  const wrist = UPPER_ARM + FOREARM;
  // [y, radius, rib]: sleeve head, upper arm, elbow, roomy forearm gathering into a snug ribbed cuff.
  const profile: [number, number, number][] = [];
  for (let i = 0; i <= 6; i++) {
    const y = 0.034 - (i / 6) * 0.034;
    profile.push([y, 0.055 * Math.sqrt(Math.max(0.06, 1 - (y / 0.037) ** 2)), 0]);
  }
  for (let i = 1; i <= 48; i++) {
    const s = i / 48;
    const y = -s * (wrist - 0.05);
    const r = 0.055 - 0.009 * smooth(clamp01(s / 0.55)) + 0.0025 * Math.exp(-(((y + 0.05) / 0.04) ** 2)) - 0.0012 * smooth(clamp01((s - 0.6) / 0.4));
    profile.push([y, r, 0]);
  }
  const cuffTop = -(wrist - 0.05);
  profile.push([cuffTop - 0.006, 0.039, 0], [cuffTop - 0.012, 0.0365, 1]);
  for (let i = 1; i <= 8; i++) profile.push([cuffTop - 0.012 - (i / 8) * 0.062, 0.0365 - 0.0015 * (i / 8), 1]);
  const end = profile[profile.length - 1][0];
  profile.push([end - 0.003, 0.0335, 1], [end - 0.001, 0.0305, 1], [end + 0.012, 0.0305, 1]);

  const positions: number[] = [];
  const uvs: number[] = [];
  const skinIndex: number[] = [];
  const skinWeight: number[] = [];
  let run = 0;
  profile.forEach(([y, radius, rib], j) => {
    if (j) run += Math.hypot(y - profile[j - 1][0], radius - profile[j - 1][1]);
    // Bone weights down the arm: sleeve head with the torso, a soft bend over the elbow, cuff edge with the hand.
    const head = smooth(clamp01((y + 0.03) / 0.07));
    const elbow = smooth(clamp01((-y - (UPPER_ARM - 0.04)) / 0.08));
    const hand = smooth(clamp01((-y - (wrist - 0.004)) / 0.016));
    const arm = 1 - head;
    const fore = arm * elbow;
    skinIndex.push(0, 1, 2, 3);
    skinWeight.push(head, arm - fore, fore * (1 - hand), fore * hand);
    for (let i = 0; i <= around; i++) {
      const a = Math.PI + (i / around) * Math.PI * 2;
      const inner = Math.max(0, Math.cos(a));
      let r = radius;
      if (!rib) {
        // Creases inside the elbow, loose folds bunching above the cuff, a long soft drape down the arm.
        r -= 0.0045 * inner * inner * Math.max(0, 1 - ((y + UPPER_ARM) / 0.05) ** 2) * Math.abs(Math.sin((2 * Math.PI * (y + UPPER_ARM)) / 0.034));
        const bunch = Math.max(0, 1 - ((y - cuffTop - 0.035) / 0.04) ** 2);
        r += 0.0032 * bunch * Math.sin((2 * Math.PI * y) / 0.034 + 0.9 * Math.sin(a + 0.6));
        r += 0.0016 * Math.sin(4 * a + 9 * y) * smooth(clamp01(-y / 0.06));
      }
      positions.push(Math.cos(a) * r * 1.04, y, Math.sin(a) * r);
      uvs.push((i / around) * (rib ? 6 : 8), run * COURSES * (rib ? 1 : 2));
    }
  });

  const indices: number[][] = [[], []];
  for (let j = 0; j < profile.length - 1; j++) {
    for (let i = 0; i < around; i++) {
      const a = j * (around + 1) + i;
      const b = a + around + 1;
      indices[profile[j + 1][2]].push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(profile.flatMap((_, j) => Array.from({ length: around + 1 }, () => skinIndex.slice(j * 4, j * 4 + 4)).flat()), 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(profile.flatMap((_, j) => Array.from({ length: around + 1 }, () => skinWeight.slice(j * 4, j * 4 + 4)).flat()), 4));
  geometry.setIndex([...indices[0], ...indices[1]]);
  geometry.addGroup(0, indices[0].length, 0);
  geometry.addGroup(indices[0].length, indices[1].length, 1);
  geometry.computeVertexNormals();
  return geometry;
}

function buildArm(m: Mats) {
  const head = new THREE.Bone();
  const shoulder = new THREE.Bone();
  const elbow = new THREE.Bone();
  const wrist = new THREE.Bone();
  head.add(shoulder);
  shoulder.add(elbow);
  elbow.position.y = -UPPER_ARM;
  elbow.add(wrist);
  wrist.position.y = -FOREARM;
  const sleeve = new THREE.SkinnedMesh(sleeveGeometry(), [m.sweater, m.rib]);
  sleeve.castShadow = true;
  sleeve.receiveShadow = true;
  // Bounds come from the rest pose; the posed arm is always in frame when it is shown.
  sleeve.frustumCulled = false;
  sleeve.add(head);
  sleeve.updateMatrixWorld(true);
  sleeve.bind(new THREE.Skeleton([head, shoulder, elbow, wrist]));
  return { sleeve, head, shoulder, elbow, wrist, world: new THREE.Quaternion() };
}

function buildUpperBody(m: Mats) {
  const torso = new THREE.Group();
  torso.add(solid(knitTube(TORSO_ROWS, 72, 26, 2, torsoFolds), m.sweater));
  torso.add(solid(knitTube(HEM_ROWS, 10, 25, 1), m.rib));
  torso.add(solid(knitTube(COLLAR_ROWS, 12, 6, 1), m.rib));
  // Only a short neck: on portrait screens everything above it sits behind the site header.
  const neck = solid(new THREE.CylinderGeometry(0.049, 0.053, 0.07, 24), m.skin);
  neck.position.set(0.006, 0.575, 0);
  neck.rotation.z = -0.12;
  torso.add(neck);
  return { torso, right: buildArm(m), left: buildArm(m) };
}

type Arm = ReturnType<typeof buildArm>;

const armX = new THREE.Vector3();
const armY = new THREE.Vector3();
const armZ = new THREE.Vector3();
const armBasis = new THREE.Matrix4();

/**
 * Two-bone reach: shoulder at `from`, wrist toward `to`, elbow bending toward `pole`. `frame` is the
 * torso's world rotation, which the sleeve head keeps. Returns the forearm direction.
 */
function reach(arm: Arm, from: THREE.Vector3, to: THREE.Vector3, pole: THREE.Vector3, frame: THREE.Quaternion) {
  const toWrist = to.clone().sub(from);
  const span = THREE.MathUtils.clamp(toWrist.length(), Math.abs(UPPER_ARM - FOREARM) + 0.01, UPPER_ARM + FOREARM - 0.002);
  const dir = toWrist.normalize();
  const along = (UPPER_ARM ** 2 - FOREARM ** 2 + span ** 2) / (2 * span);
  const out = Math.sqrt(Math.max(0, UPPER_ARM ** 2 - along ** 2));
  const bend = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
  const elbow = from.clone().addScaledVector(dir, along).addScaledVector(bend, out);
  const wrist = from.clone().addScaledVector(dir, span);
  const upper = elbow.clone().sub(from).normalize();
  const fore = wrist.sub(elbow).normalize();
  armY.copy(upper).negate();
  armZ.crossVectors(upper, fore);
  if (armZ.lengthSq() < 1e-8) armZ.crossVectors(upper, bend);
  armZ.normalize();
  armX.crossVectors(armY, armZ);
  arm.world.setFromRotationMatrix(armBasis.makeBasis(armX, armY, armZ));
  arm.head.position.copy(from);
  arm.head.quaternion.copy(frame);
  arm.shoulder.quaternion.copy(frame).invert().multiply(arm.world);
  arm.elbow.rotation.z = Math.atan2(fore.dot(armX), -fore.dot(armY));
  return fore;
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
    const longest = Math.max(width, height);
    loader.load(photo(view.id, longest > 2600 ? 2048 : longest > 1600 ? 1600 : 1024), (map) => {
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

export function createIntroScene(canvas: HTMLCanvasElement, width: number, height: number, inset: number, onPhoto: () => void, handsStarted?: HandJob | null) {
  const compact = Math.min(width, height) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.5 : 1.6));
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
  renderer.setClearColor(haze);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.45;
  room.dispose();

  const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.01, 60);

  // The laptop screen matches the viewport's shape so the final frame lines up with the real hero.
  const screenAspect = height > 0 ? Math.min(2, Math.max(1.45, width / height)) : 1.6;
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
  const upper = buildUpperBody(m);
  legs.root.add(upper.torso);
  scene.add(upper.right.sleeve, upper.left.sleeve);
  const suitcase = buildSuitcase(m, screenH, lapDepth);
  scene.add(suitcase.root);

  scene.add(new THREE.HemisphereLight("#fff3e2", "#d8cbb6", 0.9));
  const sun = new THREE.DirectionalLight("#ffdcb0", 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(compact ? 1024 : 2048);
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

  let viewW = width;
  let viewH = height;
  let topInset = inset;
  const shoulderAt = new THREE.Vector3();
  const handAt = new THREE.Quaternion();
  const foreAt = new THREE.Quaternion();
  const torsoTurn = new THREE.Quaternion();
  const gripHand = new THREE.Quaternion();
  const restHand = new THREE.Quaternion();
  const gripPoint = new THREE.Vector3(...GRIP_BAR);

  // The hands appear only in portrait framing. They are sculpted in a worker (about a second's work on a
  // phone), started at once on a portrait screen so they are ready by the first frame, and attached as they
  // arrive: the grip, then the relaxed hand (only seen after letting go of the handle).
  const hands: { grip?: THREE.Mesh; loose?: THREE.Mesh; left?: THREE.Mesh } = {};
  let disposed = false;
  let handJob: HandJob | null = null;
  function sculptHands() {
    if (handJob) return handJob;
    handJob = handsStarted ?? sculptHandsAsync();
    handJob.grip.then((data) => {
      if (disposed) return;
      hands.grip = solid(toGeometry(data), m.hand);
      upper.right.wrist.add(hands.grip);
      onPhoto();
    });
    handJob.loose.then((data) => {
      if (disposed) return;
      const relaxed = toGeometry(data);
      hands.loose = solid(relaxed, m.hand);
      hands.loose.visible = false;
      upper.right.wrist.add(hands.loose);
      // The left hand is the same relaxed hand, mirrored.
      hands.left = solid(relaxed, m.hand);
      hands.left.scale.z = -1;
      upper.left.wrist.add(hands.left);
      onPhoto();
    });
    return handJob;
  }
  if (height > width || handsStarted) sculptHands();

  /**
   * Ready to show: on a portrait screen the gripping hand is in place, and every material's shaders are
   * compiled in the background (where the browser supports it), so the first frame does not stall.
   */
  async function prepare() {
    if (viewW < viewH) await sculptHands().grip;
    await renderer.compileAsync(scene, camera).catch(() => undefined);
  }

  // The hand closes on the bar along its diagonal (GRIP_AXIS): a frame built on that axis in the hand,
  // matched each frame to the same frame built on the real bar and the forearm.
  const gripAxis = v3(...GRIP_AXIS);
  const handFrame = new THREE.Matrix4()
    .makeBasis(gripAxis, v3(0, GRIP_AXIS[2], -GRIP_AXIS[1]), new THREE.Vector3(-1, 0, 0))
    .transpose();
  const barFrame = new THREE.Matrix4();
  const barAxis = v3(1, 0, 0);

  /** Hand closed round the bar: the bar lies exactly along the grip's diagonal, the hand follows the forearm. */
  function barGrip(fore: THREE.Vector3, into: THREE.Quaternion) {
    armY.copy(fore).negate().addScaledVector(barAxis, fore.dot(barAxis)).normalize();
    armZ.crossVectors(barAxis, armY);
    barFrame.makeBasis(barAxis, armY, armZ).multiply(handFrame);
    return into.setFromRotationMatrix(barFrame);
  }

  /** Relaxed hand: follows the forearm with the palm toward the thigh, turned a little back. */
  function relaxedHand(fore: THREE.Vector3, palmZ: number, into: THREE.Quaternion) {
    armY.copy(fore).negate();
    armX.set(-0.35, 0, palmZ);
    armX.addScaledVector(armY, -armX.dot(armY)).normalize();
    armZ.crossVectors(armX, armY);
    return into.setFromRotationMatrix(armBasis.makeBasis(armX, armY, armZ));
  }

  // Right hand holds the handle (and follows it down as it is pushed shut), then lets go and swings.
  // The left arm swings with the stride. The chest leans in a touch and counter-turns against the hips.
  function poseUpperBody(p: number, phase: number, gait: number) {
    const press = Math.sin(Math.PI * seg(p, 0.278, 0.33));
    upper.torso.rotation.set(0, -0.03 * Math.sin(phase) * gait, -(0.05 * gait + 0.06 * press));
    legs.root.updateMatrixWorld(true);
    suitcase.root.updateMatrixWorld(true);

    const release = smooth(seg(p, 0.295, 0.318));
    upper.torso.getWorldQuaternion(torsoTurn);
    upper.torso.localToWorld(shoulderAt.copy(SHOULDER));
    // The handle bar, a hand's width in from its near post (it sinks as the handle is pushed shut).
    const bar = suitcase.tubes.localToWorld(v3(-0.055, 0.015, 0));
    const barEnd = suitcase.tubes.localToWorld(v3(-0.135, 0, 0)).x;
    const swing = -0.32 * Math.sin(phase) * gait;
    const hanging = shoulderAt.clone().add(v3(0.03 + 0.5 * Math.sin(swing), -0.5 * Math.cos(swing), 0.04));
    const pole = v3(-0.5, -0.5, 0.75).lerp(v3(-1, -0.2, 0.25), release);
    // The hand's curl must land on the bar; its turn follows the forearm, so settle the two together.
    const onBar = bar.clone();
    let fore = bar.clone().sub(shoulderAt).normalize();
    for (let i = 0; i < 8; i++) {
      onBar.copy(bar).sub(gripPoint.clone().applyQuaternion(barGrip(fore, gripHand)));
      // Letting go, the fingers open and the hand backs straight off the bar, back of the hand first,
      // keeping pace with the sinking bar so it never slides into the palm; only once it is clear does it
      // swing down to the side.
      const off = onBar.clone().addScaledVector(v3(-1, 0, 0).applyQuaternion(gripHand), 0.075 * smooth(clamp01(release / 0.4)));
      // On the way down it passes back beyond the end of the bar before it drops, not across it.
      const behind = v3(barEnd - 0.14, off.y + 0.03, off.z);
      const drop = smooth(clamp01((release - 0.4) / 0.6));
      const wrist = off.multiplyScalar((1 - drop) ** 2).addScaledVector(behind, 2 * drop * (1 - drop)).addScaledVector(hanging, drop ** 2);
      fore = reach(upper.right, shoulderAt, wrist, pole, torsoTurn);
    }
    handAt.slerpQuaternions(barGrip(fore, gripHand), relaxedHand(fore, -1, restHand), smooth(clamp01((release - 0.4) / 0.6)));
    foreAt.copy(upper.right.world).multiply(upper.right.elbow.quaternion).invert();
    upper.right.wrist.quaternion.copy(foreAt.multiply(handAt));
    // The fingers open the moment the hand starts to let go.
    if (hands.grip) hands.grip.visible = !hands.loose || release === 0;
    if (hands.loose) hands.loose.visible = !hands.grip?.visible;

    upper.torso.localToWorld(shoulderAt.copy(SHOULDER).setZ(-SHOULDER.z));
    // A small swing, settled slightly back, keeps the far hand beside the hip rather than out in front.
    const leftSwing = 0.12 * Math.sin(phase) * gait - 0.12;
    const leftWrist = shoulderAt.clone().add(v3(0.5 * Math.sin(leftSwing), -0.5 * Math.cos(leftSwing), -0.04));
    const leftFore = reach(upper.left, shoulderAt, leftWrist, v3(-1, -0.2, -0.25), torsoTurn);
    foreAt.copy(upper.left.world).multiply(upper.left.elbow.quaternion).invert();
    upper.left.wrist.quaternion.copy(foreAt.multiply(relaxedHand(leftFore, 1, handAt)));
  }

  function render(scroll: number) {
    const p = clock(scroll);
    const portrait = viewW < viewH;
    camera.fov = portrait ? PORTRAIT_FOV : FOV;
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
    const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const x = legsX(p);
    const speed = Math.abs(legsX(p + 0.002) - legsX(p - 0.002)) / 0.004;
    const gait = smooth(clamp01(speed / 6));
    const phase = ((x - WALK_FROM) / STRIDE) * Math.PI * 2;
    legs.root.position.set(x, poseLegs(legs.legs, phase, gait), portrait ? PORTRAIT_LANE : LEG_LANE);
    legs.root.visible = x < 4.5;

    const caseX = walkX(p) + CASE_LEAD;
    suitcase.root.position.set(caseX, 0, CASE_LANE);
    suitcase.wheels.forEach((wheel) => (wheel.rotation.z = -(caseX - WALK_FROM - CASE_LEAD) / 0.027));
    suitcase.root.rotation.x = p < 0.3 ? 0.007 * Math.sin(phase * 2) * gait : 0;
    // In portrait, where the handle is held, it is only part-way up: the bar sits where a relaxed,
    // slightly forward arm's hand falls, so the wrist stays straight.
    suitcase.tubes.position.y = CASE_H + 0.012 + (portrait ? 0.2 : 0.44) * (1 - inOut(seg(p, 0.28, 0.34)));

    const showUpper = portrait && legs.root.visible;
    upper.torso.visible = upper.right.sleeve.visible = upper.left.sleeve.visible = showUpper;
    if (showUpper) {
      sculptHands();
      poseUpperBody(p, phase, gait);
    }

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
    let shotA;
    if (portrait) {
      // Floor to shoulders fills the screen below the header; the header covers the band above.
      const span = (PORTRAIT_SHOULDERS - PORTRAIT_FLOOR) / (1 - Math.min(0.35, topInset / viewH));
      const distance = span / 2 / halfTan;
      const aim = v3(track - 0.07, PORTRAIT_FLOOR + span / 2, -0.1);
      shotA = { pos: aim.clone().add(v3(distance * Math.sin(PORTRAIT_YAW), 0.18, distance * Math.cos(PORTRAIT_YAW))), tgt: aim };
    } else {
      // Framed so the whole case clears the header while the hips stay above the top edge.
      const lead = camera.aspect < 1.3 ? 0.04 + 0.2 * clamp01((camera.aspect - 1) / 0.3) : 0.24 + 0.24 * clamp01((camera.aspect - 1.3) / 0.5);
      shotA = { pos: v3(track + 0.7, 0.4, 2.24), tgt: v3(track - lead, 0.33, -0.04) };
    }
    // Narrow screens pull each later shot back until its subject fits across (wide screens never need to).
    const fit = (shot: { pos: THREE.Vector3; tgt: THREE.Vector3 }, half: number) => {
      const offset = shot.pos.clone().sub(shot.tgt);
      const need = half / (halfTan * camera.aspect);
      return need > offset.length() ? { pos: shot.tgt.clone().addScaledVector(offset.normalize(), need), tgt: shot.tgt } : shot;
    };
    const b = fit(shotB, 0.42);
    const c = fit(shotC, 0.32);
    const d = fit(shotD, 0.2);
    const position = new THREE.Vector3();
    up.set(0, 1, 0);
    if (p < 0.38) {
      position.copy(shotA.pos);
      target.copy(shotA.tgt);
    } else if (p < 0.66) {
      const k = inOut(seg(p, 0.38, 0.63));
      position.copy(through([shotA.pos, b.pos, c.pos], k));
      target.copy(through([shotA.tgt, b.tgt, c.tgt], k));
      const drift = seg(p, 0.63, 0.66);
      position.x += 0.02 * drift;
    } else if (p < 0.78) {
      const k = inOut(seg(p, 0.66, 0.78));
      position.lerpVectors(v3(c.pos.x + 0.02, c.pos.y, c.pos.z), d.pos, k);
      target.lerpVectors(c.tgt, d.tgt, k);
    } else {
      scene.updateMatrixWorld();
      suitcase.screen.getWorldPosition(screenCenter);
      suitcase.screen.getWorldDirection(screenNormal);
      suitcase.screen.getWorldQuaternion(quaternion);
      screenUp.set(0, 1, 0).applyQuaternion(quaternion);
      const finalDistance = regionH / (2 * halfTan);
      const approach = screenCenter.clone().addScaledVector(screenNormal, 0.75).addScaledVector(screenUp, 0.06);
      const end = screenCenter.clone().addScaledVector(screenNormal, finalDistance);
      const e = inOut(seg(p, 0.78, 0.965));
      position.copy(through([d.pos, approach, end], e));
      target.lerpVectors(d.tgt, screenCenter, smooth(clamp01(e * 1.5)));
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

  function resize(w: number, h: number, inset: number) {
    viewW = w;
    viewH = h;
    topInset = inset;
    renderer.setSize(w, h, false);
    world.mirror.getRenderTarget().setSize(Math.round(w * renderer.getPixelRatio() * 0.5), Math.round(h * renderer.getPixelRatio() * 0.5));
  }

  function dispose() {
    disposed = true;
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

  return { render, setScreen, resize, dispose, prepare };
}
