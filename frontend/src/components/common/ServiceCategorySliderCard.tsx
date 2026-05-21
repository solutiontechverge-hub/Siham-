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

/** Fixed width for every category card (including “All”) */
export const SERVICE_CATEGORY_SLIDER_CARD_WIDTH = 108;

export type ServiceCategorySliderCardProps = {
  label: string;
  iconId: ServiceCategorySliderIconId;
  active: boolean;
  onSelect: () => void;
};

function CategoryIcon({ iconId, gradientFill }: { iconId: ServiceCategorySliderIconId; gradientFill: string }) {
  const sx = mollureGradientIconSx(gradientFill);
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
  function ServiceCategorySliderCard({ label, iconId, active, onSelect }, ref) {
    const theme = useTheme();
    const { fill: iconGradientFill, defs: iconGradientDefs } = useMollureIconGradient();
    const primaryMain = theme.palette.primary.main;
    const primaryDark =
      theme.palette.primary.dark ?? theme.palette.mollure?.tealDark ?? primaryMain;
    const m = theme.palette.mollure;
    const cardBg = active ? m.white : m.fxGrayF2F4F7;
    const borderColor = active ? primaryDark : "transparent";

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
          flex: `0 0 ${SERVICE_CATEGORY_SLIDER_CARD_WIDTH}px`,
          width: SERVICE_CATEGORY_SLIDER_CARD_WIDTH,
          borderRadius: "12px",
          "&:focus-visible": {
            outline: `2px solid ${alpha(primaryMain, 0.45)}`,
            outlineOffset: 2,
          },
        }}
      >
        {iconId !== "all" ? iconGradientDefs : null}
        <AppCard
          sx={{
            width: "100%",
            minHeight: 96,
            py: 1.25,
            px: 1,
            borderRadius: "12px",
            boxShadow: "none",
            border: active ? `2px solid ${borderColor}` : "none",
            bgcolor: cardBg,
            textAlign: "center",
            position: "relative",
            overflow: "visible",
            transition: theme.transitions.create(["border-color", "box-shadow", "background-color"], {
              duration: 180,
            }),
            "&:hover": {
              borderColor: active ? primaryDark : "transparent",
              boxShadow: active
                ? `0 0 0 1px ${alpha(primaryDark, 0.18)}`
                : `0 0 0 1px ${alpha(m.navy, 0.08)}`,
            },
          }}
        >
          <Stack spacing={0.65} alignItems="center" justifyContent="center" sx={{ minHeight: 88 }}>
            {iconId !== "all" ? (
              <CategoryIcon iconId={iconId} gradientFill={iconGradientFill} />
            ) : (
              <Box sx={{ height: 26, width: "100%" }} aria-hidden />
            )}
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1.2,
                color: theme.palette.common.black,
                px: 0.25,
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
            border: `1.5px solid ${active ? primaryDark : alpha(m.navy, 0.22)}`,
            bgcolor: active ? primaryDark : m.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            boxShadow: active ? `0 1px 3px ${alpha(primaryDark, 0.35)}` : `inset 0 0 0 1px ${alpha(m.navy, 0.04)}`,
            transition: theme.transitions.create(["border-color", "background-color", "box-shadow"], {
              duration: 180,
            }),
          }}
        >
          {active ? <CheckRoundedIcon sx={{ fontSize: 17, color: "#fff" }} /> : null}
        </Box>
      </Box>
    );
  },
);

export default ServiceCategorySliderCard;
