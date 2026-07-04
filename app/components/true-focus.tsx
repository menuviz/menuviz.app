"use client";

// Adapted from ReactBits TrueFocus (reactbits.dev/text-animations/true-focus):
// span root so it nests inside headings, typography inherited from the parent,
// corner glow removed (our system bans glow filters), auto-cycle only, plus a
// resize re-measure and a prefers-reduced-motion static fallback.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface TrueFocusProps {
  sentence?: string;
  blurAmount?: number;
  borderColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function TrueFocus({
  sentence = "True Focus",
  blurAmount = 4,
  borderColor = "#2f9e6e",
  animationDuration = 0.4,
  pauseBetweenAnimations = 1.2,
  className = "",
}: TrueFocusProps) {
  const words = sentence.split(" ");
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(
      () => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      },
      (animationDuration + pauseBetweenAnimations) * 1000
    );
    return () => clearInterval(interval);
  }, [animationDuration, pauseBetweenAnimations, words.length, reduceMotion]);

  const measure = useCallback(() => {
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;
    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();
    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const corner =
    "absolute h-[0.32em] w-[0.32em] rounded-[3px] border-[3px]";

  return (
    <span
      className={`relative flex flex-wrap items-center justify-center gap-[0.3em] ${className}`}
      ref={containerRef}
      style={{ userSelect: "none" }}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className="relative inline-block"
            style={{
              filter: reduceMotion || isActive ? "blur(0px)" : `blur(${blurAmount}px)`,
              transition: `filter ${animationDuration}s ease`,
            }}
          >
            {word}
          </span>
        );
      })}

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 box-border block border-0"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: focusRect.width > 0 ? 1 : 0,
        }}
        transition={{ duration: reduceMotion ? 0 : animationDuration }}
        style={{ "--border-color": borderColor } as React.CSSProperties}
      >
        <span
          className={`${corner} left-[-0.14em] top-[-0.14em] border-b-0 border-r-0`}
          style={{ borderColor: "var(--border-color)" }}
        />
        <span
          className={`${corner} right-[-0.14em] top-[-0.14em] border-b-0 border-l-0`}
          style={{ borderColor: "var(--border-color)" }}
        />
        <span
          className={`${corner} bottom-[-0.14em] left-[-0.14em] border-r-0 border-t-0`}
          style={{ borderColor: "var(--border-color)" }}
        />
        <span
          className={`${corner} bottom-[-0.14em] right-[-0.14em] border-l-0 border-t-0`}
          style={{ borderColor: "var(--border-color)" }}
        />
      </motion.span>
    </span>
  );
}
