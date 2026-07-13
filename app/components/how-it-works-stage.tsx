"use client";

// Pinned scroll-driven How-it-works stage (md+ with motion allowed only —
// the matchMedia below is the sole guard; the parent handles rendering the
// card fallback). A ~400vh track holds a sticky 100vh stage; one scrubbed
// GSAP timeline drives backdrop chapter colors, the intro heading, the three
// step texts, the props, and (via poseRef, applied in the canvas's useFrame)
// the wrap model. GSAP tweens the plain pose object — never React state — so
// scrubbing causes zero re-renders.

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { steps } from "./how-it-works";
import { INITIAL_POSE, type Pose } from "./dish-pose";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MM_STAGE = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

export function HowItWorksStage() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const poseRef = useRef<Pose>({ ...INITIAL_POSE });
  const invalidateRef = useRef<(() => void) | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MM_STAGE, () => {
        const p = poseRef.current;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: trackRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
          onUpdate: () => invalidateRef.current?.(),
        });

        // Backdrop chapters
        tl.fromTo('[data-hiw="bg-black"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 7 }, 33);
        tl.fromTo('[data-hiw="bg-mint"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 7 }, 63);

        // Intro heading
        tl.fromTo(
          '[data-hiw="heading"]',
          { autoAlpha: 1, y: 0, filter: "blur(0px)" },
          { autoAlpha: 0, y: -40, filter: "blur(6px)", duration: 5 },
          8
        );

        // Step texts: blur-crossfade in, out (text3 stays for the outro)
        const textIn = { autoAlpha: 0, y: 28, filter: "blur(8px)" };
        tl.fromTo('[data-hiw="text-0"]', textIn, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 5 }, 12);
        tl.to('[data-hiw="text-0"]', { autoAlpha: 0, y: -28, filter: "blur(8px)", duration: 5 }, 28);
        tl.fromTo('[data-hiw="text-1"]', textIn, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 5 }, 40);
        tl.to('[data-hiw="text-1"]', { autoAlpha: 0, y: -28, filter: "blur(8px)", duration: 5 }, 58);
        tl.fromTo('[data-hiw="text-2"]', textIn, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 5 }, 72);

        // Wrap pose choreography (applied by the canvas in Task 3; tweening
        // it now is harmless and keeps all timing in one place).
        tl.to(p, { y: -0.05, x: 0.22, scale: 1.35, rx: 0.2, duration: 14 }, 0); // rise + settle right
        // Continuous scrubbed turn; spanning 0-100 also anchors the timeline
        // at exactly 100 units, so every position number reads as a
        // percentage of the pinned scroll.
        tl.to(p, { ry: 6.5, duration: 100 }, 0);
        tl.to(p, { x: -0.3, y: -0.02, scale: 0.6, duration: 10 }, 28); // sweep left, shrink
        tl.to(p, { x: 0, scale: 0.95, duration: 12 }, 58); // drift back to center, grow
        tl.to(p, { scale: 0.5, y: -0.02, duration: 10 }, 70); // settle into the phone
      });
    },
    { scope: trackRef }
  );

  return (
    <div ref={trackRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Backdrop chapters: base deep green, then near-black, then mint wash */}
        <div aria-hidden="true" className="absolute inset-0 bg-[#0c2016]" />
        <div aria-hidden="true" data-hiw="bg-black" className="absolute inset-0 bg-[#040604] opacity-0" />
        <div
          aria-hidden="true"
          data-hiw="bg-mint"
          className="absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(130% 130% at 15% 0%, #eaf6e6 0%, #cfeccf 45%, #7cc79b 100%)",
          }}
        />

        {/* Canvas layer mounts here in Task 3 (z-20) */}

        {/* Props layer (QR card, phone frame) arrives in Task 4 (z-10) */}

        {/* Text layer */}
        <div className="relative z-30 h-full">
          <h2
            data-hiw="heading"
            className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-center font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.02em] text-phosphor"
          >
            How it works
          </h2>

          <div data-hiw="text-0" className="absolute left-[8%] top-1/2 max-w-md -translate-y-1/2 opacity-0">
            <h3 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.018em] text-mint">
              {steps[0].title}
            </h3>
            <p className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-sage">{steps[0].body}</p>
          </div>

          <div data-hiw="text-1" className="absolute left-[8%] top-1/2 max-w-md -translate-y-1/2 opacity-0">
            <h3 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.018em] text-mint">
              {steps[1].title}
            </h3>
            <p className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-sage">{steps[1].body}</p>
          </div>

          {/* Chapter 3 sits on the light mint wash, so its text flips dark
              (same ink pair the bento's wash card uses). */}
          <div data-hiw="text-2" className="absolute left-[8%] top-1/2 max-w-md -translate-y-1/2 opacity-0">
            <h3 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.018em] text-[#132018]">
              {steps[2].title}
            </h3>
            <p className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-[#3d5a48]">{steps[2].body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
