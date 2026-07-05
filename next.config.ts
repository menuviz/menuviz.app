import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — the landing page ships as plain HTML/CSS/JS to
  // Cloudflare Pages (`next build` emits `out/`).
  output: "export",
  images: {
    // Static export has no image-optimization server; images load as-is.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
