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
