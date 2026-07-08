"use client";

// Tiny external store (useSyncExternalStore) holding a live-tunable
// GradientGlow config. Each section that wants its own gradient gets its
// own store instance (createGradientGlowStore) — written to by that
// instance's dev-only GradientGlowDevPanel, read by GradientGlow through a
// ref (not the hook) so slider tweaks don't tear down the canvas's grain
// layers or restart its animation loop.

import { useSyncExternalStore } from "react";
import { DIRECTIONS, GRAD_MAPS, PEAK_COUNTS, type GradientStop, type LayerParams } from "./gradient-glow";

export interface TunableState {
  bgColor: string;
  margin: number;
  grainIntensity: number;
  shadowStrength: number;
  edgeStrength: number;
  sideLineStrength: number;
}

export interface TunableAnim {
  hueDriftDeg: number;
  hueDriftPeriodS: number;
  frameIntervalMs: number;
  paused: boolean;
}

export interface GradientGlowConfig {
  layer: LayerParams;
  state: TunableState;
  anim: TunableAnim;
}

export interface GradientGlowStore {
  getConfig(): GradientGlowConfig;
  subscribe(cb: () => void): () => void;
  updateLayer(patch: Partial<LayerParams>): void;
  updateState(patch: Partial<TunableState>): void;
  updateAnim(patch: Partial<TunableAnim>): void;
  reset(): void;
  randomize(): void;
  useConfig(): GradientGlowConfig;
}

