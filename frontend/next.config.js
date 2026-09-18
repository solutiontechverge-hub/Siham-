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
    // Fullstack container: Next proxies same-origin /api and /uploads to Express.
    const internalApi = (
      process.env.INTERNAL_API_ORIGIN || "http://127.0.0.1:5000"
    ).replace(/\/$/, "");
    return [
      { source: "/client", destination: "/clients/listing" },
      { source: "/client/profile", destination: "/clients/profile" },
      { source: "/client/profile/:path*", destination: "/clients/profile/:path*" },
      { source: "/client/booking", destination: "/clients/booking" },
      { source: "/client/favourites", destination: "/clients/favourites" },
      { source: "/api/:path*", destination: `${internalApi}/api/:path*` },
      { source: "/uploads/:path*", destination: `${internalApi}/uploads/:path*` },
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
