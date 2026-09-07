"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Box, Chip, CircularProgress, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  AppModalCancelButton,
  AppModalPrimaryButton,
} from "./AppModal";
import { BodyText, Typography } from "../ui/typography";
import type { ClientNotificationItem } from "../../data/clientNotifications.data";
import { useGetMyBookingsQuery } from "../../store/services/businessApi";
import { mapApiBookingToClientRecord } from "../../app/clients/booking/clientBookingApi.mapper";
import { enrichClientBookingRecord } from "../../app/clients/booking/clientBookingDraftCache";
import {
  listTabForClientBooking,
  statusChipLabel,
  type ClientBookingRecord,
} from "../../app/clients/booking/clientBookingRecords";
import { bookingStatusChipColors } from "../../app/clients/booking/clientBookingStatus";
import {
  getCheckoutPath,
  notifyActiveBookingChanged,
  setActiveBookingSession,
} from "../../app/clients/booking/clientBookingSession";
import { markBookingUpdateSeen } from "./calendar/bookingUpdateSeen";
import { buildBookingSummarySections, bookingParticipantDisplayHeading, participantHeadingOrdinal, participantOrdinals, planningScheduleMeta } from "./client-booking/buildBookingSummarySections";

export const FOCUS_BOOKING_REF_KEY = "mollure:focus_booking_ref";
export const FOCUS_BOOKING_ID_KEY = "mollure:focus_booking_id";
export const FOCUS_BOOKING_DATE_KEY = "mollure:focus_booking_date";

export type NotificationBookingSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  notification: ClientNotificationItem | null;
  isProfessional?: boolean;
};

function normalizeBookingCode(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/^#/, "")
    .replace(/^bk-?/i, "")
    .toLowerCase();
}

function formatScheduleLabel(record: ClientBookingRecord) {
  const dateIso = record.draft?.selectedDateISO;
  const time = record.draft?.selectedTime;
  if (!dateIso) return "—";
  const date = new Date(`${dateIso}T12:00:00`);
  const dateLabel = Number.isNaN(date.getTime())
    ? dateIso
    : date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  return time ? `${dateLabel} · ${time}` : dateLabel;
}

function formatMoney(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `€${value.toFixed(2)}`;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  const m = useTheme().palette.mollure;
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ py: 0.85 }}
    >
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 800,
          color: alpha(m.navy, 0.5),
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ textAlign: "right", minWidth: 0 }}>
        {typeof value === "string" || typeof value === "number" ? (
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: alpha(m.navy, 0.82),
              wordBreak: "break-word",
            }}
          >
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}

function setFocusBookingKeys(input: {
  bookingRef?: string | null;
  bookingId?: string | null;
  dateIso?: string | null;
}) {
  if (typeof window === "undefined") return;
  if (input.bookingRef) {
    window.sessionStorage.setItem(FOCUS_BOOKING_REF_KEY, input.bookingRef);
  } else {
    window.sessionStorage.removeItem(FOCUS_BOOKING_REF_KEY);
  }
  if (input.bookingId) {
    window.sessionStorage.setItem(FOCUS_BOOKING_ID_KEY, input.bookingId);
  } else {
    window.sessionStorage.removeItem(FOCUS_BOOKING_ID_KEY);
  }
  if (input.dateIso) {
    window.sessionStorage.setItem(FOCUS_BOOKING_DATE_KEY, input.dateIso);
  } else {
    window.sessionStorage.removeItem(FOCUS_BOOKING_DATE_KEY);
  }
}

