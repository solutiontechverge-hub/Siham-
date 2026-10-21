import AppButton from "../../common/AppButton";
import * as React from "react";
import {
  Box,
  Checkbox,
  Chip,
  Link as MuiLink,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Pagination,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import {
  mollureBodySx,
  mollureLabelSx,
  mollureTableHeaderSx,
} from "../../../theme/mollureHierarchy";
import {
  canEditFinanceTransactionDate,
  formatEntryIdDisplay,
  formatNetAmountEur,
  formatTransactionDate,
  formatTransactionStatusLabel,
  getTransactionStatusTone,
  isTransactionClientClickable,
  shouldShowTransactionClientEmail,
  type TransactionRow,
  type TransactionStatus,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import ClientPlatformTag from "../../common/ClientPlatformTag";
import { BodyText } from "../../ui/typography";
import { displayReceiptNumber } from "../../common/finance-documents/financeDocumentUtils";
import {
  bookingFinanceBadgeLabel,
  deriveBookingFinanceBadge,
} from "../../common/booking-finance/mapBookingFinance";
import { formatFinanceEuro } from "../../common/booking-finance/formatBookingFinance";

function statusChipSx(
  status: TransactionStatus,
  theme: Theme,
  entryLabel?: string | null,
) {
  const tone = getTransactionStatusTone(status, entryLabel);
  const m = theme.palette.mollure;
  switch (tone) {
    case "success":
      return { bgcolor: m.statusGreenBg, color: m.statusGreenFg };
    case "warning":
      return { bgcolor: m.statusOrangeBg, color: m.statusOrangeFg };
    case "danger":
      return { bgcolor: m.statusRedBg, color: m.statusRedFg };
    case "muted":
      return { bgcolor: m.fxGrayF2F4F7, color: m.statusGreyFg };
    default:
      return { bgcolor: m.fxGrayF2F4F7, color: m.statusGreyFg };
  }
}

function netAmountTooltip(row: TransactionRow): string | null {
  if (!row.grossAmount) return null;
  const parts = [`Gross: ${formatNetAmountEur(row.grossAmount)}`];
  if (row.stripeFee) parts.push(`- Stripe fee: ${formatNetAmountEur(row.stripeFee)}`);
  if (row.mollureFee) parts.push(`- Mollure fee: ${formatNetAmountEur(row.mollureFee)}`);
  if (row.stripeFee || row.mollureFee) {
    parts.push(`Net: ${formatNetAmountEur(row.netAmount)}`);
  }
  if (!row.stripeFee && !row.mollureFee) parts.push(`Net: ${formatNetAmountEur(row.netAmount)}`);
  return parts.join("\n");
}

export type TransactionsTableProps = {
  rows: readonly TransactionRow[];
  selected: Record<string, boolean>;
  onToggleOne: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onOpenDocument: (
    row: TransactionRow,
    documentType: "invoice" | "receipt",
  ) => void;
  onOpenNote?: (row: TransactionRow) => void;
  /** Offline Paid/Unpaid — edit persisted transaction_date. */
  onEditTransactionDate?: (row: TransactionRow) => void;
  onEntryClick?: (row: TransactionRow) => void;
  onClientClick?: (row: TransactionRow) => void;
  /** Deep-links overdue / overdue-response rows to calendar Sales or booking banner. */
  onReviewOverdue?: (row: TransactionRow) => void;
  disableDocumentLinks?: boolean;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  theme: Theme;
  m: Theme["palette"]["mollure"];
};

export default function TransactionsTable({
  rows,
  selected,
  onToggleOne,
  onToggleAll,
  onOpenDocument,
  onOpenNote,
  onEditTransactionDate,
  onEntryClick,
  onClientClick,
  onReviewOverdue,
  disableDocumentLinks = false,
  page,
  pageCount,
  onPageChange,
  theme,
  m,
}: TransactionsTableProps) {
  const allVisibleSelected =
    rows.length > 0 && rows.every((r) => selected[r.id]);
  const someVisibleSelected = rows.some((r) => selected[r.id]);

  return (
    <Box sx={{ px: 2.25, pb: 2.25 }}>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflowX: "auto",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(m.navy, 0.02) }}>
              <TableCell
                padding="checkbox"
                sx={{ borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }}
              >
                <Checkbox
                  size="small"
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  checked={allVisibleSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  sx={{ p: 0.5 }}
                />
              </TableCell>
              {(
                [
                  ["Entry ID", 100],
                  ["Transaction date", 130],
                  ["Client name", 160],
                  ["Net amount", 100],
                  ["Trans. type", 120],
                  ["Trans. status", 110],
                  ["Invoice and receipts", 150],
                ] as const
              ).map(([h, minWidth]) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.2,
                    minWidth,
                    whiteSpace: "nowrap",
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                  }}
                >
                  <BodyText
                    component="span"
                    sx={mollureTableHeaderSx(m.navy)}
                  >
                    {h}
                  </BodyText>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const showClientEmail = shouldShowTransactionClientEmail(row);
              const entryDisplay = formatEntryIdDisplay(
                row.entryType,
                row.entryId,
                row.entryLabel,
              );
              const dateDisplay = formatTransactionDate(row.date);
              const tooltip = netAmountTooltip(row);
              const invoiceNo = row.document?.documentNumber;
              const receiptNo = displayReceiptNumber(row.status, {
                creditNoteNumber: row.document?.creditNoteNumber,
                receiptNumber: row.document?.receiptNumber,
              });
              const clientClickable = isTransactionClientClickable(
                row.clientType,
              );

              return (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    "& td": {
                      borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                      verticalAlign: "middle",
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={Boolean(selected[row.id])}
                      onChange={() => onToggleOne(row.id)}
                      sx={{ p: 0.5 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      {row.bookingId && onEntryClick ? (
                        <MuiLink
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={() => onEntryClick(row)}
                          sx={mollureLabelSx(theme.palette.mollure.navy, {
                            color: theme.palette.primary.main,
                            border: 0,
                            bgcolor: "transparent",
                            p: 0,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "left",
                          })}
                        >
                          {entryDisplay}
                        </MuiLink>
                      ) : (
                        <BodyText
                          component="span"
                          sx={mollureLabelSx(m.navy)}
                        >
                          {entryDisplay}
                        </BodyText>
                      )}
                      {/* Same booking Entry ID across PRE/AT/fees — phase label distinguishes rows. */}
                      {row.entryLabel &&
                      entryDisplay &&
                      row.entryLabel !== entryDisplay ? (
                        <BodyText
                          component="span"
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.48),
                            maxWidth: 140,
                          }}
                        >
                          {row.entryLabel}
                        </BodyText>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.35}>
                      {canEditFinanceTransactionDate(row) &&
                      onEditTransactionDate ? (
                        <MuiLink
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={() => onEditTransactionDate(row)}
                          sx={mollureBodySx(m.navy, {
                            color: theme.palette.primary.main,
                            border: 0,
                            bgcolor: "transparent",
                            p: 0,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "left",
                          })}
                        >
                          {dateDisplay}
                        </MuiLink>
                      ) : (
                        <BodyText
                          component="span"
                          sx={mollureBodySx(m.navy, {
                            color: alpha(m.navy, 0.75),
                          })}
                        >
                          {dateDisplay}
                        </BodyText>
                      )}
                      {row.note?.trim() ? (
                        <MuiLink
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={() => onOpenNote?.(row)}
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: m.teal,
                            border: 0,
                            bgcolor: "transparent",
                            p: 0,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          View note
                        </MuiLink>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Stack spacing={0.35}>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        flexWrap="nowrap"
                        useFlexGap
                        sx={{ minWidth: 0 }}
                      >
                        {clientClickable && onClientClick ? (
                          <MuiLink
                            component="button"
                            type="button"
                            underline="hover"
                            onClick={() => onClientClick(row)}
                            sx={{
                              fontWeight: 800,
                              fontSize: 13.5,
                              color: theme.palette.primary.main,
                              border: 0,
                              bgcolor: "transparent",
                              p: 0,
                              cursor: "pointer",
                              lineHeight: 1.2,
                            }}
                          >
                            {row.clientName}
                          </MuiLink>
                        ) : (
                          <BodyText
                            component="span"
                            sx={{
                              fontWeight: 800,
                              fontSize: 13.5,
                              color: alpha(m.navy, 0.86),
                              lineHeight: 1.2,
                            }}
                          >
                            {row.clientName}
                          </BodyText>
                        )}
                        <ClientPlatformTag
                          isGuest={row.clientType === "guest"}
                          isMollure={
                            row.clientType === "mollure" ||
                            Boolean(row.document?.client?.isMollure) ||
                            Boolean(row.document?.client?.customerId)
                          }
                          clientKind={
                            row.clientType === "business" ? "company" : null
                          }
                        />
                      </Stack>
                      {showClientEmail ? (
                        <BodyText
                          component="span"
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.5),
                          }}
                        >
                          {row.clientEmail}
                        </BodyText>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {tooltip ? (
                      <Tooltip
                        title={
                          <Box sx={{ whiteSpace: "pre-line", fontSize: 11 }}>
                            {tooltip}
                          </Box>
                        }
                        arrow
                      >
                        <BodyText
                          component="span"
                          sx={mollureLabelSx(m.navy, {
                            borderBottom: `1px dashed ${alpha(m.navy, 0.25)}`,
                            cursor: "help",
                          })}
                        >
                          {formatNetAmountEur(row.netAmount)}
                        </BodyText>
                      </Tooltip>
                    ) : (
                      <BodyText
                        component="span"
                        sx={mollureLabelSx(m.navy)}
                      >
                        {formatNetAmountEur(row.netAmount)}
                      </BodyText>
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <BodyText
                      component="div"
                      sx={mollureLabelSx(m.navy, {
                        color: alpha(m.navy, 0.82),
                        whiteSpace: "nowrap",
                      })}
                    >
                      {row.methodTitle}
                    </BodyText>
                    {row.methodDetail ? (
                      <BodyText
                        component="div"
                        sx={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: alpha(m.navy, 0.48),
                          mt: 0.25,
                        }}
                      >
                        {row.methodDetail}
                      </BodyText>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.35}>
                      {row.bookingFinancials ? (
                        (() => {
                          const fin = row.bookingFinancials;
                          const badge = deriveBookingFinanceBadge({
                            paymentStatus: fin.payment_status,
                            cancellationPaymentStatus:
                              fin.cancellation_payment_status,
                            bookingStatus: row.bookingStatus,
                            totalPaid: fin.total_paid,
                            totalRefunded: fin.total_refunded,
                            amountDue: fin.outstanding_balance,
                            netTotal: fin.net_total,
                          });
                          const due = Number(fin.outstanding_balance) || 0;
                          const label = bookingFinanceBadgeLabel(badge);
                          const chipTone =
                            badge === "PAID" || badge === "PREPAID"
                              ? {
                                  color: m.statusGreenFg,
                                  bgcolor: m.statusGreenBg,
                                }
                              : badge === "UNPAID"
                                ? {
                                    color: m.statusRedFg,
                                    bgcolor: m.statusRedBg,
                                  }
                                : badge === "PARTIALLY_PAID" ||
                                    badge === "PENDING_FEE"
                                  ? {
                                      color: m.statusOrangeFg,
                                      bgcolor: m.statusOrangeBg,
                                    }
                                  : {
                                      color: m.statusGreyFg,
                                      bgcolor: m.fxGrayF2F4F7,
                                    };
                          return (
                            <>
                              <Chip
                                label={label}
                                size="small"
                                variant="filled"
                                sx={{
                                  height: 18,
                                  borderRadius: "6px",
                                  fontWeight: 700,
                                  width: "fit-content",
                                  border: 0,
                                  "& .MuiChip-label": {
                                    fontSize: 10,
                                    px: 0.75,
                                    py: 0,
                                    lineHeight: 1.2,
                                  },
                                  ...chipTone,
                                }}
                              />
                              {due > 0 ? (
                                <BodyText
                                  component="span"
                                  sx={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: alpha(m.navy, 0.62),
                                    maxWidth: 180,
                                  }}
                                >
                                  Due {formatFinanceEuro(due)}
                                </BodyText>
                              ) : null}
                              <BodyText
                                component="span"
                                sx={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: alpha(m.navy, 0.42),
                                  maxWidth: 180,
                                }}
                              >
                                Doc:{" "}
                                {formatTransactionStatusLabel(
                                  row.status,
                                  row.entryLabel,
                                )}
                              </BodyText>
                            </>
                          );
                        })()
                      ) : (
                        <Chip
                          label={formatTransactionStatusLabel(
                            row.status,
                            row.entryLabel,
                          )}
                          size="small"
                          variant="filled"
                          sx={{
                            height: 18,
                            borderRadius: "6px",
                            fontWeight: 700,
                            width: "fit-content",
                            border: 0,
                            "& .MuiChip-label": {
                              fontSize: 10,
                              px: 0.75,
                              py: 0,
                              lineHeight: 1.2,
                            },
                            ...statusChipSx(row.status, theme, row.entryLabel),
                          }}
                        />
                      )}
                      {row.statusDetail ? (
                        <BodyText
                          component="span"
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.48),
                            maxWidth: 160,
                          }}
                        >
                          {row.statusDetail}
                        </BodyText>
                      ) : null}
                      {(row.status === "Overdue" ||
                        row.status === "Overdue response") &&
                      row.bookingId ? (
                        <MuiLink
                          component="button"
                          type="button"
                          onClick={() => {
                            if (onReviewOverdue) onReviewOverdue(row);
                            else onOpenDocument(row, "invoice");
                          }}
                          underline="hover"
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: theme.palette.primary.main,
                            width: "fit-content",
                            p: 0,
                            border: 0,
                            bgcolor: "transparent",
                          }}
                        >
                          Review
                        </MuiLink>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.35}>
                      {invoiceNo ? (
                        <MuiLink
                          component="button"
                          type="button"
                          disabled={disableDocumentLinks}
                          onClick={() => onOpenDocument(row, "invoice")}
                          underline="hover"
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: disableDocumentLinks
                              ? alpha(m.navy, 0.28)
                              : theme.palette.primary.main,
                            cursor: disableDocumentLinks
                              ? "not-allowed"
                              : "pointer",
                            border: 0,
                            bgcolor: "transparent",
                            p: 0,
                            textAlign: "left",
                            display: "block",
                            pointerEvents: disableDocumentLinks
                              ? "none"
                              : "auto",
                          }}
                        >
                          {invoiceNo}
                        </MuiLink>
                      ) : null}
                      {receiptNo === "voided" ? (
                        <BodyText
                          component="span"
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.55),
                            display: "block",
                          }}
                        >
                          voided
                        </BodyText>
                      ) : receiptNo ? (
                        <MuiLink
                          component="button"
                          type="button"
                          disabled={disableDocumentLinks}
                          onClick={() => onOpenDocument(row, "receipt")}
                          underline="hover"
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: disableDocumentLinks
                              ? alpha(m.navy, 0.28)
                              : theme.palette.primary.main,
                            cursor: disableDocumentLinks
                              ? "not-allowed"
                              : "pointer",
                            border: 0,
                            bgcolor: "transparent",
                            p: 0,
                            textAlign: "left",
                            display: "block",
                            pointerEvents: disableDocumentLinks
                              ? "none"
                              : "auto",
                          }}
                        >
                          Receipt
                        </MuiLink>
                      ) : null}
                      {!invoiceNo && !receiptNo ? (
                        <BodyText
                          component="span"
                          sx={{ fontSize: 11.5, color: alpha(m.navy, 0.35) }}
                        >
                          N/A
                        </BodyText>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {pageCount > 1 ? (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination count={pageCount} page={page} onChange={(_event, value) => onPageChange(value)} color="primary" shape="rounded" />
        </Stack>
      ) : null}
    </Box>
  );
}
