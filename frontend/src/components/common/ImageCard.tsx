"use client";

import * as React from "react";
import Image from "next/image";
import {
  Box,
  CardContent,
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
  const useUnoptimizedImage =
    /^https?:\/\//i.test(image) || image.startsWith("data:") || image.startsWith("blob:");

  return (
    <AppCard sx={{ overflow: "hidden" }} {...props}>
      <Box sx={{ position: "relative", width: "100%", height: imageHeight }}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 600px) 100vw, 560px"
          style={{ objectFit: "cover" }}
          unoptimized={useUnoptimizedImage}
        />
      </Box>
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
