"use client";

import * as React from "react";
import { SubHeading } from "../ui/typography";

const sectionHeadingSx = {
  fontWeight: 600,
  fontSize: { xs: "1.5rem", sm: "1.75rem" },
  color: "mollure.textcolorgrey700",
} as const;

export function HowItWorksSectionTitle({
  title,
  mb = 4,
}: {
  title: string;
  mb?: number;
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

