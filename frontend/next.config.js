/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo + Vercel: eslint-config-next can fail to resolve ./parser.js during remote build.
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
    "@emotion/react",
    "@emotion/styled",
  ],
  experimental: {
    serverComponentsExternalPackages: ["stripe"],
  },
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
