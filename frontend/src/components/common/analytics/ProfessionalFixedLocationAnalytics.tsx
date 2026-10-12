"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  ButtonBase,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodySx,
  mollureLabelSx,
  mollureSectionTitleSx,
  mollureTableHeaderSx,
} from "../../../theme/mollureHierarchy";
import { BodyText } from "../../ui/typography";
import {
  exportProfessionalAnalyticsToExcel,
  validateAnalyticsExportDates,
  type ProfessionalAnalyticsExportSelection,
} from "../../../app/professionals/fixed-location/analytics/exportProfessionalAnalyticsExcel";
import AnalyticsSectionExplanation from "./AnalyticsSectionExplanation";
import MollureCardHeader from "../MollureCardHeader";
import ExportMenuPopover, { type ExportMenuOption } from "../ExportMenuPopover";
import AppDatePicker from "../AppDatePicker";
import ProfessionalFixedLocationSalesVolumeAnalytics from "./ProfessionalFixedLocationSalesVolumeAnalytics";
import ProfessionalFixedLocationPerformanceAnalytics from "./ProfessionalFixedLocationPerformanceAnalytics";
import ProfessionalFixedLocationRatingReviewAnalytics from "./ProfessionalFixedLocationRatingReviewAnalytics";
import type {
  AttendanceNoShowRow,
  BookingOriginRow,
  BookingStatusSummaryRow,
  ProfessionalAnalyticsSubTab,
  ProfessionalFixedLocationAnalyticsData,
  TransactionSummaryRow,
} from "../../../app/professionals/fixed-location/analytics/analytics.data";
import { useSnackbar } from "../AppSnackbar";

export type ProfessionalFixedLocationAnalyticsProps = {
  data: ProfessionalFixedLocationAnalyticsData;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
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
          pointerEvents: "none",
        },
      }}
    >
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <ButtonBase
            key={t}
            onClick={() => onChange(t)}
            sx={{
              flex: "1 1 0",
              minWidth: "max-content",
              width: "auto",
              display: "block",
              position: "relative",
              zIndex: 1,
            }}
          >
            <BodyText
              component="span"
              sx={{
                whiteSpace: "nowrap",
                width: "100%",
                textAlign: "center",
                px: 1.25,
                pt: 1.05,
                pb: 1.1,
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                letterSpacing: "-0.01em",
                color: isActive ? m.teal : alpha(m.navy, 0.55),
                position: "relative",
                display: "block",
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
              }}
            >
              {t}
            </BodyText>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

