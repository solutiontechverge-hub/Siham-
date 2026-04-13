"use client";

import * as React from "react";
import { Pagination, Stack, type PaginationProps } from "@mui/material";
import { BodyText } from "../ui/typography";

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
      <BodyText color="text.secondary">{summary || "Browse more results"}</BodyText>
      <Pagination color="primary" shape="rounded" {...props} />
    </Stack>
  );
}
