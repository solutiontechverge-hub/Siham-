"use client";

import * as React from "react";
import {
  Box,
  CardContent,
  CardMedia,
  Stack,
  Typography,
  type PaperProps,
} from "@mui/material";
import AppCard from "./AppCard";

type ImageCardProps = Omit<PaperProps, "title"> & {
  image: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  imageAlt?: string;
  imageHeight?: number;
};

export default function ImageCard({
  actions,
  description,
  image,
  imageAlt = "Card image",
  imageHeight = 220,
  title,
  ...props
}: ImageCardProps) {
  return (
    <AppCard sx={{ overflow: "hidden" }} {...props}>
      <CardMedia component="img" height={imageHeight} image={image} alt={imageAlt} />
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#10233f" }}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
          {actions ? <Box>{actions}</Box> : null}
        </Stack>
      </CardContent>
    </AppCard>
  );
}
