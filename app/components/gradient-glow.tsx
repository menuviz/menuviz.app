"use client";

// Ported from GRADIENTOOL (gradientool.com): its generative bar-gradient
// canvas renderer, trimmed to the single linear/mirrored layout used here
// and recolored to the emerald design system. No iframe/embed — this is the
// actual draw pipeline (color-stop resampling in Oklab, bar silhouette,
// shadow/bevel/seam shading, film grain), running on our own canvas and
// re-invoked every animation tick with a slowly drifting hue, the same way
// the original app's "explorer" timeline mutates params and redraws.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { GradientGlowStore } from "./gradient-glow-store";

export type GradientStop = { pos: number; color: string };
export type Direction =
  | "up"
  | "up-right"
  | "right"
  | "down-right"
  | "down"
  | "down-left"
  | "left"
  | "up-left";
export type PeakCount = "one" | "two" | "wave" | "noise";
export type GradMap = "bar" | "field" | "across";

export const DIRECTIONS: Direction[] = ["up", "up-right", "right", "down-right", "down", "down-left", "left", "up-left"];
export const PEAK_COUNTS: PeakCount[] = ["one", "two", "wave", "noise"];
export const GRAD_MAPS: GradMap[] = ["bar", "field", "across"];

type Rgb = [number, number, number];

export interface LayerParams {
  peakCount: PeakCount;
  peakPos: number;
  waveFreq: number;
  curveExp: number;
  widthExp: number;
  mirror: boolean;
  direction: Direction;
  count: number;
  depth: number; // minH
  maxH: number;
  gap: number;
  capRound: number;
  pointness: number;
  jitter: number;
  noiseSeed: number;
  steps: number;
  gradMap: GradMap;
  hueDrift: number;
  hueRotate: number;
  opacity: number;
  stops: GradientStop[];
}

interface GrainLayers {
  fine: HTMLCanvasElement;
  medium: HTMLCanvasElement;
}

interface ShadeParams {
  bgColor: string;
  shadowInk: string;
  margin: number;
  grainIntensity: number;
  shadowStrength: number;
  shadowDepthPx: number;
  edgeSidePx: number;
  edgeFadeFrac: number;
  edgeBaseStrength: number;
  edgeNeighborBoost: number;
  sideLinePx: number;
  sideLineStrength: number;
  grainLayers: GrainLayers | null;
}

/* ---------------------------------------------------------------------
 * Color space (sRGB <-> Oklab) — interpolation happens in Oklab so ramps
 * don't pass through a muddy grey midpoint the way naive RGB lerp does.
 * ------------------------------------------------------------------- */

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToCss([r, g, b]: Rgb): string {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function srgbChannelToLinear(c8: number): number {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, s)) * 255);
}

