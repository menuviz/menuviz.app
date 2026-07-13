# "How it works" Scroll-Driven 3D Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static three-step cards in the `HowItWorks` section with a pinned, full-bleed, scroll-scrubbed sequence where the fried-chicken-wrap GLB travels around the viewport past step text, a QR card, and a phone frame, over a step-reactive backdrop (desktop `md+` only; below `md` and under reduced motion the existing cards remain).

**Architecture:** A ~400vh scroll track contains a `position: sticky` viewport-height stage (CSS sticky, no ScrollTrigger pin-spacer). One GSAP master timeline with `scrub: 1`, created inside `gsap.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)")`, drives four layers: backdrop color chapters, one transparent r3f canvas (the wrap), DOM props (QR card, phone frame), and step text. GSAP never touches React state — it tweens a plain mutable pose object that a `useFrame` hook applies to the model; the canvas runs `frameloop="demand"` and is invalidated from the timeline's `onUpdate`.

**Tech Stack:** Next 16 static export, Tailwind v4, GSAP 3 + ScrollTrigger + `@gsap/react` `useGSAP`, `@react-three/fiber` + `drei` (`useGLTF`, `Center`), `motion/react` (`useReducedMotion` only).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-13-how-it-works-scrollytelling-design.md`.
- **No test framework exists in this repo and none should be added.** The verification gate for every task is `bun run lint && bun run type-check`. Run `bun run build` once, in the final task only. Do NOT start a dev server or use Playwright/browser tools — Danish reviews the dev server himself.
- GLB URL (exact): `https://cdn.menuviz.app/ouii/models/dishes/fried-chicken-wrap.glb`.
- Step copy is reused verbatim from the existing `steps` array — do not rewrite it.
- The section keeps `id="how-it-works"` (nav anchor target), exactly one element with that id.
- Below `md` and under `prefers-reduced-motion`, the existing card layout (with its micro-demos) must keep working unchanged.
- No eyebrow/overline text above headings (user's global design rule) — no "01/02/03" kickers above step titles.
- Commit messages: conventional style, NO Co-Authored-By/AI attribution (user's global git rule).
- three.js code must never be in the server bundle: the canvas file is loaded only via `next/dynamic` with `ssr: false`, and no value imports from it elsewhere (type-only imports are fine — use the shared `dish-pose.ts` for values).
- Repo commands run inside `nix develop` (bun is not global). If `bun` is not on PATH, prefix commands with `nix develop -c`, e.g. `nix develop -c bun run lint`.

---

### Task 1: Extract the existing cards into `how-it-works.tsx`

Pure move, zero visual change. Gets the section into a client component that Task 2 can branch on.

**Files:**
- Create: `app/components/how-it-works.tsx`
- Modify: `app/page.tsx` (remove `steps` + `HowItWorks` at lines ~258–302, drop newly-unused imports, import the new component)

**Interfaces:**
- Produces: `export function HowItWorks(): JSX.Element` and `export const steps: { title: string; body: string; demo: React.ReactNode }[]` from `app/components/how-it-works.tsx`. Task 2 consumes both. `steps[i].title` / `steps[i].body` are the copy source of truth.

- [ ] **Step 1: Create `app/components/how-it-works.tsx`**

Move the `steps` array and `HowItWorks` function out of `app/page.tsx` verbatim into this new file. The result:

```tsx
"use client";

// How-it-works section. Currently the static three-step cards; the pinned
// scroll-driven stage (md+) replaces the desktop grid in a follow-up task.

import BlurText from "./blur-text";
import { EditorDemo, StampDemo, MiniPhoneDemo } from "./micro-demos";

export const steps = [
  {
    title: "Upload your menu",
    body: "Add dishes, prices, and photos in a simple editor. We turn each photo into a 3D model — no scanning or special gear needed.",
    demo: <EditorDemo />,
  },
  {
    title: "Print the QR code",
    body: "One code per table, or one for the whole room. It never changes, even when the menu does.",
    demo: <StampDemo />,
  },
  {
    title: "Diners explore the food",
    body: "The code opens your menu in 3D. No app, no account, no waiting for a server to explain.",
    demo: <MiniPhoneDemo />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <h2 className="font-display text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-phosphor">
          <BlurText text="How it works" />
        </h2>
        <div className="mt-14 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-0 md:divide-x md:divide-hairline md:overflow-visible md:px-0 md:pb-0">
          {steps.map((step) => (
            <div
              key={step.title}
              className="w-[85%] shrink-0 snap-center rounded-lg border border-hairline bg-ground p-6 sm:w-[55%] md:w-auto md:shrink md:rounded-none md:border-0 md:bg-transparent md:p-0 md:px-10 md:first:pl-0 md:last:pr-0"
            >
              {step.demo}
              <h3 className="mt-6 font-display text-[22px] font-medium tracking-[-0.013em] text-mint">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-sage">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

The inner JSX must match what's currently in `app/page.tsx:276-302` — if the file has drifted from the snippet above, the file content wins; copy it exactly.

- [ ] **Step 2: Update `app/page.tsx`**

Delete the `steps` array and `HowItWorks` function (lines ~258–302). Add:

```tsx
import { HowItWorks } from "./components/how-it-works";
```

Then remove `EditorDemo`, `StampDemo`, `MiniPhoneDemo` from the `./components/micro-demos` import (the other demos — `PriceSyncDemo`, `InstantLoadDemo`, `LanguageDemo`, `LocationRippleDemo` — are still used by the bento and stay). Keep the `BlurText` import only if it's still used elsewhere in `page.tsx` (it is — the hero); lint will confirm. `<HowItWorks />` in the `Home` return stays as-is.

- [ ] **Step 3: Verify gates pass**

Run: `bun run lint && bun run type-check`
Expected: both exit 0, no unused-import warnings.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/components/how-it-works.tsx
git commit -m "refactor: extract How-it-works section into its own component"
```

---

### Task 2: Shared pose module + stage skeleton (backdrop, heading, step text — no 3D yet)

The scroll track, sticky stage, master timeline, chapter backdrop, intro heading, and the three step-text blocks. After this task the desktop section scrolls through all three chapters with text crossfades over shifting backdrop colors; the model/QR/phone slots are empty. Below `md` and under reduced motion, the cards from Task 1 render instead.

**Files:**
- Create: `app/components/dish-pose.ts`
- Create: `app/components/how-it-works-stage.tsx`
- Modify: `app/components/how-it-works.tsx`

**Interfaces:**
- Consumes: `steps` from `./how-it-works` (Task 1).
- Produces:
  - `dish-pose.ts`: `export type Pose = { x: number; y: number; rx: number; ry: number; rz: number; scale: number }` and `export const INITIAL_POSE: Pose`. `x`/`y` are viewport fractions (0 = center, +x right, +y up); `scale` 1 ≈ 2 world units (~60% of stage height). Task 3 consumes both.
  - `how-it-works-stage.tsx`: `export function HowItWorksStage(): JSX.Element`, plus these refs/objects that Task 3 wires into the canvas: `poseRef` (`useRef<Pose>`), `invalidateRef` (`useRef<(() => void) | null>`), and the timeline built in `useGSAP`. Task 4 adds prop elements + tweens to this same file.
  - Timeline convention: 100-unit scale, `defaults: { ease: "none" }`, labels/positions per the choreography table below. All later tweens use absolute position numbers on this scale.

**Choreography timing table (0–100 scale, used by Tasks 2–4):**

| Beat | Range | What happens |
| --- | --- | --- |
| Intro | 0–10 | heading visible, fades out 8–13; backdrop = deep green |
| Step 1 | 10–35 | text1 in 12–17, out 28–33 |
| Chapter shift | 33–40 | near-black layer fades in |
| Step 2 | 35–65 | QR group in 38–44, out 58–63 (Task 4) |
| Chapter shift | 63–70 | mint-wash layer fades in |
| Step 3 | 65–95 | phone in 64–72 (Task 4), text3 in 72–77, holds |
| Outro | 95–100 | everything at rest, pin releases |

- [ ] **Step 1: Create `app/components/dish-pose.ts`**

```ts
// Shared between the stage (which tweens this with GSAP) and the r3f canvas
// (which applies it per frame). Lives in its own module so the stage never
// value-imports the three.js chunk. x/y are viewport fractions (0 = center,
// +x right, +y up); scale 1 ≈ 2 world units (~60% of the stage height).

export type Pose = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
};

export const INITIAL_POSE: Pose = {
  x: 0,
  y: -0.55,
  rx: -0.1,
  ry: 0,
  rz: 0,
  scale: 0.9,
};
```

- [ ] **Step 2: Create `app/components/how-it-works-stage.tsx`**

```tsx
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
```

- [ ] **Step 3: Branch in `app/components/how-it-works.tsx`**

Add imports at the top:

```tsx
import { useReducedMotion } from "motion/react";
import { HowItWorksStage } from "./how-it-works-stage";
```

Replace the body of `HowItWorks` so the cards render below `md` (or always, under reduced motion) and the stage renders on `md+`:

```tsx
export function HowItWorks() {
  const reduce = useReducedMotion() ?? false;

  const cards = (
    <div className={reduce ? "" : "md:hidden"}>
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <h2 className="font-display text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-phosphor">
          <BlurText text="How it works" />
        </h2>
        {/* ...existing card row exactly as extracted in Task 1... */}
      </div>
    </div>
  );

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-hairline">
      {cards}
      {!reduce && (
        <div className="hidden md:block">
          <HowItWorksStage />
        </div>
      )}
    </section>
  );
}
```

(The `{/* ...existing card row... */}` comment stands in for the untouched card markup from Task 1 — keep it verbatim, don't retype it.)

Note `useReducedMotion` returns `null` on the server/first render, so `reduce` is `false` and the static export ships the stage markup — correct for the common case; reduced-motion users get the cards after hydration, and the `matchMedia` guard means the timeline never runs for them even pre-hydration.

- [ ] **Step 4: Verify gates pass**

Run: `bun run lint && bun run type-check`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/components/dish-pose.ts app/components/how-it-works-stage.tsx app/components/how-it-works.tsx
git commit -m "feat: pinned scroll stage for How-it-works with chapter backdrop and step text"
```

---

### Task 3: The 3D canvas — wrap model driven by the pose object

One transparent full-stage canvas, `frameloop="demand"`, model normalized to a known world size, pose applied per frame in viewport fractions. Lazy-mounted with the same prefetch + early-rootMargin pattern as `bento-beams.tsx`, with a photo fallback if the GLB fails.

**Files:**
- Create: `app/components/scroll-dish-canvas.tsx`
- Modify: `app/components/how-it-works-stage.tsx`

**Interfaces:**
- Consumes: `type Pose` from `./dish-pose` (type-only import — values would defeat code splitting); `poseRef`/`invalidateRef` from the stage (Task 2).
- Produces: `export default function ScrollDishCanvas(props: { poseRef: React.MutableRefObject<Pose>; invalidateRef: React.MutableRefObject<(() => void) | null>; className?: string }): JSX.Element`. Loaded only via `next/dynamic(..., { ssr: false })`.

- [ ] **Step 1: Create `app/components/scroll-dish-canvas.tsx`**

```tsx
"use client";

// Full-stage transparent canvas for the How-it-works wrap. The stage's GSAP
// timeline owns all motion: it tweens poseRef.current and pokes
// invalidateRef on update, and the useFrame below just applies the pose —
// so frameloop="demand" keeps the GPU idle whenever scrolling stops.
// Geometry is <Center>ed then normalized to a 2-world-unit max dimension so
// pose.scale means the same thing regardless of how the GLB was authored
// (same reasoning as dish-model.tsx, minus <Bounds> — the camera is fixed
// here because the pose, not the model, decides framing).

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import type { Pose } from "./dish-pose";

const DISH_URL = "https://cdn.menuviz.app/ouii/models/dishes/fried-chicken-wrap.glb";

useGLTF.preload(DISH_URL);

function InvalidateBridge({
  invalidateRef,
}: {
  invalidateRef: React.MutableRefObject<(() => void) | null>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidateRef.current = invalidate;
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);
  return null;
}

function PosedDish({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const { scene } = useGLTF(DISH_URL);
  const group = useRef<THREE.Group | null>(null);
  // Normalize so the model's largest dimension is 2 world units at scale 1.
  const norm = useMemo(() => {
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    return 2 / Math.max(size.x, size.y, size.z);
  }, [scene]);

  useFrame(({ viewport }) => {
    const g = group.current;
    if (!g) return;
    const p = poseRef.current;
    g.position.set(p.x * viewport.width, p.y * viewport.height, 0);
    g.rotation.set(p.rx, p.ry, p.rz);
    g.scale.setScalar(p.scale * norm);
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

export default function ScrollDishCanvas({
  poseRef,
  invalidateRef,
  className,
}: {
  poseRef: React.MutableRefObject<Pose>;
  invalidateRef: React.MutableRefObject<(() => void) | null>;
  className?: string;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ position: [0, 0, 5.5], fov: 32 }}
      className={className}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <directionalLight position={[-2, -1, -2]} intensity={0.5} />
      <Suspense fallback={null}>
        <InvalidateBridge invalidateRef={invalidateRef} />
        <PosedDish poseRef={poseRef} />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 2: Mount it in `how-it-works-stage.tsx`**

Add imports and the lazy-mount machinery (mirrors `bento-beams.tsx`):

```tsx
import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useState, type ReactNode } from "react";

const ScrollDishCanvas = dynamic(() => import("./scroll-dish-canvas"), { ssr: false });

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
```

Inside `HowItWorksStage`, add state + effects after the existing refs:

```tsx
const [inView, setInView] = useState(false);

useEffect(() => {
  import("./scroll-dish-canvas"); // prefetch chunk + GLB before the section arrives
}, []);

useEffect(() => {
  const el = trackRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
    threshold: 0,
    rootMargin: MOUNT_MARGIN,
  });
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

Replace the `{/* Canvas layer mounts here in Task 3 (z-20) */}` comment with:

```tsx
<div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
  {inView && (
    <ModelBoundary>
      <ScrollDishCanvas
        poseRef={poseRef}
        invalidateRef={invalidateRef}
        className="effect-reveal h-full w-full"
      />
    </ModelBoundary>
  )}
</div>
```

- [ ] **Step 3: Verify gates pass**

Run: `bun run lint && bun run type-check`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/scroll-dish-canvas.tsx app/components/how-it-works-stage.tsx
git commit -m "feat: scroll-scrubbed 3D wrap in the How-it-works stage"
```

---

### Task 4: Props — QR card (step 2) and phone frame (step 3)

The two DOM props and their timeline tweens. The QR card takes focus while the wrap is parked small on the left; the phone rises so the wrap lands "inside" its screen (the canvas is z-20, above the z-10 phone, so the wrap reads as on-screen once it shrinks within the bezel bounds).

**Files:**
- Modify: `app/components/how-it-works-stage.tsx`

**Interfaces:**
- Consumes: the 100-unit timeline and `data-hiw` selector convention from Task 2; `QrCode` from `./qr-code`.
- Produces: nothing consumed later — final feature surface.

- [ ] **Step 1: Add the prop markup**

Add `import { QrCode } from "./qr-code";` at the top. Replace the `{/* Props layer ... */}` comment with:

```tsx
<div aria-hidden="true" className="absolute inset-0 z-10">
  {/* QR card, chapter 2: same white-chip treatment as the hero sticker */}
  <div
    data-hiw="qr"
    className="absolute right-[16%] top-1/2 w-52 -translate-y-1/2 rounded-xl bg-[#fdfefd] p-3.5 text-[#111511] opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
  >
    <QrCode />
    <p className="mt-2 text-center text-[11px] font-medium tracking-wide text-[#3c463c]">
      SCAN FOR MENU
    </p>
  </div>

  {/* Phone frame, chapter 3: bezel only (adapted from PhoneMockup) — the
      screen stays empty because the wrap model floats in front of it */}
  <div
    data-hiw="phone"
    className="absolute left-1/2 top-1/2 w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-[2.6rem] border border-circuit/70 bg-carbon p-2 opacity-0 shadow-[0_32px_80px_rgba(0,0,0,0.35)]"
  >
    <div className="flex aspect-[390/844] flex-col justify-end overflow-hidden rounded-[2.2rem] bg-[#0b0e0c] p-4">
      <div className="flex items-center justify-between rounded-lg border border-hairline bg-carbon/80 px-3 py-2.5">
        <span className="text-[12px] font-medium text-mint">Fried chicken wrap</span>
        <span className="text-[12px] tabular-nums text-sage">$12</span>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add the prop tweens to the timeline**

Inside the `mm.add(MM_STAGE, ...)` callback, after the step-text tweens, add:

```tsx
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
```

Move step-2's text block so it pairs with the QR instead of overlapping step-1's spot: change `data-hiw="text-1"`'s positioning classes from `left-[8%] top-1/2 max-w-md -translate-y-1/2` to `left-[10%] top-1/2 max-w-sm -translate-y-1/2` and step-3's (`text-2`) from `left-[8%]` to `left-[7%]` with `max-w-sm` — text left, prop right/center, so each chapter composes differently (step 1: text left / wrap right; step 2: text left / wrap far-left small / QR right; step 3: text left / phone center).

- [ ] **Step 3: Verify gates pass**

Run: `bun run lint && bun run type-check`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/how-it-works-stage.tsx
git commit -m "feat: QR card and phone frame props in the How-it-works stage"
```

---

### Task 5: Final gates + handoff

**Files:** none (verification only)

- [ ] **Step 1: Full gate run**

Run: `bun run lint && bun run type-check && bun run build`
Expected: all exit 0; `next build` completes the static export to `out/` with no errors about client/server boundaries or the dynamic import.

- [ ] **Step 2: Hand off for visual review**

Do not start a dev server. Report completion and ask Danish to run `bun run dev` and review:
- scrub feel and beat timing (all tunable numbers live in the timeline in `how-it-works-stage.tsx`)
- wrap size/position per chapter (pose tween values)
- whether the wrap visually lands inside the phone screen
- text legibility over the mint-wash chapter
- that below-`md` and reduced-motion still show the old cards

- [ ] **Step 3: Commit any review tweaks Danish requests, then done**

No pre-emptive commit here — this step exists so review feedback lands in this task's scope.
