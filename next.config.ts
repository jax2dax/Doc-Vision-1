import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unpdf lazy-loads its own PDF.js build at runtime; load it with
  // Node's require instead of bundling it into the upload route.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