function rgbToOklab([r, g, b]: Rgb): Rgb {
  const lr = srgbChannelToLinear(r),
    lg = srgbChannelToLinear(g),
    lb = srgbChannelToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    linearChannelToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearChannelToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearChannelToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function lerpColorOklab(rgbA: Rgb, rgbB: Rgb, t: number): Rgb {
  const a = rgbToOklab(rgbA),
    b = rgbToOklab(rgbB);
  return oklabToRgb([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

function rotateHueOklab(rgb: Rgb, degrees: number): Rgb {
  if (!degrees) return rgb;
  const [L, a, b] = rgbToOklab(rgb);
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad),
    sin = Math.sin(rad);
  return oklabToRgb([L, a * cos - b * sin, a * sin + b * cos]);
}

/* ---------------------------------------------------------------------
 * Gradient-stop construction: a small user ramp is resampled into 41
 * dense Oklab-interpolated points.
 * ------------------------------------------------------------------- */

type Ramp = Array<[number, Rgb]>;

function sampleGradientAt(rampRgb: Ramp, t: number): Rgb {
  t = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < rampRgb.length - 2 && rampRgb[i + 1][0] <= t) i++;
  const [p0, c0] = rampRgb[i];
  const [p1, c1] = rampRgb[i + 1];
  const localT = p1 > p0 ? Math.min(1, Math.max(0, (t - p0) / (p1 - p0))) : 0;
  return [c0[0] + (c1[0] - c0[0]) * localT, c0[1] + (c1[1] - c0[1]) * localT, c0[2] + (c1[2] - c0[2]) * localT];
}

function buildGradientStops(stops: GradientStop[], hueRotateDeg: number): Ramp {
  if (!stops || stops.length === 0) return [[0, [0, 0, 0]], [1, [0, 0, 0]]];

  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const entries = sorted.map((s) => ({
    p: Math.max(0, Math.min(1, s.pos)),
    c: hueRotateDeg ? rotateHueOklab(hexToRgb(s.color), hueRotateDeg) : hexToRgb(s.color),
  }));
  if (entries[0].p > 0) entries.unshift({ p: 0, c: entries[0].c });
  if (entries[entries.length - 1].p < 1) entries.push({ p: 1, c: entries[entries.length - 1].c });

  const SAMPLES = 40;
  const ramp: Ramp = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    let seg = 0;
    for (let j = 0; j < entries.length - 1; j++) {
      if (t >= entries[j].p && t <= entries[j + 1].p) {
        seg = j;
        break;
      }
    }
    const a = entries[seg],
      b = entries[seg + 1];
    const span = b.p - a.p;
    const localT = span > 0 ? (t - a.p) / span : 0;
    ramp.push([t, lerpColorOklab(a.c, b.c, localT)]);
  }
  return ramp;
}

function stopsToCss(ramp: Ramp): Array<[number, string]> {
  return ramp.map(([pos, rgb]) => [pos, rgbToCss(rgb)]);
}

function stopsToCssRotated(ramp: Ramp, hueRotateDeg: number): Array<[number, string]> {
  return ramp.map(([pos, rgb]) => [pos, rgbToCss(rotateHueOklab(rgb, hueRotateDeg))]);
}

function hueDriftLinear(amountDeg: number, barIndex: number, barCount: number): number {
  return amountDeg * (barCount > 1 ? barIndex / (barCount - 1) - 0.5 : 0);
}

/* ---------------------------------------------------------------------
 * Deterministic hash noise (seeded, reproducible — not Math.random) for
 * the per-bar height jitter.
 * ------------------------------------------------------------------- */

function hash2D(ix: number, iy: number): number {
  let h = (ix | 0) * 0x165667b1 + (iy | 0) * 0x27d4eb2f;
  h = (h ^ (h >>> 13)) * 0x4bf19f61;
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

/* ---------------------------------------------------------------------
 * Bar height "silhouette" + width distribution.
 * ------------------------------------------------------------------- */

function heightProfile(count: number, opts: Pick<LayerParams, "peakCount" | "peakPos" | "curveExp"> & { minH: number; maxH: number }): number[] {
  const peakPos = opts.peakPos;
  const minH = opts.minH;
  const maxH = opts.maxH;
  const curveExp = opts.curveExp;
  const out = new Array<number>(count);
  const lastIdx = Math.max(1, count - 1);
  const peakIdx = Math.round(peakPos * lastIdx);

  // "two": a valley at peakPos dropping to minH, tapering up to maxH at the
  // row's edges — concentrates the glow toward the corners of the section.
  for (let i = 0; i < count; i++) {
    let t: number;
    if (i === peakIdx) t = 0;
    else t = i < peakIdx ? (peakIdx - i) / peakIdx : (i - peakIdx) / (lastIdx - peakIdx);
    out[i] = minH + (maxH - minH) * Math.pow(t, curveExp);
  }
  return out;
}

function heightsWithJitter(layer: LayerParams): number[] {
  const heights = heightProfile(layer.count, {
    peakCount: layer.peakCount,
    peakPos: layer.peakPos,
    minH: layer.depth,
    maxH: layer.maxH,
    curveExp: layer.curveExp,
  });
  const jitter = Math.max(0, Math.min(1, layer.jitter || 0));
  if (jitter > 0) {
    const seed = ((layer.noiseSeed || 1) | 0) + 0x1eef;
    for (let i = 0; i < heights.length; i++) {
      heights[i] = Math.max(0.02, Math.min(1.08, heights[i] + (hash2D(i * 7 + 13, seed) - 0.5) * 1.2 * jitter));
    }
  }
  return heights;
}

function barEdgeFractions(heights: number[], widthExp: number): number[] {
  const n = heights.length;
  const edges = new Array<number>(n + 1);
  if (!widthExp) {
    for (let i = 0; i <= n; i++) edges[i] = i / n;
    return edges;
  }
  const FLOOR = 0.05;
  let total = 0;
  const weights = heights.map((h) => {
    const w = Math.pow(Math.max(h, FLOOR), widthExp);
    total += w;
    return w;
  });
  edges[0] = 0;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += weights[i];
    edges[i + 1] = acc / total;
  }
  return edges;
}

/* ---------------------------------------------------------------------
 * Shading: the top "shine" strip, rounded corner bevels and seam shadows
 * that give the bars their soft 3D relief. All tinted with the background
 * color, not black, so shading blends into the void canvas.
 * ------------------------------------------------------------------- */

function rgba(alpha: number, rgbCsv: string): string {
  return `rgba(${rgbCsv},${alpha})`;
}

function applyShadeFalloff(gradient: CanvasGradient, baseAlpha: number, shadowInkCsv: string): void {
  gradient.addColorStop(0, rgba(baseAlpha, shadowInkCsv));
  gradient.addColorStop(0.25, rgba(baseAlpha * 0.844, shadowInkCsv));
  gradient.addColorStop(0.5, rgba(baseAlpha * 0.5, shadowInkCsv));
  gradient.addColorStop(0.75, rgba(baseAlpha * 0.156, shadowInkCsv));
  gradient.addColorStop(1, rgba(0, shadowInkCsv));
}

function drawTopShine(
  ctx: CanvasRenderingContext2D,
  canvasHeight: number,
  heightsFrac: number[],
  edgesX: number[],
  shadowDepthPx: number,
  shadowStrength: number,
  shadowInkCsv: string
): void {
  if (shadowStrength <= 0 || shadowDepthPx <= 0) return;
  const n = heightsFrac.length;
  for (let i = 0; i < n; i++) {
    const x0 = edgesX[i],
      x1 = edgesX[i + 1];
    const barTopY = heightsFrac[i] * canvasHeight;
    const yTop = Math.max(0, Math.round(canvasHeight - barTopY));
    const depth = Math.min(shadowDepthPx, barTopY * 0.5);
    const yBottom = Math.min(canvasHeight, yTop + depth);
    if (yBottom <= yTop) continue;
    const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
    applyShadeFalloff(grad, shadowStrength, shadowInkCsv);
    ctx.fillStyle = grad;
    ctx.fillRect(x0, yTop, x1 - x0, yBottom - yTop);
  }
}

function drawRadialBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dirX: number,
  dirY: number,
  radiusX: number,
  radiusY: number,
  baseAlpha: number,
  shadowInkCsv: string
): void {
  if (baseAlpha <= 0 || radiusX <= 0 || radiusY <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(dirX * radiusX, dirY * radiusY);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  applyShadeFalloff(grad, Math.min(1, baseAlpha), shadowInkCsv);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 1);
  ctx.restore();
}

