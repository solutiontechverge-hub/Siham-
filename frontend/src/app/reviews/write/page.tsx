"use client";

import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import WriteReviewPage from "./WriteReviewPage";

export default function WriteReviewRoutePage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <WriteReviewPage />
    </Suspense>
  );
}
