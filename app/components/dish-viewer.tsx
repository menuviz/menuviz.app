"use client";

// Same text-crossfades-into-photo-card micro-demo the other bento cards use
// (see EditorDemo/PriceSyncDemo in micro-demos.tsx for the sibling pattern)
// — except the "photo" slot is the actual fried-chicken-wrap GLB, spinning,
// served straight from the diner app's CDN (cdn.menuviz.app, R2 bucket
// menuviz-assets, "ouii" brand namespace) rather than bundled into this
// repo's static export. three.js/r3f/drei ship client-only (ssr: false —
// static export has no WebGL at build time) and only mount once the card
// scrolls into view. Reduced motion freezes on the photo-card phase with no
// spin, same as the phase freeze every other micro-demo already does.

import dynamic from "next/dynamic";
import { useDemoLoop } from "./micro-demos";

// Via webgl-bundle so three.js is shared with the other WebGL consumers
// instead of duplicated into this chunk — see webgl-bundle.ts.
const DishModel = dynamic(() => import("./webgl-bundle").then((m) => m.DishModel), {
  ssr: false,
});

const DISH_URL = "https://cdn.menuviz.app/ouii/models/dishes/fried-chicken-wrap.glb";
const T2P_PHASES = [2400, 3200] as const;

export function DishViewer() {
  const { ref, phase: raw, inView, reduce } = useDemoLoop(T2P_PHASES);
  const phase = reduce ? 1 : raw;

  return (
    <div ref={ref} aria-hidden="true" className="relative flex h-[176px] items-center justify-center">
      <div
        className={`absolute flex w-[180px] justify-between border-b border-hairline pb-1.5 text-[12px] text-sage transition-[opacity,filter] duration-[400ms] ease-out-quart ${
          phase === 0 ? "opacity-100 blur-none" : "opacity-0 blur-[3px]"
        }`}
      >
        <span>Fried chicken wrap</span>
        <span className="tabular-nums">$12</span>
      </div>
      <div
        className={`w-[148px] overflow-hidden rounded-lg border border-hairline bg-carbon transition-[opacity,filter,transform] duration-[400ms] ease-out-quart ${
          phase === 1 ? "scale-100 opacity-100 blur-none" : "scale-[0.97] opacity-0 blur-[3px]"
        }`}
      >
        <div className="h-[104px] w-full">
          {inView && <DishModel url={DISH_URL} spin={!reduce} className="h-full w-full" />}
        </div>
        <div className="p-2">
          <p className="text-[10px] font-medium leading-snug text-mint">Fried chicken wrap</p>
          <p className="mt-0.5 text-[10px] tabular-nums text-sage-dim">$12</p>
        </div>
      </div>
    </div>
  );
}
