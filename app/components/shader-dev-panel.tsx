"use client";

// Development-only control panel for the How-it-works shader backdrop (see
// shader-store.ts). Randomize re-rolls everything except the three colors —
// the greens are brand-locked. Renders nothing in production.

import { useState } from "react";
import type { EnvPreset, ShaderStore, ShaderType } from "./shader-store";
import { ColorRow, Section, SelectRow, SliderRow, DevPanelShell } from "./dev-panel-ui";

const TYPES: readonly ShaderType[] = ["plane", "waterPlane", "sphere"];
// dawn/lobby are flat-gray placeholder HDRs in public/hdr (the package
// fetches all three regardless of preset, and production only uses city, so
// the real ~1.5MB files would cost every visitor ~3MB for nothing). To
// audition those presets, temporarily re-download the real files — see
// https://ruucm.github.io/shadergradient/ui@0.0.0/assets/hdr/
const ENV_PRESETS: readonly EnvPreset[] = ["city", "dawn", "lobby"];
const GRAIN: readonly ("on" | "off")[] = ["on", "off"];

export function ShaderDevPanel({ store }: { store: ShaderStore }) {
  const config = store.useConfig();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — dev tool only, safe to ignore
    }
  };

  return (
    <DevPanelShell
      title="Shader"
      label="Shader blob"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      footer={
        <>
          <button
            type="button"
            onClick={store.reset}
            className="flex-1 rounded border border-hairline py-1.5 text-[11px] text-sage hover:border-emerald hover:text-phosphor"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={store.randomize}
            className="flex-1 rounded border border-hairline py-1.5 text-[11px] text-sage hover:border-emerald hover:text-phosphor"
          >
            Randomize
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded bg-emerald py-1.5 text-[11px] font-medium text-ink-emerald hover:bg-emerald-deep"
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </>
      }
    >
      <Section title="Shape">
        <SelectRow label="type" value={config.type} options={TYPES} onChange={(v) => store.update({ type: v })} />
        <SliderRow label="uStrength" value={config.uStrength} min={0} max={5} step={0.05} onChange={(v) => store.update({ uStrength: v })} />
        <SliderRow label="uDensity" value={config.uDensity} min={0} max={4} step={0.05} onChange={(v) => store.update({ uDensity: v })} />
        <SliderRow label="uFrequency" value={config.uFrequency} min={0} max={10} step={0.1} onChange={(v) => store.update({ uFrequency: v })} />
        <SliderRow label="uAmplitude" value={config.uAmplitude} min={0} max={6} step={0.1} onChange={(v) => store.update({ uAmplitude: v })} />
      </Section>

      <Section title="Motion">
        <SliderRow label="uSpeed" value={config.uSpeed} min={0} max={1} step={0.01} onChange={(v) => store.update({ uSpeed: v })} />
        <SliderRow label="uTime" value={config.uTime} min={0} max={40} step={0.5} onChange={(v) => store.update({ uTime: v })} />
      </Section>

      <Section title="Placement">
        <SliderRow label="posX" value={config.positionX} min={-2} max={2} step={0.05} onChange={(v) => store.update({ positionX: v })} />
        <SliderRow label="posY" value={config.positionY} min={-2} max={2} step={0.05} onChange={(v) => store.update({ positionY: v })} />
        <SliderRow label="posZ" value={config.positionZ} min={-2} max={2} step={0.05} onChange={(v) => store.update({ positionZ: v })} />
        <SliderRow label="rotX" value={config.rotationX} min={-180} max={180} step={1} onChange={(v) => store.update({ rotationX: v })} />
        <SliderRow label="rotY" value={config.rotationY} min={0} max={360} step={1} onChange={(v) => store.update({ rotationY: v })} />
        <SliderRow label="rotZ" value={config.rotationZ} min={-180} max={180} step={1} onChange={(v) => store.update({ rotationZ: v })} />
      </Section>

      <Section title="Camera">
        <SliderRow label="azimuth" value={config.cAzimuthAngle} min={0} max={400} step={1} onChange={(v) => store.update({ cAzimuthAngle: v })} />
        <SliderRow label="polar" value={config.cPolarAngle} min={0} max={180} step={1} onChange={(v) => store.update({ cPolarAngle: v })} />
        <SliderRow label="distance" value={config.cDistance} min={0} max={6} step={0.01} onChange={(v) => store.update({ cDistance: v })} />
        <SliderRow label="zoom" value={config.cameraZoom} min={0.5} max={8} step={0.01} onChange={(v) => store.update({ cameraZoom: v })} />
      </Section>

      <Section title="Light & surface">
        <SelectRow label="envPreset" value={config.envPreset} options={ENV_PRESETS} onChange={(v) => store.update({ envPreset: v })} />
        <SliderRow label="brightness" value={config.brightness} min={0} max={2} step={0.05} onChange={(v) => store.update({ brightness: v })} />
        <SliderRow label="reflection" value={config.reflection} min={0} max={1} step={0.01} onChange={(v) => store.update({ reflection: v })} />
        <SelectRow label="grain" value={config.grain} options={GRAIN} onChange={(v) => store.update({ grain: v })} />
      </Section>

      <Section title="Colors (locked in randomize)">
        <ColorRow label="color1" value={config.color1} onChange={(v) => store.update({ color1: v })} />
        <ColorRow label="color2" value={config.color2} onChange={(v) => store.update({ color2: v })} />
        <ColorRow label="color3" value={config.color3} onChange={(v) => store.update({ color3: v })} />
      </Section>
    </DevPanelShell>
  );
}
