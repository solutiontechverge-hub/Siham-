"use client";

import AppButton from "../../../components/common/AppButton";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureLabelSx,
  mollurePageTitleSx,
} from "../../../theme/mollureHierarchy";
import {
  isClientBookingPaymentDue,
  isWaitingForPrepayment,
  statusChipLabel,
  type BookingListTab,
  type ClientBookingRecord,
  type ClientBookingStatus,
} from "./clientBookingRecords";
import {
  bookingSecondaryStatusBadgeSx,
  bookingSecondaryStatusChipSx,
  bookingStatusChipColors,
} from "./clientBookingStatus";
import BookingRequestBadge from "../../../components/common/calendar/BookingRequestBadge";
import BookingRequestReceivedIcon from "../../../components/common/calendar/BookingRequestReceivedIcon";
import BookingIndicatorIcon from "../../../components/common/calendar/BookingIndicatorIcon";
import { isClientIncomingProfessionalEbr } from "../../../components/common/calendar/bookingEventDetails";
import PrepaymentStatusIcon from "../../../components/common/calendar/PrepaymentStatusIcon";
import { AppPagination, AppSearchField } from "../../../components/common";
import { getBookingEditRequest } from "../../../components/common/client-booking/bookingEditRequest";
import { syncEditRequestFromBookingApi } from "../../../components/common/client-booking/syncEditRequestFromApi";
import {
  shouldShowSilentUpdatedTag,
  useBookingUpdateSeenVersion,
} from "../../../components/common/calendar/bookingUpdateSeen";
import {
  getCheckoutPath,
  setActiveBookingSession,
} from "./clientBookingSession";
import { useGetMyBookingsQuery } from "../../../store/services/businessApi";
import { mapApiBookingToClientRecord } from "./clientBookingApi.mapper";
import { enrichClientBookingRecord } from "./clientBookingDraftCache";

const BOOKINGS_PAGE_SIZE = 10;

const emptyCopy: Record<BookingListTab, string> = {
  past: "No past bookings yet.",
  ongoing: "No ongoing bookings.",
  upcoming: "No upcoming bookings. Start a new booking to request a service.",
};

function formatBookingIdLabel(bookingRef?: string | null) {
  const code = String(bookingRef ?? "").trim();
  if (!code) return null;
  return code.toUpperCase().startsWith("BK-") ? code : `#${code}`;
}

type Props = {
  listTab: BookingListTab;
};

