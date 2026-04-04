"use client";

import * as React from "react";
import { Stack, Typography, type PaperProps } from "@mui/material";
import AppCard from "./AppCard";

type ContentCardProps = Omit<PaperProps, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export default function ContentCard({
  actions,
  children,
  description,
  title,
  ...props
}: ContentCardProps) {
  return (
    <AppCard {...props}>
      <Stack spacing={2.5} sx={{ p: 3 }}>
        {title ? (
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#10233f" }}>
            {title}
          </Typography>
        ) : null}
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
        {children}
        {actions}
      </Stack>
    </AppCard>
  );
}
