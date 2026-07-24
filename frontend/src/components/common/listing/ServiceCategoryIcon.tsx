"use client";

import Box from "@mui/material/Box";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import type { ServiceCategorySliderIconId } from "../../../data/businessServiceCategorySlider.data";
import { resolveServiceCategorySliderIconId } from "../../../data/businessServiceCategorySlider.data";

/** Brand SVG assets for service category icons (embedded bitmaps, not tintable). */
export const SERVICE_CATEGORY_ICON_SRC: Partial<
  Record<ServiceCategorySliderIconId, string>
> = {
  hair: "/icons/service-categories/hair.svg",
  makeup: "/icons/service-categories/makeup.svg",
  lashes: "/icons/service-categories/lashes.svg",
  brows: "/icons/service-categories/brows.svg",
  facial: "/icons/service-categories/facial.svg",
  nails: "/icons/service-categories/nails.svg",
  waxing: "/icons/service-categories/waxing.svg",
};

export type ServiceCategoryIconProps = {
  iconId?: ServiceCategorySliderIconId;
  label?: string;
  fontSize?: number;
  color?: string;
};

/** Shared category logo used across sliders, menus, and filter dropdowns. */
export default function ServiceCategoryIcon({
  iconId,
  label,
  fontSize = 20,
  color = "primary.main",
}: ServiceCategoryIconProps) {
  const resolved =
    iconId ?? (label ? resolveServiceCategorySliderIconId(label) : "generic");

  const src = SERVICE_CATEGORY_ICON_SRC[resolved];
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt=""
        aria-hidden
        sx={{
          height: fontSize,
          width: "auto",
          maxWidth: fontSize * 1.6,
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }

  const sx = {
    fontSize,
    color,
    flexShrink: 0,
    display: "block",
    lineHeight: 1,
  };

  switch (resolved) {
    case "all":
      return null;
    case "body":
      return <SpaOutlinedIcon sx={sx} />;
    case "generic":
    default:
      return <CategoryOutlinedIcon sx={sx} />;
  }
}
