"use client";

// Tiny external store (useSyncExternalStore) holding a live-tunable <Beams />
// config, mirroring gradient-glow-store.ts. Written to by BeamsDevPanel, read
// by BentoBeams — so slider tweaks apply without re-mounting the canvas.

import { useSyncExternalStore } from "react";

export interface BeamsConfig {
  beamWidth: number;
  beamHeight: number;
  beamNumber: number;
  lightColor: string;
  speed: number;
  noiseIntensity: number;
  scale: number;
  rotation: number;
  backgroundColor: string;
  surfaceColor: string;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  ambientIntensity: number;
  directionalIntensity: number;
  cameraDistance: number;
  cameraFov: number;
}

export interface BeamsStore {
  getConfig(): BeamsConfig;
  subscribe(cb: () => void): () => void;
  update(patch: Partial<BeamsConfig>): void;
  reset(): void;
  randomize(): void;
  useConfig(): BeamsConfig;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Green hue band only — randomize() should never wander into other colors.
const GREEN_HUE = [100, 160] as const;

function randomGreen(saturation: [number, number], lightness: [number, number]): string {
  return hslToHex(randomInRange(...GREEN_HUE), randomInRange(...saturation), randomInRange(...lightness));
}

function createBeamsStore(seed: BeamsConfig): BeamsStore {
  let config = { ...seed };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const getConfig = () => config;
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const update = (patch: Partial<BeamsConfig>) => {
    config = { ...config, ...patch };
    emit();
  };
  const reset = () => {
    config = { ...seed };
    emit();
  };
  // cameraFov is intentionally left out — randomizing framing is disorienting,
  // so it stays wherever the panel left it.
  const randomize = () => {
    config = {
      ...config,
      beamWidth: randomInRange(0.2, 6),
      beamHeight: randomInRange(4, 30),
      beamNumber: Math.round(randomInRange(2, 30)),
      rotation: Math.round(randomInRange(-180, 180)),
      speed: randomInRange(0, 6),
      noiseIntensity: randomInRange(0, 4),
      scale: randomInRange(0.02, 1),
      cameraDistance: randomInRange(5, 40),
      roughness: randomInRange(0, 1),
      metalness: randomInRange(0, 1),
      envMapIntensity: randomInRange(0, 20),
      ambientIntensity: randomInRange(0, 4),
      directionalIntensity: randomInRange(0, 4),
      lightColor: randomGreen([0.4, 0.9], [0.35, 0.65]),
      surfaceColor: randomGreen([0.1, 0.5], [0.02, 0.15]),
      backgroundColor: randomGreen([0.1, 0.4], [0.05, 0.15]),
    };
    emit();
  };
  const useConfig = () => useSyncExternalStore(subscribe, getConfig, getConfig);

  return { getConfig, subscribe, update, reset, randomize, useConfig };
}

// Locked in from the dev panel: close-up, wide-beam framing (low fov +
// cameraDistance) with a punchy green light over a dark green-black surface.
export const BENTO_BEAMS_SEED: BeamsConfig = {
  beamWidth: 4.186173166045164,
  beamHeight: 23,
  beamNumber: 8,
  lightColor: "#379252",
  speed: 1.6,
  noiseIntensity: 4,
  scale: 0.32,
  rotation: -180,
  backgroundColor: "#162519",
  surfaceColor: "#162922",
  roughness: 0.35,
  metalness: 0.7909625274911477,
  envMapIntensity: 6.5,
  ambientIntensity: 3.5,
  directionalIntensity: 3.176469693665647,
  cameraDistance: 10.5,
  cameraFov: 18,
};

export const bentoBeamsStore = createBeamsStore(BENTO_BEAMS_SEED);
