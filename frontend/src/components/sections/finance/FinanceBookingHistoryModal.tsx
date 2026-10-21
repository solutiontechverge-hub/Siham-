"use client";

import * as React from "react";
import { Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useGetBookingActivityQuery } from "../../../store/services/businessApi";
import {
  formatEntryIdDisplay,
  formatNetAmountEur,
  formatTransactionStatusLabel,
  type TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import { useBookingFinance } from "../../common/booking-finance/useBookingFinance";
import { bookingFinanceBadgeLabel } from "../../common/booking-finance/mapBookingFinance";
import { formatFinanceEuro } from "../../common/booking-finance/formatBookingFinance";

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
  const { finance } = useBookingFinance(row?.bookingId, { skip: !open });
  const items = data?.data ?? [];
  const entryDisplay = row
    ? formatEntryIdDisplay(row.entryType, row.entryId, row.entryLabel)
    : "";

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
            <Typography>Entry: {entryDisplay || row.id}</Typography>
            <Typography>Amount: {formatNetAmountEur(row.grossAmount ?? row.netAmount)}</Typography>
            <Typography>
              Status: {formatTransactionStatusLabel(row.status, row.entryLabel)}
            </Typography>
          </Stack>
        ) : null}
        {finance ? (
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontWeight={600}>Ledger balance</Typography>
              <Chip size="small" label={bookingFinanceBadgeLabel(finance.badge)} />
            </Stack>
            <Typography>Base Price: {formatFinanceEuro(finance.basePrice)}</Typography>
            {finance.addOnLines.map((line) => (
              <Typography key={line.id}>
                {line.label}: {formatFinanceEuro(line.amount)}
              </Typography>
            ))}
            {finance.cancellationFee > 0 ? (
              <Typography>
                Cancellation Fee: {formatFinanceEuro(finance.cancellationFee)}
              </Typography>
            ) : null}
            <Typography>Total Paid: {formatFinanceEuro(finance.totalPaid)}</Typography>
            {finance.prepaymentTotal > 0 ? (
              <Typography>
                Prepayment: {formatFinanceEuro(finance.prepaymentTotal)}
              </Typography>
            ) : null}
            {finance.totalRefunded > 0 ? (
              <Typography>
                Total Refunded: {formatFinanceEuro(finance.totalRefunded)}
              </Typography>
            ) : null}
            <Typography fontWeight={700}>
              Amount Due: {formatFinanceEuro(finance.amountDue)}
            </Typography>
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
