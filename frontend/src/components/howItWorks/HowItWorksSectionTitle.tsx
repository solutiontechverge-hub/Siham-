"use client";

import * as React from "react";
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
}: {
  title: string;
  mb?: number | string;
}) {
  return (
    <SubHeading
      sx={{
        ...sectionHeadingSx,
        textAlign: "center",
        mb,
      }}
    >
      {title}
    </SubHeading>
  );
}
