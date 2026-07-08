"use client";

import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import GestureRoundedIcon from "@mui/icons-material/GestureRounded";
import FaceRetouchingNaturalOutlinedIcon from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import BackHandOutlinedIcon from "@mui/icons-material/BackHandOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import type { ServiceCategorySliderIconId } from "../../data/businessServiceCategorySlider.data";
import { resolveServiceCategorySliderIconId } from "../../data/businessServiceCategorySlider.data";

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
  const resolved = iconId ?? (label ? resolveServiceCategorySliderIconId(label) : "generic");
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
    default:
      return <CategoryOutlinedIcon sx={sx} />;
  }
}
