"use client";

import * as React from "react";
import {
  Box,
  CardContent,
  CardMedia,
  Stack,
  type PaperProps,
} from "@mui/material";
import AppCard from "./AppCard";
import { BodyText, SubHeading } from "../ui/typography";

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
          <SubHeading sx={{ fontSize: "20px", color: "#10233f" }}>{title}</SubHeading>
          {description ? (
            <BodyText color="text.secondary">{description}</BodyText>
          ) : null}
          {actions ? <Box>{actions}</Box> : null}
        </Stack>
      </CardContent>
    </AppCard>
  );
}
