"use client";

// Lazy-mounted wrapper around <Beams />: three.js/r3f/drei only ship to the
// client (ssr: false — static export has no WebGL at build time) and only
// mount once the card is about to scroll into view, matching the visibility
// gating the other micro-demos use. Torn down again off-screen so the WebGL
// context isn't kept alive for cards the visitor has scrolled past.
//
// Two things start well ahead of the card actually being visible, so the
// chunk fetch + shader compile don't happen while the user is looking at it:
// the "./beams" module is prefetched on mount regardless of scroll position,
// and the observer fires MOUNT_MARGIN early via rootMargin rather than at
// 0px, giving the WebGL context time to spin up off-screen.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { bentoBeamsStore } from "./beams-store";

const Beams = dynamic(() => import("./beams"), { ssr: false });

const MOUNT_MARGIN = "640px 0px";

export function BentoBeams() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const config = bentoBeamsStore.useConfig();

  useEffect(() => {
    import("./beams");
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
      rootMargin: MOUNT_MARGIN,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0">
      {inView && !reduce && (
        <Beams
          beamWidth={config.beamWidth}
          beamHeight={config.beamHeight}
          beamNumber={config.beamNumber}
          lightColor={config.lightColor}
          speed={config.speed}
          noiseIntensity={config.noiseIntensity}
          scale={config.scale}
          rotation={config.rotation}
          backgroundColor={config.backgroundColor}
          surfaceColor={config.surfaceColor}
          roughness={config.roughness}
          metalness={config.metalness}
          envMapIntensity={config.envMapIntensity}
          ambientIntensity={config.ambientIntensity}
          directionalIntensity={config.directionalIntensity}
          cameraDistance={config.cameraDistance}
          cameraFov={config.cameraFov}
          className="effect-reveal h-full w-full"
        />
      )}
    </div>
  );
}
