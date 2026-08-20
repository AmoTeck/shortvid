import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  // Optimize for mobile / edge hosting
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
