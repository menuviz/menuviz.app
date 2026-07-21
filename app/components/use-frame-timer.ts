"use client";

// THREE.Timer-backed frame delta, replacing the one r3f's useFrame derives
// from its internal THREE.Clock. Timer is three's successor to Clock: it
// hooks the Page Visibility API (connect below), so the first frame after a
// backgrounded tab reports a normal delta instead of the entire time away
// arriving as one giant jump. Call update() once at the top of a useFrame
// callback, then read getDelta().

import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function useFrameTimer(): THREE.Timer {
  const timer = useMemo(() => new THREE.Timer(), []);
  useEffect(() => {
    timer.connect(document);
    return () => timer.dispose();
  }, [timer]);
  return timer;
}
