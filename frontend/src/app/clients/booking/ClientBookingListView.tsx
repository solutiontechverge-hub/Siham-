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
  isClientBookingPaymentDue,
  statusChipLabel,
  type BookingListTab,
  type ClientBookingRecord,
  type ClientBookingStatus,
} from "./clientBookingRecords";
import { bookingStatusChipColors } from "./clientBookingStatus";
import BookingRequestBadge from "../../../components/common/calendar/BookingRequestBadge";
import PrepaymentPayNowIcon from "../../../components/common/client-booking/PrepaymentPayNowIcon";
import PaymentDueIcon from "../../../components/common/client-booking/PaymentDueIcon";
import { AppPagination, AppSearchField } from "../../../components/common";
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
  ongoing: "No upcoming booking",
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
          <Typography
            sx={{ fontWeight: 900, color: alpha(m.navy, 0.86), fontSize: 14 }}
          >
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
            <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>
              Loading bookings…
            </Typography>
          ) : isError ? (
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>
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
            <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>
              {searchQuery
                ? "No bookings match your search."
                : emptyCopy[listTab]}
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {bookings.map((b) => {
                const shopName = b.shop?.shopName ?? "Salon";
                const address =
                  b.shop?.addressLabel ?? b.shop?.municipalityLabel ?? "";
                const date = b.draft?.selectedDateISO ?? "";
                const time = b.draft?.selectedTime ?? "";
                const totalPrice = b.draft?.total ?? 0;
                const bookingIdLabel = formatBookingIdLabel(b.bookingRef);
                const status = (b.status ?? "confirmed") as ClientBookingStatus;
                const paymentDue = isClientBookingPaymentDue(b);
                const showBrBadge =
                  status !== "completed" &&
                  status !== "cancelled" &&
                  (status === "requested" || Boolean(b.bookingRequestSent));
                const waitingForPayment =
                  paymentDue ||
                  (status !== "completed" &&
                    status !== "cancelled" &&
                    Boolean(b.requiresPrepayment) &&
                    !b.prepaid);
                const chipLabel =
                  status === "requested"
                    ? "Requested"
                    : statusChipLabel(status, { paymentDue });
                const chipColors = bookingStatusChipColors(status, {
                  paymentDue,
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
                              sx={{
                                mt: 0.2,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.62),
                                fontSize: 12,
                              }}
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
                            sx={{
                              mt: 0.25,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.55),
                              fontSize: 12,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
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
                          {(b.draft?.services ?? []).length > 0 ? (
                            <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                              {b.draft!.services.map((s) => (
                                <Typography
                                  key={s.id}
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
                                height: 22,
                                fontWeight: 900,
                                bgcolor: chipColors.bgcolor,
                                color: chipColors.color,
                                border: chipColors.border,
                              }}
                            />
                            {waitingForPayment ? (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: paymentDue ? 26 : undefined,
                                  height: paymentDue ? 26 : undefined,
                                  borderRadius: paymentDue ? "7px" : undefined,
                                  bgcolor: paymentDue
                                    ? alpha(m.navy, 0.04)
                                    : undefined,
                                }}
                                title={
                                  paymentDue
                                    ? "Payment due"
                                    : "Waiting for payment"
                                }
                                aria-label={
                                  paymentDue
                                    ? "Payment due"
                                    : "Waiting for payment"
                                }
                              >
                                {paymentDue ? (
                                  <PaymentDueIcon size={18} />
                                ) : (
                                  <PrepaymentPayNowIcon size={18} />
                                )}
                              </Box>
                            ) : null}
                            {showBrBadge ? (
                              <BookingRequestBadge
                                variant="compact"
                                iconSize={10}
                                direction={
                                  b.bookingRequestDirection ?? "outgoing"
                                }
                              />
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
