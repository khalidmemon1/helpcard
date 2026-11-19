import { encode } from "uqr";
import { THEMES, WORDS, type Card } from "./card";
import { CROSS, ICONS } from "./icons";

/**
 * The lanyard badge's two faces, drawn on a canvas in the layout of the owner's Framer badge: brand top-left, big
 * word, name bottom-left, details bottom-right, a thin inner frame, small "+" marks. The 3D hero uses them as
 * textures and the print sheet uses the same pictures, so the printed badge matches what swings on screen.
 * 54 × 85.6 mm at ~500 dpi. The hole is cut out (transparent) so the clip shows through.
 */
export const ART = { w: 1080, h: 1712 };
const R = 70; // corner radius
const FONT = '"General Sans", system-ui, sans-serif';
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

export type Side = "front" | "back";

export async function drawBadge(card: Card, url: string, photo: HTMLImageElement | null, side: Side): Promise<HTMLCanvasElement> {
  await Promise.all([document.fonts.load(`500 160px ${FONT}`), document.fonts.load(`600 40px ${FONT}`)]).catch(() => {});
  const c = document.createElement("canvas");
  c.width = ART.w;
  c.height = ART.h;
  const g = c.getContext("2d")!;
  const t = THEMES[card.theme];
  const usePhoto = side === "front" && !!photo;
  const ink = usePhoto ? "#ffffff" : t.ink;
  const w = WORDS[card.lang];

  // card shape
  g.save();
  g.beginPath();
  g.roundRect(0, 0, ART.w, ART.h, R);
  g.clip();

  // background: the child's photo, or the theme's sky
  if (usePhoto) {
    cover(g, photo!, ART.w, ART.h);
    const shade = g.createLinearGradient(0, ART.h * 0.45, 0, ART.h);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.6)");
    g.fillStyle = shade;
    g.fillRect(0, 0, ART.w, ART.h);
  } else {
    const sky = g.createLinearGradient(0, 0, ART.w * 0.35, ART.h);
    t.sky.forEach((col, i) => sky.addColorStop(i / (t.sky.length - 1), col));
    g.fillStyle = sky;
    g.fillRect(0, 0, ART.w, ART.h);
    // a faint grid, like the Framer badge
    g.strokeStyle = alpha(ink, 0.07);
    g.lineWidth = 2;
    for (let x = 90; x < ART.w; x += 90) line(g, x, 0, x, ART.h);
    for (let y = 90; y < ART.h; y += 90) line(g, 0, y, ART.w, y);
  }

  // inner frame + "+" marks
  g.strokeStyle = alpha(ink, 0.35);
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(44, 44, ART.w - 88, ART.h - 88, 42);
  g.stroke();
  plus(g, ART.w - 120, 330, ink);
  plus(g, 110, ART.h * 0.52, ink);

  g.fillStyle = ink;
  g.textBaseline = "alphabetic";
  if (side === "front") front(g, card, w, ink, t.accent, usePhoto);
  else back(g, card, url, w, ink);
  g.restore();

  // the hole for the clip
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.roundRect(ART.w / 2 - 105, 74, 210, 46, 23);
  g.fill();
  g.globalCompositeOperation = "source-over";
  return c;
}

function front(g: CanvasRenderingContext2D, card: Card, w: (typeof WORDS)["en"], ink: string, accent: string, usePhoto: boolean) {
  // brand, top-left (two short lines, like "FutureTech / Summit")
  icon(g, CROSS, false, 100, 168, 64, ink);
  g.font = `500 36px ${FONT}`;
  g.fillText("HelpCard", 190, 196);
  g.fillText("Emergency ID", 190, 238);
  g.textAlign = "right";
  g.font = `500 34px ${FONT}`;
  g.fillText("आपातकाल", ART.w - 100, 216);
  g.textAlign = "left";

  // the chosen icon, big, where the Framer badge has its photo (not drawn over a real photo)
  if (!usePhoto) {
    const ic = ICONS[card.avatar] ?? ICONS.star;
    g.globalAlpha = 0.92;
    icon(g, ic.d, "stroke" in ic && ic.stroke, ART.w / 2 - 190, 430, 380, ink);
    g.globalAlpha = 1;
  }

  // big word
  g.font = `500 172px ${FONT}`;
  setSpacing(g, "-6px");
  fit(g, "Emergency", 100, 1190, ART.w - 200);
  setSpacing(g, "0px");

  // name, bottom-left (up to two lines)
  const name = card.name || "Your name";
  g.font = `500 54px ${FONT}`;
  wrap(g, name, 100, 1500, 520, 62, 2);

  // details, bottom-right, right-aligned
  g.textAlign = "right";
  g.font = `500 32px ${FONT}`;
  const first = card.contacts.find((c) => c.phone.trim());
  const rows = [card.blood ? `${w.blood} ${card.blood}` : "", first ? `${w.call} ${first.relation || first.name}` : "", first ? first.phone : ""].filter(Boolean);
  rows.slice(-3).forEach((r, i, a) => g.fillText(r, ART.w - 100, 1560 - (a.length - 1 - i) * 42));
  g.textAlign = "left";
  void accent;
}

