"use client";

// Living backdrop for the How-it-works dark chapters (intro → QR): a slow
// ShaderGradient blob on black, tuned on shadergradient.co and transplanted
// here minus the export-tool props. It renders in its own canvas because it
// animates on its own clock — the dish canvas is demand-rendered and must
// stay idle between scrolls. The stage mounts/unmounts this with a
// visibility observer (it keeps the GPU busy while mounted) and fades it
// with the scrubbed timeline. Env HDRs are self-hosted (public/hdr/) so the
// package's default GitHub-Pages fetch never happens.

import { Component, type ReactNode } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { stageShaderStore } from "./shader-store";

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
  const config = stageShaderStore.useConfig();
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
        />
      </ShaderGradientCanvas>
    </SilentBoundary>
  );
}
