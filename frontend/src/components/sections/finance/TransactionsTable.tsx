import * as React from "react";
import { Box, Button, Checkbox, Chip, Link as MuiLink, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { TransactionRow, TransactionStatus } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { BodyText } from "../../ui/typography";

function statusChipSx(status: TransactionStatus, m: { navy: string; teal: string }) {
  switch (status) {
    case "Paid":
      return { bgcolor: alpha("#2E7D32", 0.12), color: "#2E7D32" };
    case "Unpaid":
      return { bgcolor: alpha("#C62828", 0.1), color: "#C62828" };
    case "Refunded":
    default:
      return { bgcolor: alpha(m.navy, 0.08), color: alpha(m.navy, 0.62) };
  }
}

export type TransactionsTableProps = {
  rows: readonly TransactionRow[];
  selected: Record<string, boolean>;
  onToggleOne: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onOpenDocument: (row: TransactionRow, documentType: "invoice" | "receipt") => void;
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
  canLoadMore,
  onLoadMore,
  theme,
  m,
}: TransactionsTableProps) {
  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected[r.id]);
  const someVisibleSelected = rows.some((r) => selected[r.id]);

  return (
    <Box sx={{ px: 2.25, pb: 2.25 }}>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflow: "hidden",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(m.navy, 0.02) }}>
              <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }}>
                <Checkbox
                  size="small"
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  checked={allVisibleSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  sx={{ p: 0.5 }}
                />
              </TableCell>
              {["Entry ID", "Date", "Client Name", "Net Amount", "Method", "Status", "Invoice/Receipt"].map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.2,
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                  }}
                >
                  <BodyText
                    component="span"
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.62),
                    }}
                  >
                    {h}
                  </BodyText>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={Boolean(selected[row.id])} onChange={() => onToggleOne(row.id)} sx={{ p: 0.5 }} />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.78) }}>
                    {row.entryLabel ?? row.entryId ?? ""}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75) }}>
                    {row.date ?? ""}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", minWidth: 160 }}>
                  <Stack spacing={0.35}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <BodyText component="span" sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.86) }}>
                        {row.clientName}
                      </BodyText>
                      {row.member ? (
                        <Chip
                          label="MEMBER"
                          size="small"
                          sx={{
                            height: 18,
                            borderRadius: "999px",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontSize: 9,
                            fontWeight: 900,
                            px: 0.25,
                          }}
                        />
                      ) : null}
                    </Stack>
                    <BodyText component="span" sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                      {row.clientEmail}
                    </BodyText>
                  </Stack>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.78) }}>
                    {row.netAmount}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", maxWidth: 200 }}>
                  <BodyText component="div" sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
                    {row.methodTitle}
                  </BodyText>
                  <BodyText component="div" sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.48), mt: 0.25 }}>
                    {row.methodDetail}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <Chip
                    label={row.status}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: "8px",
                      fontSize: 11,
                      fontWeight: 800,
                      ...statusChipSx(row.status, m),
                    }}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    {(["Invoice", "Receipt"] as const).map((label) => (
                      <MuiLink
                        key={label}
                        component="button"
                        type="button"
                        onClick={() => onOpenDocument(row, label.toLowerCase() as "invoice" | "receipt")}
                        underline="hover"
                        sx={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: theme.palette.primary.main,
                          cursor: "pointer",
                          border: 0,
                          bgcolor: "transparent",
                          p: 0,
                        }}
                      >
                        {label}
                      </MuiLink>
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {canLoadMore ? (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.72),
              bgcolor: "#fff",
              px: 3,
              height: 36,
            }}
          >
            Load More
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
}

