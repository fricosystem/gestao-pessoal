import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Server external packages (moved from experimental in Next.js 16)
  serverExternalPackages: [],
  // Empty turbopack config to acknowledge Turbopack usage (Next.js 16 default)
  // Firebase is client-only and handled by 'use client' + dynamic imports
  turbopack: {},
};

export default nextConfig;
