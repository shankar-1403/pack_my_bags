// Paints live DOM (backgrounds, gradients, borders, images, svg, text) onto a canvas at its on-screen geometry,
// so the laptop screen can show a pixel-faithful copy of the hero it hands off to.

type Box = { x: number; y: number; w: number; h: number };
type Origin = { x: number; y: number };

export type CaptureTarget = { element: Element; origin: Origin };

export async function captureTargets(targets: CaptureTarget[], width: number, height: number, scale: number) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  for (const target of targets) await paint(ctx, target.element, target.origin);
  return canvas;
}

function visible(color: string) {
  return !(color === "transparent" || /rgba\(.*,\s*0\)$/.test(color) || /\/\s*0\)$/.test(color));
}

function radii(style: CSSStyleDeclaration, box: Box) {
  const max = Math.min(box.w, box.h) / 2;
  return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map((value) => {
    const n = parseFloat(value) || 0;
    return Math.min(max, value.endsWith("%") ? (n / 100) * Math.min(box.w, box.h) : n);
  });
}

function shape(ctx: CanvasRenderingContext2D, box: Box, r: number[]) {
  ctx.beginPath();
  if (r.some(Boolean)) ctx.roundRect(box.x, box.y, box.w, box.h, r);
  else ctx.rect(box.x, box.y, box.w, box.h);
}

function splitTop(value: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function paintGradient(ctx: CanvasRenderingContext2D, image: string, box: Box, r: number[]) {
  const match = image.match(/^linear-gradient\((.*)\)$/);
  if (!match) return;
  const parts = splitTop(match[1]);
  let direction = "to bottom";
  if (/^(to |[-\d.]+deg)/.test(parts[0])) direction = parts.shift()!.replace(/\s+in\s+\w+.*$/, "");
  const [x0, y0, x1, y1] =
    direction === "to right" ? [box.x, 0, box.x + box.w, 0]
    : direction === "to left" ? [box.x + box.w, 0, box.x, 0]
    : direction === "to top" ? [0, box.y + box.h, 0, box.y]
    : [0, box.y, 0, box.y + box.h];
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  parts.forEach((part, i) => {
    const stop = part.match(/^(.*\S)\s+(-?[\d.]+)%$/);
    const color = stop ? stop[1] : part;
    const at = stop ? parseFloat(stop[2]) / 100 : parts.length > 1 ? i / (parts.length - 1) : 0;
    try {
      gradient.addColorStop(Math.min(1, Math.max(0, at)), color);
    } catch {}
  });
  ctx.fillStyle = gradient;
  shape(ctx, box, r);
  ctx.fill();
}

async function paintImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, box: Box, style: CSSStyleDeclaration, r: number[]) {
  if (!img.complete || !img.naturalWidth) await img.decode().catch(() => {});
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return;
  ctx.save();
  shape(ctx, box, r);
  ctx.clip();
  if (style.objectFit === "cover") {
    const s = Math.max(box.w / nw, box.h / nh);
    ctx.drawImage(img, box.x + (box.w - nw * s) / 2, box.y + (box.h - nh * s) / 2, nw * s, nh * s);
  } else ctx.drawImage(img, box.x, box.y, box.w, box.h);
  ctx.restore();
}

async function paintSvg(ctx: CanvasRenderingContext2D, svg: SVGSVGElement, box: Box, style: CSSStyleDeclaration) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(box.w));
  clone.setAttribute("height", String(box.h));
  clone.setAttribute("style", `color:${style.color}`);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  await img.decode().catch(() => {});
  if (img.naturalWidth) ctx.drawImage(img, box.x, box.y, box.w, box.h);
}

function paintBorders(ctx: CanvasRenderingContext2D, style: CSSStyleDeclaration, box: Box, r: number[]) {
  const widths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map((v) => parseFloat(v) || 0);
  const colors = [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor];
  if (widths.every((w) => w === widths[0]) && widths[0] > 0 && visible(colors[0])) {
    const w = widths[0];
    ctx.lineWidth = w;
    ctx.strokeStyle = colors[0];
    shape(ctx, { x: box.x + w / 2, y: box.y + w / 2, w: box.w - w, h: box.h - w }, r.map((v) => Math.max(0, v - w / 2)));
    ctx.stroke();
    return;
  }
  const sides: Box[] = [
    { x: box.x, y: box.y, w: box.w, h: widths[0] },
    { x: box.x + box.w - widths[1], y: box.y, w: widths[1], h: box.h },
    { x: box.x, y: box.y + box.h - widths[2], w: box.w, h: widths[2] },
    { x: box.x, y: box.y, w: widths[3], h: box.h },
  ];
  sides.forEach((side, i) => {
    if (widths[i] > 0 && visible(colors[i])) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(side.x, side.y, side.w, side.h);
    }
  });
}

function paintText(ctx: CanvasRenderingContext2D, node: Text, style: CSSStyleDeclaration, origin: Origin) {
  const text = node.textContent ?? "";
  if (!text.trim()) return;
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
  ctx.textBaseline = "alphabetic";
  const upper = style.textTransform === "uppercase";
  const range = document.createRange();
  const words = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = words.exec(text))) {
    range.setStart(node, match.index);
    range.setEnd(node, match.index + match[0].length);
    const rect = range.getBoundingClientRect();
    if (!rect.width) continue;
    const word = upper ? match[0].toUpperCase() : match[0];
    const metrics = ctx.measureText(word);
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;
    ctx.fillText(word, rect.left - origin.x, rect.top - origin.y + (rect.height - (ascent + descent)) / 2 + ascent);
  }
}

async function paint(ctx: CanvasRenderingContext2D, element: Element, origin: Origin) {
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return;
  const rect = element.getBoundingClientRect();
  const box = { x: rect.left - origin.x, y: rect.top - origin.y, w: rect.width, h: rect.height };
  const r = radii(style, box);

  ctx.save();
  ctx.globalAlpha *= Number(style.opacity);
  if (visible(style.backgroundColor)) {
    ctx.fillStyle = style.backgroundColor;
    shape(ctx, box, r);
    ctx.fill();
  }
  if (style.backgroundImage.startsWith("linear-gradient")) paintGradient(ctx, style.backgroundImage, box, r);

  if (element instanceof HTMLImageElement) {
    await paintImage(ctx, element, box, style, r);
    ctx.restore();
    return;
  }
  if (element instanceof SVGSVGElement) {
    await paintSvg(ctx, element, box, style);
    ctx.restore();
    return;
  }

  paintBorders(ctx, style, box, r);
  if (style.overflow !== "visible") {
    shape(ctx, box, r);
    ctx.clip();
  }
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) paintText(ctx, child as Text, style, origin);
    else if (child instanceof Element) await paint(ctx, child, origin);
  }
  ctx.restore();
}
