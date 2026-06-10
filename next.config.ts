import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  // Webpack dev avoids Turbopack source-map reads that exhaust handles on Windows (os error 1450).
  turbopack: {},
};

export default nextConfig;
