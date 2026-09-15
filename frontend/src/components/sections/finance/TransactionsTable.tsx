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
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import {
  mollureBodySx,
  mollureLabelSx,
  mollureTableHeaderSx,
} from "../../../theme/mollureHierarchy";
import {
  formatEntryIdDisplay,
  formatTransactionDate,
  formatTransactionStatusLabel,
  getTransactionClientTypeLabel,
  getTransactionStatusTone,
  isTransactionClientClickable,
  shouldShowTransactionClientEmail,
  type TransactionRow,
  type TransactionStatus,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import { BodyText } from "../../ui/typography";

function clientTypeChipSx(theme: Theme) {
  return {
    bgcolor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
  };
}

function statusChipSx(status: TransactionStatus, theme: Theme) {
  const tone = getTransactionStatusTone(status);
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
  const parts = [`Gross: ${row.grossAmount}`];
  if (row.stripeFee) parts.push(`Stripe fee: ${row.stripeFee}`);
  if (row.mollureFee) parts.push(`Mollure fee: ${row.mollureFee}`);
  if (row.stripeFee || row.mollureFee) {
    const feeTotal = [row.stripeFee, row.mollureFee]
      .filter(Boolean)
      .join(" + ");
    parts.push(`Net = Gross − (${feeTotal})`);
  }
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
  onEntryClick?: (row: TransactionRow) => void;
  onClientClick?: (row: TransactionRow) => void;
  disableDocumentLinks?: boolean;
  canLoadMore: boolean;
  onLoadMore?: () => void;
  theme: Theme;
  m: { navy: string; teal: string };
};

export default function TransactionsTable({
  rows,
  selected,
  onToggleOne,
  onToggleAll,
  onOpenDocument,
  onOpenNote,
  onEntryClick,
  onClientClick,
  disableDocumentLinks = false,
  canLoadMore,
  onLoadMore,
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
              {[
                "Entry ID",
                "Transaction date",
                "Client name",
                "Net amount",
                "Trans. type",
                "Trans. status",
                "Invoice and receipts",
              ].map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.2,
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
              const clientTypeLabel = getTransactionClientTypeLabel(
                row.clientType,
              );
              const showClientEmail = shouldShowTransactionClientEmail(row);
              const entryDisplay = formatEntryIdDisplay(
                row.entryType,
                row.entryId,
                row.entryLabel,
              );
              const dateDisplay = formatTransactionDate(row.date);
              const tooltip = netAmountTooltip(row);
              const invoiceNo = row.document?.documentNumber;
              const receiptNo = row.document?.receiptNumber;
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
                  <TableCell sx={{ verticalAlign: "top" }}>
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
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Stack spacing={0.35}>
                      <BodyText
                        component="span"
                        sx={mollureBodySx(m.navy, {
                          color: alpha(m.navy, 0.75),
                        })}
                      >
                        {dateDisplay}
                      </BodyText>
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
                  <TableCell sx={{ verticalAlign: "top", minWidth: 160 }}>
                    <Stack spacing={0.35}>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
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
                        {clientTypeLabel ? (
                          <Chip
                            label={clientTypeLabel}
                            size="small"
                            sx={{
                              height: 16,
                              borderRadius: "999px",
                              fontWeight: 700,
                              textTransform: "none",
                              "& .MuiChip-label": {
                                fontSize: 9,
                                px: 0.65,
                                py: 0,
                                lineHeight: 1.2,
                              },
                              ...clientTypeChipSx(theme),
                            }}
                          />
                        ) : null}
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
                  <TableCell sx={{ verticalAlign: "top" }}>
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
                          {row.netAmount}
                        </BodyText>
                      </Tooltip>
                    ) : (
                      <BodyText
                        component="span"
                        sx={mollureLabelSx(m.navy)}
                      >
                        {row.netAmount}
                      </BodyText>
                    )}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", maxWidth: 200 }}>
                    <BodyText
                      component="div"
                      sx={mollureLabelSx(m.navy, {
                        color: alpha(m.navy, 0.82),
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
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Stack spacing={0.35}>
                      <Chip
                        label={formatTransactionStatusLabel(row.status)}
                        size="small"
                        sx={{
                          height: 18,
                          borderRadius: "6px",
                          fontWeight: 700,
                          width: "fit-content",
                          "& .MuiChip-label": {
                            fontSize: 10,
                            px: 0.75,
                            py: 0,
                            lineHeight: 1.2,
                          },
                          ...statusChipSx(row.status, theme),
                        }}
                      />
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
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
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
                      {receiptNo ? (
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
                          —
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

      {canLoadMore ? (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <AppButton
            tone="secondary"
            onClick={onLoadMore}
            sx={{
              px: 3,
            }}
          >
            Load More
          </AppButton>
        </Stack>
      ) : null}
    </Box>
  );
}