function cloneConfig(c: GradientGlowConfig): GradientGlowConfig {
  return {
    layer: { ...c.layer, stops: c.layer.stops.map((s) => ({ ...s })) },
    state: { ...c.state },
    anim: { ...c.anim },
  };
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

// A fixed palette a store's randomize() must never drift away from — the
// stops plus the two hue knobs, since hueRotate/hueDrift are color, not
// structure.
export interface ColorLock {
  stops: GradientStop[];
  hueRotate: number;
  hueDrift: number;
}

// Reshuffles the bar structure only (layout/shape). Never touches color —
// stops, hueRotate and hueDrift are left alone here; a store's colorLock
// (if any) re-pins them afterward regardless of what was already set.
function randomizeLayer(layer: LayerParams): LayerParams {
  return {
    ...layer,
    direction: pick(DIRECTIONS),
    peakCount: pick(PEAK_COUNTS),
    gradMap: pick(GRAD_MAPS),
    mirror: Math.random() > 0.15,
    count: Math.round(randomInRange(6, 28)),
    depth: randomInRange(0, 0.22),
    maxH: randomInRange(0.5, 1.1),
    peakPos: randomInRange(0.15, 0.85),
    curveExp: randomInRange(0.6, 3),
    waveFreq: Math.round(randomInRange(1, 8)),
    widthExp: randomInRange(-1.2, 1.4),
    gap: randomInRange(0, 0.3),
    capRound: randomInRange(0, 1),
    pointness: randomInRange(0, 0.6),
    jitter: randomInRange(0, 0.35),
  };
}

function createGradientGlowStore(seed: GradientGlowConfig, colorLock?: ColorLock): GradientGlowStore {
  let config = cloneConfig(seed);
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const getConfig = () => config;
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const updateLayer = (patch: Partial<LayerParams>) => {
    config = { ...config, layer: { ...config.layer, ...patch } };
    emit();
  };
  const updateState = (patch: Partial<TunableState>) => {
    config = { ...config, state: { ...config.state, ...patch } };
    emit();
  };
  const updateAnim = (patch: Partial<TunableAnim>) => {
    config = { ...config, anim: { ...config.anim, ...patch } };
    emit();
  };
  const reset = () => {
    config = cloneConfig(seed);
    emit();
  };
  const randomize = () => {
    let layer = randomizeLayer(config.layer);
    if (colorLock) {
      layer = {
        ...layer,
        stops: colorLock.stops.map((s) => ({ ...s })),
        hueRotate: colorLock.hueRotate,
        hueDrift: colorLock.hueDrift,
      };
    }
    config = { ...config, layer };
    emit();
  };
  const useConfig = () => useSyncExternalStore(subscribe, getConfig, getConfig);

  return { getConfig, subscribe, updateLayer, updateState, updateAnim, reset, randomize, useConfig };
}

const VOID_BG = "#030503";

// Locked in from the dev panel: the corner-glow look behind the "Put your
// menu in pictures." CTA.
export const FINAL_CTA_GLOW_SEED: GradientGlowConfig = {
  layer: {
    peakCount: "two",
    peakPos: 0.5,
    waveFreq: 3,
    curveExp: 1.7,
    widthExp: 0.55,
    mirror: true,
    direction: "right",
    count: 14,
    depth: 0.11,
    maxH: 0.71,
    gap: 0,
    capRound: 0.24,
    pointness: 0,
    jitter: 0,
    noiseSeed: 42,
    steps: 0,
    gradMap: "field",
    hueDrift: 0,
    hueRotate: -6,
    opacity: 1,
    stops: [
      { pos: 0, color: VOID_BG },
      { pos: 0.4, color: "#1e7a52" },
      { pos: 0.72, color: "#2f9e6e" },
      { pos: 0.9, color: "#3cb87e" },
      { pos: 1, color: "#aed2a4" },
    ],
  },
  state: {
    bgColor: VOID_BG,
    margin: 0,
    grainIntensity: 0.18,
    shadowStrength: 0.69,
    edgeStrength: 0.44,
    sideLineStrength: 0.16,
  },
  anim: {
    hueDriftDeg: 0,
    hueDriftPeriodS: 73,
    frameIntervalMs: 16,
    paused: false,
  },
};

// Previous Bento lock: the noisy diagonal texture. Kept for reference —
// swap back in by uncommenting and pointing BENTO_GLOW_SEED at it.
// export const BENTO_GLOW_SEED_NOISE_DIAGONAL: GradientGlowConfig = {
//   layer: {
//     peakCount: "noise",
//     peakPos: 0.6041765124584839,
//     waveFreq: 6,
//     curveExp: 2.1099345400390654,
//     widthExp: 1.1865652085393001,
//     mirror: true,
//     direction: "down-left",
//     count: 19,
//     depth: 0.033851671573628755,
//     maxH: 0.8312810618065632,
//     gap: 0.05356009878945025,
//     capRound: 0.1373531897246726,
//     pointness: 0.136370257575525,
//     jitter: 0.22773476587516703,
//     noiseSeed: 42,
//     steps: 0,
//     gradMap: "bar",
//     hueDrift: 0,
//     hueRotate: -6,
//     opacity: 1,
//     stops: [
//       { pos: 0, color: VOID_BG },
//       { pos: 0.4, color: "#1e7a52" },
//       { pos: 0.72, color: "#2f9e6e" },
//       { pos: 0.9, color: "#3cb87e" },
//       { pos: 1, color: "#aed2a4" },
//     ],
//   },
//   state: {
//     bgColor: VOID_BG,
//     margin: 0,
//     grainIntensity: 0.18,
//     shadowStrength: 0.69,
//     edgeStrength: 0.44,
//     sideLineStrength: 0.16,
//   },
//   anim: {
//     hueDriftDeg: 0,
//     hueDriftPeriodS: 73,
//     frameIntervalMs: 16,
//     paused: false,
//   },
// };

// Locked in from the dev panel: the low-opacity "across" ribbon texture
// behind the Bento grid. Colors stay pinned to Final CTA's palette (see
// bentoGradientStore's colorLock).
export const BENTO_GLOW_SEED: GradientGlowConfig = {
  layer: {
    peakCount: "two",
    peakPos: 0.2567262019807701,
    waveFreq: 1,
    curveExp: 1.3413253431945398,
    widthExp: 0.75975208804849,
    mirror: true,
    direction: "right",
    count: 14,
    depth: 0.02099075128864994,
    maxH: 0.9300154845107064,
    gap: 0.10331532436025893,
    capRound: 0.07893782249037729,
    pointness: 0.07012807972525452,
    jitter: 0.09089162429821761,
    noiseSeed: 42,
    steps: 0,
    gradMap: "across",
    hueDrift: 0,
    hueRotate: -6,
    opacity: 0.5,
    stops: [
      { pos: 0, color: VOID_BG },
      { pos: 0.4, color: "#1e7a52" },
      { pos: 0.72, color: "#2f9e6e" },
      { pos: 0.9, color: "#3cb87e" },
      { pos: 1, color: "#aed2a4" },
    ],
  },
  state: {
    bgColor: VOID_BG,
    margin: 0,
    grainIntensity: 0.18,
    shadowStrength: 0.69,
    edgeStrength: 0.44,
    sideLineStrength: 0.16,
  },
  anim: {
    hueDriftDeg: 0,
    hueDriftPeriodS: 73,
    frameIntervalMs: 16,
    paused: false,
  },
};

// Locked in from the dev panel: the softer, lower-opacity glow behind the
// hero copy and phone mockup. Colors stay pinned to Final CTA's palette
// (see heroGradientStore's colorLock).
export const HERO_GLOW_SEED: GradientGlowConfig = {
  layer: {
    peakCount: "two",
    peakPos: 0.5,
    waveFreq: 3,
    curveExp: 1.7,
    widthExp: 0.55,
    mirror: true,
    direction: "up",
    count: 15,
    depth: 0.11,
    maxH: 0.8,
    gap: 0,
    capRound: 0.24,
    pointness: 0,
    jitter: 0,
    noiseSeed: 42,
    steps: 0,
    gradMap: "field",
    hueDrift: 0,
    hueRotate: -6,
    opacity: 0.66,
    stops: [
      { pos: 0, color: VOID_BG },
      { pos: 0.4, color: "#1e7a52" },
      { pos: 0.72, color: "#2f9e6e" },
      { pos: 0.9, color: "#3cb87e" },
      { pos: 1, color: "#aed2a4" },
    ],
  },
  state: {
    bgColor: VOID_BG,
    margin: 0,
    grainIntensity: 0.18,
    shadowStrength: 0.69,
    edgeStrength: 0.44,
    sideLineStrength: 0.16,
  },
  anim: {
    hueDriftDeg: 0,
    hueDriftPeriodS: 73,
    frameIntervalMs: 16,
    paused: false,
  },
};

function lockToFinalCta(): ColorLock {
  return {
    stops: FINAL_CTA_GLOW_SEED.layer.stops.map((s) => ({ ...s })),
    hueRotate: FINAL_CTA_GLOW_SEED.layer.hueRotate,
    hueDrift: FINAL_CTA_GLOW_SEED.layer.hueDrift,
  };
}

export const finalCtaGradientStore = createGradientGlowStore(FINAL_CTA_GLOW_SEED);
export const bentoGradientStore = createGradientGlowStore(BENTO_GLOW_SEED, lockToFinalCta());
export const heroGradientStore = createGradientGlowStore(HERO_GLOW_SEED, lockToFinalCta());
