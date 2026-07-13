"use client";

// Development-only panel for the How-it-works scene state (lights, camera,
// ground shadow) — the StageState counterpart of pose-dev-panel.tsx. Shows
// the live scrubbed values, and an Override toggle that freezes the scene so
// the sliders can tune it; Copy JSON exports whatever is showing. While
// overriding, the timeline's onUpdate no longer runs the shadow applier, so
// every change re-applies it (and invalidates the canvas) directly.

import { useEffect, useState } from "react";
import { INITIAL_STAGE, type StageState } from "./stage-state";
import { CheckboxRow, ColorRow, Section, SliderRow, DevPanelShell } from "./dev-panel-ui";

// GSAP color-tweens write rgba(...) strings into the stage object mid-tween;
// <input type="color"> only accepts #rrggbb, so normalize for display.
const toHex = (css: string): string => {
  if (css.startsWith("#")) {
    if (css.length === 4) return `#${css[1]}${css[1]}${css[2]}${css[2]}${css[3]}${css[3]}`;
    return css;
  }
  const m = css.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "#ffffff";
  const hex = (n: string) => (+n).toString(16).padStart(2, "0");
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
};

const round = (s: StageState): StageState => ({
  keyIntensity: +s.keyIntensity.toFixed(3),
  ambientIntensity: +s.ambientIntensity.toFixed(3),
  rimIntensity: +s.rimIntensity.toFixed(3),
  keyColor: toHex(s.keyColor),
  ambientColor: toHex(s.ambientColor),
  camZ: +s.camZ.toFixed(3),
  camFov: +s.camFov.toFixed(2),
  shadowOpacity: +s.shadowOpacity.toFixed(3),
  shadowScale: +s.shadowScale.toFixed(3),
  shadowOffset: +s.shadowOffset.toFixed(3),
  dishBlur: +s.dishBlur.toFixed(2),
});

export function StageDevPanel({
  stageRef,
  overrideRef,
  progressRef,
  invalidateRef,
  applyShadowRef,
}: {
  stageRef: React.MutableRefObject<StageState>;
  overrideRef: React.MutableRefObject<StageState | null>;
  progressRef: React.MutableRefObject<number>;
  invalidateRef: React.MutableRefObject<(() => void) | null>;
  applyShadowRef: React.MutableRefObject<(() => void) | null>;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [stage, setStage] = useState<StageState>(INITIAL_STAGE);
  const [progress, setProgress] = useState(0);

  // Live readout while the timeline owns the scene.
  useEffect(() => {
    if (!open || overriding) return;
    const timer = setInterval(() => setStage(round(stageRef.current)), 100);
    return () => clearInterval(timer);
  }, [open, overriding, stageRef]);

  // Same 0-100 timeline scale the tween positions use, so tuned values can
  // be pinned to their beat.
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setProgress(+progressRef.current.toFixed(1)), 100);
    return () => clearInterval(timer);
  }, [open, progressRef]);

  if (process.env.NODE_ENV !== "development") return null;

  const repaint = () => {
    applyShadowRef.current?.();
    invalidateRef.current?.();
  };

  const setOverride = (on: boolean) => {
    setOverriding(on);
    if (on) {
      const frozen = round(stageRef.current);
      setStage(frozen);
      overrideRef.current = { ...frozen };
    } else {
      overrideRef.current = null;
    }
    repaint();
  };

  const update = (patch: Partial<StageState>) => {
    const next = { ...stage, ...patch };
    setStage(next);
    if (overrideRef.current) {
      Object.assign(overrideRef.current, next);
      repaint();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ t: progress, ...stage }, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — dev tool only, safe to ignore
    }
  };

  const slider = (key: keyof StageState, min: number, max: number, step = 0.01) => (
    <SliderRow
      label={key}
      value={stage[key] as number}
      min={min}
      max={max}
      step={step}
      onChange={(v) => update({ [key]: v })}
    />
  );

  return (
    <DevPanelShell
      title="Stage"
      label="Scene state"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      footer={
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded bg-emerald py-1.5 text-[11px] font-medium text-ink-emerald hover:bg-emerald-deep"
        >
          {copied ? "Copied" : "Copy JSON"}
        </button>
      }
    >
      <Section title="Scroll">
        <div className="flex items-center justify-between py-1 text-[11px]">
          <span className="text-fern">timeline t</span>
          <span className="font-mono text-[11px] text-moss">{progress.toFixed(1)} / 100</span>
        </div>
      </Section>
      <Section title="Mode">
        <CheckboxRow label="override" checked={overriding} onChange={setOverride} />
        {!overriding && (
          <p className="py-1 text-[10px] leading-snug text-fern">
            Live scrub values. Scroll to the moment you want, then tick override to freeze and tweak.
          </p>
        )}
      </Section>
      <Section title="Lights">
        {slider("keyIntensity", 0, 4)}
        {slider("ambientIntensity", 0, 3)}
        {slider("rimIntensity", 0, 2)}
        <ColorRow label="keyColor" value={stage.keyColor} onChange={(v) => update({ keyColor: v })} />
        <ColorRow
          label="ambientColor"
          value={stage.ambientColor}
          onChange={(v) => update({ ambientColor: v })}
        />
      </Section>
      <Section title="Camera">
        {slider("camZ", 4.5, 7)}
        {slider("camFov", 24, 45, 0.1)}
      </Section>
      <Section title="Shadow">
        {slider("shadowOpacity", 0, 1)}
        {slider("shadowScale", 0.3, 2.5)}
        {slider("shadowOffset", 0, 0.4, 0.005)}
      </Section>
      <Section title="Focus">{slider("dishBlur", 0, 16, 0.1)}</Section>
    </DevPanelShell>
  );
}
