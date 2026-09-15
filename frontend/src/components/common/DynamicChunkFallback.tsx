"use client";

import { Box, CircularProgress } from "@mui/material";

/** Shared loading shell for next/dynamic route chunks (ssr: false). */
export default function DynamicChunkFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 8,
        minHeight: 240,
      }}
    >
      <CircularProgress size={32} />
    </Box>
  );
}
