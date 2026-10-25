import type { NextConfig } from "next";

const origineApi = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
).origin;
const origineWebSocket = origineApi.replace(/^http/, "ws");
const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
].join(" ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Nécessaire pour une image Docker de production allégée (voir
  // Dockerfile) : Next.js ne copie que le strict nécessaire au runtime.
  output: "standalone",
  async redirects() {
    return [
      { source: "/branding/skkup-wordmark-transparent.png", destination: "/assets/brand/logos/skkup-wordmark-transparent.png", permanent: true },
      { source: "/branding/skkup-s-favicon.png", destination: "/assets/brand/marks/skkup-s-favicon.png", permanent: true },
      { source: "/assets/ui-icons/:path*", destination: "/assets/icons/ui/:path*", permanent: true },
      { source: "/assets/dashboard/shared/icons/:path*", destination: "/assets/dashboard/illustrations/:path*", permanent: true },
      { source: "/assets/dashboard/user/rewards/:path*", destination: "/assets/dashboard/rewards/:path*", permanent: true },
      { source: "/assets/shared/platforms/:path*", destination: "/assets/platforms/:path*", permanent: true },
      { source: "/assets/vitrine/hero/:path*", destination: "/assets/marketing/hero/:path*", permanent: true },
      { source: "/assets/vitrine/steps/:path*", destination: "/assets/marketing/steps/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ${origineApi} ${origineWebSocket}; frame-src https://www.youtube.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`,
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
