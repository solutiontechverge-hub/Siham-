"use client";

import * as React from "react";
import { Box, Collapse, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import type { ProfessionalFixedLocationPerformanceAnalyticsData } from "../../app/professionals/fixed-location/analytics/performanceAnalytics.data";

export type ProfessionalFixedLocationPerformanceAnalyticsProps = {
  data: ProfessionalFixedLocationPerformanceAnalyticsData;
};

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatMoney2(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export default function ProfessionalFixedLocationPerformanceAnalytics({ data }: ProfessionalFixedLocationPerformanceAnalyticsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const section = data.productivityAndEfficiency;
  const [open, setOpen] = React.useState(false);

  const headers = [
    "Team Member",
    "Hours Worked",
    "Completed Bookings",
    "Revenue (€)",
    "Productivity (€ / hr)",
    "Efficiency (%)",
    "Average Rating",
    "Reviews",
  ] as const;

  return (
    <Box sx={{ px: 2.25, pb: 2.5 }}>
      <Box sx={{ pt: 2.25, pb: 1.4 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>{section.title}</BodyText>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflow: "hidden",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
              {headers.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.15,
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  <BodyText component="span" sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.62) }}>
                    {h}
                  </BodyText>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {section.rows.map((r) => {
              const isAvg = Boolean(r.isAverage);
              const textColor = alpha(m.navy, isAvg ? 0.78 : 0.65);
              const fontWeight = isAvg ? 900 : 700;

              return (
                <TableRow key={r.teamMember} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, whiteSpace: "nowrap" }}>
                      {r.teamMember}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                      {r.hoursWorked}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                      {r.completedBookings}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                      {formatMoney(r.revenueEur)}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                      {formatMoney2(r.productivityEurPerHr)}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                      {r.efficiencyPct}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                      {r.averageRating}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText component="span" sx={{ fontSize: 12.5, fontWeight, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                      {r.reviews}
                    </BodyText>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <BodyText
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        sx={{
          mt: 1.6,
          p: 0,
          border: 0,
          bgcolor: "transparent",
          cursor: "pointer",
          color: m.teal,
          fontSize: 12.5,
          fontWeight: 800,
          textDecoration: "underline",
          "&:hover": { color: m.tealDark },
          "&:focus-visible": {
            outline: "none",
            boxShadow: `0 0 0 3px ${alpha(m.teal, 0.25)}`,
            borderRadius: "6px",
          },
        }}
      >
        {section.explanationLabel}
      </BodyText>

      <Collapse in={open} timeout={180}>
        <Box sx={{ pt: 1.25, maxWidth: 880 }}>
          <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.55), lineHeight: 1.6 }}>
            {section.explanationText}
          </BodyText>
        </Box>
      </Collapse>
    </Box>
  );
}

