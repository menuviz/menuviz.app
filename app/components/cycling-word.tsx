"use client";

// A single word that cycles through a list on a slow interval, cross-fading
// through a soft blur (matching BlurText's entrance style). Decorative only
// — used inside aria-hidden headings where a static aria-label carries the
// real accessible text. IntersectionObserver-gated and frozen on the first
// word under prefers-reduced-motion, per the site's motion rules.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface CyclingWordProps {
  words: string[];
  className?: string;
  interval?: number;
  blurAmount?: number;
  initialDelay?: number;
}

export default function CyclingWord({
  words,
  className = "",
  interval = 2200,
  blurAmount = 8,
  initialDelay = 0,
}: CyclingWordProps) {
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView || words.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [reduceMotion, inView, interval, words.length]);

  if (reduceMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <motion.span
      ref={ref}
      layout
      className={`relative inline-flex overflow-hidden align-bottom ${className}`}
    >
      <AnimatePresence mode="popLayout" initial>
        <motion.span
          key={words[index]}
          initial={{ filter: `blur(${blurAmount}px)`, opacity: 0, y: -10 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          exit={{ filter: `blur(${blurAmount}px)`, opacity: 0, y: 10 }}
          transition={{
            duration: 0.6,
            ease: [0.25, 1, 0.5, 1],
            delay: index === 0 ? initialDelay / 1000 : 0,
          }}
          style={{ display: "inline-block", willChange: "transform, filter, opacity" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
