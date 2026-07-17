"use client";

import * as React from "react";
import { Box, type BoxProps } from "@mui/material";
import { MOLLURE_SECTION_GAP_PX } from "../../theme/spacing";

export type MarketingSectionProps = BoxProps & {
  /** Skip top margin for the first section on a page */
  first?: boolean;
};

export default function MarketingSection({
  first = false,
  sx,
  ...props
}: MarketingSectionProps) {
  return (
    <Box
      component="section"
      sx={[
        !first ? { mt: `${MOLLURE_SECTION_GAP_PX}px` } : null,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  );
}
