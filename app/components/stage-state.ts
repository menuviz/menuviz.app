// Scene-level state for the How-it-works stage (lights, camera, ground
// shadow), tweened by the same GSAP timeline that drives the wrap pose.
// Same contract as dish-pose.ts: a plain mutable object read per frame via
// refs, kept free of three.js imports so the stage never value-imports the
// three chunk. Colors are CSS strings — GSAP color-tweens them in place
// (writing rgba(...) mid-tween), and the canvas rig parses whatever form
// arrives. shadowOffset is the viewport-height fraction the shadow sits
// below the dish center.

export type StageState = {
  keyIntensity: number;
  ambientIntensity: number;
  rimIntensity: number;
  keyColor: string;
  ambientColor: string;
  camZ: number;
  camFov: number;
  shadowOpacity: number;
  shadowScale: number;
  shadowOffset: number;
  // CSS blur (px) on the dish canvas wrapper — the depth-of-field falloff
  // used when the wrap leaves/re-enters the focal plane around the QR
  // chapter. 0 means no filter at all (guarded in the stage's applier).
  dishBlur: number;
};

// Camera and shadow mirror the canvas defaults; the light rig is the
// hand-tuned chapter-1 look (green-tinted key, strong rim — captured via
// the stage dev panel at t≈16) that the t33 tween transitions away from.
export const INITIAL_STAGE: StageState = {
  keyIntensity: 1.07,
  ambientIntensity: 0.57,
  rimIntensity: 1.48,
  keyColor: "#4ccd84",
  ambientColor: "#ffffff",
  camZ: 5.5,
  camFov: 32,
  shadowOpacity: 0,
  shadowScale: 1,
  shadowOffset: 0.16,
  dishBlur: 0,
};
