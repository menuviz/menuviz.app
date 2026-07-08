import { ImageResponse } from "next/og";

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
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            backgroundColor: emerald,
          }}
        />
        <div style={{ fontSize: 34, color: ink, fontWeight: 600 }}>MenuViz</div>
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
