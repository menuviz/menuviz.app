// Single dynamic-import entry for every WebGL consumer on the page. All
// next/dynamic() calls resolve through this module so the bundler emits ONE
// chunk graph containing three.js — pointing them at their own files made
// each dynamic subtree carry a full duplicate copy of three (~900KB each,
// verified in the build output). The marginal cost is that the first WebGL
// consumer to mount pulls the others' component code too; the shared
// three/r3f core dwarfs all of them combined.

export { default as ScrollDishCanvas } from "./scroll-dish-canvas";
export { default as StageShader } from "./stage-shader";
export { default as DishModel } from "./dish-model";
export { default as Beams } from "./beams";
