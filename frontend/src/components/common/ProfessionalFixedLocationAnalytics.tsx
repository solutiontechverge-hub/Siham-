"use client";

import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { Box, Button, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { jsPDF } from "jspdf";
import { BodyText } from "../ui/typography";
import MollureCardHeader from "./MollureCardHeader";
import MollureFormField from "./MollureFormField";
import type {
  AttendanceNoShowRow,
  BookingByServiceCategoryRow,
  BookingByClientTypeRow,
  BookingOriginRow,
  BookingStatusSummaryRow,
  ProfessionalAnalyticsSubTab,
  ProfessionalFixedLocationAnalyticsData,
  ReschedulingSummaryRow,
} from "../../app/professionals/fixed-location/analytics/analytics.data";
import { useSnackbar } from "./AppSnackbar";

export type ProfessionalFixedLocationAnalyticsProps = {
  data: ProfessionalFixedLocationAnalyticsData;
};

function AnalyticsSubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly ProfessionalAnalyticsSubTab[];
  active: ProfessionalAnalyticsSubTab;
  onChange: (next: ProfessionalAnalyticsSubTab) => void;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Stack
      direction="row"
      spacing={0}
      sx={{
        px: 2.25,
        overflowX: "auto",
        position: "relative",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "&:after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          bgcolor: alpha(m.navy, 0.08),
        },
      }}
    >
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <BodyText
            key={t}
            component="button"
            type="button"
            onClick={() => onChange(t)}
            sx={{
              appearance: "none",
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flex: "1 1 0",
              textAlign: "center",
              px: 1.25,
              pt: 1.05,
              pb: 1.1,
              fontSize: 13,
              fontWeight: isActive ? 800 : 600,
              letterSpacing: "-0.01em",
              color: isActive ? m.teal : alpha(m.navy, 0.55),
              position: "relative",
              "&:after": {
                content: '""',
                position: "absolute",
                left: "12%",
                right: "12%",
                bottom: -0.5,
                height: 2,
                bgcolor: isActive ? m.teal : "transparent",
                borderRadius: 999,
              },
              "&:focus-visible": {
                outline: "none",
                boxShadow: `0 0 0 3px ${alpha(m.teal, 0.25)}`,
                borderRadius: "8px",
              },
            }}
          >
            {t}
          </BodyText>
        );
      })}
    </Stack>
  );
}

function BookingOriginAndTypeTable({ rows }: { rows: readonly BookingOriginRow[] }) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = ["Origin", "FL Count", "DL Count", "Project Count", "Total", "Share (%)"] as const;

  return (
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
          <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{
                  py: 1.2,
                  borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = {
              fontSize: 12.5,
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
            } as const;

            return (
              <TableRow key={r.origin} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.origin}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.flCount}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.dlCount}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.projectCount}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.total}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.sharePct}%
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

