"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, ButtonBase, Chip, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  BOOKINGS_CHANGED_EVENT,
  filterBookingsByTab,
  loadClientBookingsForList,
  statusChipLabel,
  type BookingListTab,
  type ClientBookingRecord,
  type ClientBookingStatus,
} from "./clientBookingRecords";
import { bookingStatusChipColors } from "./clientBookingStatus";
import { getCheckoutPath, setActiveBookingSession } from "./clientBookingSession";

const fallbackAddress = "Marina-Park 50, Den Helder, Noord-Holland";

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
  const [bookings, setBookings] = React.useState<ClientBookingRecord[]>([]);

  const refresh = React.useCallback(() => {
    setBookings(loadClientBookingsForList());
  }, []);

  React.useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(BOOKINGS_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(BOOKINGS_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const openBooking = (record: ClientBookingRecord) => {
    setActiveBookingSession(record);
    router.push(getCheckoutPath(record));
  };

  const filtered = React.useMemo(() => filterBookingsByTab(bookings, listTab), [bookings, listTab]);

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
          {filtered.length === 0 ? (
            <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.55) }}>{emptyCopy[listTab]}</Typography>
          ) : (
            <Stack spacing={1.25}>
              {filtered.map((b) => {
                const shopName = b.shop?.shopName ?? "Salon";
                const address = b.shop?.addressLabel ?? b.shop?.municipalityLabel ?? fallbackAddress;
                const date = b.draft?.selectedDateISO ?? "";
                const time = b.draft?.selectedTime ?? "";
                const total = b.draft?.total ?? 0;
                const status = (b.status ?? "confirmed") as ClientBookingStatus;
                const chipLabel = statusChipLabel(status);
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
