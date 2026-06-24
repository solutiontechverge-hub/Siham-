"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import GestureRoundedIcon from "@mui/icons-material/GestureRounded";
import FaceRetouchingNaturalOutlinedIcon from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import BackHandOutlinedIcon from "@mui/icons-material/BackHandOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import type { ServiceCategorySliderIconId } from "../../../data/businessServiceCategorySlider.data";

export type CalendarServiceOrderCardProps = {
  label: string;
  iconId: ServiceCategorySliderIconId;
  order: number;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
};

function CategoryIcon({ iconId, color }: { iconId: ServiceCategorySliderIconId; color: string }) {
  const sx = { fontSize: 24, color };
  switch (iconId) {
    case "hair":
      return <ContentCutRoundedIcon sx={sx} />;
    case "makeup":
      return <BrushRoundedIcon sx={sx} />;
    case "lashes":
      return <VisibilityRoundedIcon sx={sx} />;
    case "brows":
      return <GestureRoundedIcon sx={sx} />;
    case "facial":
      return <FaceRetouchingNaturalOutlinedIcon sx={sx} />;
    case "nails":
      return <BackHandOutlinedIcon sx={sx} />;
    case "body":
      return <SpaOutlinedIcon sx={sx} />;
    case "waxing":
      return <WaterDropOutlinedIcon sx={sx} />;
    default:
      return <CategoryOutlinedIcon sx={sx} />;
  }
}

export default function CalendarServiceOrderCard({
  label,
  iconId,
  order,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CalendarServiceOrderCardProps) {
  const m = useTheme().palette.mollure;
  const teal = m.teal;

  return (
    <Box
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", label);
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver?.(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop?.(event);
      }}
      sx={{
        position: "relative",
        flex: "0 0 96px",
        width: 96,
        minWidth: 96,
        borderRadius: "10px",
        border: `1px solid ${alpha(teal, 0.35)}`,
        bgcolor: "#fff",
        px: 0.75,
        py: 1.25,
        textAlign: "center",
        cursor: draggable ? "grab" : "default",
        opacity: isDragging ? 0.55 : 1,
        transition: "opacity 0.15s ease",
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 6,
          left: 6,
          minWidth: 18,
          height: 18,
          px: 0.35,
          borderRadius: "4px",
          bgcolor: teal,
          color: "#fff",
          fontSize: 10,
          fontWeight: 800,
          display: "grid",
          placeItems: "center",
        }}
      >
        {order}
      </Box>
      <Stack spacing={0.5} alignItems="center" justifyContent="center" sx={{ minHeight: 72 }}>
        <CategoryIcon iconId={iconId} color={teal} />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.2,
            color: alpha(m.navy, 0.72),
            px: 0.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {label}
        </Typography>
      </Stack>
    </Box>
  );
}