const SEAM_TOP_FADE_FRAC = 0.12;
const SEAM_BOTTOM_FADE_FRAC = 0.38;

function buildSeamTexture(widthPx: number, heightPx: number, shadowInkCsv: string, strength: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(widthPx));
  c.height = Math.max(1, Math.ceil(heightPx));
  const ctx = c.getContext("2d")!;
  const hGrad = ctx.createLinearGradient(0, 0, c.width, 0);
  hGrad.addColorStop(0, rgba(strength, shadowInkCsv));
  hGrad.addColorStop(0.3, rgba(strength * 0.5, shadowInkCsv));
  hGrad.addColorStop(0.65, rgba(strength * 0.15, shadowInkCsv));
  hGrad.addColorStop(1, rgba(0, shadowInkCsv));
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = "destination-in";

  const topFade = Math.min(c.height * SEAM_TOP_FADE_FRAC, 60);
  const bottomFade = Math.min(c.height * SEAM_BOTTOM_FADE_FRAC, 220);
  const vGrad = ctx.createLinearGradient(0, 0, 0, c.height);
  vGrad.addColorStop(0, "rgba(0,0,0,0)");
  vGrad.addColorStop(topFade / c.height, "rgba(0,0,0,1)");
  vGrad.addColorStop(Math.max(0, 1 - bottomFade / c.height), "rgba(0,0,0,1)");
  vGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function drawSeamShadows(
  ctx: CanvasRenderingContext2D,
  canvasHeight: number,
  heightsFrac: number[],
  edgesX: number[],
  sideLinePx: number,
  sideLineStrength: number,
  shadowInkCsv: string
): void {
  if (sideLineStrength <= 0 || sideLinePx <= 0) return;
  const n = heightsFrac.length;
  for (let i = 0; i < n - 1; i++) {
    const y0 = heightsFrac[i] * canvasHeight,
      y1 = heightsFrac[i + 1] * canvasHeight;
    if (y0 === y1) continue;
    const shorter = Math.min(y0, y1);
    if (shorter <= 2) continue;
    const seamX = edgesX[i + 1];
    const yTop = Math.max(0, Math.round(canvasHeight - shorter));
    const texture = buildSeamTexture(sideLinePx, canvasHeight - yTop, shadowInkCsv, sideLineStrength);
    ctx.save();
    ctx.beginPath();
    if (y0 > y1) {
      ctx.rect(seamX, 0, edgesX[i + 2] - seamX, canvasHeight);
      ctx.clip();
      ctx.setTransform(1, 0, 0, 1, seamX, yTop);
    } else {
      ctx.rect(edgesX[i], 0, seamX - edgesX[i], canvasHeight);
      ctx.clip();
      ctx.setTransform(-1, 0, 0, 1, seamX, yTop);
    }
    ctx.drawImage(texture, 0, 0);
    ctx.restore();
  }
}

