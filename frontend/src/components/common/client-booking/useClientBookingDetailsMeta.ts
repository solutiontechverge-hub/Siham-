"use client";

import * as React from "react";
import { parseTimeLabelToMinutes, buildWallClockDateTimeIso } from "../../../app/clients/booking/booking-time";
import {
  fmtTimeLabel,
  parseClockToMinutes,
} from "../calendar/calendar.utils";
import {
  computePrepaidAmount,
  formatBookedDateLabel,
  resolveBookingAddressLabel,
  resolvePrimaryProfessional,
} from "./clientBookingDetails.helpers";
import type { ClientBookingDraft } from "./types";

/** Booking-level end clock: max service endTime, else start + sum(durations). */
export function resolveClientBookingEndClock(
  draft: ClientBookingDraft | null | undefined,
): string {
  if (!draft) return "";
  let maxEnd: number | null = null;
  for (const service of draft.services ?? []) {
    const endMin = service.endTime?.trim()
      ? parseClockToMinutes(service.endTime.trim())
      : null;
    if (endMin != null && (maxEnd == null || endMin > maxEnd)) maxEnd = endMin;
  }
  if (maxEnd != null) return fmtTimeLabel(maxEnd);

  const startMin = draft.selectedTime?.trim()
    ? parseClockToMinutes(draft.selectedTime.trim()) ??
      parseTimeLabelToMinutes(draft.selectedTime)
    : null;
  if (startMin == null || !Number.isFinite(startMin)) return "";
  const duration = (draft.services ?? []).reduce(
    (sum, service) => sum + (Number(service.durationMins) || 0),
    0,
  );
  return duration > 0 ? fmtTimeLabel(startMin + duration) : "";
}

export function useClientBookingDetailsMeta(input: {
  draft: ClientBookingDraft | null;
  shop: {
    shopName?: string | null;
    addressLabel?: string | null;
    municipalityLabel?: string | null;
  } | null;
  businessProfile: {
    shopName?: string | null;
    specialties?: string[] | null;
    phone?: string | null;
    policySections?: unknown;
    fixedLocation?: {
      salonName?: string | null;
      formattedAddress?: string | null;
    } | null;
  } | null;
  bookingSetup: { phone?: string | null } | null;
  locationMode: string;
  prepaymentPercent: number;
  user: {
    email?: string | null;
    display_name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  isCompleted: boolean;
  isPaymentDue: boolean;
  activeBookingPaid?: boolean | null;
  pageBg: string;
}) {
  const professional = React.useMemo(
    () => resolvePrimaryProfessional(input.draft),
    [input.draft],
  );
  const shopDisplayName =
    input.shop?.shopName?.trim() ||
    input.businessProfile?.shopName?.trim() ||
    input.businessProfile?.fixedLocation?.salonName?.trim() ||
    professional.name;
  const professionalRole =
    input.businessProfile?.specialties?.[0]?.trim() || "";
  const professionalPhone =
    input.businessProfile?.phone?.trim() ||
    input.bookingSetup?.phone?.trim() ||
    "";

  const address = React.useMemo(
    () =>
      resolveBookingAddressLabel({
        locationMode: input.locationMode,
        desiredLocation: input.draft?.desiredLocation,
        profileFormattedAddress:
          input.businessProfile?.fixedLocation?.formattedAddress,
        shopAddressLabel: input.shop?.addressLabel,
        shopMunicipalityLabel: input.shop?.municipalityLabel,
      }),
    [
      input.businessProfile?.fixedLocation?.formattedAddress,
      input.draft?.desiredLocation,
      input.locationMode,
      input.shop?.addressLabel,
      input.shop?.municipalityLabel,
    ],
  );

  const bookedDateLabel = React.useMemo(
    () => formatBookedDateLabel(input.draft?.selectedDateISO),
    [input.draft?.selectedDateISO],
  );
  const bookedTimeLabel = input.draft?.selectedTime ?? "";
  const bookedEndTimeLabel = React.useMemo(
    () => resolveClientBookingEndClock(input.draft),
    [input.draft],
  );

  const headerName =
    input.user?.display_name ||
    `${input.user?.first_name ?? ""} ${input.user?.last_name ?? ""}`.trim() ||
    input.user?.email ||
    "";

  const policySections =
    (input.businessProfile?.policySections as never[]) ?? [];

  const prepaidAmount = React.useMemo(
    () => computePrepaidAmount(input.draft?.total ?? 0, input.prepaymentPercent),
    [input.draft?.total, input.prepaymentPercent],
  );

  const appointmentStartMs = React.useMemo(() => {
    if (!input.draft?.selectedDateISO) return null;
    const iso = buildWallClockDateTimeIso(
      input.draft.selectedDateISO,
      parseTimeLabelToMinutes(input.draft.selectedTime ?? ""),
    );
    const ms = new Date(iso).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [input.draft?.selectedDateISO, input.draft?.selectedTime]);

  const isFullyCompleted =
    input.isCompleted && input.activeBookingPaid === true && !input.isPaymentDue;
  const pageBackground = isFullyCompleted ? "#EAECF0" : input.pageBg;

  return {
    professional,
    shopDisplayName,
    professionalRole,
    professionalPhone,
    address,
    bookedDateLabel,
    bookedTimeLabel,
    bookedEndTimeLabel,
    headerName,
    policySections,
    prepaidAmount,
    appointmentStartMs,
    pageBackground,
  };
}
