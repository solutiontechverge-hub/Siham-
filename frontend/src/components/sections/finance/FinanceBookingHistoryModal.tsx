"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useGetBookingActivityQuery } from "../../../store/services/businessApi";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";

export default function FinanceBookingHistoryModal({
  row,
  onClose,
}: {
  row: TransactionRow | null;
  onClose: () => void;
}) {
  const open = Boolean(row?.bookingId);
  const { data, isLoading } = useGetBookingActivityQuery(
    { bookingId: row?.bookingId ?? null },
    { skip: !open },
  );
  const items = data?.data ?? [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Booking history
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {row ? (
          <Stack spacing={0.25} sx={{ mb: 2 }}>
            <Typography fontWeight={600}>Transaction details</Typography>
            <Typography>Entry: {row.entryId ?? row.id}</Typography>
            <Typography>Amount: {row.grossAmount ?? row.netAmount}</Typography>
            <Typography>Status: {row.status}</Typography>
          </Stack>
        ) : null}
        {isLoading ? <Typography>Loading booking history…</Typography> : null}
        {!isLoading && !items.length ? <Typography color="text.secondary">No recorded booking activity found for this booking.</Typography> : null}
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Stack key={item.id} spacing={0.25}>
              <Typography fontWeight={600}>{item.title}</Typography>
              {item.subtitle ? <Typography color="text.secondary">{item.subtitle}</Typography> : null}
              <Typography variant="caption" color="text.secondary">
                {item.actorLabel ?? item.actor ?? "System"} · {new Date(item.occurredAt).toLocaleString()}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
