import type { Palette } from "@mui/material/styles";

type MollurePalette = Palette["mollure"];

/** Mollure brand teal stack: dark → pale (matches Figma & theme.palette.mollure). */
export function getSalesVolumeChartColors(m: MollurePalette): readonly string[] {
  return [
    m.salesVolumeStackDark,
    m.salesVolumeStackMid,
    m.salesVolumeStackLight,
    m.salesVolumeStackPale,
  ];
}

export function salesVolumeSegmentColor(m: MollurePalette, index: number): string {
  const colors = getSalesVolumeChartColors(m);
  return colors[index % colors.length]!;
}

/** Figma: segment labels are always white. */
export function salesVolumeSegmentTextColor(m: MollurePalette): string {
  return m.white;
}