function back(g: CanvasRenderingContext2D, card: Card, url: string, w: (typeof WORDS)["en"], ink: string) {
  g.textAlign = "center";
  g.font = `500 70px ${FONT}`;
  setSpacing(g, "-2px");
  g.fillText(w.scan, ART.w / 2, 300);
  setSpacing(g, "0px");
  g.font = `500 36px ${FONT}`;
  g.globalAlpha = 0.75;
  g.fillText(card.lang === "hi" ? "Scan in an emergency" : "आपातकाल में स्कैन करें", ART.w / 2, 358);
  g.globalAlpha = 1;

  // the QR, big, on white
  const size = 700, x = (ART.w - size) / 2, y = 420;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.roundRect(x, y, size, size, 36);
  g.fill();
  const qr = encode(url || " ", { ecc: "M", border: 2 });
  const cell = (size - 40) / qr.size;
  g.fillStyle = "#000000";
  qr.data.forEach((row, r) => row.forEach((on, col) => on && g.fillRect(x + 20 + col * cell, y + 20 + r * cell, Math.ceil(cell), Math.ceil(cell))));

  // what a helper should know first
  g.fillStyle = ink;
  g.textAlign = "left";
  g.font = `500 34px ${FONT}`;
  const notes = [
    card.allergies && `${w.allergies}: ${card.allergies}`,
    card.conditions && `${w.conditions}: ${card.conditions}`,
    card.medicines && `${w.medicines}: ${card.medicines}`,
  ].filter(Boolean) as string[];
  let ty = 1230;
  for (const n of notes.slice(0, 3)) ty = wrap(g, n, 100, ty, ART.w - 200, 44, 2) + 14;

  g.font = `500 26px ${MONO}`;
  setSpacing(g, "4px");
  g.globalAlpha = 0.8;
  g.fillText("IF FOUND // SCAN ME ++++", 100, ART.h - 110);
  g.textAlign = "right";
  g.fillText("CALL 112", ART.w - 100, ART.h - 110);
  g.globalAlpha = 1;
  setSpacing(g, "0px");
  g.textAlign = "left";
}

// ---- small drawing helpers ----------------------------------------------------------------------------------------

function cover(g: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
}
function icon(g: CanvasRenderingContext2D, d: string, stroke: boolean, x: number, y: number, size: number, color: string) {
  g.save();
  g.translate(x, y);
  g.scale(size / 24, size / 24);
  const p = new Path2D(d);
  if (stroke) {
    g.strokeStyle = color;
    g.lineWidth = 2;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.stroke(p);
  } else {
    g.fillStyle = color;
    g.fill(p);
  }
  g.restore();
}
function plus(g: CanvasRenderingContext2D, x: number, y: number, color: string) {
  g.strokeStyle = alpha(color, 0.6);
  g.lineWidth = 3;
  line(g, x - 14, y, x + 14, y);
  line(g, x, y - 14, x, y + 14);
}
function line(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
/** Draws text on one line, shrinking it if it's wider than max. */
function fit(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number) {
  const m = g.measureText(text).width;
  if (m <= max) return g.fillText(text, x, y);
  g.save();
  g.translate(x, y);
  g.scale(max / m, max / m);
  g.fillText(text, 0, 0);
  g.restore();
}
/** Word-wraps into at most `lines` lines (the last one ends in … if cut). Returns the y after the last line. */
function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, lines: number) {
  const words = text.split(/\s+/);
  let cur = "", n = 0;
  for (let i = 0; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (g.measureText(next).width > max && cur) {
      if (n === lines - 1) {
        while (g.measureText(cur + "…").width > max && cur.length) cur = cur.slice(0, -1);
        g.fillText(cur + "…", x, y + n * lh);
        return y + (n + 1) * lh;
      }
      g.fillText(cur, x, y + n * lh);
      n++;
      cur = words[i];
    } else cur = next;
  }
  if (cur) g.fillText(cur, x, y + n * lh);
  return y + (n + 1) * lh;
}
function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function setSpacing(g: CanvasRenderingContext2D, v: string) {
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = v;
}
