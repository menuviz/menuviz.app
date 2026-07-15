"use client";

// Pinned scroll-driven How-it-works stage (motion allowed only — the
// matchMedia below is the sole guard; the parent renders the card fallback
// under reduced motion). Runs at every viewport size: gsap.matchMedia picks
// a desktop or mobile choreography (same beats, different composition —
// desktop reads left-text/right-prop, mobile stacks text above the prop).
// A ~400vh track holds a sticky full-viewport stage; one scrubbed
// GSAP timeline drives backdrop chapter colors, the intro heading, the three
// step texts, the props, (via poseRef, applied in the canvas's useFrame) the
// wrap model, and (via stageRef) the light rig, camera dolly, and the DOM
// ground shadow. GSAP tweens plain objects — never React state — so
// scrubbing causes zero re-renders.

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { steps } from "./how-it-works";
import { INITIAL_POSE, type Pose } from "./dish-pose";
import { INITIAL_STAGE, type StageState } from "./stage-state";
import { QrCode } from "./qr-code";
import { PoseDevPanel } from "./pose-dev-panel";
import { StageDevPanel } from "./stage-dev-panel";
import { ShaderDevPanel } from "./shader-dev-panel";
import { stageShaderStore } from "./shader-store";
import { QrFxDevPanel } from "./qr-fx-dev-panel";
import { qrFxStore } from "./qr-fx-store";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Both come through webgl-bundle (not their own files) so three.js lands in
// one shared chunk — see webgl-bundle.ts.
const ScrollDishCanvas = dynamic(() => import("./webgl-bundle").then((m) => m.ScrollDishCanvas), {
  ssr: false,
});
const StageShader = dynamic(() => import("./webgl-bundle").then((m) => m.StageShader), {
  ssr: false,
});

const MM_MOTION = "(prefers-reduced-motion: no-preference)";
// The two choreographies split at md (48rem), mirroring the Tailwind
// breakpoint the DOM layer classes use.
const MM_CONDITIONS = {
  desktop: `(min-width: 48rem) and ${MM_MOTION}`,
  mobile: `(max-width: 47.9375rem) and ${MM_MOTION}`,
};
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
          className="w-[min(60vw,420px)] drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] md:w-[min(38vw,420px)]"
        />
      </div>
    );
  }
}

