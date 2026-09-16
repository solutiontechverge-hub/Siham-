/** @type {import('next').NextConfig} */
const path = require("path");

const monorepoRoot = path.join(__dirname, "..");

const nextConfig = {
  // Workspace root (next + deps are hoisted here). Must match turbopack.root.
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  // Run `npm run lint:frontend` locally or in CI for lint coverage.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const apiOrigin = (
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
    ).replace(/\/$/, "");
    return [
      { source: "/client", destination: "/clients/listing" },
      { source: "/client/profile", destination: "/clients/profile" },
      { source: "/client/profile/:path*", destination: "/clients/profile/:path*" },
      { source: "/client/booking", destination: "/clients/booking" },
      { source: "/client/favourites", destination: "/clients/favourites" },
      // Proxy local booking/messaging uploads so relative /uploads/* paths load.
      { source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` },
    ];
  },
  // Required for MUI + Next.js webpack so client chunks resolve correctly
  transpilePackages: [
    "@mui/material",
    "@mui/system",
    "@mui/icons-material",
    "@mui/x-date-pickers",
    "@emotion/react",
    "@emotion/styled",
  ],
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      path.resolve(monorepoRoot, "node_modules"),
      ...(config.resolve.modules || ["node_modules"]),
    ];
    return config;
  },
  serverExternalPackages: ["stripe"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mollure-staging-uploads.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
