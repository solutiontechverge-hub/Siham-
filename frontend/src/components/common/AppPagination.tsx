"use client";

import * as React from "react";
import { Box, Pagination, Stack, type PaginationProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

type AppPaginationProps = PaginationProps & {
  summary?: React.ReactNode;
};

export default function AppPagination({
  summary,
  count = 1,
  page = 1,
  ...props
}: AppPaginationProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const compactCount = count <= 1;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent={summary ? "space-between" : "flex-end"}
    >
      {summary ? <BodyText color="text.secondary">{summary}</BodyText> : null}
      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "center", sm: "flex-end" },
          overflow: "hidden",
          maxWidth: "100%",
        }}
      >
        <Pagination
          color="primary"
          shape="rounded"
          count={count}
          page={page}
          siblingCount={0}
          boundaryCount={1}
          showFirstButton={false}
          showLastButton={false}
          {...props}
          sx={[
            {
              flexShrink: 0,
              "& .MuiPagination-ul": {
                flexWrap: "nowrap",
                gap: 0.25,
              },
              "& .MuiPaginationItem-root": {
                fontWeight: 600,
                fontSize: 13,
                minWidth: 32,
                height: 32,
                borderRadius: "50%",
                color: alpha(m.navy, 0.72),
                border: `1px solid transparent`,
                transition: "all 160ms ease",
                "&:hover": {
                  bgcolor: alpha(m.teal, 0.08),
                  borderColor: alpha(m.teal, 0.2),
                },
              },
              "& .MuiPaginationItem-root.Mui-selected": {
                color: "#fff",
                bgcolor: m.teal,
                borderColor: m.teal,
                boxShadow: `0 4px 12px ${alpha(m.teal, 0.35)}`,
                "&:hover": {
                  bgcolor: m.tealDark,
                  borderColor: m.tealDark,
                },
              },
              "& .MuiPaginationItem-previousNext": {
                borderRadius: 2,
                border: `1px solid ${m.cardBorder}`,
                bgcolor: m.white,
                "&.Mui-disabled": {
                  opacity: 0.45,
                  borderColor: alpha(m.cardBorder, 0.7),
                },
              },
              "& .MuiPaginationItem-ellipsis": {
                fontSize: 14,
                fontWeight: 700,
                color: alpha(m.slate, 0.75),
                minWidth: 24,
              },
            },
            compactCount
              ? {
                  "& .MuiPaginationItem-page": { display: "none" },
                  "& .MuiPaginationItem-ellipsis": { display: "none" },
                }
              : {},
            props.sx as object,
          ]}
        />
      </Box>
    </Stack>
  );
}
