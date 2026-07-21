"use client";

// Living backdrop for the How-it-works dark chapters (intro → QR): a slow
// ShaderGradient blob on black, tuned on shadergradient.co and transplanted
// here minus the export-tool props. It renders in its own canvas because it
// animates on its own clock — the dish canvas is demand-rendered and must
// stay idle between scrolls. The stage mounts/unmounts this with a
// visibility observer (it keeps the GPU busy while mounted) and fades it
// with the scrubbed timeline. Env HDRs are self-hosted (public/hdr/) so the
// package's default GitHub-Pages fetch never happens.

import { Component, useSyncExternalStore, type ReactNode } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { stageShaderStore, type ShaderConfig } from "./shader-store";

// Phone variant of the hand-tuned seed (tuned on-device against the portrait
// frame): the azimuth swing re-centers the blob in the narrow viewport, and
// grain goes off — at phone pixel sizes it reads as compression noise, not
// texture. Everything else rides the shared store so dev-panel tweaks apply
// to both variants.
const MM_MOBILE = "(max-width: 47.9375rem)";
const MOBILE_OVERRIDES: Partial<ShaderConfig> = {
  cAzimuthAngle: 258,
  grain: "off",
};

function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(MM_MOBILE);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(MM_MOBILE).matches,
    // Never SSR'd (dynamic ssr:false), but useSyncExternalStore wants one.
    () => false
  );
}

// A failed shader (WebGL context loss, HDR fetch error) should cost
// nothing: the flat backdrop chapters underneath are the fallback.
class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function StageShader({ className }: { className?: string }) {
  // Live-tunable via ShaderDevPanel in dev; in production the store simply
  // holds STAGE_SHADER_SEED forever.
  const base = stageShaderStore.useConfig();
  const config = useIsMobile() ? { ...base, ...MOBILE_OVERRIDES } : base;
  return (
    <SilentBoundary>
      <ShaderGradientCanvas
        className={className}
        pixelDensity={1}
        fov={30}
        envBasePath="/hdr/"
        pointerEvents="none"
        // The stage already gates mounting on visibility; the canvas's own
        // lazy-load would otherwise delay shader compile past our pre-warm.
        lazyLoad={false}
      >
        <ShaderGradient
          control="props"
          animate="on"
          shader="defaults"
          wireframe={false}
          lightType="env"
          type={config.type}
          uTime={config.uTime}
          uSpeed={config.uSpeed}
          uStrength={config.uStrength}
          uDensity={config.uDensity}
          uFrequency={config.uFrequency}
          uAmplitude={config.uAmplitude}
          positionX={config.positionX}
          positionY={config.positionY}
          positionZ={config.positionZ}
          rotationX={config.rotationX}
          rotationY={config.rotationY}
          rotationZ={config.rotationZ}
          color1={config.color1}
          color2={config.color2}
          color3={config.color3}
          reflection={config.reflection}
          cAzimuthAngle={config.cAzimuthAngle}
          cPolarAngle={config.cPolarAngle}
          cDistance={config.cDistance}
          cameraZoom={config.cameraZoom}
          brightness={config.brightness}
          envPreset={config.envPreset}
          grain={config.grain}
          grainBlending={config.grainBlending}
        />
      </ShaderGradientCanvas>
    </SilentBoundary>
  );
}
