"use client";

// Development-only panel for the How-it-works wrap: shows the live scrubbed
// pose while you scroll, and an Override toggle that freezes the model at
// the current pose so the sliders can nudge it. Copy JSON exports whatever
// pose is showing. Renders nothing in production.

import { useEffect, useState } from "react";
import { INITIAL_POSE, type Pose } from "./dish-pose";
import { CheckboxRow, Section, SliderRow, DevPanelShell } from "./dev-panel-ui";

const round = (p: Pose): Pose => ({
  x: +p.x.toFixed(3),
  y: +p.y.toFixed(3),
  rx: +p.rx.toFixed(3),
  ry: +p.ry.toFixed(3),
  rz: +p.rz.toFixed(3),
  scale: +p.scale.toFixed(3),
});

export function PoseDevPanel({
  poseRef,
  overrideRef,
  invalidateRef,
}: {
  poseRef: React.MutableRefObject<Pose>;
  overrideRef: React.MutableRefObject<Pose | null>;
  invalidateRef: React.MutableRefObject<(() => void) | null>;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [overriding, setOverriding] = useState(false);
  // Starts from INITIAL_POSE (refs can't be read during render); the live
  // readout interval syncs it to the real scrubbed pose within 100ms of open.
  const [pose, setPose] = useState<Pose>(INITIAL_POSE);

  // Live readout while the timeline owns the pose.
  useEffect(() => {
    if (!open || overriding) return;
    const timer = setInterval(() => setPose(round(poseRef.current)), 100);
    return () => clearInterval(timer);
  }, [open, overriding, poseRef]);

  if (process.env.NODE_ENV !== "development") return null;

  const setOverride = (on: boolean) => {
    setOverriding(on);
    if (on) {
      const frozen = round(poseRef.current);
      setPose(frozen);
      overrideRef.current = { ...frozen };
    } else {
      overrideRef.current = null;
    }
    invalidateRef.current?.();
  };

  const update = (patch: Partial<Pose>) => {
    const next = { ...pose, ...patch };
    setPose(next);
    if (overrideRef.current) {
      Object.assign(overrideRef.current, next);
      invalidateRef.current?.();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(pose, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — dev tool only, safe to ignore
    }
  };

  const slider = (key: keyof Pose, min: number, max: number, step = 0.005) => (
    <SliderRow label={key} value={pose[key]} min={min} max={max} step={step} onChange={(v) => update({ [key]: v })} />
  );

  return (
    <DevPanelShell
      title="Pose"
      label="Wrap pose"
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
      <Section title="Mode">
        <CheckboxRow label="override" checked={overriding} onChange={setOverride} />
        {!overriding && (
          <p className="py-1 text-[10px] leading-snug text-fern">
            Live scrub values. Scroll to the moment you want, then tick override to freeze and tweak.
          </p>
        )}
      </Section>
      <Section title="Position (viewport fractions)">
        {slider("x", -0.6, 0.6)}
        {slider("y", -0.6, 0.6)}
      </Section>
      <Section title="Rotation (rad)">
        {slider("rx", -7, 7, 0.01)}
        {slider("ry", -7, 7, 0.01)}
        {slider("rz", -7, 7, 0.01)}
      </Section>
      <Section title="Scale">{slider("scale", 0.05, 2.5, 0.01)}</Section>
    </DevPanelShell>
  );
}
