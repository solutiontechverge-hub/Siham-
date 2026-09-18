"use client";

import * as React from "react";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  isProjectUploadImage,
  projectUploadHref,
  type ProjectUploadLike,
} from "../../../lib/projectUploadMedia";

type Props = {
  upload: ProjectUploadLike;
  width?: number;
  height?: number;
};

/** Cover img that falls back to existing non-image UI when the browser cannot render (e.g. HEIC on Chrome). */
export function FillImageOrFallback({
  src,
  alt,
  fallback,
}: {
  src?: string | null;
  alt: string;
  fallback: React.ReactNode;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);
  if (!src || previewFailed) return fallback;
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setPreviewFailed(true)}
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}

export default function ProjectUploadThumb({
  upload,
  width = 88,
  height = 72,
}: Props) {
  const m = useTheme().palette.mollure;
  const href = projectUploadHref(upload);
  const canPreview = Boolean(href) && isProjectUploadImage(upload);

  return (
    <Box
      component={href ? "a" : "div"}
      href={href || undefined}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      sx={{
        width,
        textDecoration: "none",
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: alpha(m.navy, 0.03),
      }}
    >
      <Box
        sx={{
          width: "100%",
          height,
          bgcolor: alpha(m.navy, 0.06),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <FillImageOrFallback
          src={canPreview ? href : null}
          alt={upload.name || "Upload"}
          fallback={
            <InsertDriveFileOutlinedIcon
              sx={{ fontSize: 26, color: alpha(m.navy, 0.4) }}
            />
          }
        />
      </Box>
      <Typography
        sx={{
          px: 0.5,
          py: 0.4,
          fontSize: 9.5,
          fontWeight: 800,
          color: alpha(m.navy, 0.5),
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {upload.name || "File"}
      </Typography>
    </Box>
  );
}