export default function NotificationBookingSummaryModal({
  open,
  onClose,
  notification,
  isProfessional = false,
}: NotificationBookingSummaryModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();

  const bookingRef = notification?.bookingRef?.trim() || "";
  const bookingId = notification?.bookingId?.trim() || "";
  const searchTerm = bookingRef || bookingId;

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useGetMyBookingsQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });

  const record = React.useMemo(() => {
    if (!notification) return null;
    const rows = data?.data ?? [];
    if (!rows.length) return null;

    const refNorm = normalizeBookingCode(bookingRef);
    const match =
      rows.find((row) => {
        if (bookingId && row.id === bookingId) return true;
        if (
          refNorm &&
          row.unique_code &&
          normalizeBookingCode(row.unique_code) === refNorm
        ) {
          return true;
        }
        return false;
      }) ?? null;

    if (!match) return null;
    return enrichClientBookingRecord(mapApiBookingToClientRecord(match));
  }, [bookingId, bookingRef, data?.data, notification]);

  const summarySections = React.useMemo(
    () => buildBookingSummarySections(record?.draft ?? null),
    [record?.draft],
  );

  const loading = Boolean(open && (isLoading || isFetching));
  const statusColors = record
    ? bookingStatusChipColors(record.status)
    : null;

  const handleOk = () => {
    onClose();
  };

  const handleViewClient = () => {
    if (!record) return;
    markBookingUpdateSeen("client", record.bookingRef, record.updatedAt);
    setActiveBookingSession(record);
    notifyActiveBookingChanged();
    onClose();
    router.push(getCheckoutPath(record, listTabForClientBooking(record)));
  };

  const handleViewProfessional = () => {
    if (!notification || !record) return;

    const resolvedRef = bookingRef || record.bookingRef || "";
    const resolvedId = bookingId || record.apiBookingId || record.id || "";
    const dateIso = record.draft?.selectedDateISO || "";

    setFocusBookingKeys({
      bookingRef: resolvedRef || null,
      bookingId: resolvedId || null,
      dateIso: dateIso || null,
    });

    const params = new URLSearchParams();
    if (resolvedRef) params.set("bookingRef", resolvedRef);
    else if (resolvedId) params.set("bookingId", resolvedId);
    if (dateIso) params.set("date", dateIso);
    params.set("open", "1");

    onClose();
    router.push(`/professionals/calendar?${params.toString()}`);
  };

  const actorLabel = isProfessional ? "Client" : "Professional / Salon";
  const actorValue =
    notification?.actorName ?? notification?.professionalName ?? "—";

  const footer = (() => {
    if (!isProfessional) {
      if (record) {
        return (
          <>
            <AppModalCancelButton onClick={handleOk} label="OK" />
            <AppModalPrimaryButton onClick={handleViewClient} label="View Booking" />
          </>
        );
      }
      return <AppModalPrimaryButton onClick={handleOk} label="OK" />;
    }
    if (loading) {
      return <AppModalCancelButton onClick={onClose} label="Close" />;
    }
    if (record) {
      return (
        <>
          <AppModalCancelButton onClick={onClose} label="Close" />
          <AppModalPrimaryButton onClick={handleViewProfessional} label="View" />
        </>
      );
    }
    return <AppModalPrimaryButton onClick={handleOk} label="OK" />;
  })();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={notification?.statusLabel ?? "Booking summary"}
      subtitle={notification?.bookingIdLabel ?? undefined}
      maxWidth="sm"
      footerVariant="actions"
      footer={footer}
    >
      {!notification ? null : (
        <Stack spacing={1.5} sx={{ px: 2.5, pb: 1 }}>
          {notification.message ? (
            <BodyText sx={{ color: alpha(m.navy, 0.7), fontSize: 13.5 }}>
              {notification.message}
            </BodyText>
          ) : null}

          <Box
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              bgcolor: alpha(m.navy, 0.02),
              px: 1.75,
              py: 0.5,
            }}
          >
            <SummaryRow label={actorLabel} value={actorValue} />
            <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />
            <SummaryRow
              label="Notified"
              value={notification.timeLabel || "—"}
            />
            <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />
            <SummaryRow
              label="Booking ID"
              value={notification.bookingIdLabel || "—"}
            />
          </Box>

          {loading ? (
            <Stack alignItems="center" py={3}>
              <CircularProgress size={28} sx={{ color: m.teal }} />
              <Typography
                sx={{ mt: 1.5, fontSize: 13, color: alpha(m.navy, 0.55) }}
              >
                Loading booking summary…
              </Typography>
            </Stack>
          ) : null}

          {!loading && isError ? (
            <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.6) }}>
              Could not load booking details.
            </Typography>
          ) : null}

          {!loading && !isError && searchTerm && !record ? (
            <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.6) }}>
              Booking details are unavailable for this notification.
            </Typography>
          ) : null}

          {!loading && record ? (
            <Box
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                px: 1.75,
                py: 0.5,
              }}
            >
              <SummaryRow
                label="Status"
                value={
                  <Chip
                    size="small"
                    label={statusChipLabel(record.status)}
                    sx={{
                      height: 22,
                      fontWeight: 800,
                      fontSize: 11,
                      bgcolor: statusColors?.bgcolor,
                      color: statusColors?.color,
                      border: statusColors?.border,
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                }
              />
              <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />
              <SummaryRow
                label="Schedule"
                value={formatScheduleLabel(record)}
              />
              <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />
              <SummaryRow
                label={isProfessional ? "Business" : "Salon"}
                value={record.shop?.shopName ?? "—"}
              />
              <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />
              <SummaryRow
                label="Location"
                value={
                  record.shop?.addressLabel ||
                  record.shop?.municipalityLabel ||
                  (record.shop?.locationMode === "desired"
                    ? "Desired location"
                    : "—")
                }
              />
              {record.contactPhone ? (
                <>
                  <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />
                  <SummaryRow label="Contact" value={record.contactPhone} />
                </>
              ) : null}
              <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />
              <SummaryRow
                label="Total"
                value={formatMoney(record.draft?.total)}
              />
            </Box>
          ) : null}

          {!loading && summarySections.length > 0 ? (
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: alpha(m.navy, 0.78),
                  mb: 1,
                  px: 0.25,
                }}
              >
                Services
              </Typography>
              <Stack spacing={1.25}>
                {summarySections.map((section) => (
                  <Box
                    key={section.key}
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                      bgcolor: alpha(m.navy, 0.02),
                      px: 1.75,
                      py: 1.25,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 12.5,
                        color: alpha(m.navy, 0.72),
                        mb:
                          section.items.length || section.planningItem
                            ? 0.85
                            : 0,
                      }}
                    >
                      {bookingParticipantDisplayHeading(
                        section,
                        participantHeadingOrdinal(
                          section,
                          participantOrdinals(summarySections),
                        ),
                      )}
                      {section.teamMemberLabel
                        ? ` · ${section.teamMemberLabel}`
                        : ""}
                    </Typography>
                    <Stack spacing={0.75}>
                      {section.items.map((item) => (
                        <Stack
                          key={item.id}
                          direction="row"
                          justifyContent="space-between"
                          spacing={1.5}
                        >
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.78),
                            }}
                          >
                            {item.name}
                            {item.durationMins
                              ? ` (${item.durationMins} min)`
                              : ""}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.7),
                              flexShrink: 0,
                            }}
                          >
                            {formatMoney(item.price)}
                          </Typography>
                        </Stack>
                      ))}
                      {section.planningItem ? (
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 650,
                            color: alpha(m.navy, 0.6),
                          }}
                        >
                          {[
                            section.planningItem.activity,
                            planningScheduleMeta(section).timeRange,
                            planningScheduleMeta(section).durationLabel,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Planning"}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      )}
    </AppModal>
  );
}
