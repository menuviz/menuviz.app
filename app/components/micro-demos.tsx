"use client";

// Micro-demos: tiny looping simulations of the product for the How-it-works
// and bento sections. Each one is decorative (aria-hidden); the real claims
// stay in the surrounding headings and copy. All loops are gated by an
// IntersectionObserver (nothing animates off-screen) and freeze at a
// meaningful static frame under prefers-reduced-motion.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { QrCode } from "./qr-code";
import { dishes } from "./menu-data";

export function useDemoLoop(durations: readonly number[]) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [inView, setInView] = useState(false);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !inView) return;
    const timer = setTimeout(() => {
      if (phase + 1 === durations.length) {
        setCycle((c) => c + 1);
        setPhase(0);
      } else {
        setPhase(phase + 1);
      }
    }, durations[phase]);
    return () => clearTimeout(timer);
  }, [phase, inView, reduce, durations]);

  return { ref, phase, cycle, inView, reduce };
}

function Tick({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 text-emerald ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 6.5 5 9l4.5-5.5" />
    </svg>
  );
}

/** Rolls the last digit of a price between 5 and 6 ($15 -> $16). */
function RollDigit({ up }: { up: boolean }) {
  return (
    <span className="inline-block h-[1.2em] overflow-hidden align-text-bottom">
      <span
        className={`flex flex-col transition-transform duration-300 ease-out-quart ${
          up ? "-translate-y-1/2" : ""
        }`}
      >
        <span className="h-[1.2em] leading-[1.2em]">5</span>
        <span className="h-[1.2em] leading-[1.2em]">6</span>
      </span>
    </span>
  );
}

const burger = dishes[0];

/* ---------------- How it works ---------------- */

const EDITOR_PHASES = [1500, 800, 800, 2900] as const;

