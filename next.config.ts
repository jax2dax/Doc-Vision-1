import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a second dev server (for example a test run) use its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // unpdf lazy-loads its own PDF.js build at runtime; load it with
  // Node's require instead of bundling it into the upload route.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
