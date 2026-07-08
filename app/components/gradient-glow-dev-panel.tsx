"use client";

// Development-only control panel for live-tweaking <GradientGlow />. Renders
// nothing in production (the NODE_ENV check lets the bundler dead-code-
// eliminate the whole panel body from the prod build). Edits go through the
// gradient-glow-store, which GradientGlow reads without re-mounting the
// canvas, so sliders feel instant.

import { useState, type ReactNode } from "react";
import type { GradientGlowStore } from "./gradient-glow-store";
import { DIRECTIONS, GRAD_MAPS, PEAK_COUNTS } from "./gradient-glow";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-fern-deep">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 py-1 text-[11px] text-sage">
      <span className="w-20 shrink-0 text-fern">{label}</span>
      {children}
    </label>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={label}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 accent-emerald"
      />
      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-moss">{value.toFixed(2)}</span>
    </Row>
  );
}

function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <Row label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="flex-1 rounded border border-hairline bg-ground px-1.5 py-1 text-[11px] text-phosphor"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </Row>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-emerald" />
    </Row>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-10 shrink-0 cursor-pointer rounded border border-hairline bg-transparent p-0"
      />
      <span className="font-mono text-[10px] text-moss">{value}</span>
    </Row>
  );
}

export function GradientGlowDevPanel({
  store,
  label,
  showRandomize = false,
}: {
  store: GradientGlowStore;
  label: string;
  showRandomize?: boolean;
}) {
  const config = store.useConfig();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify({ layer: config.layer, state: config.state, anim: config.anim }, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — dev tool only, safe to ignore
    }
  };

  return (
    <div className="font-sans text-phosphor">
      {open ? (
        <div className="flex max-h-[82vh] w-[320px] flex-col overflow-hidden rounded-lg border border-hairline bg-carbon/95 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-moss">Gradient — {label}</span>
            <button type="button" onClick={() => setOpen(false)} className="px-1 text-fern hover:text-phosphor" aria-label="Close">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            <Section title="Layer">
              <SelectRow label="direction" value={config.layer.direction} options={DIRECTIONS} onChange={(v) => store.updateLayer({ direction: v })} />
              <SelectRow label="peakCount" value={config.layer.peakCount} options={PEAK_COUNTS} onChange={(v) => store.updateLayer({ peakCount: v })} />
              <SelectRow label="gradMap" value={config.layer.gradMap} options={GRAD_MAPS} onChange={(v) => store.updateLayer({ gradMap: v })} />
              <CheckboxRow label="mirror" checked={config.layer.mirror} onChange={(v) => store.updateLayer({ mirror: v })} />
              <SliderRow label="count" value={config.layer.count} min={4} max={40} step={1} onChange={(v) => store.updateLayer({ count: v })} />
              <SliderRow label="depth (min)" value={config.layer.depth} min={0} max={0.3} step={0.01} onChange={(v) => store.updateLayer({ depth: v })} />
              <SliderRow label="maxH" value={config.layer.maxH} min={0.3} max={1.3} step={0.01} onChange={(v) => store.updateLayer({ maxH: v })} />
              <SliderRow label="peakPos" value={config.layer.peakPos} min={0} max={1} step={0.01} onChange={(v) => store.updateLayer({ peakPos: v })} />
              <SliderRow label="curveExp" value={config.layer.curveExp} min={0.2} max={4} step={0.05} onChange={(v) => store.updateLayer({ curveExp: v })} />
              <SliderRow label="waveFreq" value={config.layer.waveFreq} min={1} max={10} step={1} onChange={(v) => store.updateLayer({ waveFreq: v })} />
              <SliderRow label="widthExp" value={config.layer.widthExp} min={-2} max={2} step={0.05} onChange={(v) => store.updateLayer({ widthExp: v })} />
              <SliderRow label="gap" value={config.layer.gap} min={0} max={0.45} step={0.01} onChange={(v) => store.updateLayer({ gap: v })} />
              <SliderRow label="capRound" value={config.layer.capRound} min={0} max={1} step={0.01} onChange={(v) => store.updateLayer({ capRound: v })} />
              <SliderRow label="pointness" value={config.layer.pointness} min={0} max={1} step={0.01} onChange={(v) => store.updateLayer({ pointness: v })} />
              <SliderRow label="jitter" value={config.layer.jitter} min={0} max={1} step={0.01} onChange={(v) => store.updateLayer({ jitter: v })} />
              <SliderRow label="hueDrift" value={config.layer.hueDrift} min={-60} max={60} step={1} onChange={(v) => store.updateLayer({ hueDrift: v })} />
              <SliderRow label="hueRotate" value={config.layer.hueRotate} min={-180} max={180} step={1} onChange={(v) => store.updateLayer({ hueRotate: v })} />
              <SliderRow label="opacity" value={config.layer.opacity} min={0} max={1} step={0.01} onChange={(v) => store.updateLayer({ opacity: v })} />
            </Section>

            <Section title="Shading">
              <ColorRow label="bgColor" value={config.state.bgColor} onChange={(v) => store.updateState({ bgColor: v })} />
              <SliderRow label="margin" value={config.state.margin} min={0} max={0.25} step={0.005} onChange={(v) => store.updateState({ margin: v })} />
              <SliderRow label="grain" value={config.state.grainIntensity} min={0} max={1} step={0.01} onChange={(v) => store.updateState({ grainIntensity: v })} />
              <SliderRow label="shadow" value={config.state.shadowStrength} min={0} max={1} step={0.01} onChange={(v) => store.updateState({ shadowStrength: v })} />
              <SliderRow label="edge" value={config.state.edgeStrength} min={0} max={1} step={0.01} onChange={(v) => store.updateState({ edgeStrength: v })} />
              <SliderRow label="seam" value={config.state.sideLineStrength} min={0} max={0.3} step={0.005} onChange={(v) => store.updateState({ sideLineStrength: v })} />
            </Section>

            <Section title="Animation">
              <SliderRow label="hue deg" value={config.anim.hueDriftDeg} min={0} max={40} step={1} onChange={(v) => store.updateAnim({ hueDriftDeg: v })} />
              <SliderRow label="period (s)" value={config.anim.hueDriftPeriodS} min={5} max={120} step={1} onChange={(v) => store.updateAnim({ hueDriftPeriodS: v })} />
              <SliderRow label="frame (ms)" value={config.anim.frameIntervalMs} min={16} max={200} step={1} onChange={(v) => store.updateAnim({ frameIntervalMs: v })} />
              <CheckboxRow label="paused" checked={config.anim.paused} onChange={(v) => store.updateAnim({ paused: v })} />
            </Section>

            <Section title="Stops">
              {config.layer.stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => {
                      const stops = config.layer.stops.map((s, j) => (j === i ? { ...s, color: e.target.value } : s));
                      store.updateLayer({ stops });
                    }}
                    className="h-6 w-6 shrink-0 cursor-pointer rounded border border-hairline bg-transparent p-0"
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={stop.pos}
                    onChange={(e) => {
                      const stops = config.layer.stops.map((s, j) => (j === i ? { ...s, pos: Number(e.target.value) } : s));
                      store.updateLayer({ stops });
                    }}
                    className="h-1 flex-1 accent-emerald"
                  />
                  <span className="w-8 shrink-0 text-right font-mono text-[10px] text-moss">{stop.pos.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => store.updateLayer({ stops: config.layer.stops.filter((_, j) => j !== i) })}
                    disabled={config.layer.stops.length <= 2}
                    className="shrink-0 px-1 text-fern-deep hover:text-phosphor disabled:opacity-30"
                    aria-label="Remove stop"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => store.updateLayer({ stops: [...config.layer.stops, { pos: 1, color: "#2f9e6e" }] })}
                className="mt-1 text-[10px] text-fern hover:text-phosphor"
              >
                + add stop
              </button>
            </Section>
          </div>

          <div className="flex items-center gap-2 border-t border-hairline px-3 py-2">
            <button
              type="button"
              onClick={store.reset}
              className="flex-1 rounded border border-hairline py-1.5 text-[11px] text-sage hover:border-emerald hover:text-phosphor"
            >
              Reset
            </button>
            {showRandomize && (
              <button
                type="button"
                onClick={store.randomize}
                className="flex-1 rounded border border-hairline py-1.5 text-[11px] text-sage hover:border-emerald hover:text-phosphor"
              >
                Randomize
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded bg-emerald py-1.5 text-[11px] font-medium text-ink-emerald hover:bg-emerald-deep"
            >
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-hairline bg-carbon/90 px-3 py-2 text-[11px] font-medium text-moss shadow-lg hover:border-emerald hover:text-phosphor"
        >
          {label} ⚙
        </button>
      )}
    </div>
  );
}
