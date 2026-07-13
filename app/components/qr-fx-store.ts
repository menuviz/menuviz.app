"use client";

// Tiny external store (useSyncExternalStore) for the QR card's "out of
// focus" treatment — the degraded look the card wears before the viewfinder
// brackets lock on and pull it sharp. Written to by QrFxDevPanel, read by
// the stage's applyQrFx (which multiplies these amounts by the timeline's
// focus progress). `preview` forces the fully degraded state regardless of
// scroll so the effect can be tuned without parking the scrub at the beat.

import { useSyncExternalStore } from "react";

export type HalftoneBlend = "multiply" | "overlay" | "darken" | "normal";

export interface QrFxConfig {
  blurPx: number;
  contrast: number;
  halftoneOpacity: number;
  halftoneSizePx: number;
  halftoneDot: number;
  halftoneBlend: HalftoneBlend;
  ditherOpacity: number;
  ditherFreq: number;
  ditherScalePx: number;
  preview: boolean;
}

export interface QrFxStore {
  getConfig(): QrFxConfig;
  subscribe(cb: () => void): () => void;
  update(patch: Partial<QrFxConfig>): void;
  reset(): void;
  useConfig(): QrFxConfig;
}

function createQrFxStore(seed: QrFxConfig): QrFxStore {
  let config = { ...seed };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const getConfig = () => config;
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const update = (patch: Partial<QrFxConfig>) => {
    config = { ...config, ...patch };
    emit();
  };
  const reset = () => {
    config = { ...seed, preview: config.preview };
    emit();
  };
  const useConfig = () => useSyncExternalStore(subscribe, getConfig, getConfig);

  return { getConfig, subscribe, update, reset, useConfig };
}

// Hand-tuned via the dev panel: a light blur with the dither carrying most
// of the degradation.
export const QR_FX_SEED: QrFxConfig = {
  blurPx: 2,
  contrast: 1.1,
  halftoneOpacity: 0.1,
  halftoneSizePx: 6,
  halftoneDot: 0.35,
  halftoneBlend: "multiply",
  ditherOpacity: 0.45,
  ditherFreq: 0.65,
  ditherScalePx: 104,
  preview: false,
};

export const qrFxStore = createQrFxStore(QR_FX_SEED);
