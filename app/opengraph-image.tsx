import { ImageResponse } from "next/og";
import {
  WORDMARK_PATH,
  WORDMARK_RATIO,
  WORDMARK_VIEWBOX,
} from "./components/wordmark";

// Generated at build time (static export) — becomes the og:image for the
// landing page. Mirrors the site's phosphor-dark system: near-black canvas,
// sage type, one emerald signal.
export const dynamic = "force-static";
export const alt = "MenuViz — your menu, in 3D";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const emerald = "#2f9e6e";
const sage = "#9db3a4";
const ink = "#e8efe9";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: "#070908",
        backgroundImage:
          "radial-gradient(900px 450px at 20% 0%, rgba(47,158,110,0.10), transparent)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* Viewfinder mark, matching Mark in page.tsx */}
        <svg viewBox="0 0 24 24" width={30} height={30}>
          <g
            fill="none"
            stroke={emerald}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 8V6a3 3 0 0 1 3-3h2" />
            <path d="M16 3h2a3 3 0 0 1 3 3v2" />
            <path d="M21 16v2a3 3 0 0 1-3 3h-2" />
            <path d="M8 21H6a3 3 0 0 1-3-3v-2" />
          </g>
          <rect x="8.2" y="7.2" width="7.6" height="9.6" rx="1.6" fill={emerald} />
        </svg>
        <svg
          viewBox={WORDMARK_VIEWBOX}
          width={Math.round(36 * WORDMARK_RATIO)}
          height={36}
        >
          <path fill={ink} d={WORDMARK_PATH} />
        </svg>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 76,
            lineHeight: 1.05,
            color: ink,
            fontWeight: 700,
            maxWidth: 940,
          }}
        >
          Your menu, in 3D.
        </div>
        <div style={{ fontSize: 32, color: sage, maxWidth: 900 }}>
          A QR code on the table opens your menu in 3D — every dish modeled,
          priced, and up to date. No app, no reprints.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid rgba(157,179,164,0.25)`,
          paddingTop: 28,
        }}
      >
        <div style={{ fontSize: 26, color: sage }}>Built for restaurants</div>
        <div style={{ fontSize: 26, color: emerald, fontWeight: 600 }}>
          menuviz.app
        </div>
      </div>
    </div>,
    size,
  );
}