function BookingStatusSummaryTable({ rows }: { rows: readonly BookingStatusSummaryRow[] }) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = ["Status", "Count", "Share (%)"] as const;

  return (
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
          <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{
                  py: 1.2,
                  borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = {
              fontSize: 12.5,
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
            } as const;

            return (
              <TableRow key={r.status} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.status}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.count}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
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

function AttendanceNoShowAnalyticsTable({ rows }: { rows: readonly AttendanceNoShowRow[] }) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = ["Booking Type", "No-Show Count", "Share (%)"] as const;

  return (
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
          <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{
                  py: 1.2,
                  borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = {
              fontSize: 12.5,
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
              whiteSpace: "normal",
            } as const;

            return (
              <TableRow key={r.bookingType} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.bookingType}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.noShowCount}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
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

function ReschedulingSummaryTable({ rows }: { rows: readonly ReschedulingSummaryRow[] }) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = ["Category", "Count"] as const;

  return (
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
          <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{
                  py: 1.2,
                  borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = {
              fontSize: 12.5,
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
            } as const;

            return (
              <TableRow key={r.category} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.category}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.count}
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

function BookingByClientTypeTable({ rows }: { rows: readonly BookingByClientTypeRow[] }) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = ["Client Type", "Count", "Share (%)"] as const;

  return (
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
          <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{
                  py: 1.2,
                  borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = {
              fontSize: 12.5,
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
              whiteSpace: "normal",
            } as const;

            return (
              <TableRow key={r.clientType} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.clientType}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.count}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
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

function BookingByServiceCategoryTable({ rows }: { rows: readonly BookingByServiceCategoryRow[] }) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = ["Category", "Count", "Share (%)"] as const;

  return (
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
          <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{
                  py: 1.2,
                  borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = {
              fontSize: 12.5,
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
              whiteSpace: "normal",
            } as const;

            return (
              <TableRow key={r.category} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.category}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.count}
                  </BodyText>
                </TableCell>
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
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

export default function ProfessionalFixedLocationAnalytics({ data }: ProfessionalFixedLocationAnalyticsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [activeSubTab, setActiveSubTab] = React.useState<ProfessionalAnalyticsSubTab>(data.initialSubTab);
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const section11 = data.sections.bookingOriginAndType;
  const section12 = data.sections.bookingStatusSummary;
  const section13 = data.sections.attendanceNoShowAnalytics;
  const section14 = data.sections.reschedulingSummary;
  const section15 = data.sections.bookingByClientType;
  const section16 = data.sections.bookingByServiceCategory;

  const exportPdf = React.useCallback(() => {
    const hasFrom = Boolean(fromDate);
    const hasTo = Boolean(toDate);

    if ((hasFrom && !hasTo) || (!hasFrom && hasTo)) {
      showSnackbar({
        severity: "warning",
        message: "Please select both Date From and Date To before exporting.",
      });
      return;
    }

    if (fromDate && fromDate > todayIso) {
      showSnackbar({
        severity: "warning",
        message: "Date From cannot be in the future.",
      });
      return;
    }
    if (toDate && toDate > todayIso) {
      showSnackbar({
        severity: "warning",
        message: "Date To cannot be in the future.",
      });
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      showSnackbar({
        severity: "warning",
        message: "Date From must be before Date To.",
      });
      return;
    }

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    const title = `${data.header.title}`;
    const subtitle = data.header.subtitle;
    const rangeLabel = fromDate && toDate ? `Date range: ${fromDate} → ${toDate}` : "Date range: All time";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 40, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(String(subtitle ?? ""), 40, 70, { maxWidth: pageW - 80 });
    doc.setTextColor(60);
    doc.text(rangeLabel, 40, 86);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(String(activeSubTab), 40, 114, { maxWidth: pageW - 80 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(section11.title, 40, 142);

    const headers = ["Origin", "FL Count", "DL Count", "Project Count", "Total", "Share (%)"];
    const body = section11.rows.map((r) => [
      r.origin,
      String(r.flCount),
      String(r.dlCount),
      String(r.projectCount),
      String(r.total),
      `${r.sharePct}%`,
    ]);

    const startY = 156;
    const colW = [120, 70, 70, 90, 60, 70];
    const rowH = 22;
    const x0 = 40;
    const tableW = colW.reduce((a, b) => a + b, 0);

    // header row
    doc.setFillColor(245, 247, 250);
    doc.rect(x0, startY, tableW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80);
    let x = x0;
    headers.forEach((h, i) => {
      doc.text(h, x + 6, startY + 15, { maxWidth: colW[i]! - 12 });
      x += colW[i]!;
    });

    // body rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    body.forEach((row, idx) => {
      const y = startY + rowH * (idx + 1);
      x = x0;
      row.forEach((cell, i) => {
        doc.text(cell, x + 6, y + 15, { maxWidth: colW[i]! - 12 });
        x += colW[i]!;
      });
      doc.setDrawColor(230);
      doc.line(x0, y + rowH, x0 + tableW, y + rowH);
    });

    // Section 1.2 (start after table 1.1)
    const pageH = doc.internal.pageSize.getHeight();
    const table11H = rowH * (1 + body.length);
    let yCursor = startY + table11H + 28;
    if (yCursor > pageH - 140) {
      doc.addPage();
      yCursor = 52;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(section12.title, 40, yCursor);
    yCursor += 14;

    const headers12 = ["Status", "Count", "Share (%)"];
    const body12 = section12.rows.map((r) => [r.status, String(r.count), `${r.sharePct.toFixed(1)}%`]);
    const colW12 = [260, 120, 120];
    const tableW12 = colW12.reduce((a, b) => a + b, 0);
    const startY12 = yCursor + 10;

    doc.setFillColor(245, 247, 250);
    doc.rect(x0, startY12, tableW12, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80);
    x = x0;
    headers12.forEach((h, i) => {
      doc.text(h, x + 6, startY12 + 15, { maxWidth: colW12[i]! - 12 });
      x += colW12[i]!;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    body12.forEach((row, idx) => {
      const y = startY12 + rowH * (idx + 1);
      x = x0;
      row.forEach((cell, i) => {
        doc.text(cell, x + 6, y + 15, { maxWidth: colW12[i]! - 12 });
        x += colW12[i]!;
      });
      doc.setDrawColor(230);
      doc.line(x0, y + rowH, x0 + tableW12, y + rowH);
    });

    // Section 1.3 (start after table 1.2)
    const table12H = rowH * (1 + body12.length);
    let yCursor13 = startY12 + table12H + 28;
    if (yCursor13 > pageH - 160) {
      doc.addPage();
      yCursor13 = 52;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(section13.title, 40, yCursor13);
    yCursor13 += 14;

    const headers13 = ["Booking Type", "No-Show Count", "Share (%)"];
    const body13 = section13.rows.map((r) => [r.bookingType, String(r.noShowCount), `${r.sharePct.toFixed(1)}%`]);
    const colW13 = [260, 120, 120];
    const tableW13 = colW13.reduce((a, b) => a + b, 0);
    const startY13 = yCursor13 + 10;

    doc.setFillColor(245, 247, 250);
    doc.rect(x0, startY13, tableW13, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80);
    x = x0;
    headers13.forEach((h, i) => {
      doc.text(h, x + 6, startY13 + 15, { maxWidth: colW13[i]! - 12 });
      x += colW13[i]!;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    body13.forEach((row, idx) => {
      const y = startY13 + rowH * (idx + 1);
      x = x0;
      row.forEach((cell, i) => {
        doc.text(cell, x + 6, y + 15, { maxWidth: colW13[i]! - 12 });
        x += colW13[i]!;
      });
      doc.setDrawColor(230);
      doc.line(x0, y + rowH, x0 + tableW13, y + rowH);
    });

    // Section 1.4 (start after table 1.3)
    const table13H = rowH * (1 + body13.length);
    let yCursor14 = startY13 + table13H + 28;
    if (yCursor14 > pageH - 160) {
      doc.addPage();
      yCursor14 = 52;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(section14.title, 40, yCursor14);
    yCursor14 += 14;

    const headers14 = ["Category", "Count"];
    const body14 = section14.rows.map((r) => [r.category, String(r.count)]);
    const colW14 = [320, 180];
    const tableW14 = colW14.reduce((a, b) => a + b, 0);
    const startY14 = yCursor14 + 10;

    doc.setFillColor(245, 247, 250);
    doc.rect(x0, startY14, tableW14, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80);
    x = x0;
    headers14.forEach((h, i) => {
      doc.text(h, x + 6, startY14 + 15, { maxWidth: colW14[i]! - 12 });
      x += colW14[i]!;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    body14.forEach((row, idx) => {
      const y = startY14 + rowH * (idx + 1);
      x = x0;
      row.forEach((cell, i) => {
        doc.text(cell, x + 6, y + 15, { maxWidth: colW14[i]! - 12 });
        x += colW14[i]!;
      });
      doc.setDrawColor(230);
      doc.line(x0, y + rowH, x0 + tableW14, y + rowH);
    });

    // Section 1.5 (start after table 1.4)
    const table14H = rowH * (1 + body14.length);
    let yCursor15 = startY14 + table14H + 28;
    if (yCursor15 > pageH - 200) {
      doc.addPage();
      yCursor15 = 52;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(section15.title, 40, yCursor15);
    yCursor15 += 14;

    const headers15 = ["Client Type", "Count", "Share (%)"];
    const body15 = section15.rows.map((r) => [r.clientType, String(r.count), `${r.sharePct.toFixed(1)}%`]);
    const colW15 = [260, 120, 120];
    const tableW15 = colW15.reduce((a, b) => a + b, 0);
    const startY15 = yCursor15 + 10;

    doc.setFillColor(245, 247, 250);
    doc.rect(x0, startY15, tableW15, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80);
    x = x0;
    headers15.forEach((h, i) => {
      doc.text(h, x + 6, startY15 + 15, { maxWidth: colW15[i]! - 12 });
      x += colW15[i]!;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    body15.forEach((row, idx) => {
      const y = startY15 + rowH * (idx + 1);
      x = x0;
      row.forEach((cell, i) => {
        doc.text(cell, x + 6, y + 15, { maxWidth: colW15[i]! - 12 });
        x += colW15[i]!;
      });
      doc.setDrawColor(230);
      doc.line(x0, y + rowH, x0 + tableW15, y + rowH);
    });

    // Section 1.6 (start after table 1.5)
    const table15H = rowH * (1 + body15.length);
    let yCursor16 = startY15 + table15H + 28;
    if (yCursor16 > pageH - 200) {
      doc.addPage();
      yCursor16 = 52;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(section16.title, 40, yCursor16);
    yCursor16 += 14;

    const headers16 = ["Category", "Count", "Share (%)"];
    const body16 = section16.rows.map((r) => [r.category, String(r.count), `${r.sharePct.toFixed(1)}%`]);
    const colW16 = [260, 120, 120];
    const tableW16 = colW16.reduce((a, b) => a + b, 0);
    const startY16 = yCursor16 + 10;

    doc.setFillColor(245, 247, 250);
    doc.rect(x0, startY16, tableW16, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80);
    x = x0;
    headers16.forEach((h, i) => {
      doc.text(h, x + 6, startY16 + 15, { maxWidth: colW16[i]! - 12 });
      x += colW16[i]!;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    body16.forEach((row, idx) => {
      const y = startY16 + rowH * (idx + 1);
      x = x0;
      row.forEach((cell, i) => {
        doc.text(cell, x + 6, y + 15, { maxWidth: colW16[i]! - 12 });
        x += colW16[i]!;
      });
      doc.setDrawColor(230);
      doc.line(x0, y + rowH, x0 + tableW16, y + rowH);
    });

    const filename =
      fromDate && toDate
        ? `professional-analytics_${activeSubTab.replaceAll(" ", "-").toLowerCase()}_${fromDate}_to_${toDate}.pdf`
        : `professional-analytics_${activeSubTab.replaceAll(" ", "-").toLowerCase()}.pdf`;

    doc.save(filename);
    showSnackbar({ severity: "success", message: "Export started. Your PDF should download shortly." });
  }, [
    activeSubTab,
    data.header.subtitle,
    data.header.title,
    fromDate,
    section11.rows,
    section11.title,
    section12.rows,
    section12.title,
    section13.rows,
    section13.title,
    section14.rows,
    section14.title,
    section15.rows,
    section15.title,
    section16.rows,
    section16.title,
    showSnackbar,
    toDate,
    todayIso,
  ]);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
        bgcolor: theme.palette.background.paper,
        overflow: "hidden",
      }}
    >
      <MollureCardHeader title={data.header.title} subtitle={data.header.subtitle} tone="tinted" />
      <Box sx={{ height: 1, bgcolor: alpha(m.navy, 0.06) }} />

      {/* Filters row */}
      <Box sx={{ px: 2, py: 1 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "8px",
            bgcolor: alpha(m.teal, 0.08),
            border: `1px solid ${alpha(m.teal, 0.14)}`,
            boxShadow: "none",
            px: 1,
            py: 0.75,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            <MollureFormField
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="MM/DD/YY"
              InputLabelProps={{ shrink: false }}
              inputProps={{
                max: toDate && toDate < todayIso ? toDate : todayIso,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.65) }}>
                      Date From
                    </BodyText>
                  </InputAdornment>
                ),
                endAdornment: <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
              }}
              sx={{
                maxWidth: 245,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: "8px",
                },
                "& .MuiOutlinedInput-input": {
                  paddingTop: "8px",
                  paddingBottom: "8px",
                },
              }}
            />

            <MollureFormField
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="MM/DD/YY"
              InputLabelProps={{ shrink: false }}
              inputProps={{
                min: fromDate || undefined,
                max: todayIso,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.65) }}>
                      Date To
                    </BodyText>
                  </InputAdornment>
                ),
                endAdornment: <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
              }}
              sx={{
                maxWidth: 245,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: "8px",
                },
                "& .MuiOutlinedInput-input": {
                  paddingTop: "8px",
                  paddingBottom: "8px",
                },
              }}
            />

            <Box sx={{ flex: 1 }} />

            <Button
              variant="contained"
              disableElevation
              onClick={exportPdf}
              sx={{
                height: 28,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
                px: 2,
                minWidth: 84,
              }}
            >
              Export
            </Button>
          </Stack>
        </Paper>
      </Box>

      <AnalyticsSubTabs tabs={data.subTabs} active={activeSubTab} onChange={setActiveSubTab} />

      {/* Content (only first section implemented to match screenshot) */}
      <Box sx={{ px: 2.25, py: 1.6 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          {section11.title}
        </BodyText>
      </Box>

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <BookingOriginAndTypeTable rows={section11.rows} />

        <BodyText
          component="button"
          type="button"
          onClick={() => {
            // placeholder for explanation dialog/drawer
            void 0;
          }}
          sx={{
            mt: 1.75,
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            color: m.teal,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: "underline",
            "&:hover": { color: m.tealDark },
          }}
        >
          {section11.explanationLabel}
        </BodyText>
      </Box>

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.6 }}>
          {section12.title}
        </BodyText>

        <BookingStatusSummaryTable rows={section12.rows} />

        <BodyText
          component="button"
          type="button"
          onClick={() => {
            void 0;
          }}
          sx={{
            mt: 1.75,
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            color: m.teal,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: "underline",
            "&:hover": { color: m.tealDark },
          }}
        >
          {section12.explanationLabel}
        </BodyText>
      </Box>

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.6 }}>
          {section13.title}
        </BodyText>

        <AttendanceNoShowAnalyticsTable rows={section13.rows} />

        <BodyText
          component="button"
          type="button"
          onClick={() => {
            void 0;
          }}
          sx={{
            mt: 1.75,
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            color: m.teal,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: "underline",
            "&:hover": { color: m.tealDark },
          }}
        >
          {section13.explanationLabel}
        </BodyText>
      </Box>

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.6 }}>
          {section14.title}
        </BodyText>

        <ReschedulingSummaryTable rows={section14.rows} />

        <BodyText
          component="button"
          type="button"
          onClick={() => {
            void 0;
          }}
          sx={{
            mt: 1.75,
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            color: m.teal,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: "underline",
            "&:hover": { color: m.tealDark },
          }}
        >
          {section14.explanationLabel}
        </BodyText>
      </Box>

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.6 }}>
          {section15.title}
        </BodyText>

        <BookingByClientTypeTable rows={section15.rows} />

        <BodyText
          component="button"
          type="button"
          onClick={() => {
            void 0;
          }}
          sx={{
            mt: 1.75,
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            color: m.teal,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: "underline",
            "&:hover": { color: m.tealDark },
          }}
        >
          {section15.explanationLabel}
        </BodyText>
      </Box>

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.6 }}>
          {section16.title}
        </BodyText>

        <BookingByServiceCategoryTable rows={section16.rows} />

        <BodyText
          component="button"
          type="button"
          onClick={() => {
            void 0;
          }}
          sx={{
            mt: 1.75,
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            color: m.teal,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: "underline",
            "&:hover": { color: m.tealDark },
          }}
        >
          {section16.explanationLabel}
        </BodyText>
      </Box>
    </Paper>
  );
}

