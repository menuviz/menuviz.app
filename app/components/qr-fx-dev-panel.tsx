"use client";

// Development-only control panel for the QR card's pre-focus degradation
// (see qr-fx-store.ts). Tick "preview degraded" to hold the card in its
// fully unfocused state while tuning — otherwise the effect only shows in
// the moment before the brackets lock (t≈38–50). Renders nothing in
// production.

import { useState } from "react";
import type { HalftoneBlend, QrFxStore } from "./qr-fx-store";
import { CheckboxRow, Section, SelectRow, SliderRow, DevPanelShell } from "./dev-panel-ui";

const BLENDS: readonly HalftoneBlend[] = ["multiply", "overlay", "darken", "normal"];

export function QrFxDevPanel({ store }: { store: QrFxStore }) {
  const config = store.useConfig();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  const handleCopy = async () => {
    try {
      const { preview: _preview, ...values } = config;
      await navigator.clipboard.writeText(JSON.stringify(values, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — dev tool only, safe to ignore
    }
  };

  return (
    <DevPanelShell
      title="QR focus"
      label="QR focus"
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
            onClick={handleCopy}
            className="flex-1 rounded bg-emerald py-1.5 text-[11px] font-medium text-ink-emerald hover:bg-emerald-deep"
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </>
      }
    >
      <Section title="Mode">
        <CheckboxRow
          label="preview"
          checked={config.preview}
          onChange={(v) => store.update({ preview: v })}
        />
        {!config.preview && (
          <p className="py-1 text-[10px] leading-snug text-fern">
            Tick preview to hold the card fully degraded while you tune; untick to hand it back to the
            scroll (focus resolves as the brackets lock).
          </p>
        )}
      </Section>
      <Section title="Blur">
        <SliderRow label="blurPx" value={config.blurPx} min={0} max={14} step={0.5} onChange={(v) => store.update({ blurPx: v })} />
        <SliderRow label="contrast" value={config.contrast} min={1} max={2} step={0.05} onChange={(v) => store.update({ contrast: v })} />
      </Section>
      <Section title="Halftone">
        <SliderRow label="opacity" value={config.halftoneOpacity} min={0} max={1} step={0.05} onChange={(v) => store.update({ halftoneOpacity: v })} />
        <SliderRow label="cell px" value={config.halftoneSizePx} min={2} max={16} step={0.5} onChange={(v) => store.update({ halftoneSizePx: v })} />
        <SliderRow label="dot size" value={config.halftoneDot} min={0.1} max={0.9} step={0.05} onChange={(v) => store.update({ halftoneDot: v })} />
        <SelectRow label="blend" value={config.halftoneBlend} options={BLENDS} onChange={(v) => store.update({ halftoneBlend: v })} />
      </Section>
      <Section title="Dither">
        <SliderRow label="opacity" value={config.ditherOpacity} min={0} max={1} step={0.05} onChange={(v) => store.update({ ditherOpacity: v })} />
        <SliderRow label="grain" value={config.ditherFreq} min={0.2} max={1.4} step={0.05} onChange={(v) => store.update({ ditherFreq: v })} />
        <SliderRow label="tile px" value={config.ditherScalePx} min={32} max={256} step={8} onChange={(v) => store.update({ ditherScalePx: v })} />
      </Section>
    </DevPanelShell>
  );
}
