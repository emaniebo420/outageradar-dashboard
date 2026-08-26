import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Set by GitHub Actions' configure-pages step when deploying to GitHub
  // Pages; empty (root) on Vercel, which serves this same static export as-is.
  basePath: process.env.PAGES_BASE_PATH ?? "",
  images: { unoptimized: true },
};

export default nextConfig;
