/** @type {import('next').NextConfig} */
const nextConfig = {
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
