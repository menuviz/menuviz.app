"use client";

// Pinned scroll-driven How-it-works stage (md+ with motion allowed only —
// the matchMedia below is the sole guard; the parent handles rendering the
// card fallback). A ~400vh track holds a sticky 100vh stage; one scrubbed
// GSAP timeline drives backdrop chapter colors, the intro heading, the three
// step texts, the props, and (via poseRef, applied in the canvas's useFrame)
// the wrap model. GSAP tweens the plain pose object — never React state — so
// scrubbing causes zero re-renders.

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { steps } from "./how-it-works";
import { INITIAL_POSE, type Pose } from "./dish-pose";
import { QrCode } from "./qr-code";
import { PoseDevPanel } from "./pose-dev-panel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ScrollDishCanvas = dynamic(() => import("./scroll-dish-canvas"), { ssr: false });

const MM_STAGE = "(min-width: 48rem) and (prefers-reduced-motion: no-preference)";
const MOUNT_MARGIN = "640px 0px";

// GLB/network failure inside the canvas escapes through Suspense to the
// nearest React error boundary; fall back to the real dish photo so the
// stage never shows an empty slot.
class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full items-center justify-center">
        <Image
          src="/images/dishes/fried-chicken.png"
          alt=""
          width={420}
          height={420}
          className="w-[min(38vw,420px)] drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
        />
      </div>
    );
  }
}

