"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SalesByCategoryServiceRow } from "../../../app/professionals/fixed-location/analytics/salesVolumeAnalytics.data";
import { mollureBodySx, mollureTableHeaderSx } from "../../../theme/mollureHierarchy";
import { BodyText } from "../../ui/typography";

function formatNetSalesEur(value: number) {
  return `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function SalesByCategoriesServicesTable({
  rows,
}: {
  rows: readonly SalesByCategoryServiceRow[];
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const headers = [
    "Category",
    "Service",
    "Count",
    "Net Sales (€)",
    "Share (%)",
  ] as const;

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        overflowX: "auto",
        boxShadow: "none",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: alpha("#9BA3B5", 0.14) }}>
            {headers.map((h) => (
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
          {rows.map((r, index) => {
            const isTotal = Boolean(r.isCategoryTotal || r.isGrandTotal);
            const fontWeight = isTotal ? 900 : 700;
            const textColor = alpha(m.navy, isTotal ? 0.82 : 0.68);
            const cellSx = (extra?: Record<string, unknown>) =>
              mollureBodySx(m.navy, { fontWeight, color: textColor, ...extra });

            return (
              <TableRow
                key={`${r.category}-${r.service}-${index}`}
                sx={{
                  bgcolor: isTotal ? alpha(m.navy, 0.02) : "#fff",
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                }}
              >
                <TableCell sx={{ py: 1.1, verticalAlign: "top" }}>
                  <BodyText component="span" sx={cellSx()}>
                    {r.hideCategoryCell ? "" : r.category}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText component="span" sx={cellSx()}>
                    {r.service}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={cellSx({ fontVariantNumeric: "tabular-nums" })}
                  >
                    {r.count}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={cellSx({ fontVariantNumeric: "tabular-nums" })}
                  >
                    {formatNetSalesEur(r.netSalesEur)}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={cellSx({ fontVariantNumeric: "tabular-nums" })}
                  >
                    {r.sharePct.toFixed(1)}%
                  </BodyText>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
