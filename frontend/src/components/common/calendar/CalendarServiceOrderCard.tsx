"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import type { ServiceCategorySliderIconId } from "../../../data/businessServiceCategorySlider.data";
import { SERVICE_CATEGORY_ICON_SRC } from "../ServiceCategoryIcon";

export type CalendarServiceOrderCardProps = {
  label: string;
  iconId: ServiceCategorySliderIconId;
  order: number;
  /** When false, category is hidden from business setup / listing. */
  selected?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onClick?: () => void;
};

function CategoryIcon({ iconId, color }: { iconId: ServiceCategorySliderIconId; color: string }) {
  const src = SERVICE_CATEGORY_ICON_SRC[iconId];
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt=""
        aria-hidden
        sx={{ height: 24, width: "auto", maxWidth: 40, objectFit: "contain", display: "block" }}
      />
    );
  }

  const sx = { fontSize: 24, color };
  switch (iconId) {
    case "body":
      return <SpaOutlinedIcon sx={sx} />;
    default:
      return <CategoryOutlinedIcon sx={sx} />;
  }
}

export default function CalendarServiceOrderCard({
  label,
  iconId,
  order,
  selected = true,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onClick,
}: CalendarServiceOrderCardProps) {
  const m = useTheme().palette.mollure;
  const teal = m.teal;

  return (
    <Box
      draggable={draggable}
      onClick={onClick}
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
        boxSizing: "border-box",
        flex: "0 0 108px",
        width: 108,
        minWidth: 108,
        maxWidth: 108,
        borderRadius: "10px",
        border: `1px ${selected ? "solid" : "dashed"} ${selected ? alpha(teal, 0.45) : alpha(m.navy, 0.18)}`,
        bgcolor: selected ? "#fff" : alpha(m.navy, 0.03),
        px: 1,
        pt: 1.5,
        pb: 1.1,
        textAlign: "center",
        overflow: "hidden",
        cursor: onClick || draggable ? (draggable ? "grab" : "pointer") : "default",
        opacity: isDragging ? 0.55 : selected ? 1 : 0.55,
        transition: "opacity 0.15s ease, border-color 0.15s ease, background-color 0.15s ease",
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 6,
          left: 6,
          zIndex: 1,
          width: 18,
          height: 18,
          borderRadius: "999px",
          bgcolor: selected ? teal : alpha(m.navy, 0.35),
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          p: 0,
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: 10,
            fontWeight: 800,
            lineHeight: 1,
            display: "block",
            transform: "translateY(0.5px)",
          }}
        >
          {order}
        </Box>
      </Box>
      <Stack
        spacing={0.6}
        alignItems="center"
        justifyContent="center"
        sx={{ width: "100%", minHeight: 78, overflow: "hidden" }}
      >
        <CategoryIcon iconId={iconId} color={teal} />
        <Typography
          title={label}
          sx={{
            width: "100%",
            maxWidth: "100%",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.25,
            color: alpha(m.navy, 0.72),
            px: 0.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            hyphens: "auto",
          }}
        >
          {label}
        </Typography>
      </Stack>
    </Box>
  );
}
