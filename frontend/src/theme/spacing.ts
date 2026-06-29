/** Vertical gap between page sections */
export const MOLLURE_SECTION_GAP_PX = 40;

/** Gap between a section heading and its body or subheading */
export const MOLLURE_HEADING_BODY_GAP_PX = 16;

/** MUI spacing units (8px base): 40px */
export const MOLLURE_SECTION_GAP = 5;

/** MUI spacing units (8px base): 16px */
export const MOLLURE_HEADING_BODY_GAP = 2;

export const mollureSectionGapSx = {
  mt: `${MOLLURE_SECTION_GAP_PX}px`,
} as const;

export const mollureHeadingBodyGapSx = {
  mb: `${MOLLURE_HEADING_BODY_GAP_PX}px`,
} as const;
