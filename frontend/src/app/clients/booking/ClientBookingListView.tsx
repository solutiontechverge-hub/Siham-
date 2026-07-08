"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, ButtonBase, Chip, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  filterBookingsByTab,
  statusChipLabel,
  type BookingListTab,
  type ClientBookingRecord,
  type ClientBookingStatus,
} from "./clientBookingRecords";
import { bookingStatusChipColors } from "./clientBookingStatus";
import BookingRequestBadge from "../../../components/common/calendar/BookingRequestBadge";
import { getCheckoutPath, setActiveBookingSession } from "./clientBookingSession";
import { useGetMyBookingsQuery } from "../../../store/services/businessApi";
import { mapApiBookingToClientRecord } from "./clientBookingApi.mapper";

const emptyCopy: Record<BookingListTab, string> = {
  past: "No completed bookings yet.",
  outgoing: "No confirmed bookings for upcoming dates.",
  upcoming: "No bookings awaiting approval. Start a new booking to request a service.",
};

type Props = {
  listTab: BookingListTab;
};

export default function ClientBookingListView({ listTab }: Props) {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { data, isLoading, isFetching, isError, refetch } = useGetMyBookingsQuery();

  const bookings = React.useMemo(() => {
    const rows = data?.data ?? [];
    return rows.map(mapApiBookingToClientRecord);
  }, [data]);

  const openBooking = (record: ClientBookingRecord) => {
    setActiveBookingSession(record);
    router.push(getCheckoutPath(record));
  };

  const filtered = React.useMemo(() => filterBookingsByTab(bookings, listTab), [bookings, listTab]);
  const loading = isLoading || isFetching;

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
        <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.86), fontSize: 14 }}>Your Bookings</Typography>
          <Button
            component={Link}
            href="/clients/booking?tab=upcoming&mode=create"
            variant="contained"
            disableElevation
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 900, bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
          >
            New Booking
          </Button>
        </Box>
        <Divider />
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {loading ? (
            <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>Loading bookings…</Typography>
          ) : isError ? (
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                Unable to load bookings from the server.
              </Typography>
              <Button
                onClick={() => refetch()}
                variant="outlined"
                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800 }}
              >
                Retry
              </Button>
            </Stack>
          ) : filtered.length === 0 ? (
            <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>{emptyCopy[listTab]}</Typography>
          ) : (
            <Stack spacing={1.25}>
              {filtered.map((b) => {
                const shopName = b.shop?.shopName ?? "Salon";
                const address = b.shop?.addressLabel ?? b.shop?.municipalityLabel ?? "";
                const date = b.draft?.selectedDateISO ?? "";
                const time = b.draft?.selectedTime ?? "";
                const total = b.draft?.total ?? 0;
                const status = (b.status ?? "confirmed") as ClientBookingStatus;
                const isRequested = status === "requested";
                const chipLabel = isRequested ? "Requested" : statusChipLabel(status);
                const chipColors = bookingStatusChipColors(status);
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
                        border: `1px solid ${alpha(m.navy, 0.10)}`,
                        p: 1.6,
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        "&:hover": {
                          borderColor: alpha(m.teal, 0.35),
                          boxShadow: `0 6px 16px ${alpha(m.teal, 0.08)}`,
                        },
                      }}
                    >
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.25}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.85) }}>{shopName}</Typography>
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
                          <Typography sx={{ mt: 0.35, fontWeight: 900, color: alpha(m.teal, 0.95), fontSize: 12 }}>
                            {date} {time ? `• ${time}` : ""}
                          </Typography>
                          {(b.draft?.services ?? []).length > 0 ? (
                            <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                              {b.draft!.services.map((s) => (
                                <Typography key={s.id} sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.5) }}>
                                  {s.name} • {s.durationMins} mins • {s.price} €
                                </Typography>
                              ))}
                            </Stack>
                          ) : null}
                        </Box>
                        <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.5}>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
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
                            {isRequested ? <BookingRequestBadge variant="compact" iconSize={10} /> : null}
                          </Stack>
                          <Typography sx={{ fontWeight: 1000, color: alpha(m.navy, 0.85) }}>{total} €</Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </ButtonBase>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
