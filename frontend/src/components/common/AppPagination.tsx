"use client";

import * as React from "react";
import { Pagination, Stack, type PaginationProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

type AppPaginationProps = PaginationProps & {
  summary?: React.ReactNode;
};

export default function AppPagination({
  summary,
  ...props
}: AppPaginationProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
    >
      <BodyText color="text.secondary">{summary || "Browse more results"}</BodyText>
      <Pagination
        color="primary"
        shape="rounded"
        {...props}
        sx={[
          {
            "& .MuiPaginationItem-root": {
              fontWeight: 600,
              color: alpha(m.navy, 0.75),
            },
            "& .MuiPaginationItem-root.Mui-selected": {
              color: "#fff",
            },
          },
          props.sx as any,
        ]}
      />
    </Stack>
  );
}
