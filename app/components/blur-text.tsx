"use client";

// Adapted from ReactBits BlurText (reactbits.dev/text-animations/blur-text):
// span root so it can compose inside a heading, `initialDelay` for sequencing
// multiple instances, and a prefers-reduced-motion static fallback.

import { motion, useReducedMotion, type Transition, type Easing } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type BlurTextProps = {
  text?: string;
  delay?: number;
  initialDelay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  easing?: Easing | Easing[];
  stepDuration?: number;
};

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))]);
  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])];
  });
  return keyframes;
};

export default function BlurText({
  text = "",
  delay = 120,
  initialDelay = 0,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  easing = [0.25, 1, 0.5, 1],
  stepDuration = 0.3,
}: BlurTextProps) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === "top"
        ? { filter: "blur(10px)", opacity: 0, y: -24 }
        : { filter: "blur(10px)", opacity: 0, y: 24 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      { filter: "blur(5px)", opacity: 0.5, y: direction === "top" ? 4 : -4 },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction]
  );

  if (reduceMotion) {
    return <span className={`flex flex-wrap ${className}`}>{text}</span>;
  }

  const stepCount = defaultTo.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1)
  );

  return (
    <span ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(defaultFrom, defaultTo);
        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: (initialDelay + index * delay) / 1000,
          ease: easing,
        };
        return (
          <motion.span
            key={index}
            initial={defaultFrom}
            animate={inView ? animateKeyframes : defaultFrom}
            transition={spanTransition}
            style={{ display: "inline-block", willChange: "transform, filter, opacity" }}
          >
            {segment === " " ? " " : segment}
            {animateBy === "words" && index < elements.length - 1 && " "}
          </motion.span>
        );
      })}
    </span>
  );
}
