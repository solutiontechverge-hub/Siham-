"use client";

import * as React from "react";
import { Box, Radio, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { formatLinkableBookingLabel, linkableBookingsMock, type LinkableBooking } from "./messagingBookingsMock";
import MessagingModalShell, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "./MessagingModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  bookings?: LinkableBooking[];
  onSubmit: (booking: LinkableBooking) => void;
  embedded?: boolean;
};

export default function MessagingLinkBookingDialog({
  open,
  onClose,
  bookings = linkableBookingsMock,
  onSubmit,
  embedded = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const [selectedId, setSelectedId] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) setSelectedId("");
    else if (bookings[0]) setSelectedId(bookings[0].id);
  }, [open, bookings]);

  const selected = bookings.find((b) => b.id === selectedId);

  return (
    <MessagingModalShell
      open={open}
      title="Link to Booking"
      onClose={onClose}
      embedded={embedded}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Link"
            disabled={!selected}
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
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.5), mb: 2 }}>
        Select One Booking To Link This Conversation To
      </Typography>
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
                px: 1.75,
                py: 1.35,
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.05),
                cursor: "pointer",
                border: `1px solid ${active ? alpha(m.teal, 0.35) : "transparent"}`,
                "&:hover": { bgcolor: alpha(m.navy, 0.07) },
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                {formatLinkableBookingLabel(booking)}
              </Typography>
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
    </MessagingModalShell>
  );
}
