"use client";

import { useMemo } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Typography } from "../../../../components/ui/typography";

/** MUI SelectProps for empty-value placeholder styling (gender / client type). */
export function useEmptySelectRenderProps(placeholder: string) {
  const m = useTheme().palette.mollure;
  return useMemo(
    () => ({
      displayEmpty: true as const,
      renderValue: (selected: unknown) => {
        const v = String(selected ?? "").trim();
        if (!v) {
          return (
            <Typography
              component="span"
              sx={{
                color: alpha(m.navy, 0.48),
                fontWeight: 500,
                fontSize: "0.8125rem",
              }}
            >
              {placeholder}
            </Typography>
          );
        }
        return v;
      },
    }),
    [m.navy, placeholder],
  );
}
