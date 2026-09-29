import * as THREE from "three";

const PINE = "#1b3a33";
const CLAY = "#d4652f";
const CREAM = "#fbf8f3";
const GILT = "#d9bb86";

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

export const fonts = () => ({
  serif: cssFont("--font-fraunces", "Georgia, serif"),
  sans: cssFont("--font-jakarta", "system-ui, sans-serif"),
});

function sheet(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, g: canvas.getContext("2d")! };
}

function texture(canvas: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, count: number, rgb: string, alpha: number, size = 1.5) {
  for (let i = 0; i < count; i++) {
    g.fillStyle = `rgba(${rgb},${Math.random() * alpha})`;
    g.fillRect(Math.random() * w, Math.random() * h, size, size);
  }
}

/** Two-by-two limestone tiles; one repeat covers 2.4m of floor. */
export function floorTexture(repeat: number) {
  const { canvas, g } = sheet(1024, 1024);
  const tones = ["#ebe4d7", "#e6ded0", "#e9e1d4", "#e3dacb"];
  tones.forEach((tone, i) => {
    g.fillStyle = tone;
    g.fillRect((i % 2) * 512, Math.floor(i / 2) * 512, 512, 512);
  });
  speckle(g, 1024, 1024, 14000, "120,100,78", 0.05);
  g.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    g.strokeStyle = `rgba(150,128,102,${0.05 + Math.random() * 0.06})`;
    g.lineWidth = 0.6 + Math.random() * 1.2;
    g.beginPath();
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    g.moveTo(x, y);
    g.bezierCurveTo(x + 120, y + 40 - Math.random() * 80, x + 220, y - 60, x + 320 + Math.random() * 120, y + Math.random() * 90);
    g.stroke();
  }
  g.fillStyle = "rgba(170,152,128,0.55)";
  for (const p of [0, 512]) {
    g.fillRect(0, p, 1024, 2);
    g.fillRect(p, 0, 2, 1024);
  }
  return texture(canvas, [repeat, repeat]);
}

/** Case lining: a quiet repeat of the Pack my bags mark. */
export function liningTexture() {
  const { canvas, g } = sheet(256, 256);
  g.fillStyle = "#eee3d1";
  g.fillRect(0, 0, 256, 256);
  speckle(g, 256, 256, 1600, "150,120,90", 0.05, 1);
  const mark = (x: number, y: number) => {
    g.save();
    g.translate(x, y);
    g.strokeStyle = "rgba(184,150,112,0.55)";
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(-14, -14, 28, 28, 8);
    g.stroke();
    g.beginPath();
    g.moveTo(-8, 7);
    g.bezierCurveTo(-2, 6, 1, -3, 9, -6);
    g.stroke();
    g.fillStyle = "rgba(212,101,47,0.55)";
    g.beginPath();
    g.arc(7, -5, 2.4, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  mark(64, 64);
  mark(192, 192);
  return texture(canvas, [1, 1]);
}

export function knitTexture() {
  const { canvas, g } = sheet(256, 256);
  g.fillStyle = "#e9e1d0";
  g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 8) {
    for (let y = 0; y < 256; y += 10) {
      g.fillStyle = "rgba(160,140,110,0.22)";
      g.beginPath();
      g.ellipse(x + 4, y + 5, 2.6, 4.6, 0.35 * (x % 16 ? 1 : -1), 0, Math.PI * 2);
      g.fill();
    }
  }
  speckle(g, 256, 256, 1200, "255,255,255", 0.25, 1);
  return texture(canvas, [1, 1]);
}

export function oxfordTexture() {
  const { canvas, g } = sheet(128, 128);
  g.fillStyle = "#d3dde3";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 3) {
    g.fillStyle = "rgba(255,255,255,0.28)";
    g.fillRect(i, 0, 1, 128);
    g.fillStyle = "rgba(90,110,125,0.10)";
    g.fillRect(0, i, 128, 1);
  }
  return texture(canvas, [1, 1]);
}

