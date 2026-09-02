"use client";

import * as React from "react";
import { Box, Checkbox, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import type { ServiceCategorySliderIconId } from "../../../data/businessServiceCategorySlider.data";
import { SERVICE_CATEGORY_ICON_SRC } from "../ServiceCategoryIcon";

export type CalendarServiceOrderCardProps = {
  label: string;
  iconId: ServiceCategorySliderIconId;
  order: number;
  /** Checked = shown in business setup / client listing. */
  checked?: boolean;
  /** Show the visibility checkbox (only while editing). */
  showCheckbox?: boolean;
  /** Soft highlight for the category whose services are being viewed. */
  active?: boolean;
  draggable?: boolean;
  /** Show a drag-handle affordance while editing / reordering. */
  showDragHandle?: boolean;
  isDragging?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onClick?: () => void;
};

function CategoryIcon({
  iconId,
  color,
}: {
  iconId: ServiceCategorySliderIconId;
  color: string;
}) {
  const src = SERVICE_CATEGORY_ICON_SRC[iconId];
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt=""
        aria-hidden
        sx={{
          height: 24,
          width: "auto",
          maxWidth: 40,
          objectFit: "contain",
          display: "block",
        }}
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
  checked = true,
  showCheckbox = false,
  active = false,
  draggable = false,
  showDragHandle = false,
  isDragging = false,
  onCheckedChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onClick,
}: CalendarServiceOrderCardProps) {
  const m = useTheme().palette.mollure;
  const teal = m.teal;
  const didDragRef = React.useRef(false);

  return (
    <Box
      draggable={draggable}
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        onClick?.();
      }}
      onDragStart={(event) => {
        didDragRef.current = true;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", label);
        onDragStart?.();
      }}
      onDragEnd={() => {
        onDragEnd?.();
        // Keep didDragRef true until the following click is suppressed.
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }}
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
        border: `1px solid ${active ? alpha(teal, 0.55) : alpha(m.navy, 0.12)}`,
        bgcolor: active
          ? alpha(teal, 0.06)
          : checked
            ? "#fff"
            : alpha(m.navy, 0.03),
        px: 1,
        pt: 1.5,
        pb: 1.1,
        textAlign: "center",
        overflow: "hidden",
        cursor:
          onClick || draggable ? (draggable ? "grab" : "pointer") : "default",
        opacity: isDragging ? 0.55 : checked ? 1 : 0.55,
        transition:
          "opacity 0.15s ease, border-color 0.15s ease, background-color 0.15s ease",
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
          bgcolor: checked ? teal : alpha(m.navy, 0.35),
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

      {showDragHandle ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: 4,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: alpha(m.navy, 0.32),
            pointerEvents: "none",
          }}
        >
          <DragIndicatorRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
      ) : null}

      {showCheckbox ? (
        <Checkbox
          size="small"
          checked={checked}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            onCheckedChange?.(event.target.checked);
          }}
          inputProps={{
            "aria-label": checked ? `Hide ${label}` : `Show ${label}`,
          }}
          sx={{
            position: "absolute",
            top: 2,
            right: 2,
            zIndex: 2,
            p: 0.35,
            color: alpha(m.navy, 0.35),
            "&.Mui-checked": { color: teal },
          }}
        />
      ) : null}

      <Stack
        spacing={0.6}
        alignItems="center"
        justifyContent="center"
        sx={{
          width: "100%",
          minHeight: 78,
          overflow: "hidden",
          pb: showDragHandle ? 1.25 : 0,
        }}
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
            color: alpha(m.navy, checked ? 0.72 : 0.45),
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
