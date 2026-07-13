# "How it works" scroll-driven 3D section — design

**Date:** 2026-07-13
**Status:** Approved (desktop build first; mobile pass deferred)

## Goal

Replace the three static step cards in the `HowItWorks` section of `app/page.tsx`
with a full-bleed, pinned, scroll-driven sequence starring the fried-chicken-wrap
3D model. Scroll progress choreographs the wrap's movement around the viewport,
the three step texts, two props (QR card, phone frame), and a step-reactive
backdrop color. The section should feel dynamic — nothing parked in place.

## Scope

- **In (this build):** desktop/tablet experience at `md+`, reduced-motion
  fallback, model-load fallback, removal of now-unused step card code.
- **Deferred:** the tuned-down mobile variant (same timeline, stacked layout,
  ~320vh track, DPR ≤ 1.5). Until it lands, screens below `md` keep the current
  horizontal snap cards with their micro-demos.

## Architecture

New client component `app/components/how-it-works-scroll.tsx`, dynamically
imported (`ssr: false`) so three.js stays out of the initial bundle. The section
keeps `id="how-it-works"` so the nav anchor still works.

Outer element: a tall scroll track (~400vh). Inside it, one GSAP ScrollTrigger
pins a viewport-height stage and scrubs a single master timeline (`scrub: 1`)
across the track. The stage has four layers, all driven by that one timeline:

1. **Backdrop** — a div whose background interpolates through three chapter
   colors: deep green (step 1) → near-black (step 2) → mint wash (step 3).
2. **Canvas** — one transparent full-stage r3f canvas containing only the wrap
   GLB (`https://cdn.menuviz.app/ouii/models/dishes/fried-chicken-wrap.glb`,
   same asset the bento `DishViewer` uses). The timeline tweens a plain
   mutable "pose" object ({ position, rotation, scale }); a `useFrame` hook
   applies the pose to the model group each frame. GSAP never touches React
   state, so scrubbing causes zero re-renders.
3. **Props** — DOM elements animated by the timeline: the demo QR card
   (step 2) and a phone frame (step 3, reusing/adapting the existing
   `PhoneMockup` styling).
4. **Text** — the three existing step titles + bodies (copy unchanged),
   absolutely positioned in different spots per step, entering/exiting with
   the site's established blur-crossfade style.

## Choreography (percent of pinned scroll distance)

- **Intro (0–10%)** — deep-green backdrop. "How it works" heading center;
  the wrap tumbles in oversized from below/behind it.
- **Step 1 — Upload (10–35%)** — heading exits. Wrap settles large on the
  right half, rotation scrubbed to scroll; "Upload your menu" text on the
  left. On exit the wrap sweeps across the viewport to the left, shrinking.
- **Step 2 — QR (35–65%)** — backdrop to near-black. Wrap parks small on the
  left. QR card scales in center-right with "Print the QR code" text. On exit
  the QR tilts away; the wrap grows and drifts toward center.
- **Step 3 — Explore (65–95%)** — backdrop to mint wash. Phone frame rises
  from bottom center; the wrap travels into the phone screen, scales to fit,
  and keeps rotating inside it. "Diners explore the food" text beside.
- **Outro (95–100%)** — everything eases to rest; pin releases into the bento.

The wrap's rotation is scrubbed (scroll back = turns back) so it reads as
physically tied to the page, not a looping video.

## Fallbacks & performance

- **Reduced motion:** no pin, no scrub. Three plain stacked blocks (text plus
  a static-framed wrap render / QR / phone), matching how the existing
  micro-demos freeze under `prefers-reduced-motion`.
- **Model load failure:** the canvas slot falls back to the real wrap photo
  from `public/images/dishes`, so the stage is never empty.
- **Perf:** canvas mounts only when the section approaches (same lazy pattern
  as `DishViewer`); `frameloop="demand"` with invalidation driven by timeline
  updates so the GPU idles when scrolling stops; GLB prefetched as the
  section nears.

## Removals

The static card grid disappears from `md+` (replaced by the pinned stage) but
stays below `md`, so the `steps` copy and `EditorDemo`/`StampDemo`/
`MiniPhoneDemo` survive this build. They get deleted in the mobile pass once
the snap-card fallback is gone, if unreferenced.

## Verification

`bun run lint` + `bun run type-check`; Danish reviews the dev server himself
(no Playwright, no build-after-every-edit).