/** Laptop deck: starlight aluminium, recessed keys, glass trackpad. */
export function keyboardTexture(width: number, depth: number) {
  const px = 2000;
  const w = px;
  const h = Math.round(px * (depth / width));
  const { canvas, g } = sheet(w, h);
  g.fillStyle = "#d9d1c4";
  g.fillRect(0, 0, w, h);
  const s = w / width;
  const well = { x: 0.018 * s, y: 0.012 * s, w: w - 0.036 * s, h: 0.108 * s };
  g.fillStyle = "#c6bdae";
  g.beginPath();
  g.roundRect(well.x, well.y, well.w, well.h, 0.004 * s);
  g.fill();
  const rows = [13, 14, 14, 13, 12, 9];
  const gap = 0.0022 * s;
  rows.forEach((count, r) => {
    const rowH = r === 0 ? 0.009 * s : 0.0152 * s;
    const y = well.y + gap + (r === 0 ? 0 : 0.009 * s + gap + (r - 1) * (0.0152 * s + gap));
    const keyW = (well.w - gap * (count + 1)) / count;
    for (let k = 0; k < count; k++) {
      const x = well.x + gap + k * (keyW + gap);
      g.fillStyle = "#26272a";
      g.beginPath();
      g.roundRect(x, y, keyW, rowH, 0.0018 * s);
      g.fill();
    }
  });
  const padW = 0.11 * s;
  const padH = h - well.y - well.h - 0.03 * s;
  g.fillStyle = "#d1c8ba";
  g.strokeStyle = "rgba(120,110,95,0.35)";
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect((w - padW) / 2, well.y + well.h + 0.012 * s, padW, padH, 0.006 * s);
  g.fill();
  g.stroke();
  return texture(canvas);
}

