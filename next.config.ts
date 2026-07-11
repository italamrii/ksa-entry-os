import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        },
      ],
    },
    {
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "no-store" }],
    },
    {
      source: "/dashboard/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    },
    {
      source: "/admin/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    },
    {
      source: "/payments/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    },
    {
      source: "/settings/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    },
    {
      source: "/assessment/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    },
  ],
};

export default nextConfig;
