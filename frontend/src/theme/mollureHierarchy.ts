import { alpha } from "@mui/material/styles";

/**
 * Dense app UI type hierarchy (calendar / booking / finance / analytics).
 * Marketing pages keep theme variants (MainHeading / SubHeading / BodyText).
 *
 * Levels:
 * - pageTitle / pageSubtitle — card / screen page headers (Client / Finance / Analytics)
 * - sectionTitle — panel / drawer / nested block headings
 * - label — nested block titles (info panels, field groups)
 * - body — primary supporting copy
 * - bodyMuted — secondary / helper copy
 * - tableHeader — data table column headers
 * - confirm — danger/confirm modal body
 */
export const MOLLURE_UI = {
  pageTitle: {
    fontSize: 20,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: 700 as const,
    opacity: 0.9,
    lineHeight: 1.15,
    letterSpacing: "-0.01em",
  },
  pageSubtitle: { fontSize: 13, fontWeight: 600 as const, opacity: 0.6 },
  sectionTitle: { fontSize: 20, fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700 as const, opacity: 0.88 },
  label: { fontSize: 12.5, fontWeight: 800 as const, opacity: 0.78 },
  body: { fontSize: 12.5, fontWeight: 700 as const, opacity: 0.72 },
  bodyMuted: { fontSize: 12.5, fontWeight: 600 as const, opacity: 0.55 },
  tableHeader: {
    fontSize: 12,
    fontWeight: 800 as const,
    opacity: 0.7,
    letterSpacing: "0.02em",
  },
  confirm: { fontSize: 14, fontWeight: 900 as const, opacity: 0.88 },
} as const;

type Extra = Record<string, unknown> | undefined;

export function mollurePageTitleSx(navy: string, extra?: Extra) {
  const t = MOLLURE_UI.pageTitle;
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    color: alpha(navy, t.opacity),
    ...extra,
  };
}

export function mollurePageSubtitleSx(navy: string, extra?: Extra) {
  const t = MOLLURE_UI.pageSubtitle;
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    color: alpha(navy, t.opacity),
    ...extra,
  };
}

export function mollureSectionTitleSx(navy: string, extra?: Extra) {
  const t = MOLLURE_UI.sectionTitle;
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    color: alpha(navy, t.opacity),
    ...extra,
  };
}

export function mollureLabelSx(navy: string, extra?: Extra) {
  const t = MOLLURE_UI.label;
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    color: alpha(navy, t.opacity),
    ...extra,
  };
}

export function mollureBodySx(navy: string, extra?: Extra) {
  const t = MOLLURE_UI.body;
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    color: alpha(navy, t.opacity),
    ...extra,
  };
}

export function mollureBodyMutedSx(navy: string, extra?: Extra) {
  const t = MOLLURE_UI.bodyMuted;
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    color: alpha(navy, t.opacity),
    ...extra,
  };
}

export function mollureTableHeaderSx(navy: string, extra?: Extra) {
  const t = MOLLURE_UI.tableHeader;
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    letterSpacing: t.letterSpacing,
    color: alpha(navy, t.opacity),
    ...extra,
  };
}

export function mollureConfirmBodySx(navy: string, opacity: number = MOLLURE_UI.confirm.opacity) {
  const t = MOLLURE_UI.confirm;
  return {
    fontWeight: t.fontWeight,
    fontSize: t.fontSize,
    color: alpha(navy, opacity),
    lineHeight: 1.55,
    px: 1,
  };
}
