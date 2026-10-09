import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BODY, buildInstantCamera, DOOR_OPEN, STACK } from "./camera-model";
import { sizedImage } from "@/lib/image-sizes";
import { ASPECT, seeded, type TableLayout } from "./layout";

// The gallery intro: an instant camera on a walnut table under a desk lamp. Scrolling plays it forward —
// it takes your picture, turns its back, drops the door, and every print bursts out at once, arcing,
// flipping and skidding to the exact spot it rests on the interactive table, while the camera shuts its
// door and hops off the table. The view cranes up to look straight down so the last frame is the table.

export type ScenePrint = { place: string; photo?: string };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const outCubic = (t: number) => 1 - (1 - t) ** 3;
const outBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);

// Choreography, in scroll progress (0 → 1).
const PUSH = 0.17; // the view leans in on the lens
const FLASH = 0.185; // it takes your picture
const TURN: [number, number] = [0.2, 0.38]; // turns its back to you
const OPEN: [number, number] = [0.38, 0.44]; // the door drops
const BURST = 0.45; // every print, at once
const CLOSE: [number, number] = [0.49, 0.54]; // door snaps shut once the stack is out
const EXIT: [number, number] = [0.53, 0.66]; // then it hops backwards off the near edge of the table
const CLEAR = 0.67; // prints whose spot is under or in the way of the camera land after it has gone
// Overhead, the lamp and haze give way to the table as it really is — the wood and prints in their own
// colours, each print with the soft shadow the interactive table draws — so the hand-off is invisible.
const SETTLE: [number, number] = [0.8, 0.92];
export const HANDOFF: [number, number] = [0.93, 0.995];

/** How bright the flash is at p, 0 → 1 (also drives the white flash over the page). */
export const flashAt = (p: number) => Math.exp(-(((p - FLASH) / 0.006) ** 2));

