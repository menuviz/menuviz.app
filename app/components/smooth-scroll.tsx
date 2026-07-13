"use client";

// Site-wide Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger
// (the How-it-works scrub) and Lenis share one clock — the recommended
// integration from the Lenis docs. Renders nothing; mounted once in the root
// layout. Skipped entirely under reduced motion (native scrolling stays),
// and Lenis leaves touch devices on native scrolling by default.

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // anchors: true keeps the nav's #hash links working now that CSS
    // scroll-behavior is out of the picture (Lenis forces it to auto).
    const lenis = new Lenis({ anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    // Lenis drives scroll position from the ticker; lag smoothing would make
    // the page visibly rubber-band after a dropped frame.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      gsap.ticker.lagSmoothing(500, 33); // GSAP default
    };
  }, []);

  return null;
}
