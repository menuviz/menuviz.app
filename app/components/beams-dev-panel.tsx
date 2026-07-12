"use client";

// Development-only control panel for live-tweaking <Beams /> (see
// beams-store.ts). Renders nothing in production.

import { useState } from "react";
import type { BeamsStore } from "./beams-store";
import { Section, SliderRow, ColorRow, DevPanelShell } from "./dev-panel-ui";

export function BeamsDevPanel({ store, label }: { store: BeamsStore; label: string }) {
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
      title="Beams"
      label={label}
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
      <Section title="Geometry">
        <SliderRow label="beamWidth" value={config.beamWidth} min={0.2} max={6} step={0.1} onChange={(v) => store.update({ beamWidth: v })} />
        <SliderRow label="beamHeight" value={config.beamHeight} min={4} max={30} step={0.5} onChange={(v) => store.update({ beamHeight: v })} />
        <SliderRow label="beamNumber" value={config.beamNumber} min={2} max={30} step={1} onChange={(v) => store.update({ beamNumber: v })} />
        <SliderRow label="rotation" value={config.rotation} min={-180} max={180} step={1} onChange={(v) => store.update({ rotation: v })} />
      </Section>

      <Section title="Motion">
        <SliderRow label="speed" value={config.speed} min={0} max={6} step={0.1} onChange={(v) => store.update({ speed: v })} />
        <SliderRow
          label="noiseIntensity"
          value={config.noiseIntensity}
          min={0}
          max={4}
          step={0.05}
          onChange={(v) => store.update({ noiseIntensity: v })}
        />
        <SliderRow label="scale" value={config.scale} min={0.02} max={1} step={0.01} onChange={(v) => store.update({ scale: v })} />
      </Section>

      <Section title="Camera">
        <SliderRow
          label="distance"
          value={config.cameraDistance}
          min={5}
          max={40}
          step={0.5}
          onChange={(v) => store.update({ cameraDistance: v })}
        />
        <SliderRow label="fov" value={config.cameraFov} min={1} max={170} step={1} onChange={(v) => store.update({ cameraFov: v })} />
      </Section>

      <Section title="Material">
        <SliderRow label="roughness" value={config.roughness} min={0} max={1} step={0.01} onChange={(v) => store.update({ roughness: v })} />
        <SliderRow label="metalness" value={config.metalness} min={0} max={1} step={0.01} onChange={(v) => store.update({ metalness: v })} />
        <SliderRow
          label="envMapInt"
          value={config.envMapIntensity}
          min={0}
          max={20}
          step={0.5}
          onChange={(v) => store.update({ envMapIntensity: v })}
        />
      </Section>

      <Section title="Lighting & color">
        <SliderRow
          label="ambient"
          value={config.ambientIntensity}
          min={0}
          max={4}
          step={0.05}
          onChange={(v) => store.update({ ambientIntensity: v })}
        />
        <SliderRow
          label="directional"
          value={config.directionalIntensity}
          min={0}
          max={4}
          step={0.05}
          onChange={(v) => store.update({ directionalIntensity: v })}
        />
        <ColorRow label="lightColor" value={config.lightColor} onChange={(v) => store.update({ lightColor: v })} />
        <ColorRow label="surfaceColor" value={config.surfaceColor} onChange={(v) => store.update({ surfaceColor: v })} />
        <ColorRow label="background" value={config.backgroundColor} onChange={(v) => store.update({ backgroundColor: v })} />
      </Section>
    </DevPanelShell>
  );
}
