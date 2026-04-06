"use client";

import * as React from "react";
import { Pagination, Stack, Typography, type PaginationProps } from "@mui/material";

type AppPaginationProps = PaginationProps & {
  summary?: React.ReactNode;
};

export default function AppPagination({
  summary,
  ...props
}: AppPaginationProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
    >
      <Typography variant="body2" color="text.secondary">
        {summary || "Browse more results"}
      </Typography>
      <Pagination color="primary" shape="rounded" {...props} />
    </Stack>
  );
}
