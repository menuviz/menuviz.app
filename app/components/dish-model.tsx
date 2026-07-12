"use client";

// Renders one real product GLB (pulled from the diner app's asset set) with a
// gentle turntable rotation plus a slight wobble on the other two axes.
// <Center> re-centers the geometry on its own visual bounding box first —
// without it, the model spins around whatever pivot it happened to be
// authored with, which (if that pivot sits off-center) makes it orbit
// instead of spin in place and reads as broken depth/z-ordering. <Bounds>
// then auto-fits the camera to that centered box, so different dishes frame
// consistently without per-model camera tuning. Kept deliberately simple —
// no HDR environment map, just two directional lights — to stay light for a
// small card-sized viewer.

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Bounds, Center } from "@react-three/drei";

function Rotator({ url, spin }: { url: string; spin: boolean }) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group | null>(null);
  useFrame((_, delta) => {
    if (!spin || !group.current) return;
    // Non-integer speed ratios between axes so the tumble never repeats a
    // simple cycle — it keeps drifting through new orientations.
    group.current.rotation.x += delta * 0.27;
    group.current.rotation.y += delta * 0.5;
    group.current.rotation.z += delta * 0.19;
  });
  return (
    <group ref={group}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

export default function DishModel({
  url,
  spin,
  className,
}: {
  url: string;
  spin: boolean;
  className?: string;
}) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.4, 3], fov: 32 }} className={className}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <directionalLight position={[-2, -1, -2]} intensity={0.5} />
      <Suspense fallback={null}>
        <Bounds fit clip margin={1.1}>
          <Rotator url={url} spin={spin} />
        </Bounds>
      </Suspense>
    </Canvas>
  );
}
