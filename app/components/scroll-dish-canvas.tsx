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
import type { StageState } from "./stage-state";

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

// GSAP color tweens write rgba(...) strings into the stage object mid-tween;
// THREE.Color.set() would parse those too but warns about the alpha channel
// on every frame, so parse rgb() ourselves and fall back to set() for hex.
function applyCssColor(color: THREE.Color, css: string) {
  const m = css.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) color.setRGB(+m[1] / 255, +m[2] / 255, +m[3] / 255, THREE.SRGBColorSpace);
  else color.set(css);
}

// Lights + camera, driven per frame from the stage state the timeline tweens
// (same ref pattern as the pose). Priority -1 so the camera is already in
// place when PosedDish computes its viewport-fraction position.
function StageRig({
  stageRef,
  overrideRef,
}: {
  stageRef: React.MutableRefObject<StageState>;
  overrideRef?: React.MutableRefObject<StageState | null>;
}) {
  const ambient = useRef<THREE.AmbientLight | null>(null);
  const key = useRef<THREE.DirectionalLight | null>(null);
  const rim = useRef<THREE.DirectionalLight | null>(null);
  // Skip re-parsing color strings that haven't changed since the last frame.
  const applied = useRef({ keyColor: "", ambientColor: "" });

  useFrame(({ camera }) => {
    const s = overrideRef?.current ?? stageRef.current;
    if (ambient.current) {
      ambient.current.intensity = s.ambientIntensity;
      if (applied.current.ambientColor !== s.ambientColor) {
        applyCssColor(ambient.current.color, s.ambientColor);
        applied.current.ambientColor = s.ambientColor;
      }
    }
    if (key.current) {
      key.current.intensity = s.keyIntensity;
      if (applied.current.keyColor !== s.keyColor) {
        applyCssColor(key.current.color, s.keyColor);
        applied.current.keyColor = s.keyColor;
      }
    }
    if (rim.current) rim.current.intensity = s.rimIntensity;

    camera.position.z = s.camZ;
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.fov !== s.camFov) {
      persp.fov = s.camFov;
      persp.updateProjectionMatrix();
    }
  }, -1);

  return (
    <>
      <ambientLight ref={ambient} intensity={1.2} />
      <directionalLight ref={key} position={[2, 4, 3]} intensity={2} />
      <directionalLight ref={rim} position={[-2, -1, -2]} intensity={0.5} />
    </>
  );
}

function PosedDish({
  poseRef,
  overrideRef,
}: {
  poseRef: React.MutableRefObject<Pose>;
  overrideRef?: React.MutableRefObject<Pose | null>;
}) {
  const { scene } = useGLTF(DISH_URL);
  const group = useRef<THREE.Group | null>(null);
  // The bento's DishViewer renders the same GLB, and useGLTF hands both
  // consumers one shared Object3D — which can only sit in one scene graph at
  // a time, so whichever canvas mounts later would steal it from the other.
  // A clone (shares geometry/materials, separate node graph) lets both show
  // the dish at once.
  const dish = useMemo(() => scene.clone(), [scene]);
  // Normalize so the model's largest dimension is 2 world units at scale 1.
  const norm = useMemo(() => {
    const size = new THREE.Box3().setFromObject(dish).getSize(new THREE.Vector3());
    return 2 / Math.max(size.x, size.y, size.z);
  }, [dish]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    // The dev pose panel can freeze the model at an editable pose; its
    // override wins over the scrubbed pose while active.
    const p = overrideRef?.current ?? poseRef.current;
    // Recompute the viewport against the live camera (the StageRig dollies
    // it) so pose x/y stay true screen fractions no matter where the camera
    // is — the cached state.viewport is only valid for the initial camera.
    const v = state.viewport.getCurrentViewport(state.camera);
    g.position.set(p.x * v.width, p.y * v.height, 0);
    g.rotation.set(p.rx, p.ry, p.rz);
    g.scale.setScalar(p.scale * norm);
  });

  return (
    <group ref={group}>
      <Center>
        {/* dispose={null}: the clone shares the cached scene's geometry and
            materials — r3f's unmount auto-dispose would gut them for every
            other consumer (and any later mount). */}
        <primitive object={dish} dispose={null} />
      </Center>
    </group>
  );
}

export default function ScrollDishCanvas({
  poseRef,
  overrideRef,
  stageRef,
  stageOverrideRef,
  invalidateRef,
  className,
}: {
  poseRef: React.MutableRefObject<Pose>;
  overrideRef?: React.MutableRefObject<Pose | null>;
  stageRef: React.MutableRefObject<StageState>;
  stageOverrideRef?: React.MutableRefObject<StageState | null>;
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
      <StageRig stageRef={stageRef} overrideRef={stageOverrideRef} />
      <Suspense fallback={null}>
        <InvalidateBridge invalidateRef={invalidateRef} />
        <PosedDish poseRef={poseRef} overrideRef={overrideRef} />
      </Suspense>
    </Canvas>
  );
}
