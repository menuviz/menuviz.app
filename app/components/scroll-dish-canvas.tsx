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
