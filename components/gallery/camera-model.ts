import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// An instant camera in the classic boxy mould, in print widths (88 mm): body 150 × 97 × 112 mm. Origin at
// the middle of its footprint on the table, front (lens) toward +z. The back is a door hinged along its
// bottom edge; behind it the film tray holds the stack of prints, lying flat, long side across the body.

export const BODY = { w: 1.7, h: 1.02, d: 1.27, foot: 0.03 };
/** Where the print stack sits inside the body (camera frame): first print's centre, and the step up per print. */
export const STACK = { y: BODY.foot + 0.15, z: -0.13, step: 0.0125 };
/** The door's fully open angle: it swings down until its top edge rests on the table. */
export const DOOR_OPEN = -(Math.PI / 2 + Math.asin((BODY.foot + 0.07) / 0.92));

const TOP = BODY.foot + BODY.h;
const FRONT = BODY.d / 2;

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

function sheet(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, color = true) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Fine speckle for an orange-peel plastic finish. */
function grain() {
  const t = sheet(
    256,
    256,
    (g) => {
      const img = g.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 118 + Math.random() * 20;
        img.data.set([v, v, v, 255], i);
      }
      g.putImageData(img, 0, 0);
    },
    false,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

export function buildInstantCamera() {
  const peel = grain();
  const shell = new THREE.MeshPhysicalMaterial({ color: "#efe9de", roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.35, bumpMap: peel, bumpScale: 0.6 });
  const black = new THREE.MeshPhysicalMaterial({ color: "#171717", roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5, bumpMap: peel, bumpScale: 0.6 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#0e0e0e", roughness: 0.95 });
  const metal = new THREE.MeshStandardMaterial({ color: "#d4d0c8", metalness: 1, roughness: 0.22 });
  const orange = new THREE.MeshPhysicalMaterial({ color: "#f94f18", roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#0a1013", roughness: 0.03, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8 });
  const coating = new THREE.MeshPhysicalMaterial({
    color: "#0b171c",
    roughness: 0.12,
    iridescence: 1,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [180, 520],
    envMapIntensity: 1.4,
  });
  const cavity = new THREE.MeshBasicMaterial({ color: "#0a0a0a", side: THREE.BackSide });
  const solid = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  const root = new THREE.Group();
  // Everything that jolts when the prints burst out.
  const body = new THREE.Group();
  root.add(body);

  // Shell: a solid front plate, and behind it a hollow frame whose open back the door closes.
  const frontPlate = solid(new RoundedBoxGeometry(BODY.w, BODY.h, 0.3, 5, 0.085), shell);
  frontPlate.position.set(0, BODY.foot + BODY.h / 2, FRONT - 0.15);
  body.add(frontPlate);
  const bevel = 0.028;
  const rim = roundedRect(BODY.w - 2 * bevel, BODY.h - 2 * bevel, 0.06);
  rim.holes.push(roundedRect(1.44 + 2 * bevel, 0.8 + 2 * bevel, 0.04));
  const rear = solid(
    new THREE.ExtrudeGeometry(rim, { depth: BODY.d - 0.3 - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 10 }),
    shell,
  );
  rear.position.set(0, BODY.foot + BODY.h / 2, -FRONT + bevel);
  body.add(rear);
  const inside = new THREE.Mesh(new THREE.BoxGeometry(1.43, 0.79, 0.99), cavity);
  inside.position.set(0, BODY.foot + BODY.h / 2, -FRONT + 0.49);
  body.add(inside);
  const tray = solid(new THREE.BoxGeometry(1.36, 0.03, 0.96), black);
  tray.position.set(0, STACK.y - 0.022, STACK.z);
  body.add(tray);

  // A raised viewfinder hump along the top, and the strap lugs on the sides.
  const hump = solid(new RoundedBoxGeometry(0.38, 0.08, 0.62, 3, 0.035), shell);
  hump.position.set(-0.52, TOP + 0.02, 0.16);
  body.add(hump);
  for (const side of [-1, 1]) {
    const lug = solid(new THREE.TorusGeometry(0.045, 0.013, 10, 28), metal);
    lug.position.set(side * (BODY.w / 2 + 0.03), TOP - 0.2, -0.32);
    lug.rotation.y = Math.PI / 2;
    body.add(lug);
  }
  for (const [x, z] of [
    [-0.68, -0.5],
    [0.68, -0.5],
    [-0.68, 0.5],
    [0.68, 0.5],
  ]) {
    const foot = solid(new THREE.CylinderGeometry(0.05, 0.056, BODY.foot, 20), rubber);
    foot.position.set(x, BODY.foot / 2, z);
    body.add(foot);
  }

  // Front: lens housing, lens, viewfinder window, flash, shutter button, colour stripe, print slot, nameplate.
  const lensX = -0.08;
  const lensY = BODY.foot + 0.46;
  const housing = solid(new RoundedBoxGeometry(0.88, 0.82, 0.2, 4, 0.08), black);
  housing.position.set(lensX, lensY, FRONT + 0.08);
  body.add(housing);
  const barrel = solid(new THREE.CylinderGeometry(0.31, 0.325, 0.12, 72), black);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(lensX, lensY, FRONT + 0.24);
  body.add(barrel);
  const knurl = sheet(1024, 16, (g) => {
    for (let x = 0; x < 1024; x += 8) {
      g.fillStyle = x % 16 ? "#2a2a2a" : "#0d0d0d";
      g.fillRect(x, 0, 8, 16);
    }
  });
  const focus = solid(new THREE.CylinderGeometry(0.33, 0.33, 0.05, 96, 1, true), new THREE.MeshStandardMaterial({ map: knurl, roughness: 0.7 }));
  focus.rotation.x = Math.PI / 2;
  focus.position.set(lensX, lensY, FRONT + 0.22);
  body.add(focus);
  const trim = solid(new THREE.TorusGeometry(0.286, 0.017, 14, 96), metal);
  trim.position.set(lensX, lensY, FRONT + 0.3);
  body.add(trim);
  const ringText = sheet(1024, 1024, (g) => {
    g.fillStyle = "#121212";
    g.fillRect(0, 0, 1024, 1024);
    g.translate(512, 512);
    g.fillStyle = "#cfcac0";
    g.font = "600 44px system-ui, sans-serif";
    g.textAlign = "center";
    const text = "PACK MY BAGS · INSTANT LENS 106 mm · f/14 · ";
    const step = (Math.PI * 2) / text.length;
    for (let i = 0; i < text.length; i++) {
      g.save();
      g.rotate(i * step);
      g.translate(0, -430);
      g.fillText(text[i], 0, 0);
      g.restore();
    }
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.205, 0.27, 96), new THREE.MeshStandardMaterial({ map: ringText, roughness: 0.6 }));
  ring.position.set(lensX, lensY, FRONT + 0.301);
  body.add(ring);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.205, 64), new THREE.MeshBasicMaterial({ color: "#050607" }));
  pupil.position.set(lensX, lensY, FRONT + 0.27);
  body.add(pupil);
  const element = new THREE.Mesh(new THREE.CircleGeometry(0.16, 64), coating);
  element.position.set(lensX, lensY, FRONT + 0.282);
  body.add(element);
  // The front glass: a shallow dome catching the lamp.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 72, 20, 0, Math.PI * 2, 0, 0.4), glass);
  dome.rotation.x = Math.PI / 2;
  dome.position.set(lensX, lensY, FRONT + 0.3 - 0.52 + 0.035);
  body.add(dome);

  const finder = solid(new RoundedBoxGeometry(0.2, 0.13, 0.03, 2, 0.02), glass);
  finder.position.set(-0.6, TOP - 0.16, FRONT + 0.005);
  body.add(finder);

  const flashFrame = solid(new RoundedBoxGeometry(0.52, 0.24, 0.04, 2, 0.03), black);
  flashFrame.position.set(0.52, TOP - 0.19, FRONT + 0.01);
  body.add(flashFrame);
  const ridges = sheet(256, 128, (g) => {
    for (let x = 0; x < 256; x += 8) {
      const v = 228 + (x % 16 ? 18 : -10);
      g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      g.fillRect(x, 0, 8, 128);
    }
  });
  const flashLens = new THREE.MeshPhysicalMaterial({ map: ridges, roughness: 0.25, clearcoat: 0.6, emissive: new THREE.Color("#fff6ea"), emissiveIntensity: 0 });
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.18), flashLens);
  flash.position.set(0.52, TOP - 0.19, FRONT + 0.031);
  body.add(flash);
  const flashLight = new THREE.PointLight("#fff4e6", 0, 9, 1.6);
  flashLight.position.set(0.52, TOP - 0.19, FRONT + 0.35);
  body.add(flashLight);

  const shutterBase = solid(new THREE.CylinderGeometry(0.098, 0.098, 0.02, 40), black);
  shutterBase.rotation.x = Math.PI / 2;
  shutterBase.position.set(0.56, BODY.foot + 0.34, FRONT + 0.01);
  body.add(shutterBase);
  const shutter = solid(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 40), orange);
  shutter.rotation.x = Math.PI / 2;
  shutter.position.set(0.56, BODY.foot + 0.34, FRONT + 0.04);
  body.add(shutter);

  ["#f94f18", "#f5a524", "#e9dfc9", "#1b3a33"].forEach((color, i) => {
    const band = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.64), new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.5 }));
    band.position.set(-0.73 + i * 0.036, BODY.foot + 0.5, FRONT + 0.0015);
    body.add(band);
  });

  const slot = solid(new RoundedBoxGeometry(1.22, 0.07, 0.025, 2, 0.012), black);
  slot.position.set(-0.04, BODY.foot + 0.075, FRONT + 0.005);
  body.add(slot);
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.012), new THREE.MeshBasicMaterial({ color: "#020202" }));
  slit.position.set(-0.04, BODY.foot + 0.075, FRONT + 0.0185);
  body.add(slit);

  const nameplate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.08),
    new THREE.MeshPhysicalMaterial({
      map: sheet(512, 88, (g) => {
        g.clearRect(0, 0, 512, 88);
        g.fillStyle = "#1b3a33";
        g.font = "700 58px system-ui, sans-serif";
        g.textBaseline = "middle";
        g.fillText("packmy", 8, 46);
        const w = g.measureText("packmy").width;
        g.fillStyle = "#f94f18";
        g.fillText("bags", 8 + w, 46);
      }),
      transparent: true,
      roughness: 0.4,
    }),
  );
  nameplate.position.set(-0.08, TOP - 0.115, FRONT + 0.0016);
  body.add(nameplate);

  // Back door, hinged along its bottom edge: ridged grip, latch, film counter, and its own label.
  const hinge = new THREE.Group();
  hinge.position.set(0, BODY.foot + 0.07, -FRONT);
  body.add(hinge);
  const door = solid(new RoundedBoxGeometry(1.6, 0.92, 0.045, 3, 0.02), shell);
  door.position.set(0, 0.46, -0.0225);
  hinge.add(door);
  for (let i = 0; i < 7; i++) {
    const ridge = solid(new RoundedBoxGeometry(1.1, 0.013, 0.012, 1, 0.005), shell);
    ridge.position.set(0, 0.68 + i * 0.025, -0.048);
    hinge.add(ridge);
  }
  const latch = solid(new RoundedBoxGeometry(0.18, 0.05, 0.025, 2, 0.012), orange);
  latch.position.set(0, 0.88, -0.05);
  hinge.add(latch);
  const back = sheet(512, 160, (g) => {
    g.clearRect(0, 0, 512, 160);
    g.fillStyle = "#9b958a";
    g.font = "600 30px system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText("PACK MY BAGS  ·  INSTANT", 256, 60);
    g.font = "500 22px system-ui, sans-serif";
    g.fillText("OPEN ▾  TO LOAD FILM", 256, 110);
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), new THREE.MeshStandardMaterial({ map: back, transparent: true, roughness: 0.5 }));
  label.position.set(0, 0.36, -0.0458);
  label.rotation.y = Math.PI;
  hinge.add(label);
  const counter = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.1),
    new THREE.MeshPhysicalMaterial({
      map: sheet(150, 100, (g) => {
        g.fillStyle = "#0b0b0b";
        g.fillRect(0, 0, 150, 100);
        g.fillStyle = "#f94f18";
        g.font = "700 64px ui-monospace, monospace";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("10", 75, 54);
      }),
      roughness: 0.1,
      clearcoat: 1,
    }),
  );
  counter.position.set(-0.55, 0.2, -0.0458);
  counter.rotation.y = Math.PI;
  hinge.add(counter);

  // A woven wrist strap from the right lug, slumped onto the table in a loose loop.
  const strapPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(BODY.w / 2 + 0.05, TOP - 0.2, -0.32),
    new THREE.Vector3(BODY.w / 2 + 0.16, TOP - 0.42, -0.36),
    new THREE.Vector3(BODY.w / 2 + 0.3, 0.05, -0.22),
    new THREE.Vector3(BODY.w / 2 + 0.42, 0.022, 0.12),
    new THREE.Vector3(BODY.w / 2 + 0.3, 0.022, 0.5),
    new THREE.Vector3(BODY.w / 2 + 0.02, 0.022, 0.66),
  ]);
  const weave = sheet(64, 256, (g) => {
    g.fillStyle = "#1b3a33";
    g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 6) {
      g.fillStyle = y % 12 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.18)";
      g.fillRect(0, y, 64, 3);
    }
  });
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(1, 18);
  const strap = solid(new THREE.TubeGeometry(strapPath, 120, 0.024, 12, false), new THREE.MeshStandardMaterial({ map: weave, roughness: 0.85 }));
  body.add(strap);
  const toggle = solid(new THREE.CapsuleGeometry(0.035, 0.05, 6, 16), orange);
  toggle.position.copy(strapPath.getPoint(1));
  toggle.rotation.z = Math.PI / 2;
  body.add(toggle);

  return { root, body, hinge, shutter, flashLens, flashLight };
}

export type InstantCamera = ReturnType<typeof buildInstantCamera>;