/** Monotone cubic through keyframes: smooth, never overshoots, no stalls between keys. */
function track(keys: [number, number][]) {
  const n = keys.length;
  const slopes = keys.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    const d0 = (keys[i][1] - keys[i - 1][1]) / (keys[i][0] - keys[i - 1][0]);
    const d1 = (keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]);
    return d0 * d1 <= 0 ? 0 : (2 * d0 * d1) / (d0 + d1);
  });
  return (p: number) => {
    if (p <= keys[0][0]) return keys[0][1];
    if (p >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (p > keys[i + 1][0]) i++;
    const [x0, y0] = keys[i];
    const [x1, y1] = keys[i + 1];
    const h = x1 - x0;
    const t = (p - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * slopes[i] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * slopes[i + 1];
  };
}

/** A print is drawn at 512 px, so a 640 px copy of each photo is plenty (straight from its source, with CORS). */
function photoUrl(src: string) {
  return /^https?:/.test(src) ? sizedImage(src, 640) : src;
}

/** The face of a print, drawn exactly like the interactive card: white frame, square photo, caption by hand. */
function drawPrint(canvas: HTMLCanvasElement, place: string, font: string, photo?: HTMLImageElement) {
  const w = canvas.width;
  const h = canvas.height;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#fbfaf6";
  g.fillRect(0, 0, w, h);
  const margin = w * 0.052;
  const size = w - margin * 2;
  if (photo) {
    const scale = Math.max(size / photo.naturalWidth, size / photo.naturalHeight);
    const sw = size / scale;
    const sh = size / scale;
    g.drawImage(photo, (photo.naturalWidth - sw) / 2, (photo.naturalHeight - sh) / 2, sw, sh, margin, margin, size, size);
  } else {
    const dark = g.createRadialGradient(margin + size * 0.3, margin + size * 0.2, 0, margin + size * 0.3, margin + size * 0.2, size * 1.2);
    dark.addColorStop(0, "#3a403c");
    dark.addColorStop(0.55, "#1d221f");
    dark.addColorStop(1, "#121513");
    g.fillStyle = dark;
    g.fillRect(margin, margin, size, size);
  }
  g.fillStyle = "#26302c";
  g.font = `500 ${Math.round(w * 0.13)}px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(place, w / 2, (margin + size + h) / 2);
}

type Flight = {
  /** Where the print sits in the stack, in the camera body's own frame (it rides along until launched). */
  stack: THREE.Vector3;
  start: THREE.Vector3;
  exit: THREE.Vector3;
  c1: THREE.Vector3;
  c2: THREE.Vector3;
  land: THREE.Vector3;
  home: THREE.Vector3;
  q0: THREE.Quaternion;
  qEnd: THREE.Quaternion;
  flipAxis: THREE.Vector3;
  flips: number;
  spin: number;
  launch: number;
  eject: number;
  fly: number;
  slide: number;
};

export function createGalleryScene(canvas: HTMLCanvasElement, options: { prints: ScenePrint[]; font: string; wood: HTMLCanvasElement | HTMLImageElement }) {
  const { prints, font, wood } = options;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const room = new THREE.Color("#120b07");
  scene.background = room;
  scene.fog = new THREE.Fog(room, 10, 34);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new RoomEnvironment();
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  scene.environmentIntensity = 0.32;
  env.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 200);

  // A desk lamp overhead: a warm pool on the table, soft shadows; a little cool light from behind for edges.
  const lamp = new THREE.SpotLight("#ffe2bd", 420, 0, 0.62, 0.9, 2);
  lamp.position.set(-2.2, 10, 3.2);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  lamp.shadow.camera.near = 2;
  lamp.shadow.camera.far = 30;
  lamp.shadow.bias = -0.0002;
  lamp.shadow.normalBias = 0.02;
  lamp.shadow.radius = 4;
  scene.add(lamp, lamp.target);
  const fill = new THREE.HemisphereLight("#fff1df", "#2a1a10", 0.45);
  scene.add(fill);
  const rim = new THREE.DirectionalLight("#cfdcff", 0.5);
  rim.position.set(2, 4, -6);
  scene.add(rim);

  // The table: the same walnut canvas as the page, mapped the way the page shows it (cover, centred).
  const woodTexture = new THREE.CanvasTexture(wood);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = woodTexture.wrapT = THREE.MirroredRepeatWrapping;
  woodTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const TABLE_SCALE = 8;
  // Lit by the lamp during the film; shown in its own colours (emissive, untouched by tone mapping) once settled.
  const woodMaterial = new THREE.MeshStandardMaterial({ map: woodTexture, emissiveMap: woodTexture, emissive: "#ffffff", emissiveIntensity: 0, roughness: 0.48, metalness: 0, toneMapped: false });
  const table = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), woodMaterial);
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  const instant = buildInstantCamera();
  scene.add(instant.root);

  // Prints: white edges, the face on top, the black back of a real instant print underneath.
  const edge = new THREE.MeshStandardMaterial({ color: "#f1eee6", roughness: 0.7 });
  const backing = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.55 });
  const printGeometry = new THREE.BoxGeometry(1, 0.008, ASPECT);
  const faces = prints.map((print) => {
    const face = document.createElement("canvas");
    face.width = 512;
    face.height = Math.round(512 * ASPECT);
    drawPrint(face, print.place, font);
    const texture = new THREE.CanvasTexture(face);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { face, texture };
  });
  const fronts: THREE.MeshStandardMaterial[] = [];
  const printMeshes = faces.map(({ texture }) => {
    const front = new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: "#ffffff", emissiveIntensity: 0, roughness: 0.42, toneMapped: false });
    fronts.push(front);
    const mesh = new THREE.Mesh(printGeometry, [edge, edge, front, backing, edge, edge]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  });
  // The interactive card's CSS shadow (0 10px 24px -10px, plus a 1px contact line), drawn once per layout
  // and laid under each print in its own frame so it turns with it.
  const shadowTexture = new THREE.CanvasTexture(document.createElement("canvas"));
  shadowTexture.colorSpace = THREE.SRGBColorSpace;
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false, fog: false, opacity: 0 });
  const shadowGeometry = new THREE.PlaneGeometry(1, 1);
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadows = prints.map(() => {
    const mesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    mesh.renderOrder = 1;
    scene.add(mesh);
    return mesh;
  });
  function drawShadow(cardW: number) {
    const cardH = cardW * ASPECT;
    const pad = 48;
    const c = document.createElement("canvas");
    c.width = Math.round(cardW + pad * 2);
    c.height = Math.round(cardH + pad * 2);
    const g = c.getContext("2d")!;
    g.filter = "blur(12px)";
    g.fillStyle = "rgba(40,30,20,0.35)";
    g.fillRect(pad + 10, pad + 10 + 10, cardW - 20, cardH - 20);
    g.filter = "blur(0.5px)";
    g.fillStyle = "rgba(40,30,20,0.12)";
    g.fillRect(pad, pad + 1, cardW, cardH);
    shadowTexture.image = c;
    shadowTexture.needsUpdate = true;
    shadows.forEach((mesh) => mesh.scale.set(c.width / cardW, 1, c.height / cardW));
  }

  const loading = prints.map(
    (print, i) =>
      new Promise<void>((resolve) => {
        if (!print.photo) return resolve();
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          drawPrint(faces[i].face, print.place, font, image);
          faces[i].texture.needsUpdate = true;
          resolve();
        };
        // A missing smaller copy (photos uploaded before copies existed) falls back to the original.
        image.onerror = () => (/_w\d+\.webp\?/.test(image.src) ? (image.src = image.src.replace(/_w\d+\.webp\?/, ".webp?")) : resolve());
        image.src = photoUrl(print.photo);
      }),
  );
  const ready = Promise.all(loading);

  let layout: TableLayout | null = null;
  let flights: Flight[] = [];
  // The camera starts in the middle of the table and leaves off its near edge.
  const cameraHome = v3(0, 0, 0);
  let cameraGone = v3(0, 0, 0);
  const turnFrom = -0.3;
  const turnTo = Math.PI - 0.3;
  let view = { elev: track([[0, 0]]), radius: track([[0, 0]]), azimuth: track([[0, 0]]), fov: track([[0, 30]]), tx: track([[0, 0]]), ty: track([[0, 0]]), tz: track([[0, 0]]) };

  /** Where the scene camera is at p. */
  function viewAt(p: number, into = new THREE.Vector3()) {
    const elev = view.elev(p);
    const az = view.azimuth(p);
    const r = view.radius(p);
    const target = v3(view.tx(p), view.ty(p), view.tz(p));
    into.set(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev)).multiplyScalar(r).add(target);
    return { position: into, target, elev };
  }

  function setLayout(next: TableLayout) {
    layout = next;
    const { width, height, cardW } = next;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const tableW = width / cardW;
    const tableH = height / cardW;
    const toWorld = (x: number, y: number) => v3((x - width / 2) / cardW, 0, (y - height / 2) / cardW);

    table.scale.set(tableW * TABLE_SCALE, tableH * TABLE_SCALE, 1);
    const cover = Math.max(width / 1600, height / 1000);
    const fx = width / (1600 * cover);
    const fy = height / (1000 * cover);
    woodTexture.repeat.set(TABLE_SCALE * fx, TABLE_SCALE * fy);
    woodTexture.offset.set(0.5 - (TABLE_SCALE * fx) / 2, 0.5 - (TABLE_SCALE * fy) / 2);

    cameraGone = v3(0.5, 0, tableH / 2 + 2.8);

    // The view: beside the camera with room for the headline on its left, in on the lens for the flash,
    // round as it turns, back to watch the burst, then up and over until it looks straight down on the table.
    const fovEnd = 18;
    const top = tableH / 2 / Math.tan(THREE.MathUtils.degToRad(fovEnd / 2));
    const c = cameraHome;
    view = {
      elev: track([[0, 0.3], [0.06, 0.3], [PUSH, 0.2], [0.21, 0.2], [TURN[1], 0.36], [0.47, 0.44], [0.62, 0.95], [0.9, Math.PI / 2]]),
      radius: track([[0, 5.4], [0.06, 5.4], [PUSH, 3.5], [0.21, 3.5], [TURN[1], 4.6], [0.47, 5.6], [0.62, top * 0.62], [0.9, top]]),
      azimuth: track([[0, 0.12], [0.06, 0.12], [PUSH, 0.02], [0.21, 0.02], [TURN[1], -0.36], [0.47, -0.22], [0.62, -0.06], [0.9, 0]]),
      fov: track([[0, 30], [0.47, 32], [0.62, 24], [0.9, fovEnd]]),
      tx: track([[0, c.x - 1.05], [0.06, c.x - 1.05], [PUSH, c.x - 0.42], [0.21, c.x - 0.42], [TURN[1], c.x - 0.15], [0.47, c.x], [0.9, 0]]),
      ty: track([[0, 0.5], [PUSH, 0.5], [TURN[1], 0.45], [0.47, 0.35], [0.62, 0.1], [0.9, 0]]),
      tz: track([[0, c.z], [TURN[1], c.z], [0.47, c.z + 0.5], [0.62, c.z + 0.2], [0.9, 0]]),
    };

    // Flights: from the stack, out of the back, arcing high (some right over the camera), flipping, then a
    // little skid along the table into each print's spot.
    const random = seeded(19);
    const turn = new THREE.Quaternion().setFromAxisAngle(UP, turnTo);
    const local = (x: number, y: number, z: number) => v3(x, y, z).applyQuaternion(turn).add(cameraHome);
    const back = v3(0, 0, -1).applyQuaternion(turn);
    const count = next.count;
    // The two prints landing nearest the viewer come straight at the lens first.
    const nearest = next.homes
      .map((h, i) => ({ i, y: h.y }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 2)
      .map((h) => h.i);
    flights = next.homes.map((spot, i) => {
      const r = () => random();
      const y = STACK.y + 0.004 + i * STACK.step;
      const start = local(0, y, STACK.z);
      const exit = local(0, y + 0.05, -BODY.d / 2 - 0.45);
      const home = toWorld(spot.x, spot.y);
      home.y = 0.0045 + i * 0.0009;
      const across = home.clone().sub(exit).setY(0);
      const distance = across.length();
      const slideLen = 0.2 + 0.45 * r();
      const land = home.clone().addScaledVector(across.normalize(), -slideLen);
      const launch = BURST + (count - 1 - i) * 0.0016 + r() * 0.004;
      let fly = 0.1 + 0.05 * r() + 0.012 * distance;
      // In the camera's way out? Hang in the air longer, arcing higher, and come down once it has passed.
      const path = cameraGone.clone().sub(cameraHome);
      const along = clamp01(home.clone().sub(cameraHome).dot(path) / path.lengthSq());
      const inTheWay = home.distanceTo(cameraHome.clone().addScaledVector(path, along)) < 1.45;
      if (inTheWay) fly = Math.max(fly, CLEAR + 0.012 * r() - launch - 0.014);
      const apex = (0.9 + 1.7 * r() + 0.22 * distance) * Math.max(1, fly / 0.16);
      let c1 = exit.clone().addScaledVector(back, 0.7 + 0.6 * r()).addScaledVector(UP, apex * 1.25);
      if (nearest.includes(i)) {
        const eye = viewAt(launch + 0.014 + fly * 0.3).position;
        c1 = exit.clone().lerp(eye, 0.86).add(v3((nearest.indexOf(i) - 0.5) * 1.2, -0.3, 0));
      }
      const c2 = land.clone().addScaledVector(UP, apex * 0.6);
      const phi = r() * Math.PI * 2;
      return {
        stack: v3(0, y, STACK.z),
        start,
        exit,
        c1,
        c2,
        land,
        home,
        q0: new THREE.Quaternion().setFromAxisAngle(UP, turnTo + Math.PI / 2),
        qEnd: new THREE.Quaternion().setFromAxisAngle(UP, -spot.angle),
        flipAxis: v3(Math.cos(phi), 0, Math.sin(phi)),
        flips: nearest.includes(i) ? 0 : r() < 0.7 ? 1 : 2,
        spin: r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0,
        launch,
        eject: 0.014,
        fly,
        slide: 0.035 + 0.02 * r(),
      };
    });
    printMeshes.forEach((mesh, i) => (mesh.visible = i < count));
    drawShadow(cardW);
    shadows.forEach((mesh, i) => {
      mesh.visible = i < count;
      const f = flights[i];
      if (!f) return;
      mesh.position.set(f.home.x, 0.0015, f.home.z);
      mesh.quaternion.copy(f.qEnd);
    });
  }

  const flipQ = new THREE.Quaternion();
  const spinQ = new THREE.Quaternion();
  const bezier = (f: Flight, s: number, into: THREE.Vector3) => {
    const u = 1 - s;
    return into
      .copy(f.exit)
      .multiplyScalar(u * u * u)
      .addScaledVector(f.c1, 3 * u * u * s)
      .addScaledVector(f.c2, 3 * u * s * s)
      .addScaledVector(f.land, s * s * s);
  };

  const stackTurn = new THREE.Quaternion().setFromAxisAngle(UP, Math.PI / 2);
  function posePrint(mesh: THREE.Mesh, f: Flight, p: number) {
    const t = p - f.launch;
    if (t < 0) {
      // Still in the camera: moves with it as it turns and jolts.
      mesh.position.copy(f.stack).applyMatrix4(instant.body.matrixWorld);
      instant.body.getWorldQuaternion(mesh.quaternion).multiply(stackTurn);
    } else if (t < f.eject) {
      // Shot out of the back, accelerating.
      mesh.position.lerpVectors(f.start, f.exit, (t / f.eject) ** 2);
      mesh.quaternion.copy(f.q0);
    } else if (t < f.eject + f.fly) {
      const s = (t - f.eject) / f.fly;
      bezier(f, s, mesh.position);
      const e = smooth(s);
      mesh.quaternion.slerpQuaternions(f.q0, f.qEnd, e);
      // Flips happen fast, mid-air: each print leaves face up and lands face up.
      flipQ.setFromAxisAngle(f.flipAxis, Math.PI * 2 * f.flips * smooth(clamp01((s - 0.22) / 0.5)));
      spinQ.setFromAxisAngle(UP, Math.PI * 2 * f.spin * e);
      mesh.quaternion.premultiply(spinQ).multiply(flipQ);
    } else {
      // Touch down, a small hop, then a skid that eases into place with a dying wobble.
      const u = clamp01((t - f.eject - f.fly) / f.slide);
      mesh.position.lerpVectors(f.land, f.home, outCubic(u));
      mesh.position.y = f.home.y + (u < 0.4 ? 0.09 * Math.sin((Math.PI * u) / 0.4) * (1 - u) : 0);
      spinQ.setFromAxisAngle(UP, 0.28 * (1 - u) ** 2 * Math.sin(u * 11));
      mesh.quaternion.copy(f.qEnd).premultiply(spinQ);
    }
  }

  function render(p: number) {
    if (!layout) return;
    // The camera: turns its back on you; jolts as the prints burst out; door drops open, snaps shut; then it
    // hops backwards off the table, quicker with every hop, with a little waddle.
    const leave = seg(p, EXIT[0], EXIT[1]);
    instant.root.position.lerpVectors(cameraHome, cameraGone, leave ** 1.8);
    instant.root.position.y = leave > 0 && leave < 1 ? 0.12 * Math.abs(Math.sin(Math.PI * 4 * leave)) : 0;
    instant.root.visible = leave < 1;
    instant.root.rotation.y = turnFrom + (turnTo - turnFrom) * inOut(seg(p, TURN[0], TURN[1])) + 0.2 * Math.sin(Math.PI * 4 * leave) * (1 - leave);
    const press = Math.exp(-(((p - (FLASH - 0.006)) / 0.006) ** 2));
    instant.shutter.position.z = BODY.d / 2 + 0.04 - 0.028 * press;
    const flash = flashAt(p);
    instant.flashLens.emissiveIntensity = 7 * flash;
    instant.flashLight.intensity = 80 * flash;
    const open = outBack(seg(p, OPEN[0], OPEN[1])) * (1 - inOut(seg(p, CLOSE[0], CLOSE[1])));
    instant.hinge.rotation.x = DOOR_OPEN * open;
    const jolt = seg(p, BURST, BURST + 0.07);
    instant.body.position.z = 0.12 * Math.sin(Math.PI * jolt) * (1 - jolt) ** 1.5;
    instant.body.position.y = jolt < 0.3 ? 0.06 * Math.sin((Math.PI * jolt) / 0.3) : 0;
    instant.root.updateMatrixWorld(true);

    printMeshes.forEach((mesh, i) => flights[i] && posePrint(mesh, flights[i], p));

    const settle = smooth(seg(p, SETTLE[0], SETTLE[1]));
    const lit = 1 - settle;
    lamp.intensity = 420 * lit;
    fill.intensity = 0.45 * lit;
    rim.intensity = 0.5 * lit;
    scene.environmentIntensity = 0.32 * lit;
    const fog = scene.fog as THREE.Fog;
    fog.near = 10 + 400 * settle;
    fog.far = 34 + 400 * settle;
    woodMaterial.color.setScalar(lit);
    woodMaterial.emissiveIntensity = settle;
    for (const front of fronts) {
      front.color.setScalar(lit);
      front.emissiveIntensity = settle;
    }
    shadowMaterial.opacity = settle;

    const { position, target, elev } = viewAt(p, camera.position);
    camera.fov = view.fov(p);
    camera.updateProjectionMatrix();
    // Over the top, "up" on screen becomes the far edge of the table.
    const over = smooth(clamp01((elev - 1.2) / (Math.PI / 2 - 1.2)));
    camera.up.set(0, 1 - over, -over).normalize();
    camera.position.copy(position);
    // A short, dying shudder the moment the prints burst out.
    const shake = seg(p, BURST, BURST + 0.035);
    if (shake > 0 && shake < 1) {
      const amount = 0.035 * (1 - shake) ** 2;
      camera.position.x += amount * Math.sin(shake * 97);
      camera.position.y += amount * Math.sin(shake * 131 + 1.3);
    }
    camera.lookAt(target);
    lamp.target.position.set(target.x * 0.5, 0, target.z * 0.5);
    renderer.render(scene, camera);
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
    pmrem.dispose();
    renderer.dispose();
  }

  return { setLayout, render, ready, dispose };
}

export type GalleryScene = ReturnType<typeof createGalleryScene>;
