"use client";

// Adapted from ReactBits StickerPeel (reactbits.dev/animations/sticker-peel):
// renders arbitrary DOM children instead of an image, and drops the Draggable
// behavior since our sticker sits in a fixed hero composition.

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";

interface StickerPeelProps {
  children: ReactNode;
  peelBackHoverPct?: number;
  peelBackActivePct?: number;
  shadowIntensity?: number;
  lightingIntensity?: number;
  peelDirection?: number;
  className?: string;
}

interface CSSVars extends CSSProperties {
  "--sticker-p"?: string;
  "--sticker-peelback-hover"?: string;
  "--sticker-peelback-active"?: string;
  "--sticker-shadow-opacity"?: number;
  "--sticker-start"?: string;
  "--sticker-end"?: string;
}

export default function StickerPeel({
  children,
  peelBackHoverPct = 25,
  peelBackActivePct = 35,
  shadowIntensity = 0.5,
  lightingIntensity = 0.06,
  peelDirection = 0,
  className = "",
}: StickerPeelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointLightRef = useRef<SVGFEPointLightElement>(null);
  const pointLightFlippedRef = useRef<SVGFEPointLightElement>(null);

  const defaultPadding = 12;

  useEffect(() => {
    const updateLight = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = mouseEvent.clientX - rect.left;
      const y = mouseEvent.clientY - rect.top;

      if (pointLightRef.current) {
        gsap.set(pointLightRef.current, { attr: { x, y } });
      }

      const normalizedAngle = Math.abs(peelDirection % 360);
      if (pointLightFlippedRef.current) {
        if (normalizedAngle !== 180) {
          gsap.set(pointLightFlippedRef.current, { attr: { x, y: rect.height - y } });
        } else {
          gsap.set(pointLightFlippedRef.current, { attr: { x: -1000, y: -1000 } });
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", updateLight);
      return () => container.removeEventListener("mousemove", updateLight);
    }
  }, [peelDirection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = () => container.classList.add("touch-active");
    const handleTouchEnd = () => container.classList.remove("touch-active");

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const cssVars: CSSVars = useMemo(
    () => ({
      "--sticker-p": `${defaultPadding}px`,
      "--sticker-peelback-hover": `${peelBackHoverPct}%`,
      "--sticker-peelback-active": `${peelBackActivePct}%`,
      "--sticker-shadow-opacity": shadowIntensity,
      "--sticker-start": `calc(-1 * ${defaultPadding}px)`,
      "--sticker-end": `calc(100% + ${defaultPadding}px)`,
    }),
    [peelBackHoverPct, peelBackActivePct, shadowIntensity]
  );

  const stickerMainStyle: CSSProperties = {
    clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end))`,
    transition: "clip-path 0.6s ease-out",
    filter: "url(#sticker-drop-shadow)",
    willChange: "clip-path, transform",
  };

  const flapStyle: CSSProperties = {
    clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-start) var(--sticker-start))`,
    top: `calc(-100% - var(--sticker-p) - var(--sticker-p))`,
    transform: "scaleY(-1)",
    transition: "all 0.6s ease-out",
    willChange: "clip-path, transform",
  };

  return (
    <div className={`transform-gpu ${className}`} style={cssVars}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .sticker-container:hover .sticker-main,
          .sticker-container.touch-active .sticker-main {
            clip-path: polygon(var(--sticker-start) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
          }
          .sticker-container:hover .sticker-flap,
          .sticker-container.touch-active .sticker-flap {
            clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-start) var(--sticker-peelback-hover)) !important;
            top: calc(-100% + 2 * var(--sticker-peelback-hover) - 1px) !important;
          }
          .sticker-container:active .sticker-main {
            clip-path: polygon(var(--sticker-start) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
          }
          .sticker-container:active .sticker-flap {
            clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-start) var(--sticker-peelback-active)) !important;
            top: calc(-100% + 2 * var(--sticker-peelback-active) - 1px) !important;
          }
        `,
        }}
      />

      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="sticker-point-light">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity}
              lightingColor="white"
            >
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="sticker-point-light-flipped">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity * 7}
              lightingColor="white"
            >
              <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="sticker-drop-shadow">
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation={3 * shadowIntensity}
              floodColor="black"
              floodOpacity={shadowIntensity}
            />
          </filter>
        </defs>
      </svg>

      <div
        className="sticker-container relative select-none"
        ref={containerRef}
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
          transform: `rotate(${peelDirection}deg)`,
          transformOrigin: "center",
        }}
      >
        <div className="sticker-main" style={stickerMainStyle}>
          <div style={{ filter: "url(#sticker-point-light)" }}>{children}</div>
        </div>

        <div
          aria-hidden="true"
          className="absolute left-2 top-4 h-full w-full opacity-40"
          style={{ filter: "brightness(0) blur(8px)" }}
        >
          <div className="sticker-flap" style={flapStyle}>
            {children}
          </div>
        </div>

        <div aria-hidden="true" className="sticker-flap absolute left-0 h-full w-full" style={flapStyle}>
          <div style={{ filter: "url(#sticker-point-light-flipped)" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
