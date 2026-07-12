"use client";

// Shared control primitives for dev-only tuning panels (see
// gradient-glow-dev-panel.tsx and beams-dev-panel.tsx) — kept in one place
// so the panels stay visually identical without copy-pasted markup.

import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-fern-deep">{title}</div>
      {children}
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 py-1 text-[11px] text-sage">
      <span className="w-20 shrink-0 text-fern">{label}</span>
      {children}
    </label>
  );
}

export function SliderRow({
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

export function SelectRow<T extends string>({
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

export function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-emerald" />
    </Row>
  );
}

export function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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

export function DevPanelShell({
  title,
  label,
  open,
  onOpen,
  onClose,
  children,
  footer,
}: {
  title: string;
  label: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="font-sans text-phosphor">
      {open ? (
        <div className="flex max-h-[82vh] w-[300px] flex-col overflow-hidden rounded-lg border border-hairline bg-carbon/95 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-moss">
              {title} — {label}
            </span>
            <button type="button" onClick={onClose} className="px-1 text-fern hover:text-phosphor" aria-label="Close">
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">{children}</div>
          <div className="flex items-center gap-2 border-t border-hairline px-3 py-2">{footer}</div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full border border-hairline bg-carbon/90 px-3 py-2 text-[11px] font-medium text-moss shadow-lg hover:border-emerald hover:text-phosphor"
        >
          {label} ⚙
        </button>
      )}
    </div>
  );
}
