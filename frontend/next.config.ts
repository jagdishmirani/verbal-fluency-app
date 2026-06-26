import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prevent Next.js from treating an unrelated parent folder as the workspace
  // root when another package-lock.json exists higher up on the Windows machine.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
