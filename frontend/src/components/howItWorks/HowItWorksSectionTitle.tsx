"use client";

import * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { SubHeading } from "../ui/typography";
import { MOLLURE_HEADING_BODY_GAP_PX } from "../../theme/spacing";

const sectionHeadingSx = {
  fontWeight: 600,
  textAlign: "center",
  color: "mollure.textcolorgrey700",
} as const;

export function HowItWorksSectionTitle({
  title,
  mb = `${MOLLURE_HEADING_BODY_GAP_PX}px`,
  sx,
}: {
  title: string;
  mb?: number | string;
  sx?: SxProps<Theme>;
}) {
  return (
    <SubHeading
      sx={[
        {
          ...sectionHeadingSx,
          textAlign: "center",
          mb,
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {title}
    </SubHeading>
  );
}
