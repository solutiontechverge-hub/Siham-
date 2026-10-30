"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Booking status guideline icons — inline SVGs.
 * All variants sit in a 24×24 soft-grey squircle (`#F2F4F7`, no border).
 * Stroke weight ~1.15 to match waiting-for-prepayment.
 */
export type BookingGuidelineIconVariant =
  | "refund_pending"
  | "prepaid"
  | "refund_completed"
  | "response_time_active"
  | "waiting_for_prepayment"
  | "waiting_for_payment"
  | "overdue_response"
  | "overdue_payment"
  | "suggestion_for_change";

export const BOOKING_GUIDELINE_ICON_LABELS: Record<
  BookingGuidelineIconVariant,
  string
> = {
  refund_pending: "Prepayment failed / rejected",
  prepaid: "Prepayment received",
  refund_completed: "Refund completed",
  response_time_active: "Waiting for response",
  waiting_for_prepayment: "Waiting for prepayment",
  waiting_for_payment: "Invoice due / waiting for payment",
  overdue_response: "Overdue response",
  overdue_payment: "Overdue payment",
  suggestion_for_change: "Suggestion for change",
};

const SLATE = "#607080";
const BADGE_GREEN = "#039855";
const BADGE_RED = "#F04438";
const WARN_ORANGE = "#F79009";
const ICON_BG = "#F2F4F7";
const STROKE = 1.15;

type SvgProps = { size: number; color?: string };

function SvgRoot({ size, children }: SvgProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      style={{ display: "block" }}
    >
      {children}
    </svg>
  );
}

