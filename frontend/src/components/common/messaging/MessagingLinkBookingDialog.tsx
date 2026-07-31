"use client";

import * as React from "react";
import { Box, Radio, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  formatLinkableBookingLabel,
  type LinkableBooking,
} from "./messagingBookingsMock";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

type Props = {
  open: boolean;
  onClose: () => void;
  bookings?: LinkableBooking[];
  onSubmit: (booking: LinkableBooking) => void;
  embedded?: boolean;
  loading?: boolean;
};

export default function MessagingLinkBookingDialog({
  open,
  onClose,
  bookings = [],
  onSubmit,
  embedded = false,
  loading = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const [selectedId, setSelectedId] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) setSelectedId("");
    else if (bookings[0]) setSelectedId(bookings[0].id);
  }, [open, bookings]);

  const selected = bookings.find((b) => b.id === selectedId);

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title="Link to Booking"
      onClose={onClose}
      embedded={embedded}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Link"
            disabled={!selected || loading}
            onClick={() => {
              if (selected) {
                onSubmit(selected);
                onClose();
              }
            }}
          />
        </>
      }
    >
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 600,
          color: alpha(m.navy, 0.5),
          mb: 2,
        }}
      >
        Select One Booking To Link This Conversation To
      </Typography>
      {loading && bookings.length === 0 ? (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.45) }}>
          Loading bookings…
        </Typography>
      ) : bookings.length === 0 ? (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.45) }}>
          No bookings available to link.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {bookings.map((booking) => {
            const active = selectedId === booking.id;
            return (
              <Box
                key={booking.id}
                onClick={() => setSelectedId(booking.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  px: 1.75,
                  py: 1.35,
                  borderRadius: "10px",
                  bgcolor: alpha(m.navy, 0.05),
                  cursor: "pointer",
                  border: `1px solid ${active ? alpha(m.teal, 0.35) : "transparent"}`,
                  "&:hover": { bgcolor: alpha(m.navy, 0.07) },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.72),
                    }}
                  >
                    {formatLinkableBookingLabel(booking)}
                  </Typography>
                  {booking.closed ? (
                    <Typography
                      sx={{
                        mt: 0.35,
                        fontSize: 11,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.42),
                        textTransform: "uppercase",
                        letterSpacing: 0.3,
                      }}
                    >
                      Booking Closed
                    </Typography>
                  ) : null}
                </Box>
                <Radio
                  checked={active}
                  onChange={() => setSelectedId(booking.id)}
                  sx={{
                    p: 0.5,
                    color: alpha(m.navy, 0.25),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </AppModal>
  );
}