function drawCornerBevels(
  ctx: CanvasRenderingContext2D,
  canvasHeight: number,
  heightsFrac: number[],
  edgesX: number[],
  edgeSidePx: number,
  edgeFadeFrac: number,
  edgeBaseStrength: number,
  edgeNeighborBoost: number,
  shadowInkCsv: string
): void {
  if (edgeBaseStrength <= 0 && edgeNeighborBoost <= 0) return;
  const n = heightsFrac.length;
  for (let i = 0; i < n; i++) {
    const x0 = edgesX[i],
      x1 = edgesX[i + 1];
    const barTopY = heightsFrac[i] * canvasHeight;
    const yTop = Math.max(0, Math.round(canvasHeight - barTopY));
    const radiusPx = barTopY * edgeFadeFrac;
    const prevTaller = i > 0 && heightsFrac[i - 1] > heightsFrac[i];
    const nextTaller = i < n - 1 && heightsFrac[i + 1] > heightsFrac[i];
    const leftAlpha = edgeBaseStrength + (prevTaller ? edgeNeighborBoost : 0);
    const rightAlpha = edgeBaseStrength + (nextTaller ? edgeNeighborBoost : 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, x1 - x0, canvasHeight);
    ctx.clip();
    drawRadialBlob(ctx, x0, yTop, +1, +1, edgeSidePx, radiusPx, leftAlpha, shadowInkCsv);
    drawRadialBlob(ctx, x1, yTop, -1, +1, edgeSidePx, radiusPx, rightAlpha, shadowInkCsv);
    ctx.restore();
  }
}

/* ---------------------------------------------------------------------
 * Film grain: two noise layers, built once per resolution and cached,
 * then composited (soft-light + overlay) on top of the finished art.
 * ------------------------------------------------------------------- */

function makeFineGrainData(width: number, height: number): ImageData {
  const rnd3 = () => (Math.random() + Math.random() + Math.random()) * 2 - 3;
  const img = new ImageData(width, height);
  const data = img.data;
  const SHARED_AMP = 40,
    CHANNEL_AMP = 5;
  for (let i = 0; i < data.length; i += 4) {
    const shared = rnd3() * SHARED_AMP;
    data[i] = Math.max(0, Math.min(255, 128 + shared + rnd3() * CHANNEL_AMP));
    data[i + 1] = Math.max(0, Math.min(255, 128 + shared + rnd3() * CHANNEL_AMP));
    data[i + 2] = Math.max(0, Math.min(255, 128 + shared + rnd3() * CHANNEL_AMP));
    data[i + 3] = 255;
  }
  return img;
}

