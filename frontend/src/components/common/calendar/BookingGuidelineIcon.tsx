"use client";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

/**
 * Booking status guideline icons — inline SVGs (was PNG set).
 * Main stroke uses slate `#607080` (sibling set). Badges keep status green/red.
 * Waiting-for-prepayment uses solid navy + bold € coin for clear card-row weight.
 * Overdue uses theme `statusRedFg`.
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
  refund_pending: "Refund pending",
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
  strokeWidth = 1.6,
}: {
  cx?: number;
  cy?: number;
  scale?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const s = scale;
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${s}) translate(-12, -12)`}
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

/**
 * Bold €-in-circle (waiting for prepayment only).
 * Geometric C + equal bars; butt caps read sharper than EuroMark at 16–18px.
 */
function WaitingForPrepaymentSvg({ size, color = SLATE }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <g
        stroke={color}
        strokeWidth={2.15}
        strokeLinecap="butt"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Open C — generous inset so coin rim stays clear */}
        <path d="M15.6 7.35c-1.15-1.15-2.7-1.75-4.35-1.7-2.85.1-5.1 2.4-5.1 5.35s2.25 5.25 5.1 5.35c1.65.05 3.2-.55 4.35-1.7" />
        <path d="M6.85 10.55h7.1" />
        <path d="M6.85 13.45h7.1" />
      </g>
    </SvgRoot>
  );
}

function WaitingForPaymentSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <circle
        cx="12"
        cy="13"
        r="7.2"
        stroke={SLATE}
        strokeWidth={1.6}
        fill="none"
      />
      <path
        d="M8.2 5.2 L9.6 7.4"
        stroke={SLATE}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M15.8 5.2 L14.4 7.4"
        stroke={SLATE}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M12 13 V8.6"
        stroke={SLATE}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M12 13 L15.4 15.2"
        stroke={SLATE}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </SvgRoot>
  );
}

function PrepaidSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <circle
        cx="11"
        cy="11"
        r="7.5"
        stroke={SLATE}
        strokeWidth={1.6}
        fill="none"
      />
      <EuroMark cx={11} cy={11} scale={0.78} />
      <circle cx="17.2" cy="17.2" r="4.2" fill={BADGE_GREEN} />
      <path
        d="M15.2 17.2 L16.5 18.5 L19.4 15.6"
        stroke="#1B4332"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgRoot>
  );
}

function RefundPendingSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <circle
        cx="11"
        cy="11"
        r="7.5"
        stroke={SLATE}
        strokeWidth={1.6}
        fill="none"
      />
      <EuroMark cx={11} cy={11} scale={0.78} />
      <circle cx="17.2" cy="17.2" r="4.2" fill={BADGE_RED} />
      <path
        d="M15.6 15.6 L18.8 18.8 M18.8 15.6 L15.6 18.8"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </SvgRoot>
  );
}

function RefundCompletedSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <path
        d="M16.8 7.2 A6.8 6.8 0 1 0 18.2 14.2"
        stroke={SLATE}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.4 5.6 L16.8 7.2 L15.2 9.6"
        stroke={SLATE}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <EuroMark cx={12} cy={12.2} scale={0.7} />
    </SvgRoot>
  );
}

function ResponseTimeActiveSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <path
        d="M7.5 4.5 H16.5 V6.2 C16.5 7.5 15.7 8.6 14.6 9.2 L12 10.5 L9.4 9.2 C8.3 8.6 7.5 7.5 7.5 6.2 V4.5 Z"
        stroke={SLATE}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M7.5 19.5 H16.5 V17.8 C16.5 16.5 15.7 15.4 14.6 14.8 L12 13.5 L9.4 14.8 C8.3 15.4 7.5 16.5 7.5 17.8 V19.5 Z"
        stroke={SLATE}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9.2 7.6 H14.8"
        stroke={SLATE}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M9.2 16.8 H14.8"
        stroke={SLATE}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.85}
      />
    </SvgRoot>
  );
}

function SuggestionForChangeSvg({ size }: SvgProps) {
  return (
    <SvgRoot size={size}>
      <rect
        x="7"
        y="4"
        width="12"
        height="16"
        rx="1.6"
        stroke={SLATE}
        strokeWidth={1.6}
        fill="none"
      />
      <path
        d="M4.8 7.5 H7 M4.8 12 H7 M4.8 16.5 H7"
        stroke={SLATE}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M14.8 9.2 A2.8 2.8 0 0 0 10.4 10.4"
        stroke={SLATE}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10.2 8.6 L10.4 10.4 L12.2 10.1"
        stroke={SLATE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10.2 14.8 A2.8 2.8 0 0 0 14.6 13.6"
        stroke={SLATE}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.8 15.4 L14.6 13.6 L12.8 13.9"
        stroke={SLATE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgRoot>
  );
}

const VARIANT_SVG: Partial<
  Record<BookingGuidelineIconVariant, (p: SvgProps) => ReactNode>
> = {
  waiting_for_prepayment: WaitingForPrepaymentSvg,
  waiting_for_payment: WaitingForPaymentSvg,
  prepaid: PrepaidSvg,
  refund_pending: RefundPendingSvg,
  refund_completed: RefundCompletedSvg,
  response_time_active: ResponseTimeActiveSvg,
  suggestion_for_change: SuggestionForChangeSvg,
};

type Props = {
  variant: BookingGuidelineIconVariant;
  size?: number;
};

export default function BookingGuidelineIcon({ variant, size = 16 }: Props) {
  const m = useTheme().palette.mollure;
  const overdueColor = m.statusRedFg;
  // Card call sites pass 16; seal needs ~18 optical weight (matches PaymentDue).
  const resolvedSize =
    variant === "waiting_for_prepayment" && size < 18 ? 18 : size;
  // Full navy — alpha washed out the coin at card size vs reference.
  const prepayColor = m.navy;

  if (variant === "overdue_response" || variant === "overdue_payment") {
    return (
      <Box
        component="span"
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          color: overdueColor,
        }}
      >
        <WarningAmberRoundedIcon
          aria-hidden
          sx={{ fontSize: size, color: "inherit", display: "block" }}
        />
      </Box>
    );
  }

  const Svg = VARIANT_SVG[variant];
  if (!Svg) return null;

  return (
    <Box
      component="span"
      sx={{
        width: resolvedSize,
        height: resolvedSize,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
      }}
    >
      <Svg
        size={resolvedSize}
        color={
          variant === "waiting_for_prepayment" ? prepayColor : undefined
        }
      />
    </Box>
  );
}
