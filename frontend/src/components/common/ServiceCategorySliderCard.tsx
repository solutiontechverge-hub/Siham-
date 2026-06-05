"use client";

import * as React from "react";
import { Stack, Typography, Box } from "@mui/material";
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
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AppCard from "./AppCard";
import type { ServiceCategorySliderIconId } from "../../data/businessServiceCategorySlider.data";
import { mollureGradientIconSx, useMollureIconGradient } from "./MollureIconGradient";

/** Fixed width for horizontal-scroll category strips */
export const SERVICE_CATEGORY_SLIDER_CARD_WIDTH = 108;
const SERVICE_CATEGORY_SLIDER_CARD_WIDTH_VAR = "--serviceCategoryCardWidth";

export type ServiceCategorySliderCardProps = {
  label: string;
  iconId: ServiceCategorySliderIconId;
  active: boolean;
  onSelect: () => void;
  /** When true, cards share row width equally (business setup / Figma bar) */
  equalWidth?: boolean;
};

function CategoryIcon({
  iconId,
  active,
  gradientFill,
  mutedColor,
  barStyle,
  tealColor,
}: {
  iconId: ServiceCategorySliderIconId;
  active: boolean;
  gradientFill: string;
  mutedColor: string;
  barStyle: boolean;
  tealColor: string;
}) {
  const sx = barStyle
    ? { fontSize: 26, color: tealColor }
    : active
      ? mollureGradientIconSx(gradientFill)
      : { fontSize: 26, color: mutedColor };
  switch (iconId) {
    case "all":
      return null;
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
    case "generic":
      return <CategoryOutlinedIcon sx={sx} />;
  }
}

const ServiceCategorySliderCard = React.forwardRef<HTMLButtonElement, ServiceCategorySliderCardProps>(
  function ServiceCategorySliderCard({ label, iconId, active, onSelect, equalWidth = false }, ref) {
    const theme = useTheme();
    const { fill: iconGradientFill, defs: iconGradientDefs } = useMollureIconGradient();
    const m = theme.palette.mollure;
    const teal = theme.palette.primary.main;
    const tealDark = theme.palette.primary.dark ?? m.tealDark ?? teal;

    const barStyle = equalWidth;
    const cardBg = active ? m.white : m.fxGrayF2F4F7;
    const borderColor = barStyle
      ? active
        ? teal
        : alpha(m.navy, 0.08)
      : active
        ? teal
        : alpha(m.navy, 0.1);
    const borderWidth = active ? 2 : 1;
    const labelColor = barStyle
      ? teal
      : active
        ? iconId === "all"
          ? teal
          : m.navy
        : iconId === "all"
          ? alpha(teal, 0.65)
          : alpha(m.navy, 0.42);
    const mutedIconColor = alpha(m.navy, 0.32);
    const cardWidth = `var(${SERVICE_CATEGORY_SLIDER_CARD_WIDTH_VAR}, ${SERVICE_CATEGORY_SLIDER_CARD_WIDTH}px)`;

    return (
      <Box
        ref={ref}
        component="button"
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onSelect}
        sx={{
          position: "relative",
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          font: "inherit",
          display: "block",
          cursor: "pointer",
          flex: `0 0 ${cardWidth}`,
          width: cardWidth,
          minWidth: cardWidth,
          borderRadius: "12px",
          "&:focus-visible": {
            outline: `2px solid ${alpha(teal, 0.45)}`,
            outlineOffset: 2,
          },
        }}
      >
        {active && iconId !== "all" && !barStyle ? iconGradientDefs : null}
        <AppCard
          sx={{
            width: "100%",
            minHeight: barStyle ? 96 : equalWidth ? 92 : 96,
            py: barStyle ? 1.25 : equalWidth ? 1.35 : 1.25,
            px: 1,
            borderRadius: barStyle ? "10px" : "12px",
            boxShadow: barStyle ? "none" : "none",
            border: `${borderWidth}px solid ${borderColor}`,
            bgcolor: cardBg,
            textAlign: "center",
            position: "relative",
            overflow: "visible",
            opacity: 1,
            transition: theme.transitions.create(["border-color", "background-color"], {
              duration: 180,
            }),
            "&:hover": {
              borderColor: active ? tealDark : barStyle ? alpha(m.navy, 0.14) : alpha(m.navy, 0.16),
            },
          }}
        >
          <Stack
            spacing={iconId === "all" ? 0 : 0.75}
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: barStyle ? 88 : equalWidth ? 76 : 88 }}
          >
            {iconId !== "all" ? (
              <CategoryIcon
                iconId={iconId}
                active={active}
                gradientFill={iconGradientFill}
                mutedColor={mutedIconColor}
                barStyle={barStyle}
                tealColor={teal}
              />
            ) : !barStyle ? (
              <Box sx={{ height: 26, width: "100%" }} aria-hidden />
            ) : null}
            <Typography
              sx={{
                fontSize: barStyle ? 11.5 : equalWidth ? 12 : 11,
                fontWeight: active ? 700 : barStyle ? 600 : 500,
                lineHeight: 1.25,
                color: labelColor,
                px: 0.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {label}
            </Typography>
          </Stack>
        </AppCard>
        {!equalWidth ? (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 7,
              left: 7,
              zIndex: 4,
              width: 18,
              height: 18,
              borderRadius: "4px",
              border: `1.5px solid ${active ? tealDark : alpha(m.navy, 0.22)}`,
              bgcolor: active ? tealDark : m.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              boxShadow: active ? `0 1px 3px ${alpha(tealDark, 0.35)}` : `inset 0 0 0 1px ${alpha(m.navy, 0.04)}`,
              transition: theme.transitions.create(["border-color", "background-color", "box-shadow"], {
                duration: 180,
              }),
            }}
          >
            {active ? <CheckRoundedIcon sx={{ fontSize: 17, color: "#fff" }} /> : null}
          </Box>
        ) : null}
      </Box>
    );
  },
);

export default ServiceCategorySliderCard;