export default function ClientBookingListView({ listTab }: Props) {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  useBookingUpdateSeenVersion();

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    setPage(1);
  }, [listTab, searchQuery]);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetMyBookingsQuery({
      page,
      limit: BOOKINGS_PAGE_SIZE,
      tab: listTab,
      ...(searchQuery ? { q: searchQuery } : {}),
    });

  const bookings = React.useMemo(() => {
    const rows = data?.data ?? [];
    return rows.map((row) =>
      enrichClientBookingRecord(mapApiBookingToClientRecord(row)),
    );
  }, [data]);

  React.useEffect(() => {
    for (const b of bookings) {
      if (b.bookingRef && b.editRequest) {
        syncEditRequestFromBookingApi(b.bookingRef, b.editRequest);
      }
    }
  }, [bookings]);

  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? bookings.length;

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openBooking = (record: ClientBookingRecord) => {
    const enriched = enrichClientBookingRecord(record);
    setActiveBookingSession(enriched);
    router.push(getCheckoutPath(enriched, listTab));
  };

  const openPrepaidCheckout = (record: ClientBookingRecord) => {
    const enriched = enrichClientBookingRecord(record);
    setActiveBookingSession(enriched);
    router.push(
      `/clients/booking/checkout/prepaid?tab=${encodeURIComponent(listTab)}`,
    );
  };

  const loading = isLoading || isFetching;
  const showingFrom = total === 0 ? 0 : (page - 1) * BOOKINGS_PAGE_SIZE + 1;
  const showingTo = Math.min(page * BOOKINGS_PAGE_SIZE, total);

  return (
    <Container maxWidth="lg" sx={{ pb: 5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: "#fff",
          overflow: "hidden",
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 2.5 },
            py: 1.75,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.25,
          }}
        >
          <Typography sx={mollurePageTitleSx(m.navy)}>
            Your Bookings
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <AppSearchField
              size="small"
              placeholder="Search by Booking ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              sx={{
                minWidth: { sm: 220 },
                maxWidth: { sm: 280 },
                width: { xs: "100%", sm: 260 },
                "& .MuiOutlinedInput-root": {
                  height: 36,
                  bgcolor: alpha(m.navy, 0.01),
                },
              }}
            />
            <AppButton
              tone="primary"
              component={Link}
              href="/clients/listing"
              sx={{ whiteSpace: "nowrap" }}
            >
              New Booking
            </AppButton>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {loading ? (
            <Typography sx={mollureBodyMutedSx(m.navy)}>
              Loading bookings…
            </Typography>
          ) : isError ? (
            <Stack spacing={1}>
              <Typography sx={mollureBodyMutedSx(m.navy)}>
                Unable to load bookings from the server.
              </Typography>
              <AppButton
                onClick={() => refetch()}
                variant="outlined"
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  fontWeight: 800,
                }}
              >
                Retry
              </AppButton>
            </Stack>
          ) : bookings.length === 0 ? (
            <Typography sx={mollureBodyMutedSx(m.navy)}>
              {searchQuery
                ? "No bookings match your search."
                : emptyCopy[listTab]}
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {bookings.map((b) => {
                const shopName = b.shop?.shopName ?? "Salon";
                const address =
                  b.shop?.addressLabel?.trim() ||
                  b.shop?.municipalityLabel?.trim() ||
                  "";
                const date = b.draft?.selectedDateISO ?? "";
                const time = b.draft?.selectedTime ?? "";
                const totalPrice = b.draft?.total ?? 0;
                const bookingIdLabel = formatBookingIdLabel(b.bookingRef);
                const status = (b.status ?? "confirmed") as ClientBookingStatus;
                const paymentDue = isClientBookingPaymentDue(b);
                const displayStatus: ClientBookingStatus = status;
                // BR only while pending — hide once accepted (confirmed) or rejected.
                const isEbrIncoming = isClientIncomingProfessionalEbr(
                  b.incomingEditRequest,
                );
                const showEbrBadge =
                  isEbrIncoming && status === "requested";
                const showBrBadge =
                  !showEbrBadge &&
                  (status === "requested" ||
                    (status === "draft" && Boolean(b.bookingRequestSent)));
                // Pending Confirmed ER — show on list for both directions.
                const pendingEr =
                  displayStatus === "confirmed"
                    ? b.editRequest?.status === "pending"
                      ? b.editRequest
                      : b.bookingRef
                        ? (() => {
                            const local = getBookingEditRequest(b.bookingRef);
                            return local.status === "pending"
                              ? {
                                  note: local.note,
                                  status: local.status as "pending",
                                  initiated_by: (local.initiatedBy ??
                                    "client") as "client" | "professional",
                                }
                              : null;
                          })()
                        : null
                    : null;
                const incomingEr =
                  pendingEr?.initiated_by === "professional" ? pendingEr : null;
                const outgoingEr =
                  pendingEr?.initiated_by === "client" ? pendingEr : null;
                const erNote =
                  (incomingEr?.note || outgoingEr?.note || "").trim() || "";
                const waitingForPrepayment = isWaitingForPrepayment(b);
                const showPrepaidIcon =
                  Boolean(b.requiresPrepayment) &&
                  Boolean(b.prepaid) &&
                  !waitingForPrepayment;
                const waitingForPayment = paymentDue;
                const isSilentUpdated = Boolean(b.silentUpdated);
                const isConfirmedEdited =
                  displayStatus === "confirmed" &&
                  !pendingEr &&
                  !isSilentUpdated &&
                  Boolean(
                    b.lastEditedBy ||
                      b.editedServiceIds?.length ||
                      b.incomingEditRequest?.status === "accepted",
                  );
                const chipLabel = statusChipLabel(displayStatus, {
                  edited: isConfirmedEdited,
                });
                const chipColors = bookingStatusChipColors(displayStatus);
                const showUpdated =
                  !pendingEr &&
                  displayStatus === "confirmed" &&
                  shouldShowSilentUpdatedTag({
                    silentUpdated: isSilentUpdated,
                    viewer: "client",
                    bookingRef: b.bookingRef,
                    updatedAt: b.updatedAt,
                    lastEditedBy: b.lastEditedBy ?? null,
                  });
                return (
                  <ButtonBase
                    key={b.id}
                    onClick={() => openBooking(b)}
                    sx={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      borderRadius: "12px",
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: "12px",
                        border: `1px solid ${alpha(m.navy, 0.1)}`,
                        p: 1.6,
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        "&:hover": {
                          borderColor: alpha(m.teal, 0.35),
                          boxShadow: `0 6px 16px ${alpha(m.teal, 0.08)}`,
                        },
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1.25}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{ fontWeight: 900, color: alpha(m.navy, 0.85) }}
                          >
                            {shopName}
                          </Typography>
                          {bookingIdLabel ? (
                            <Typography
                              sx={mollureLabelSx(m.navy, { mt: 0.2 })}
                            >
                              Booking ID:{" "}
                              <Box
                                component="span"
                                sx={{ color: m.teal, fontWeight: 900 }}
                              >
                                {bookingIdLabel}
                              </Box>
                            </Typography>
                          ) : null}
                          <Typography
                            sx={mollureBodyMutedSx(m.navy, {
                              mt: 0.25,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            })}
                          >
                            {address}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.35,
                              fontWeight: 900,
                              color: alpha(m.teal, 0.95),
                              fontSize: 12,
                            }}
                          >
                            {date} {time ? `• ${time}` : ""}
                          </Typography>
                          {erNote ? (
                            <Typography
                              sx={{
                                mt: 0.65,
                                fontSize: 12,
                                fontWeight: 700,
                                color: alpha(m.navy, 0.62),
                                lineHeight: 1.4,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {incomingEr
                                ? `Note from professional: ${erNote}`
                                : `Edit request note: ${erNote}`}
                            </Typography>
                          ) : null}
                          {(b.draft?.services ?? []).length > 0 ? (
                            <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                              {b.draft!.services.map((s, i) => (
                                <Typography
                                  key={`${s.id}::${s.guestId ?? ""}::${i}`}
                                  sx={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: alpha(m.navy, 0.5),
                                  }}
                                >
                                  {s.name} • {s.durationMins} mins • {s.price} €
                                </Typography>
                              ))}
                            </Stack>
                          ) : null}
                        </Box>
                        <Stack
                          alignItems={{ xs: "flex-start", sm: "flex-end" }}
                          spacing={0.5}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                          >
                            <Chip
                              label={chipLabel}
                              size="small"
                              sx={{
                                height: 24,
                                minHeight: 24,
                                maxHeight: 24,
                                boxSizing: "border-box",
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: chipColors.bgcolor,
                                color: chipColors.color,
                                border: chipColors.border,
                                borderWidth:
                                  chipColors.border === "none" ? 0 : undefined,
                                "& .MuiChip-label": {
                                  px: 1.1,
                                  py: 0,
                                  lineHeight: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                },
                              }}
                            />
                            {showUpdated ? (
                              <Chip
                                label="Updated"
                                size="small"
                                sx={bookingSecondaryStatusChipSx}
                              />
                            ) : null}
                            {waitingForPrepayment ? (
                              <Box
                                component="span"
                                role="button"
                                tabIndex={0}
                                title="Waiting for prepayment — pay now"
                                aria-label="Waiting for prepayment — pay now"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  event.preventDefault();
                                  openPrepaidCheckout(b);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key !== "Enter" && event.key !== " ")
                                    return;
                                  event.stopPropagation();
                                  event.preventDefault();
                                  openPrepaidCheckout(b);
                                }}
                                sx={{
                                  display: "grid",
                                  placeItems: "center",
                                  width: 24,
                                  height: 24,
                                  cursor: "pointer",
                                  border: "none",
                                  borderRadius: "8px",
                                  lineHeight: 0,
                                  bgcolor: "transparent",
                                  p: 0,
                                  flexShrink: 0,
                                  "&:hover": { opacity: 0.88 },
                                }}
                              >
                                <PrepaymentStatusIcon
                                  variant="pending"
                                  size={24}
                                />
                              </Box>
                            ) : showPrepaidIcon ? (
                              <Box
                                sx={{
                                  display: "grid",
                                  placeItems: "center",
                                  width: 24,
                                  height: 24,
                                  lineHeight: 0,
                                  flexShrink: 0,
                                }}
                                title="Prepayment received"
                                aria-label="Prepayment received"
                              >
                                <PrepaymentStatusIcon
                                  variant="confirmed"
                                  size={24}
                                />
                              </Box>
                            ) : null}
                            {waitingForPayment ? (
                              <Box
                                sx={{
                                  display: "grid",
                                  placeItems: "center",
                                  width: 24,
                                  height: 24,
                                  lineHeight: 0,
                                  flexShrink: 0,
                                }}
                                title="Waiting for payment"
                                aria-label="Waiting for payment"
                              >
                                <BookingIndicatorIcon
                                  variant="waiting_for_payment"
                                  size={24}
                                />
                              </Box>
                            ) : null}
                            {showEbrBadge ? (
                              <Chip
                                size="small"
                                label={
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.35}
                                  >
                                    <span>EBR</span>
                                    <BookingRequestReceivedIcon size={10} />
                                  </Stack>
                                }
                                sx={bookingSecondaryStatusChipSx}
                              />
                            ) : null}
                            {showBrBadge ? (
                              <BookingRequestBadge
                                variant="compact"
                                iconSize={10}
                                direction={
                                  b.bookingRequestDirection ?? "outgoing"
                                }
                                sx={bookingSecondaryStatusBadgeSx}
                              />
                            ) : null}
                            {pendingEr ? (
                              <Box
                                sx={{
                                  ...bookingSecondaryStatusBadgeSx,
                                  gap: 0.35,
                                }}
                                title="Suggestion for change"
                                aria-label="Suggestion for change"
                              >
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "inherit",
                                    lineHeight: 1,
                                  }}
                                >
                                  ER
                                </Typography>
                                <BookingIndicatorIcon
                                  variant="suggestion_for_change"
                                  size={14}
                                />
                              </Box>
                            ) : null}
                          </Stack>
                          <Typography
                            sx={{
                              fontWeight: 1000,
                              color: alpha(m.navy, 0.85),
                            }}
                          >
                            {totalPrice} €
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </ButtonBase>
                );
              })}
            </Stack>
          )}

          {!loading && !isError && total > 0 ? (
            <Box sx={{ mt: 2.5 }}>
              <AppPagination
                count={totalPages}
                page={Math.min(page, totalPages)}
                onChange={(_e, next) => setPage(next)}
                summary={`Showing ${showingFrom}-${showingTo} of ${total}`}
              />
            </Box>
          ) : null}
        </Box>
      </Paper>
    </Container>
  );
}