export function HowItWorksStage() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const poseRef = useRef<Pose>({ ...INITIAL_POSE });
  const poseOverrideRef = useRef<Pose | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Below md (or under reduced motion) the stage never mounts, so skip the
    // chunk + GLB prefetch — phones shouldn't pay for a canvas they can't show.
    if (!window.matchMedia(MM_STAGE).matches) return;
    import("./scroll-dish-canvas"); // prefetch chunk + GLB before the section arrives
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // Mount once and keep: unlike the beams card (which animates every frame
    // and is torn down off-screen to free the GPU), this canvas renders on
    // demand only, so an idle mounted context costs nothing — and tearing it
    // down would leave the scrub without a model when scrolling back up
    // until remount, plus re-pay shader compile on every re-entry.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: MOUNT_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MM_STAGE, () => {
        const p = poseRef.current;

        // Centering lives on GSAP's own xPercent/yPercent channels (not the
        // Tailwind -translate-x/y-1/2 utilities) so the pixel y tweens below
        // compose with it instead of overwriting it when GSAP first parses
        // the computed transform.
        gsap.set('[data-hiw="heading"], [data-hiw="phone"]', { xPercent: -50, yPercent: -50 });
        gsap.set('[data-hiw="text-0"], [data-hiw="text-1"], [data-hiw="text-2"], [data-hiw="qr"]', {
          yPercent: -50,
        });

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

        // Backdrop chapters. The stage enters and exits as the page's void —
        // deep green fades in with the intro and every layer fades back out
        // during the outro — so there's no visible seam against the hero
        // above or the bento below.
        tl.fromTo('[data-hiw="bg-green"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 6 }, 0);
        tl.fromTo('[data-hiw="bg-black"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 7 }, 33);
        tl.fromTo('[data-hiw="bg-mint"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 7 }, 63);
        tl.to(
          '[data-hiw="bg-green"], [data-hiw="bg-black"], [data-hiw="bg-mint"]',
          { autoAlpha: 0, duration: 8 },
          92
        );

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
        // Dark ink needs the light mint wash behind it, so it exits just
        // before the outro fades the backdrop to void.
        tl.to('[data-hiw="text-2"]', { autoAlpha: 0, y: -28, filter: "blur(8px)", duration: 5 }, 90);

        // QR card: scales in center-right while the wrap idles small on the left,
        // then tilts up and away as chapter 3 approaches.
        tl.fromTo(
          '[data-hiw="qr"]',
          { autoAlpha: 0, scale: 0.85, rotate: -5, y: 60 },
          { autoAlpha: 1, scale: 1, rotate: 2, y: 0, duration: 6 },
          38
        );
        tl.to('[data-hiw="qr"]', { autoAlpha: 0, y: -80, rotate: 8, duration: 5 }, 58);

        // Phone frame: rises from the bottom as the wrap grows back toward center,
        // arriving just before the wrap shrinks into its screen (pose tween at 70).
        tl.fromTo(
          '[data-hiw="phone"]',
          { autoAlpha: 0, y: "55vh" },
          { autoAlpha: 1, y: 0, duration: 8 },
          64
        );

        // Wrap pose choreography (applied by the canvas in Task 3; tweening
        // it now is harmless and keeps all timing in one place).
        tl.to(p, { y: -0.05, x: 0.22, scale: 1.75, rx: 0.2, duration: 14 }, 0); // rise + settle right, hero-sized
        // Continuous scrubbed turn; spanning 0-100 also anchors the timeline
        // at exactly 100 units, so every position number reads as a
        // percentage of the pinned scroll.
        tl.to(p, { ry: 6.5, duration: 100 }, 0);
        tl.to(p, { x: -0.28, y: -0.02, scale: 0.85, duration: 10 }, 28); // sweep left, shrink
        tl.to(p, { x: 0, scale: 1.15, duration: 12 }, 58); // drift back to center, grow
        // Settle into the phone with a roll (rz) on top of the ever-running
        // yaw, so the drop-in reads as a tumble rather than a straight sink.
        tl.to(p, { scale: 0.34, y: -0.02, rz: 1.05, duration: 10 }, 70);
      });
    },
    { scope: trackRef }
  );

  return (
    <div ref={trackRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Backdrop chapters: deep green, then near-black, then mint wash.
            All start transparent (page void shows through) — the timeline
            fades them in and back out at the section's ends. */}
        <div aria-hidden="true" data-hiw="bg-green" className="absolute inset-0 bg-[#0c2016] opacity-0" />
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

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          {inView && (
            <ModelBoundary>
              <ScrollDishCanvas
                poseRef={poseRef}
                overrideRef={poseOverrideRef}
                invalidateRef={invalidateRef}
                className="effect-reveal h-full w-full"
              />
            </ModelBoundary>
          )}
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-10">
          {/* QR card, chapter 2: same white-chip treatment as the hero sticker */}
          <div
            data-hiw="qr"
            className="absolute right-[15%] top-1/2 w-[300px] rounded-2xl bg-[#fdfefd] p-5 text-[#111511] opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          >
            <QrCode />
            <p className="mt-3 text-center text-[13px] font-medium tracking-wide text-[#3c463c]">
              SCAN FOR MENU
            </p>
          </div>

          {/* Phone frame, chapter 3: bezel only (adapted from PhoneMockup) — the
              screen stays empty because the wrap model floats in front of it */}
          <div
            data-hiw="phone"
            className="absolute left-1/2 top-1/2 w-[320px] rounded-[2.9rem] border border-circuit/70 bg-carbon p-2 opacity-0 shadow-[0_32px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="flex aspect-[390/780] flex-col justify-end overflow-hidden rounded-[2.4rem] bg-[#0b0e0c] p-4">
              <div className="flex items-center justify-between rounded-lg border border-hairline bg-carbon/80 px-3.5 py-3">
                <span className="text-[13px] font-medium text-mint">Fried chicken wrap</span>
                <span className="text-[13px] tabular-nums text-sage">$12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text layer */}
        <div className="relative z-30 h-full">
          <h2
            data-hiw="heading"
            className="absolute left-1/2 top-[38%] text-center font-display text-[clamp(2.6rem,5.5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.02em] text-phosphor"
          >
            How it works
          </h2>

          <div data-hiw="text-0" className="absolute left-[8%] top-1/2 max-w-xl opacity-0">
            <h3 className="font-display text-[clamp(2.2rem,3.8vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.018em] text-mint">
              {steps[0].title}
            </h3>
            <p className="mt-5 max-w-[40ch] text-[18px] leading-relaxed text-sage">{steps[0].body}</p>
          </div>

          <div data-hiw="text-1" className="absolute left-[9%] top-1/2 max-w-lg opacity-0">
            <h3 className="font-display text-[clamp(2.2rem,3.8vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.018em] text-mint">
              {steps[1].title}
            </h3>
            <p className="mt-5 max-w-[40ch] text-[18px] leading-relaxed text-sage">{steps[1].body}</p>
          </div>

          {/* Chapter 3 sits on the light mint wash, so its text flips dark
              (same ink pair the bento's wash card uses). */}
          <div data-hiw="text-2" className="absolute left-[7%] top-1/2 max-w-lg opacity-0">
            <h3 className="font-display text-[clamp(2.2rem,3.8vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.018em] text-[#132018]">
              {steps[2].title}
            </h3>
            <p className="mt-5 max-w-[40ch] text-[18px] leading-relaxed text-[#3d5a48]">{steps[2].body}</p>
          </div>
        </div>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-[60]">
          <PoseDevPanel poseRef={poseRef} overrideRef={poseOverrideRef} invalidateRef={invalidateRef} />
        </div>
      )}
    </div>
  );
}