function BookingOriginAndTypeTable({
  rows,
}: {
  rows: readonly BookingOriginRow[];
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = [
    "Origin",
    "FL Count",
    "DL Count",
    "Project Count",
    "Total",
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = mollureBodySx(m.navy, {
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
            });

            return (
              <TableRow
                key={r.origin}
                hover
                sx={{
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                }}
              >
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

function BookingStatusSummaryTable({
  rows,
}: {
  rows: readonly BookingStatusSummaryRow[];
}) {
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
        overflowX: "auto",
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = mollureBodySx(m.navy, {
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
            });

            return (
              <TableRow
                key={r.status}
                hover
                sx={{
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                }}
              >
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

function AttendanceNoShowAnalyticsTable({
  rows,
}: {
  rows: readonly AttendanceNoShowRow[];
}) {
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
        overflowX: "auto",
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = mollureBodySx(m.navy, {
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
              whiteSpace: "normal",
            });

            return (
              <TableRow
                key={r.bookingType}
                hover
                sx={{
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                }}
              >
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

function TransactionSummaryTable({
  rows,
}: {
  rows: readonly TransactionSummaryRow[];
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const headers = ["Transaction Channel", "Count", "Share (%)"] as const;

  return (
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
          <TableRow sx={{ bgcolor: alpha(m.navy, 0.03) }}>
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
          {rows.map((r) => {
            const isTotal = Boolean(r.isTotal);
            const cellSx = {
              borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
              py: 1.1,
            } as const;
            const textSx = mollureBodySx(m.navy, {
              fontWeight: isTotal ? 900 : 700,
              color: alpha(m.navy, isTotal ? 0.78 : 0.7),
              whiteSpace: "normal",
            });

            return (
              <TableRow
                key={r.channel}
                hover
                sx={{
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                }}
              >
                <TableCell sx={cellSx}>
                  <BodyText component="span" sx={textSx}>
                    {r.channel}
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

export default function ProfessionalFixedLocationAnalytics({
  data,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: ProfessionalFixedLocationAnalyticsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [exportAnchor, setExportAnchor] = React.useState<HTMLElement | null>(
    null,
  );
  const [exportSelection, setExportSelection] =
    React.useState<ProfessionalAnalyticsExportSelection>("all");
  const exportMenuOpen = Boolean(exportAnchor);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const resolvedSubTab =
    tabFromUrl && (data.subTabs as readonly string[]).includes(tabFromUrl)
      ? (tabFromUrl as ProfessionalAnalyticsSubTab)
      : data.initialSubTab;

  const [activeSubTab, setActiveSubTab] =
    React.useState<ProfessionalAnalyticsSubTab>(resolvedSubTab);

  React.useEffect(() => {
    setActiveSubTab(resolvedSubTab);
  }, [resolvedSubTab]);

  const todayIso = React.useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  const isBookingAndOperational =
    activeSubTab === "Booking and Operational Analytics";
  const isSalesVolume = activeSubTab === "Sales Volume Analytics";
  const isPerformance = activeSubTab === "Performance Analytics";
  const isRatingReview = activeSubTab === "Rating and Review Analytics";
  const section11 = data.sections.bookingOriginAndType;
  const section12 = data.sections.bookingStatusSummary;
  const section13 = data.sections.attendanceNoShowAnalytics;
  const section16 = data.sections.transactionSummary;

  const exportExcel = React.useCallback(
    (scope: ProfessionalAnalyticsExportSelection) => {
      const validation = validateAnalyticsExportDates(
        fromDate,
        toDate,
        todayIso,
      );
      if (!validation.ok) {
        showSnackbar({ severity: "warning", message: validation.message });
        return;
      }

      if (Array.isArray(scope) && scope.length === 0) {
        showSnackbar({
          severity: "warning",
          message: "Please select at least one analytics page to export.",
        });
        return;
      }

      try {
        exportProfessionalAnalyticsToExcel({ data, scope, fromDate, toDate });
        const label =
          scope === "all"
            ? "all analytics"
            : Array.isArray(scope)
              ? `${scope.length} analytics pages`
              : scope;
        showSnackbar({
          severity: "success",
          message: `Downloaded ${label} as Excel.`,
        });
      } catch {
        showSnackbar({
          severity: "error",
          message: "Export failed. Please try again.",
        });
      }
    },
    [data, fromDate, showSnackbar, toDate, todayIso],
  );

  const exportOptions = React.useMemo(
    () =>
      [
        {
          id: "Booking and Operational Analytics",
          label: "Booking and Operational",
        },
        { id: "Sales Volume Analytics", label: "Sales Volume" },
        { id: "Performance Analytics", label: "Performance" },
        { id: "Rating and Review Analytics", label: "Rating and Review" },
      ] as const,
    [],
  );

  const selectedExportIds = React.useMemo(
    () => (Array.isArray(exportSelection) ? exportSelection : []),
    [exportSelection],
  );
  const allExportSelected = exportSelection === "all";

  function selectAllExports() {
    setExportSelection("all");
    setExportAnchor(null);
    exportExcel("all");
  }

  function toggleExportOption(opt: ExportMenuOption) {
    const scope = opt.id as ProfessionalAnalyticsSubTab;
    setExportSelection((current) => {
      if (current === "all") {
        return [scope];
      }
      const currentScopes = Array.isArray(current) ? current : [current];
      return currentScopes.includes(scope)
        ? currentScopes.filter(
            (item: ProfessionalAnalyticsSubTab) => item !== scope,
          )
        : [...currentScopes, scope];
    });
  }

  function downloadSelectedExports() {
    setExportAnchor(null);
    exportExcel(exportSelection);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
        bgcolor: theme.palette.background.paper,
        overflowX: "auto",
      }}
    >
      <MollureCardHeader
        title={data.header.title}
        subtitle={data.header.subtitle}
        tone="tinted"
      />
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
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <BodyText
                sx={mollureLabelSx(m.navy, { whiteSpace: "nowrap" })}
              >
                Date From
              </BodyText>
              <AppDatePicker
                value={fromDate}
                onChange={(iso) => onFromDateChange(iso)}
                max={toDate && toDate < todayIso ? toDate : todayIso}
                placeholder="DD/MM/YYYY"
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.75}>
              <BodyText
                sx={mollureLabelSx(m.navy, { whiteSpace: "nowrap" })}
              >
                Date To
              </BodyText>
              <AppDatePicker
                value={toDate}
                onChange={(iso) => onToDateChange(iso)}
                min={fromDate || undefined}
                max={todayIso}
                placeholder="DD/MM/YYYY"
              />
            </Stack>

            <Box sx={{ flex: 1 }} />

            <AppButton
              tone="primary"
              onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{
                height: 28,
                fontSize: 12,
                px: 2,
                minWidth: 84,
              }}
            >
              Export
            </AppButton>

            <ExportMenuPopover
              anchorEl={exportAnchor}
              open={exportMenuOpen}
              onClose={() => setExportAnchor(null)}
              options={exportOptions}
              selectedIds={selectedExportIds}
              allSelected={allExportSelected}
              onSelectAll={selectAllExports}
              onToggle={toggleExportOption}
              onDownloadSelected={downloadSelectedExports}
            />
          </Stack>
        </Paper>
      </Box>

      <AnalyticsSubTabs
        tabs={data.subTabs}
        active={activeSubTab}
        onChange={(next) => {
          setActiveSubTab(next);
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", next);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }}
      />

      {isBookingAndOperational ? (
        <>
          <Box sx={{ px: 2.25, py: 1.6 }}>
            <BodyText
              sx={mollureSectionTitleSx(m.navy)}
            >
              {section11.title}
            </BodyText>
          </Box>

          <Box sx={{ px: 2.25, pb: 2.25 }}>
            <BookingOriginAndTypeTable rows={section11.rows} />

            {section11.explanationContent ? (
              <AnalyticsSectionExplanation
                label={section11.explanationLabel}
                content={section11.explanationContent}
              />
            ) : null}
          </Box>

          <Box sx={{ px: 2.25, pb: 2.25 }}>
            <BodyText
              sx={{
                ...mollureSectionTitleSx(m.navy),
                mb: 1.6,
              }}
            >
              {section12.title}
            </BodyText>

            <BookingStatusSummaryTable rows={section12.rows} />

            {section12.explanationContent ? (
              <AnalyticsSectionExplanation
                label={section12.explanationLabel}
                content={section12.explanationContent}
              />
            ) : null}
          </Box>

          <Box sx={{ px: 2.25, pb: 2.25 }}>
            <BodyText
              sx={{
                ...mollureSectionTitleSx(m.navy),
                mb: 1.6,
              }}
            >
              {section13.title}
            </BodyText>

            <AttendanceNoShowAnalyticsTable rows={section13.rows} />

            {section13.explanationContent ? (
              <AnalyticsSectionExplanation
                label={section13.explanationLabel}
                content={section13.explanationContent}
              />
            ) : null}
          </Box>

          <Box sx={{ px: 2.25, pb: 2.25 }}>
            <BodyText
              sx={{
                ...mollureSectionTitleSx(m.navy),
                mb: 1.6,
              }}
            >
              {section16.title}
            </BodyText>

            <TransactionSummaryTable rows={section16.rows} />

            {section16.explanationContent ? (
              <AnalyticsSectionExplanation
                label={section16.explanationLabel}
                content={section16.explanationContent}
              />
            ) : null}
          </Box>
        </>
      ) : isSalesVolume ? (
        <ProfessionalFixedLocationSalesVolumeAnalytics
          data={data.salesVolume}
        />
      ) : isPerformance ? (
        <ProfessionalFixedLocationPerformanceAnalytics
          data={data.performance}
        />
      ) : isRatingReview ? (
        <ProfessionalFixedLocationRatingReviewAnalytics
          data={data.ratingReview}
        />
      ) : (
        <Box sx={{ px: 2.25, py: 5 }}>
              <BodyText
                sx={mollureSectionTitleSx(m.navy, {
                  color: alpha(m.navy, 0.65),
                  textAlign: "center",
                })}
              >
            No data is wired for{" "}
            <BodyText
              component="span"
              sx={{ fontWeight: 900, color: alpha(m.navy, 0.8) }}
            >
              {activeSubTab}
            </BodyText>{" "}
            yet.
          </BodyText>
        </Box>
      )}
    </Paper>
  );
}