function makeMediumGrainData(width: number, height: number): ImageData {
  const rnd3 = () => (Math.random() + Math.random() + Math.random()) * 2 - 3;
  const img = new ImageData(width, height);
  const data = img.data;
  const AMP = 95;
  for (let i = 0; i < data.length; i += 4) {
    const shared = rnd3() * AMP;
    data[i] = Math.max(0, Math.min(255, 128 + shared));
    data[i + 1] = Math.max(0, Math.min(255, 126 + shared));
    data[i + 2] = Math.max(0, Math.min(255, 120 + shared));
    data[i + 3] = 255;
  }
  return img;
}

function grainBlurPx(width: number, height: number): string {
  return ((Math.max(width, height) / 1920) * 0.55).toFixed(2);
}

function buildGrainLayers(width: number, height: number): GrainLayers {
  const fineCanvas = document.createElement("canvas");
  fineCanvas.width = width;
  fineCanvas.height = height;
  fineCanvas.getContext("2d")!.putImageData(makeFineGrainData(width, height), 0, 0);

  const rawCanvas = document.createElement("canvas");
  rawCanvas.width = width;
  rawCanvas.height = height;
  rawCanvas.getContext("2d")!.putImageData(makeMediumGrainData(width, height), 0, 0);

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = width;
  mediumCanvas.height = height;
  const mctx = mediumCanvas.getContext("2d")!;
  mctx.filter = `blur(${grainBlurPx(width, height)}px)`;
  mctx.drawImage(rawCanvas, 0, 0);
  mctx.filter = "none";

  return { fine: fineCanvas, medium: mediumCanvas };
}

function applyGrain(ctx: CanvasRenderingContext2D, width: number, height: number, params: ShadeParams): void {
  if (params.grainIntensity <= 0 || !params.grainLayers) return;
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = params.grainIntensity * 0.95;
  ctx.drawImage(params.grainLayers.medium, 0, 0, width, height);
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = params.grainIntensity * 0.3;
  ctx.drawImage(params.grainLayers.fine, 0, 0, width, height);
  ctx.restore();
}

/* ---------------------------------------------------------------------
 * Rounded / pointed bar-cap polygon path (for pointness > 0 "tent" tops).
 * ------------------------------------------------------------------- */

function fillRoundedPolygon(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, radii: number[]): void {
  const n = points.length;
  const dist = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  ctx.beginPath();
  const last = points[n - 1],
    first = points[0];
  ctx.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const cur = points[i];
    const next = points[(i + 1) % n];
    const r = Math.min(radii[i] || 0, 0.49 * dist(prev, cur), 0.49 * dist(cur, next));
    ctx.arcTo(cur[0], cur[1], next[0], next[1], Math.max(0, r));
  }
  ctx.closePath();
  ctx.fill();
}

/* ---------------------------------------------------------------------
 * Linear layout: bars grow "up" from the bottom of a local canvas, then
 * an 8-direction wrapper rotates that into any compass direction and
 * (with `mirror`) doubles it across the opposite edge too.
 * ------------------------------------------------------------------- */