export function passportTexture() {
  const { serif, sans } = fonts();
  const { canvas, g } = sheet(352, 500);
  g.fillStyle = "#1e2a44";
  g.fillRect(0, 0, 352, 500);
  speckle(g, 352, 500, 4000, "255,255,255", 0.05, 1);
  g.strokeStyle = GILT;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(176, 230, 58, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 1.6;
  for (const k of [-1, 1]) {
    g.beginPath();
    g.ellipse(176, 230, 26, 58, 0, Math.PI / 2 * k, Math.PI / 2 * k + Math.PI);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(118, 230);
  g.lineTo(234, 230);
  g.stroke();
  g.fillStyle = GILT;
  g.textAlign = "center";
  g.font = `600 30px ${sans}`;
  g.letterSpacing = "8px";
  g.fillText("PASSPORT", 180, 380);
  g.font = `italic 22px ${serif}`;
  g.letterSpacing = "0px";
  g.fillText("travel document", 176, 90);
  return texture(canvas);
}

export function boardingPassTexture() {
  const { serif, sans } = fonts();
  const { canvas, g } = sheet(1000, 400);
  g.fillStyle = "#f7f1e6";
  g.fillRect(0, 0, 1000, 400);
  g.fillStyle = PINE;
  g.fillRect(0, 0, 1000, 70);
  g.fillStyle = CREAM;
  g.font = `600 26px ${sans}`;
  g.letterSpacing = "6px";
  g.fillText("PACK MY BAGS", 36, 46);
  g.textAlign = "right";
  g.fillStyle = GILT;
  g.fillText("BOARDING PASS", 964, 46);
  g.textAlign = "left";
  g.fillStyle = "#17140f";
  g.font = `500 96px ${serif}`;
  g.letterSpacing = "0px";
  g.fillText("DEL", 36, 200);
  g.fillText("IXL", 330, 200);
  g.fillStyle = CLAY;
  g.font = `400 60px ${sans}`;
  g.fillText("→", 232, 190);
  g.fillStyle = "#6f675c";
  g.font = `500 22px ${sans}`;
  g.letterSpacing = "4px";
  g.fillText("DELHI", 40, 240);
  g.fillText("LEH · LADAKH", 334, 240);
  const cells = [
    ["GROUP", "01"],
    ["SEAT", "3A"],
    ["GATE", "14"],
    ["BOARDS", "06:40"],
  ];
  cells.forEach(([label, value], i) => {
    const x = 40 + i * 150;
    g.fillStyle = "#8a8174";
    g.font = `600 18px ${sans}`;
    g.fillText(label, x, 300);
    g.fillStyle = "#17140f";
    g.font = `600 36px ${sans}`;
    g.letterSpacing = "1px";
    g.fillText(value, x, 344);
    g.letterSpacing = "4px";
  });
  g.setLineDash([8, 8]);
  g.strokeStyle = "rgba(23,20,15,0.25)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(700, 90);
  g.lineTo(700, 380);
  g.stroke();
  g.setLineDash([]);
  for (let x = 740; x < 960; x += 4) {
    g.fillStyle = "#17140f";
    g.fillRect(x, 110, Math.random() > 0.5 ? 2 : 3.5, 220);
  }
  return texture(canvas);
}

/** Round clay sticker for the shell and the laptop lid. */
export function stickerTexture() {
  const { sans } = fonts();
  const { canvas, g } = sheet(512, 512);
  g.fillStyle = CLAY;
  g.beginPath();
  g.arc(256, 256, 250, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(251,248,243,0.85)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(256, 256, 214, 0, Math.PI * 2);
  g.stroke();
  // Top arc reads clockwise, bottom arc counter-clockwise, so both stay upright.
  const ring = (text: string, radius: number, bottom: boolean) => {
    const chars = [...text];
    g.font = `700 40px ${sans}`;
    g.fillStyle = CREAM;
    g.textAlign = "center";
    g.textBaseline = "middle";
    chars.forEach((ch, i) => {
      const k = i - (chars.length - 1) / 2;
      g.save();
      g.translate(256, 256);
      g.rotate(bottom ? -k * 0.2 : k * 0.2);
      g.translate(0, bottom ? radius : -radius);
      g.fillText(ch, 0, 0);
      g.restore();
    });
  };
  ring("PACK MY BAGS", 172, false);
  ring("GROUP TRIPS", 172, true);
  g.save();
  g.translate(256, 256);
  g.fillStyle = CREAM;
  g.beginPath();
  g.roundRect(-58, -58, 116, 116, 34);
  g.fill();
  g.strokeStyle = PINE;
  g.lineWidth = 8;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-34, 30);
  g.bezierCurveTo(-8, 26, 4, -12, 36, -24);
  g.stroke();
  g.fillStyle = CLAY;
  g.beginPath();
  g.arc(30, -22, 10, 0, Math.PI * 2);
  g.fill();
  g.restore();
  return texture(canvas);
}

/** Engraved plate / leather patch text. */
export function plateTexture(text: string, background: string, ink: string) {
  const { sans } = fonts();
  const { canvas, g } = sheet(512, 128);
  g.fillStyle = background;
  g.fillRect(0, 0, 512, 128);
  speckle(g, 512, 128, 1500, "255,255,255", 0.08, 1);
  g.fillStyle = ink;
  g.font = `700 44px ${sans}`;
  g.letterSpacing = "12px";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 262, 68);
  return texture(canvas);
}

/** Compression-panel mesh: diamonds with a transparent ground. */
export function meshPanelTexture() {
  const { canvas, g } = sheet(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(38,56,50,0.9)";
  g.lineWidth = 2.2;
  for (let i = -256; i < 512; i += 16) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 256, 256);
    g.stroke();
    g.beginPath();
    g.moveTo(i + 256, 0);
    g.lineTo(i, 256);
    g.stroke();
  }
  return texture(canvas, [1, 1]);
}

/** Soft contact shadow. */
export function blobTexture() {
  const { canvas, g } = sheet(256, 256);
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(canvas);
  return t;
}