/** € mark centered in viewBox */
function EuroMark({
  cx = 12,
  cy = 12,
  scale = 1,
  color = SLATE,
  strokeWidth = STROKE,
}: {
  cx?: number;
  cy?: number;
  scale?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-12, -12)`}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M15.2 7.2c-1.1-1-2.5-1.5-4-1.4-2.6.1-4.7 2.2-4.7 4.8s2.1 4.7 4.7 4.8c1.5.1 2.9-.4 4-1.4" />
      <path d="M7.2 11.1h6.2" />
      <path d="M7.2 13.4h5.4" />
    </g>
  );
}

/** € + dashed ring + clock badge (waiting for prepayment). */
function WaitingForPrepaymentSvg({ size, color = SLATE }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <circle
        cx="11"
        cy="11"
        r="8.8"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray="2.4 1.9"
        fill="none"
      />
      <circle
        cx="11"
        cy="11"
        r="5.9"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
      />
      <EuroMark cx={11} cy={11} scale={0.58} color={color} strokeWidth={STROKE} />
      <circle
        cx="17.4"
        cy="17.4"
        r="4"
        fill={ICON_BG}
        stroke={color}
        strokeWidth={STROKE}
      />
      <path
        d="M17.4 15.5 V17.4 L18.85 18.5"
        stroke={color}
        strokeWidth={1.05}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgRoot>
  );
}

/** Alarm clock — waiting for response / payment due (image-2 squircle glyph). */
function AlarmClockSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      {/* Twin bells */}
      <path
        d="M8.2 6.4c0-.9.7-1.5 1.5-1.2.4.6.5 1.3.2 1.9"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M15.8 6.4c0-.9-.7-1.5-1.5-1.2-.4.6-.5 1.3-.2 1.9"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="12"
        cy="13"
        r="7.2"
        stroke={SLATE}
        strokeWidth={STROKE}
        fill="none"
      />
      {/* Hands ~3 o'clock */}
      <path
        d="M12 13 V9.2"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M12 13 H16.2"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </SvgRoot>
  );
}

/** € in circle + green check — prepaid / payment completed. */
function PrepaidSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <circle
        cx="11"
        cy="11"
        r="7.5"
        stroke={SLATE}
        strokeWidth={STROKE}
        fill="none"
      />
      <EuroMark cx={11} cy={11} scale={0.78} strokeWidth={STROKE} />
      <circle cx="17.2" cy="17.2" r="4.2" fill={BADGE_GREEN} />
      <path
        d="M15.2 17.2 L16.5 18.5 L19.4 15.6"
        stroke="#fff"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgRoot>
  );
}

/** € in circle + red X — payment / prepayment failed. */
function RefundPendingSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <circle
        cx="11"
        cy="11"
        r="7.5"
        stroke={SLATE}
        strokeWidth={STROKE}
        fill="none"
      />
      <EuroMark cx={11} cy={11} scale={0.78} strokeWidth={STROKE} />
      <circle cx="17.2" cy="17.2" r="4.2" fill={BADGE_RED} />
      <path
        d="M15.6 15.6 L18.8 18.8 M18.8 15.6 L15.6 18.8"
        stroke="#fff"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </SvgRoot>
  );
}

/** € with circular return arrow — refund. */
function RefundCompletedSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <path
        d="M16.8 7.2 A6.8 6.8 0 1 0 18.2 14.2"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.4 5.6 L16.8 7.2 L15.2 9.6"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <EuroMark cx={12} cy={12.2} scale={0.7} strokeWidth={STROKE} />
    </SvgRoot>
  );
}

/** Notebook + rotating arrows — BR / ER / edit request. */
function SuggestionForChangeSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <rect
        x="7"
        y="4"
        width="12"
        height="16"
        rx="1.4"
        stroke={SLATE}
        strokeWidth={STROKE}
        fill="none"
      />
      <path
        d="M5 7.5 H7 M5 12 H7 M5 16.5 H7"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M15 9.4 A2.7 2.7 0 0 0 10.8 10.5"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10.6 8.7 L10.8 10.5 L12.5 10.2"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10 14.6 A2.7 2.7 0 0 0 14.2 13.5"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.4 15.3 L14.2 13.5 L12.5 13.8"
        stroke={SLATE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgRoot>
  );
}

/** Orange triangle + ! — overdue / warning notice. */
function WarningTriangleSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <path
        d="M12 3.2 L21.2 19.8 H2.8 Z"
        fill={WARN_ORANGE}
        stroke={WARN_ORANGE}
        strokeWidth={0.4}
        strokeLinejoin="round"
      />
      <path
        d="M12 9.2 V14.2"
        stroke="#fff"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.6" r="0.95" fill="#fff" />
    </SvgRoot>
  );
}

const VARIANT_SVG: Record<
  BookingGuidelineIconVariant,
  (p: SvgProps) => ReactNode
> = {
  waiting_for_prepayment: WaitingForPrepaymentSvg,
  // Same €+clock glyph as prepayment wait — used for AT payment due too.
  waiting_for_payment: WaitingForPrepaymentSvg,
  prepaid: PrepaidSvg,
  refund_pending: RefundPendingSvg,
  refund_completed: RefundCompletedSvg,
  response_time_active: AlarmClockSvg,
  suggestion_for_change: SuggestionForChangeSvg,
  overdue_response: WarningTriangleSvg,
  overdue_payment: WarningTriangleSvg,
};

const WARNING_VARIANTS: ReadonlySet<BookingGuidelineIconVariant> = new Set([
  "overdue_response",
  "overdue_payment",
]);

type Props = {
  variant: BookingGuidelineIconVariant;
  size?: number;
};

export default function BookingGuidelineIcon({ variant, size = 24 }: Props) {
  const Svg = VARIANT_SVG[variant];
  const isWarning = WARNING_VARIANTS.has(variant);
  // Warnings fill the box (no grey pad). Mini in-pill glyphs (≤16) skip pad so they stay readable.
  const pad = isWarning ? 0 : size <= 16 ? 0 : Math.max(3, Math.round(size * 0.14));
  const glyph = Math.max(10, size - pad * 2);

  return (
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        boxSizing: "border-box",
        p: `${pad}px`,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        bgcolor: isWarning ? "transparent" : ICON_BG,
        border: "none",
        borderRadius: isWarning
          ? 0
          : `${Math.max(6, Math.round(size * 0.28))}px`,
      }}
      aria-hidden
    >
      <Svg size={glyph} />
    </Box>
  );
}
