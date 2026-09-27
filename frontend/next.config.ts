import type { NextConfig } from "next";

const origineApi = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
).origin;
const origineWebSocket = origineApi.replace(/^http/, "ws");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Nécessaire pour une image Docker de production allégée (voir
  // Dockerfile) : Next.js ne copie que le strict nécessaire au runtime.
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ${origineApi} ${origineWebSocket}; frame-src https://www.youtube.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
