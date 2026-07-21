"use client";

// Tiny external store (useSyncExternalStore) holding the live-tunable
// ShaderGradient config for the How-it-works backdrop, mirroring
// beams-store.ts. Written to by ShaderDevPanel, read by StageShader — so
// slider tweaks apply without a page reload. randomize() re-rolls the
// shape, motion, camera, and lighting but NEVER the colors: the palette is
// brand-locked, the geometry is the toy.

import { useSyncExternalStore } from "react";

export type ShaderType = "plane" | "waterPlane" | "sphere";
export type EnvPreset = "city" | "dawn" | "lobby";

export interface ShaderConfig {
  type: ShaderType;
  uTime: number;
  uSpeed: number;
  uStrength: number;
  uDensity: number;
  uFrequency: number;
  uAmplitude: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  color1: string;
  color2: string;
  color3: string;
  reflection: number;
  cAzimuthAngle: number;
  cPolarAngle: number;
  cDistance: number;
  cameraZoom: number;
  brightness: number;
  envPreset: EnvPreset;
  grain: "on" | "off";
  // 0-1 mix of the grain (halftone) pass over the raw gradient. Requires our
  // patch of @shadergradient/react (patches/) — stock 2.4.20 declares the
  // grainBlending prop in its types but never wires it, hardcoding 1.
  grainBlending: number;
}

export interface ShaderStore {
  getConfig(): ShaderConfig;
  subscribe(cb: () => void): () => void;
  update(patch: Partial<ShaderConfig>): void;
  reset(): void;
  randomize(): void;
  useConfig(): ShaderConfig;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function createShaderStore(seed: ShaderConfig): ShaderStore {
  let config = { ...seed };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const getConfig = () => config;
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const update = (patch: Partial<ShaderConfig>) => {
    config = { ...config, ...patch };
    emit();
  };
  const reset = () => {
    config = { ...seed };
    emit();
  };
  // Colors (color1/2/3) are deliberately untouched — the greens are locked.
  // Camera distance/zoom ranges depend on the rolled type: spheres are shot
  // close-up, planes from further back, so random rolls stay presentable.
  const randomize = () => {
    const type = pick<ShaderType>(["plane", "waterPlane", "sphere"]);
    const sphere = type === "sphere";
    config = {
      ...config,
      type,
      uTime: randomInRange(0, 20),
      uSpeed: randomInRange(0.05, 0.5),
      uStrength: randomInRange(0.5, 4),
      uDensity: randomInRange(0.5, 3),
      uFrequency: randomInRange(2, 8),
      uAmplitude: randomInRange(0.5, 5),
      positionX: randomInRange(-1, 1),
      positionY: randomInRange(-0.5, 0.5),
      positionZ: randomInRange(-0.5, 0.5),
      rotationX: Math.round(randomInRange(-90, 90)),
      rotationY: Math.round(randomInRange(0, 360)),
      rotationZ: Math.round(randomInRange(-180, 180)),
      reflection: randomInRange(0, 1),
      cAzimuthAngle: Math.round(randomInRange(0, 360)),
      cPolarAngle: Math.round(randomInRange(30, 150)),
      cDistance: sphere ? randomInRange(0.03, 1.5) : randomInRange(2, 5),
      cameraZoom: sphere ? randomInRange(3, 7) : randomInRange(0.8, 2),
      brightness: randomInRange(0.4, 1.6),
      // envPreset stays put: dawn/lobby ship as flat-gray placeholder HDRs
      // (see shader-dev-panel.tsx), so rolling them would just kill the
      // lighting.
    };
    emit();
  };
  const useConfig = () => useSyncExternalStore(subscribe, getConfig, getConfig);

  return { getConfig, subscribe, update, reset, randomize, useConfig };
}

// Hand-tuned via the shader dev panel: a slow green sphere blob on black,
// env-lit, grained, shot dim and zoomed-in.
export const STAGE_SHADER_SEED: ShaderConfig = {
  type: "sphere",
  uTime: 20,
  uSpeed: 0.16,
  uStrength: 2.5,
  uDensity: 0.8,
  uFrequency: 5.5,
  uAmplitude: 2.2,
  positionX: -0.2,
  positionY: 0,
  positionZ: 0,
  rotationX: 0,
  rotationY: 130,
  rotationZ: 70,
  color1: "#007d00",
  color2: "#004e00",
  color3: "#3fcc62",
  reflection: 0.4,
  cAzimuthAngle: 391,
  cPolarAngle: 58,
  cDistance: 0.03,
  cameraZoom: 8,
  brightness: 0.3,
  envPreset: "city",
  grain: "on",
  grainBlending: 0.2,
};

export const stageShaderStore = createShaderStore(STAGE_SHADER_SEED);
