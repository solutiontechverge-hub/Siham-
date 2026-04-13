/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/client", destination: "/clients/listing" },
      { source: "/client/profile", destination: "/clients/profile" },
      { source: "/client/profile/:path*", destination: "/clients/profile/:path*" },
      { source: "/client/booking", destination: "/clients/booking" },
      { source: "/client/favourites", destination: "/clients/favourites" },
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
};

module.exports = nextConfig;