export function EditorDemo() {
  const { ref, phase: raw, cycle, reduce } = useDemoLoop(EDITOR_PHASES);
  const phase = reduce ? 3 : raw;
  return (
    <div ref={ref} aria-hidden="true" className="flex h-28 items-center">
      <div className="w-full max-w-[230px] rounded-lg border border-hairline bg-ground p-3">
        <div className="flex items-center gap-3">
          <div
            className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-md ${
              phase >= 1 ? "" : "border border-dashed border-pine"
            }`}
          >
            {phase >= 1 && (
              <Image
                src={burger.img}
                alt=""
                width={44}
                height={44}
                className="demo-pop h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-mint">
              <span
                key={`type-${cycle}`}
                className={`inline-block overflow-hidden whitespace-nowrap align-bottom ${
                  phase === 0 && !reduce ? "demo-typing" : ""
                }`}
              >
                Smash burger
              </span>
            </p>
            <p
              className={`mt-0.5 text-[11px] tabular-nums text-sage-dim transition-opacity duration-300 ${
                phase >= 2 ? "opacity-100" : "opacity-0"
              }`}
            >
              $15
            </p>
          </div>
        </div>
        <div
          className={`mt-2.5 flex items-center gap-1.5 border-t border-hairline pt-2 transition-opacity duration-300 ${
            phase >= 3 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Tick />
          <span className="text-[10px] font-medium text-emerald">Saved</span>
        </div>
      </div>
    </div>
  );
}

const STAMP_PHASES = [900, 3400] as const;

export function StampDemo() {
  const { ref, phase: raw, reduce } = useDemoLoop(STAMP_PHASES);
  const phase = reduce ? 1 : raw;
  return (
    <div ref={ref} aria-hidden="true" className="flex h-28 items-center">
      <div className="rounded-xl border border-dashed border-pine p-2.5">
        <div
          className={`w-[72px] rounded-md bg-[#fdfefd] p-1.5 text-[#111511] transition-[transform,box-shadow] duration-500 ease-out-quart ${
            phase === 0
              ? "-translate-y-2 scale-[1.12] shadow-[0_16px_26px_-10px_rgba(0,0,0,0.75)]"
              : "translate-y-0 scale-100 shadow-[0_3px_8px_-5px_rgba(0,0,0,0.8)]"
          }`}
        >
          <QrCode />
        </div>
      </div>
    </div>
  );
}

const PHONE_PHASES = [4000] as const;

export function MiniPhoneDemo() {
  const { ref, inView, reduce } = useDemoLoop(PHONE_PHASES);
  return (
    <div ref={ref} aria-hidden="true" className="flex h-28 items-center">
      <div className="w-[100px] rounded-[18px] border border-circuit/70 bg-carbon p-1">
        <div className="h-[102px] overflow-hidden rounded-[14px] bg-[#0b0e0c] p-1.5">
          <div
            className={`grid grid-cols-2 gap-1 ${reduce ? "" : "demo-scroll"}`}
            style={{ animationPlayState: inView ? "running" : "paused" }}
          >
            {[...dishes, ...dishes].map((dish, i) => (
              <div key={i} className="overflow-hidden rounded-[5px] bg-ground">
                <Image
                  src={dish.img}
                  alt=""
                  width={44}
                  height={44}
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bento ---------------- */

const PRICE_PHASES = [1900, 500, 700, 2600, 600] as const;

export function PriceSyncDemo() {
  const { ref, phase: raw, reduce } = useDemoLoop(PRICE_PHASES);
  const phase = reduce ? 3 : raw;
  const editorUp = phase >= 1 && phase <= 3;
  const menuUp = phase >= 2 && phase <= 3;
  return (
    <div ref={ref} aria-hidden="true" className="flex items-center justify-center gap-3 sm:gap-4">
      <div className="w-[150px] rounded-lg border border-hairline bg-carbon/60 p-3">
        <p className="text-[11px] font-medium text-mint">Mozzarella sticks</p>
        <div className="mt-2 flex items-center justify-between rounded-md border border-pine px-2.5 py-1.5">
          <span className="text-[12px] text-sage-dim">−</span>
          <span className="text-[12px] font-medium tabular-nums text-mint">
            $1
            <RollDigit up={editorUp} />
          </span>
          <span
            className={`text-[12px] transition-colors duration-150 ${
              phase === 1 ? "text-emerald" : "text-sage-dim"
            }`}
          >
            +
          </span>
        </div>
      </div>
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 shrink-0 text-sage-dim"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 8h11M9 4l4 4-4 4" />
      </svg>
      <div className="w-[104px] overflow-hidden rounded-lg border border-hairline bg-ground">
        <Image
          src="/images/dishes/mozzarella-sticks.png"
          alt=""
          width={104}
          height={64}
          className="h-16 w-full object-cover"
        />
        <div className="p-2">
          <p className="text-[10px] font-medium leading-snug text-mint">Mozzarella sticks</p>
          <p
            className={`mt-0.5 text-[10px] tabular-nums text-sage-dim ${
              phase === 2 ? "demo-pulse" : ""
            }`}
          >
            $1
            <RollDigit up={menuUp} />
          </p>
        </div>
      </div>
    </div>
  );
}

const LOAD_PHASES = [1000, 400, 3000] as const;

export function InstantLoadDemo() {
  const { ref, phase: raw, cycle, reduce } = useDemoLoop(LOAD_PHASES);
  const phase = reduce ? 2 : raw;
  return (
    <div ref={ref} aria-hidden="true" className="flex flex-col items-center gap-3">
      <div className="h-1 w-32 overflow-hidden rounded-full bg-[#132018]/15">
        <div
          key={`fill-${cycle}`}
          className={`h-full rounded-full bg-[#132018] ${
            phase === 0 && !reduce ? "demo-fill" : "w-full"
          }`}
        />
      </div>
      <div
        className={`w-[116px] overflow-hidden rounded-lg border border-white/50 bg-gradient-to-b from-white/85 to-[#e2f0e5]/65 shadow-[0_10px_24px_-12px_rgba(19,32,24,0.35)] backdrop-blur-md transition-[opacity,filter,transform] duration-300 ease-out-quart ${
          phase >= 1 ? "scale-100 opacity-100 blur-none" : "scale-95 opacity-0 blur-[4px]"
        }`}
      >
        <div className="relative h-[60px] w-full">
          <Image src="/images/dishes/fried-chicken.png" alt="" fill sizes="116px" className="object-cover" />
        </div>
        <div className="p-2 text-[#132018]">
          <p className="text-[10px] font-medium leading-snug">Fried chicken</p>
          <p className="mt-0.5 text-[10px] tabular-nums opacity-70">$14</p>
        </div>
      </div>
    </div>
  );
}

const LANG_NAMES = ["Lamb skewers", "Brochetas", "羊肉串"];
const LANG_PHASES = [2000, 2000, 2000] as const;

export function LanguageDemo() {
  const { ref, phase: raw, reduce } = useDemoLoop(LANG_PHASES);
  const phase = reduce ? 0 : raw;
  return (
    <div ref={ref} aria-hidden="true" className="flex justify-center">
      <div className="flex w-[180px] items-center gap-2.5 rounded-lg border border-white/50 bg-gradient-to-br from-white/85 to-[#e2f0e5]/60 p-2.5 text-[#132018] shadow-[0_10px_24px_-12px_rgba(19,32,24,0.3)] backdrop-blur-md">
        <Image
          src={dishes[2].img}
          alt=""
          width={38}
          height={38}
          className="h-[38px] w-[38px] shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <p key={`lang-${phase}`} className="demo-swap truncate text-[11px] font-medium">
            {LANG_NAMES[phase]}
          </p>
          <p className="mt-0.5 text-[10px] tabular-nums opacity-70">$18</p>
        </div>
      </div>
    </div>
  );
}

const LOC_NAMES = ["Downtown", "Harbor", "Airport"];
const LOC_PHASES = [2000, 350, 350, 2900, 600] as const;

export function LocationRippleDemo() {
  const { ref, phase: raw, reduce } = useDemoLoop(LOC_PHASES);
  const phase = reduce ? 3 : raw;
  return (
    <div ref={ref} aria-hidden="true" className="flex justify-center gap-2">
      {LOC_NAMES.map((loc, i) => {
        const updated = phase >= i + 1 && phase <= 3;
        return (
          <div key={loc} className="w-[72px] rounded-md border border-hairline bg-carbon/60 p-2">
            <p className="truncate text-[9px] font-medium uppercase tracking-[0.08em] text-sage-dim">
              {loc}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium tabular-nums text-mint">
                $1
                <RollDigit up={updated} />
              </span>
              <Tick
                className={`transition-opacity duration-300 ${updated ? "opacity-100" : "opacity-0"}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
