/** App-wide typography scale — Poppins for body and headings (weights differentiate hierarchy). */
export const MOLLURE_FONT_HEADING_PX = 20;
export const MOLLURE_FONT_HEADING_MOBILE_PX = 20;
export const MOLLURE_FONT_SUBHEADING_PX = 20;
export const MOLLURE_FONT_SUBHEADING_MOBILE_PX = 20;
export const MOLLURE_FONT_CONTENT_PX = 16;

/** Loaded in `app/layout.tsx` via next/font (`--font-poppins`). */
export const MOLLURE_FONT_BODY =
  "var(--font-poppins), Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
/** Titles / h1–h6 — same stack as body (formerly Georgia serif). */
export const MOLLURE_FONT_DISPLAY = MOLLURE_FONT_BODY;

/** MUI `md` is 900px — keep in sync with theme breakpoints. */
export const MOLLURE_TYPE_MOBILE_MQ = "@media (max-width:899.95px)";

export const mollureFontSizes = {
  heading: `${MOLLURE_FONT_HEADING_PX}px`,
  headingMobile: `${MOLLURE_FONT_HEADING_MOBILE_PX}px`,
  subheading: `${MOLLURE_FONT_SUBHEADING_PX}px`,
  subheadingMobile: `${MOLLURE_FONT_SUBHEADING_MOBILE_PX}px`,
  content: `${MOLLURE_FONT_CONTENT_PX}px`,
} as const;

/** Dense product UI (calendar/booking/finance): see `mollureHierarchy.ts`. */
