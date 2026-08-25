"use client";

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

export default function ProjectUploadThumb({
  upload,
  width = 88,
  height = 72,
}: Props) {
  const m = useTheme().palette.mollure;
  const href = projectUploadHref(upload);
  const showImage = Boolean(href) && isProjectUploadImage(upload);

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
        {showImage ? (
          <Box
            component="img"
            src={href}
            alt={upload.name || "Upload"}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <InsertDriveFileOutlinedIcon
            sx={{ fontSize: 26, color: alpha(m.navy, 0.4) }}
          />
        )}
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