export function HowItWorksStage() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageElRef = useRef<HTMLDivElement | null>(null);
  const poseRef = useRef<Pose>({ ...INITIAL_POSE });
  const poseOverrideRef = useRef<Pose | null>(null);
  // Scene state (lights, camera, ground shadow) — tweened by the same
  // timeline, applied by the canvas's StageRig and the DOM shadow below.
  const stageRef = useRef<StageState>({ ...INITIAL_STAGE });
  const stageOverrideRef = useRef<StageState | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  // Stage dimensions cached on ScrollTrigger refresh so the per-scroll-frame
  // shadow placement never reads layout.
  const sizeRef = useRef({ w: 0, h: 0 });
  const applyShadowRef = useRef<(() => void) | null>(null);
  // QR pre-focus degradation: the timeline scrubs focus 0→1 as the brackets
  // lock; the look itself (blur/halftone/dither amounts) lives in qrFxStore.
  const qrFxRef = useRef({ focus: 0 });
  const qrContentRef = useRef<HTMLDivElement | null>(null);
  const qrHalftoneRef = useRef<HTMLDivElement | null>(null);
  const qrDitherRef = useRef<HTMLDivElement | null>(null);
  // Timeline progress on the 0-100 unit scale (i.e. tween position numbers),
  // surfaced in the dev pose panel so tuned poses can be tied to a beat.
  const progressRef = useRef(0);
  const invalidateRef = useRef<(() => void) | null>(null);
  const [inView, setInView] = useState(false);
  const [shaderInView, setShaderInView] = useState(false);

  useEffect(() => {
    // Under reduced motion the stage never mounts, so skip the chunk + GLB
    // prefetch — those visitors get the static cards instead.
    if (!window.matchMedia(MM_MOTION).matches) return;
    import("./webgl-bundle"); // prefetch the shared WebGL chunk + GLB before the section arrives
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

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // Unlike the dish canvas (demand-rendered, kept mounted), the shader
    // backdrop animates continuously — so it toggles with visibility, like
    // the bento beams card, and is torn down once the visitor scrolls past.
    const observer = new IntersectionObserver(
      ([entry]) => setShaderInView(entry.isIntersecting),
      { threshold: 0, rootMargin: MOUNT_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MM_CONDITIONS, (context) => {
        const mobile = !!context.conditions?.mobile;
        // Composition constants that differ between the two choreographies.
        // Desktop: text left, prop right, hero-sized wrap. Mobile: text band
        // top, prop centered below it, wrap sized to the narrow viewport
        // (scale is a fraction of stage height; at 1.36 the wrap's width
        // would overflow a portrait screen). Phone/settle values track the
        // phone frame's mobile position (top-[62%], smaller width).
        const C = mobile
          ? {
              riseX: 0,
              riseY: -0.18,
              riseScale: 0.8,
              reEnterY: -0.08,
              reEnterScale: 0.72,
              settleY: -0.12,
              settleScale: 0.26,
              settleShadowScale: 1.7,
              settleShadowOffset: 0.3,
            }
          : {
              riseX: 0.135,
              riseY: -0.05,
              riseScale: 1.36,
              reEnterY: -0.02,
              reEnterScale: 1.15,
              settleY: -0.015,
              settleScale: 0.3,
              settleShadowScale: 2.5,
              settleShadowOffset: 0.355,
            };
        const p = poseRef.current;
        const s = stageRef.current;
        // Deterministic start values on every matchMedia (re-)init — the
        // refs survive breakpoint flips, the timeline's from-values don't.
        Object.assign(p, INITIAL_POSE);
        Object.assign(s, INITIAL_STAGE);

        // Ground shadow under the wrap: a DOM ellipse tracked to the pose
        // (screen fractions → pixels) rather than a three.js contact shadow,
        // because the dish traverses the whole viewport — there is no
        // consistent ground plane for a shadow-catcher to live on.
        const applyShadow = () => {
          const el = shadowRef.current;
          if (!el) return;
          const pose = poseOverrideRef.current ?? poseRef.current;
          const stage = stageOverrideRef.current ?? stageRef.current;
          const { w, h } = sizeRef.current;
          const scale = pose.scale * stage.shadowScale;
          gsap.set(el, {
            x: (0.5 + pose.x) * w,
            y: (0.5 - pose.y + stage.shadowOffset) * h,
            xPercent: -50,
            yPercent: -50,
            scaleX: scale,
            scaleY: scale,
            opacity: stage.shadowOpacity,
            force3D: true,
          });
        };
        // Depth-of-field on the dish: a CSS blur on its (otherwise
        // transparent) canvas wrapper reads exactly like the model falling
        // out of the focal plane, without a postprocessing pass. Guarded to
        // "none" at 0 so there's no idle compositing cost.
        let lastBlur = -1;
        const applyDishBlur = () => {
          const el = canvasWrapRef.current;
          if (!el) return;
          const stage = stageOverrideRef.current ?? stageRef.current;
          const blur = Math.round(stage.dishBlur * 100) / 100;
          if (blur === lastBlur) return;
          lastBlur = blur;
          gsap.set(el, { filter: blur < 0.05 ? "none" : `blur(${blur}px)` });
        };
        // One handle for the dev panels: re-applies every DOM-side scene bit.
        applyShadowRef.current = () => {
          applyShadow();
          applyDishBlur();
        };
        const measure = () => {
          const el = stageElRef.current;
          if (el) sizeRef.current = { w: el.clientWidth, h: el.clientHeight };
        };
        measure();

        // QR pre-focus degradation: blur/contrast on the card content plus
        // halftone and dither overlays, all scaled by (1 - focus). The
        // timeline drives fx.focus as the brackets lock; the store holds the
        // dev-tunable amounts, and its preview flag pins the card degraded.
        const fx = qrFxRef.current;
        fx.focus = 0;
        let ditherCache = { freq: -1, uri: "" };
        const ditherUri = (freq: number) => {
          if (ditherCache.freq !== freq) {
            const svg =
              `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">` +
              `<filter id="d"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="1" stitchTiles="stitch"/>` +
              `<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0"/>` +
              `<feComponentTransfer><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer></filter>` +
              `<rect width="128" height="128" filter="url(#d)"/></svg>`;
            ditherCache = { freq, uri: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` };
          }
          return ditherCache.uri;
        };
        const applyQrFx = () => {
          const content = qrContentRef.current;
          const halftone = qrHalftoneRef.current;
          const dither = qrDitherRef.current;
          if (!content || !halftone || !dither) return;
          const cfg = qrFxStore.getConfig();
          const d = cfg.preview ? 1 : 1 - fx.focus;
          const dot = cfg.halftoneDot * 50;
          gsap.set(content, {
            filter:
              d < 0.001 ? "none" : `blur(${cfg.blurPx * d}px) contrast(${1 + (cfg.contrast - 1) * d})`,
          });
          gsap.set(halftone, {
            opacity: cfg.halftoneOpacity * d,
            backgroundImage: `radial-gradient(circle, rgba(10, 20, 13, 0.95) ${dot}%, transparent ${dot}%)`,
            backgroundSize: `${cfg.halftoneSizePx}px ${cfg.halftoneSizePx}px`,
            mixBlendMode: cfg.halftoneBlend,
          });
          gsap.set(dither, {
            opacity: cfg.ditherOpacity * d,
            backgroundImage: ditherUri(cfg.ditherFreq),
            backgroundSize: `${cfg.ditherScalePx}px ${cfg.ditherScalePx}px`,
          });
        };
        applyQrFx();
        const unsubQrFx = qrFxStore.subscribe(applyQrFx);

        // Centering lives on GSAP's own xPercent/yPercent channels (not the
        // Tailwind -translate-x/y-1/2 utilities) so the pixel y tweens below
        // compose with it instead of overwriting it when GSAP first parses
        // the computed transform.
        gsap.set('[data-hiw="heading"], [data-hiw="phone"]', { xPercent: -50, yPercent: -50 });
        gsap.set('[data-hiw="text-0"], [data-hiw="text-1"], [data-hiw="text-2"]', {
          yPercent: -50,
        });
        // The QR card anchors right-[15%] on desktop but centers (left-1/2)
        // on mobile, so it needs the -50 xPercent only there.
        gsap.set('[data-hiw="qr"]', { yPercent: -50, xPercent: mobile ? -50 : 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: trackRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onRefresh: measure,
          },
          onUpdate: () => {
            progressRef.current = tl.progress() * 100;
            applyShadow();
            applyDishBlur();
            applyQrFx();
            invalidateRef.current?.();
          },
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

        // Shader blob backdrop: alive through the dark chapters (it paints
        // over the flat green/black layers, which double as its fallback),
        // handing off to the mint wash as chapter 3 arrives.
        tl.fromTo('[data-hiw="shader"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 6 }, 0);
        tl.to('[data-hiw="shader"]', { autoAlpha: 0, duration: 7 }, 63);

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

        // QR card: scales in center-right while the wrap slips offstage,
        // then tilts up and away as chapter 3 approaches.
        tl.fromTo(
          '[data-hiw="qr"]',
          { autoAlpha: 0, scale: 0.85, rotate: -5, y: 60 },
          { autoAlpha: 1, scale: 1, rotate: 2, y: 0, duration: 6 },
          38
        );
        tl.to('[data-hiw="qr"]', { autoAlpha: 0, y: -80, rotate: 8, duration: 5 }, 58);

        // Mid-chapter scan moment: viewfinder brackets (the logo motif)
        // converge onto the parked card, then the caption flips to its
        // scanned state — a state change, not a crossfade, hence the lag.
        tl.fromTo(
          '[data-hiw="qr-brackets"]',
          { autoAlpha: 0, scale: 1.35 },
          { autoAlpha: 1, scale: 1, duration: 4 },
          46
        );
        // The card rides in degraded (focus 0) and the lock pulls it sharp.
        tl.fromTo(fx, { focus: 0 }, { focus: 1, duration: 4 }, 46);
        tl.to('[data-hiw="qr-cap-idle"]', { autoAlpha: 0, duration: 2 }, 50);
        tl.to('[data-hiw="qr-cap-done"]', { autoAlpha: 1, duration: 2.5 }, 50.5);

        // Phone frame: rises from the bottom as the wrap grows back toward center,
        // arriving just before the wrap shrinks into its screen (pose tween at 70).
        tl.fromTo(
          '[data-hiw="phone"]',
          { autoAlpha: 0, y: "55vh" },
          { autoAlpha: 1, y: 0, duration: 8 },
          64
        );

        // Wrap pose choreography. Rise + settle right, hero-sized — end
        // state hand-tuned via the wrap-pose dev panel (rx 1.623 ≡ the tuned
        // -4.66 mod 2π, shorter travel, same orientation).
        tl.to(p, { y: C.riseY, x: C.riseX, scale: C.riseScale, rx: 1.623, rz: 0.14, duration: 14 }, 0);
        // Continuous scrubbed yaw in two segments so it passes through the
        // hand-tuned rise pose (ry 1.15 at t=14.4) and still lands on the
        // hand-tuned phone pose (ry 5.73) when the settle beat ends at 80,
        // holding through the outro. (Timeline length stays anchored at 100
        // by the backdrop outro fade: 92 + 8.)
        tl.to(p, { ry: 1.15, duration: 14.4 }, 0);
        tl.to(p, { ry: 5.73, duration: 65.6 }, 14.4);
        // Offstage for the QR chapter: the wrap exits below the fold as the
        // card arrives (the chapter belongs to the QR + brackets), carrying
        // its orientation back to the original path (rx 0.2, rz 0) so the
        // re-entrance at 58 rises clean into the phone landing. Long window
        // + accelerate-in so it drifts off the hold instead of being yanked
        // (the only linear-speed exit read as too fast against the site's
        // eased motion language).
        tl.to(p, { x: 0, y: -0.75, scale: 0.6, rx: 0.2, rz: 0, duration: 14, ease: "power1.in" }, 26);
        tl.to(p, { x: 0, y: C.reEnterY, scale: C.reEnterScale, duration: 12 }, 58); // re-enter: rise to center, grow
        // Settle into the phone, tumbling (pitch + roll on top of the
        // ever-running yaw) into the hand-tuned final pose (values picked
        // live via the wrap-pose dev panel).
        tl.to(p, { scale: C.settleScale, y: C.settleY, rx: 1.82, rz: 0.92, duration: 10 }, 70);

        // Scene state: ground shadow, per-chapter light rig, and a small
        // camera dolly. Light shifts ride the backdrop crossfades exactly
        // (33 and 63, dur 7); camera moves only during pose *transitions*
        // (duck 28-38, rise-back 58-70) and is back at its baseline before
        // the hand-tuned phone settle at 70, so every tuned pose is viewed
        // under the camera it was tuned with. Chapter-1 light values are
        // INITIAL_STAGE itself, so no tween is needed before 28.
        tl.to(s, { shadowOpacity: 0.42, duration: 8 }, 16);
        // Shadow leaves with the wrap (offstage during the QR chapter); the
        // camera still eases in for the card and returns before the settle.
        tl.to(s, { shadowOpacity: 0, duration: 10 }, 26);
        tl.to(s, { camZ: 5.35, camFov: 33, duration: 10 }, 28);
        // Focus handoff: the exit tween's power1.in means the wrap barely
        // moves until ~30, so focus holds until it's visibly departing and
        // falls off exactly across the fast half of the drop (30-38, fully
        // soft just before it leaves the frame at ~40). The QR card arrives
        // soft at 38 and the bracket lock at 46 is where the camera finds
        // focus again; the wrap then rises back INTO focus at 58-68, landing
        // sharp before the phone settle at 70.
        tl.to(s, { dishBlur: 2, duration: 8 }, 30);
        tl.to(s, { dishBlur: 0, duration: 10 }, 58);
        tl.to(
          s,
          {
            keyIntensity: 1.5,
            keyColor: "#e8f0ff",
            ambientIntensity: 0.7,
            ambientColor: "#ccd6d0",
            rimIntensity: 0.75,
            duration: 7,
          },
          33
        );
        // Re-entry: the shadow returns wide and low (hand-tuned settle
        // capture at t≈80: broad pool under the phone) as the camera comes
        // back to baseline.
        tl.to(
          s,
          {
            shadowScale: C.settleShadowScale,
            shadowOpacity: 0.5,
            shadowOffset: C.settleShadowOffset,
            camZ: 5.5,
            camFov: 32,
            duration: 12,
          },
          58
        );
        // Mint-chapter rig, hand-tuned via the stage dev panel: key nearly
        // off with a pale mint tint, ambient carrying the scene, strong rim.
        tl.to(
          s,
          {
            keyIntensity: 0.05,
            keyColor: "#d7eee1",
            ambientIntensity: 1.38,
            ambientColor: "#ffffff",
            rimIntensity: 1.49,
            duration: 7,
          },
          63
        );
        // Shadow holds under the phone through the settle and leaves with
        // the backdrops during the outro.
        tl.to(s, { shadowOpacity: 0, duration: 8 }, 92);

        // matchMedia revert: drop the store subscription (the timeline and
        // tweens are cleaned up by gsap.matchMedia itself).
        return () => {
          unsubQrFx();
        };
      });
    },
    { scope: trackRef }
  );

  return (
    <div ref={trackRef} className="relative h-[400vh]">
      {/* h-dvh (not h-screen ≈ lvh): on phones the stage tracks the visible
          viewport as the browser chrome collapses, instead of overflowing
          under the toolbar. The sticky pin is pure CSS, so the resize costs
          only a smoothed ScrollTrigger refresh. */}
      <div ref={stageElRef} className="sticky top-0 h-dvh overflow-hidden">
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

        {/* Shader blob backdrop for the dark chapters. Sits above the flat
            backdrop layers (DOM order) and below every z-indexed layer; the
            timeline fades the wrapper, the observer handles mount/teardown. */}
        <div aria-hidden="true" data-hiw="shader" className="absolute inset-0 opacity-0">
          {shaderInView && <StageShader className="effect-reveal h-full w-full" />}
        </div>

        <div ref={canvasWrapRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          {inView && (
            <ModelBoundary>
              <ScrollDishCanvas
                poseRef={poseRef}
                overrideRef={poseOverrideRef}
                stageRef={stageRef}
                stageOverrideRef={stageOverrideRef}
                invalidateRef={invalidateRef}
                className="effect-reveal h-full w-full"
              />
            </ModelBoundary>
          )}
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-10">
          {/* Ground shadow under the wrap — placed per scroll frame from the
              pose (see applyShadow); first in the layer so it sits beneath
              the QR card and phone too. Softness comes from the gradient
              falloff itself, no blur filter. */}
          <div
            ref={shadowRef}
            className="pointer-events-none absolute left-0 top-0 h-[110px] w-[400px] opacity-0 will-change-transform"
            style={{
              background: "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.5), transparent 72%)",
            }}
          />

          {/* QR card, chapter 2: same white-chip treatment as the hero sticker */}
          <div
            data-hiw="qr"
            className="absolute left-1/2 top-[56%] w-[min(74vw,300px)] rounded-2xl bg-[#eef2ec] p-5 text-[#111511] opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.55)] md:left-auto md:right-[15%] md:top-1/2"
          >
            {/* Viewfinder brackets (the logo motif) — a child of the card so
                they inherit its in/out/tilt tweens; -inset-5 keeps them out
                on the dark backdrop where phosphor reads. */}
            <div data-hiw="qr-brackets" className="pointer-events-none absolute -inset-5 opacity-0">
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-phosphor" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-phosphor" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-phosphor" />
              <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-phosphor" />
            </div>
            {/* Only the QR image takes the pre-focus blur (see applyQrFx);
                the brackets and caption stay sharp — the caption is a label,
                not part of the unfocused subject. */}
            <div ref={qrContentRef}>
              <QrCode />
            </div>
            {/* Stacked captions: idle → scanned state flip at t≈50 */}
            <div className="mt-3 grid text-center text-[13px] font-medium tracking-wide">
              <p data-hiw="qr-cap-idle" className="col-start-1 row-start-1 text-[#3c463c]">
                SCAN FOR MENU
              </p>
              <p
                data-hiw="qr-cap-done"
                className="col-start-1 row-start-1 flex items-center justify-center gap-1.5 text-[#111511] opacity-0"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3 8.5l3.2 3.2L13 5"
                    fill="none"
                    stroke="#2f9e6e"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                MENU FOUND
              </p>
            </div>
            {/* Pre-focus degradation overlays (halftone dots + dither
                noise), driven by applyQrFx and gone once focus resolves. */}
            <div ref={qrHalftoneRef} className="pointer-events-none absolute inset-0 rounded-2xl opacity-0" />
            <div
              ref={qrDitherRef}
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0"
              style={{ imageRendering: "pixelated" }}
            />
            {/* Ambient shading: the stage is a dim green room, so the card
                can't stay device-white — a directional falloff (lit from the
                upper left, falling into green-black) seats it in the scene's
                light, covering the QR jpeg's own white too. */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background:
                  "linear-gradient(148deg, rgba(255,255,255,0.07) 0%, rgba(10,20,13,0.12) 45%, rgba(10,20,13,0.38) 100%)",
              }}
            />
          </div>

          {/* Phone frame, chapter 3: bezel only (adapted from PhoneMockup) — the
              screen stays empty because the wrap model floats in front of it */}
          <div
            data-hiw="phone"
            className="absolute left-1/2 top-[62%] w-[min(56vw,320px)] rounded-[2.4rem] border border-circuit/70 bg-carbon p-2 opacity-0 shadow-[0_32px_80px_rgba(0,0,0,0.35)] md:top-1/2 md:w-[320px] md:rounded-[2.9rem]"
          >
            <div className="flex aspect-[390/780] flex-col justify-end overflow-hidden rounded-[2rem] bg-[#0b0e0c] p-3 md:rounded-[2.4rem] md:p-4">
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

          {/* Step texts: on mobile a full-width band in the upper fifth
              (yPercent -50 centers each block on its top line), leaving the
              lower two-thirds to the wrap/QR/phone; on md+ the desktop
              left-column placement takes over. */}
          <div
            data-hiw="text-0"
            className="absolute left-6 right-6 top-[20%] max-w-xl opacity-0 md:left-[8%] md:right-auto md:top-1/2"
          >
            <h3 className="font-display text-[clamp(2.2rem,3.8vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.018em] text-mint">
              {steps[0].title}
            </h3>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-sage md:mt-5 md:text-[18px]">
              {steps[0].body}
            </p>
          </div>

          <div
            data-hiw="text-1"
            className="absolute left-6 right-6 top-[20%] max-w-lg opacity-0 md:left-[9%] md:right-auto md:top-1/2"
          >
            <h3 className="font-display text-[clamp(2.2rem,3.8vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.018em] text-mint">
              {steps[1].title}
            </h3>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-sage md:mt-5 md:text-[18px]">
              {steps[1].body}
            </p>
          </div>

          {/* Chapter 3 sits on the light mint wash, so its text flips dark
              (same ink pair the bento's wash card uses). */}
          <div
            data-hiw="text-2"
            className="absolute left-6 right-6 top-[20%] max-w-lg opacity-0 md:left-[7%] md:right-auto md:top-1/2"
          >
            <h3 className="font-display text-[clamp(2.2rem,3.8vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.018em] text-[#132018]">
              {steps[2].title}
            </h3>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-[#3d5a48] md:mt-5 md:text-[18px]">
              {steps[2].body}
            </p>
          </div>
        </div>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2">
          <PoseDevPanel
            poseRef={poseRef}
            overrideRef={poseOverrideRef}
            progressRef={progressRef}
            invalidateRef={invalidateRef}
          />
          <StageDevPanel
            stageRef={stageRef}
            overrideRef={stageOverrideRef}
            progressRef={progressRef}
            invalidateRef={invalidateRef}
            applyShadowRef={applyShadowRef}
          />
          <ShaderDevPanel store={stageShaderStore} />
          <QrFxDevPanel store={qrFxStore} />
        </div>
      )}
    </div>
  );
}