function createCanvasEl(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function drawBarsLinearBase(ctx: CanvasRenderingContext2D, width: number, height: number, layer: LayerParams, state: ShadeParams): void {
  const heights = heightsWithJitter(layer);
  const barCount = heights.length;
  const edgesX = barEdgeFractions(heights, layer.widthExp || 0).map((f) => Math.round(f * width));
  const ramp = buildGradientStops(layer.stops, layer.hueRotate || 0);
  const staticCss = layer.hueDrift ? null : stopsToCss(ramp);
  const mirror = !!layer.mirror;
  const drawHeight = mirror ? Math.floor(height / 2) : height;

  const layerCanvas = createCanvasEl(width, drawHeight);
  const lctx = layerCanvas.getContext("2d")!;

  const gapFrac = Math.max(0, Math.min(0.45, layer.gap || 0)) / 2;
  const capRound = Math.max(0, Math.min(1, layer.capRound || 0));
  const pointness = Math.max(0, Math.min(1, layer.pointness || 0));

  for (let i = 0; i < barCount; i++) {
    const xLeft = edgesX[i],
      xRight = edgesX[i + 1];
    const gapPx = Math.round((xRight - xLeft) * gapFrac);
    const barHeightPx = heights[i] * drawHeight;
    const yTop = Math.max(0, Math.round(drawHeight - barHeightPx));

    if (layer.gradMap === "across") {
      const color = sampleGradientAt(ramp, barCount > 1 ? i / (barCount - 1) : 0.5);
      lctx.fillStyle = rgbToCss(rotateHueOklab(color, hueDriftLinear(layer.hueDrift, i, barCount)));
    } else {
      const gradTop = layer.gradMap === "field" ? 0 : yTop;
      const grad = lctx.createLinearGradient(0, gradTop, 0, drawHeight);
      const css = staticCss || stopsToCssRotated(ramp, hueDriftLinear(layer.hueDrift, i, barCount));
      css.forEach(([pos, color]) => grad.addColorStop(pos, color));
      lctx.fillStyle = grad;
    }

    const rectX = xLeft + gapPx;
    const rectW = xRight - xLeft - 2 * gapPx;
    const rectH = drawHeight - yTop;
    const cornerR = capRound * Math.min(rectW / 2, rectH);

    if (pointness > 0 && rectW > 1 && rectH > 1) {
      const pull = (rectW / 2) * pointness;
      const topLeftX = rectX + pull,
        topRightX = rectX + rectW - pull;
      fillRoundedPolygon(
        lctx,
        [
          [topLeftX, yTop],
          [topRightX, yTop],
          [rectX + rectW, drawHeight],
          [rectX, drawHeight],
        ],
        [cornerR, cornerR, 0, 0]
      );
    } else if (cornerR > 0.5) {
      lctx.beginPath();
      lctx.roundRect(rectX, yTop, rectW, rectH, [cornerR, cornerR, 0, 0]);
      lctx.fill();
    } else {
      lctx.fillRect(rectX, yTop, rectW, rectH);
    }
  }

  lctx.globalCompositeOperation = "source-atop";
  drawTopShine(lctx, drawHeight, heights, edgesX, state.shadowDepthPx, state.shadowStrength, state.shadowInk);
  drawSeamShadows(lctx, drawHeight, heights, edgesX, state.sideLinePx, state.sideLineStrength, state.shadowInk);
  drawCornerBevels(lctx, drawHeight, heights, edgesX, state.edgeSidePx, state.edgeFadeFrac, state.edgeBaseStrength, state.edgeNeighborBoost, state.shadowInk);
  lctx.globalCompositeOperation = "source-over";

  if (mirror) {
    ctx.drawImage(layerCanvas, 0, height - drawHeight);
    ctx.save();
    ctx.translate(0, drawHeight);
    ctx.scale(1, -1);
    ctx.drawImage(layerCanvas, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(layerCanvas, 0, 0);
  }
}

const DIRECTION_ANGLE: Record<Direction, number> = {
  up: -Math.PI / 2,
  "up-right": -Math.PI / 4,
  right: 0,
  "down-right": Math.PI / 4,
  down: Math.PI / 2,
  "down-left": (3 * Math.PI) / 4,
  left: Math.PI,
  "up-left": (-3 * Math.PI) / 4,
};
const isDiagonalDirection = (d: Direction) => d === "up-right" || d === "down-right" || d === "down-left" || d === "up-left";

function drawBarsLinear(ctx: CanvasRenderingContext2D, width: number, height: number, layer: LayerParams, state: ShadeParams): void {
  const margin = Math.round((state.margin || 0) * Math.min(width, height));
  const innerW = width - 2 * margin,
    innerH = height - 2 * margin;
  if (innerW < 2 || innerH < 2) return;
  const dir = layer.direction || "up";

  if (isDiagonalDirection(dir)) {
    const diag = Math.ceil(Math.sqrt(innerW * innerW + innerH * innerH));
    const tmp = createCanvasEl(diag, diag);
    drawBarsLinearBase(tmp.getContext("2d")!, diag, diag, layer, state);
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin, margin, innerW, innerH);
    ctx.clip();
    ctx.translate(margin + innerW / 2, margin + innerH / 2);
    ctx.rotate(DIRECTION_ANGLE[dir] + Math.PI / 2);
    ctx.drawImage(tmp, -diag / 2, -diag / 2);
    ctx.restore();
    return;
  }

  const horizontal = dir === "right" || dir === "left";
  const w = horizontal ? innerH : innerW,
    h = horizontal ? innerW : innerH;
  const tmp = createCanvasEl(w, h);
  drawBarsLinearBase(tmp.getContext("2d")!, w, h, layer, state);

  ctx.save();
  ctx.translate(margin, margin);
  if (dir === "right") {
    ctx.translate(innerW, 0);
    ctx.rotate(Math.PI / 2);
  } else if (dir === "down") {
    ctx.translate(innerW, innerH);
    ctx.rotate(Math.PI);
  } else if (dir === "left") {
    ctx.translate(0, innerH);
    ctx.rotate(-Math.PI / 2);
  }
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

function renderGradientArt(ctx: CanvasRenderingContext2D, width: number, height: number, layer: LayerParams, state: ShadeParams): void {
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = layer.opacity ?? 1;
  drawBarsLinear(ctx, width, height, layer, state);
  ctx.restore();
  applyGrain(ctx, width, height, state);
}

/* ---------------------------------------------------------------------
 * React wiring: size to the parent, gate animation on visibility +
 * prefers-reduced-motion, and slowly drift the hue like a long ambient
 * loop (60-80s), matching the rest of the site's motion rules. Params
 * are read live from the gradient-glow-store, tunable in development via
 * <GradientGlowDevPanel /> without tearing down the canvas each tweak.
 * ------------------------------------------------------------------- */

const SHADOW_DEPTH_BASE_PX = 120;
const EDGE_SIDE_BASE_PX = 70;
const EDGE_FADE_FRAC = 0.45;
const EDGE_BASE_MULT = 0.3;
const EDGE_NEIGHBOR_MULT = 1;
const SIDE_LINE_BASE_PX = 9;
const isDev = process.env.NODE_ENV === "development";

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

export function GradientGlow({ store, className = "" }: { store: GradientGlowStore; className?: string }) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [inView, setInView] = useState(false);
  // The canvas is always mounted (no dynamic import to gate on) but stays
  // blank until inView + sizing are both ready, so the first real paint below
  // pops in without this — flips once and stays true, since the drawn frame
  // persists on the canvas even after scrolling away.
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const configRef = useRef(store.getConfig());

  useEffect(() => {
    configRef.current = store.getConfig();
    return store.subscribe(() => {
      configRef.current = store.getConfig();
    });
  }, [store]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !inView || size.width === 0 || size.height === 0) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(size.width * dpr));
    const height = Math.max(1, Math.round(size.height * dpr));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRevealed(true);
    const grainLayers = buildGrainLayers(width, height);

    let raf = 0;
    let lastFrame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const cfg = configRef.current;
      if (now - lastFrame >= cfg.anim.frameIntervalMs) {
        lastFrame = now;
        const animating = isDev ? !cfg.anim.paused : !reduce;
        const t = animating ? (now - start) / 1000 : 0;
        const drift = animating
          ? Math.sin((t / cfg.anim.hueDriftPeriodS) * 2 * Math.PI) * cfg.anim.hueDriftDeg
          : 0;
        const layer: LayerParams = { ...cfg.layer, hueRotate: cfg.layer.hueRotate + drift };
        const state: ShadeParams = {
          bgColor: cfg.state.bgColor,
          shadowInk: hexToRgb(cfg.state.bgColor).join(","),
          margin: cfg.state.margin,
          grainIntensity: cfg.state.grainIntensity,
          shadowStrength: cfg.state.shadowStrength,
          shadowDepthPx: SHADOW_DEPTH_BASE_PX * dpr,
          edgeSidePx: EDGE_SIDE_BASE_PX * dpr,
          edgeFadeFrac: EDGE_FADE_FRAC,
          edgeBaseStrength: cfg.state.edgeStrength * EDGE_BASE_MULT,
          edgeNeighborBoost: cfg.state.edgeStrength * EDGE_NEIGHBOR_MULT,
          sideLinePx: SIDE_LINE_BASE_PX * dpr,
          sideLineStrength: cfg.state.sideLineStrength,
          grainLayers,
        };
        renderGradientArt(ctx, width, height, layer, state);
      }
      if (isDev || !reduce) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [size.width, size.height, inView, reduce]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${revealed ? "effect-reveal" : "opacity-0"} ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        }}
      />
    </div>
  );
}
