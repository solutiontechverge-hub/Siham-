/** App-wide typography scale. Display headings intentionally use the brand serif. */
export const MOLLURE_FONT_HEADING_PX = 48;
export const MOLLURE_FONT_SUBHEADING_PX = 28;
export const MOLLURE_FONT_CONTENT_PX = 16;

export const MOLLURE_FONT_DISPLAY = 'Georgia, "Times New Roman", serif';
export const MOLLURE_FONT_BODY =
  "var(--font-poppins), Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

export const mollureFontSizes = {
  heading: `${MOLLURE_FONT_HEADING_PX}px`,
  subheading: `${MOLLURE_FONT_SUBHEADING_PX}px`,
  content: `${MOLLURE_FONT_CONTENT_PX}px`,
} as const;

/** Dense product UI (calendar/booking/finance): see `mollureHierarchy.ts`. */
