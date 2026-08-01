import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nécessaire pour une image Docker de production allégée (voir
  // Dockerfile) : Next.js ne copie que le strict nécessaire au runtime.
  output: "standalone",
};

export default nextConfig;
