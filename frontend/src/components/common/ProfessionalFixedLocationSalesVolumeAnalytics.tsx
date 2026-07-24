"use client";

import * as React from "react";
import {
  Box,
  ButtonBase,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import type { ProfessionalFixedLocationSalesVolumeAnalyticsData } from "../../app/professionals/fixed-location/analytics/salesVolumeAnalytics.data";
import AnalyticsSectionExplanation from "./AnalyticsSectionExplanation";
import SalesByCategoriesServicesTable from "./SalesByCategoriesServicesTable";
import SalesVolumeStackedBarChart from "./SalesVolumeStackedBarChart";

export type ProfessionalFixedLocationSalesVolumeAnalyticsProps = {
  data: ProfessionalFixedLocationSalesVolumeAnalyticsData;
};

function formatAmountEur(amount: number) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${formatted}` : formatted;
}

function formatPct(pct: number) {
  const abs = Math.abs(pct);
  const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return pct < 0 ? `-${formatted}%` : `${formatted}%`;
}

function formatValueEur(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrencyEur(value: number) {
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
  return `€${formatted}`;
}

type BarDatum = { label: string; value: number; sharePct?: number };

function HorizontalBarChart({
  title,
  data,
  xLabel,
  pageSize = 8,
}: {
  title: string;
  data: readonly BarDatum[];
  xLabel: string;
  pageSize?: number;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageData = data.slice(startIdx, startIdx + pageSize);

  React.useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [page, safePage]);

  const w = 760;
  const h = 260;
  const margin = { top: 20, right: 140, bottom: 44, left: 100 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const max = Math.max(1, ...pageData.map((d) => d.value));
  const ticks = 6;
  const gridColor = alpha(m.navy, 0.1);
  const axisColor = alpha(m.navy, 0.3);

  const barGap = 16;
  const barH = pageData.length
    ? Math.max(
        22,
        Math.min(
          44,
          (innerH - barGap * (pageData.length - 1)) / pageData.length,
        ),
      )
    : 30;
  const usedH =
    pageData.length * barH + Math.max(0, pageData.length - 1) * barGap;
  const y0 = margin.top + (innerH - usedH) / 2;

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: "10px",
        border: `1.5px dashed ${alpha(m.teal, 0.55)}`,
        overflow: "hidden",
        boxShadow: "none",
        bgcolor: "#fff",
      }}
    >
      {title && (
        <Box sx={{ px: 2.25, pt: 2.1, pb: 1.1 }}>
          <BodyText
            sx={{
              fontSize: 14,
              fontWeight: 900,
              color: alpha(m.navy, 0.85),
              textAlign: "center",
            }}
          >
            {title}
          </BodyText>
        </Box>
      )}

      <Box sx={{ px: 2.25, pb: 1.5, pt: title ? 0 : 1.5 }}>
        <Box sx={{ width: "100%" }}>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            width="100%"
            height={h}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={title || xLabel}
          >
            {/* grid + x-axis ticks */}
            {Array.from({ length: ticks }).map((_, i) => {
              const t = (max / (ticks - 1)) * i;
              const x = margin.left + (innerW * i) / (ticks - 1);
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={margin.top + innerH}
                    stroke={gridColor}
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={margin.top + innerH + 18}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="inherit"
                    fill={alpha(m.navy, 0.55)}
                  >
                    {Math.round(t).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* y labels + bars + right value labels */}
            {pageData.map((d, idx) => {
              const y = y0 + idx * (barH + barGap);
              const barW = (d.value / max) * innerW;
              const valueLabel =
                d.sharePct !== undefined
                  ? `${d.value.toLocaleString()}€ (${d.sharePct}%)`
                  : `${d.value.toLocaleString()}€`;
              return (
                <g key={d.label}>
                  {/* left label */}
                  <text
                    x={margin.left - 12}
                    y={y + barH / 2 + 4}
                    textAnchor="end"
                    fontSize={12}
                    fontFamily="inherit"
                    fill={alpha(m.navy, 0.7)}
                  >
                    {d.label}
                  </text>
                  {/* bar */}
                  <rect
                    x={margin.left}
                    y={y}
                    width={Math.max(0, barW)}
                    height={barH}
                    fill={m.teal}
                    rx={4}
                  />
                  {/* right value label */}
                  <text
                    x={margin.left + barW + 10}
                    y={y + barH / 2 + 4}
                    textAnchor="start"
                    fontSize={11.5}
                    fontFamily="inherit"
                    fontWeight="700"
                    fill={alpha(m.navy, 0.68)}
                  >
                    {valueLabel}
                  </text>
                </g>
              );
            })}

            {/* x axis line */}
            <line
              x1={margin.left}
              y1={margin.top + innerH}
              x2={margin.left + innerW}
              y2={margin.top + innerH}
              stroke={axisColor}
              strokeWidth={1}
            />

            {/* x label */}
            <text
              x={margin.left + innerW / 2}
              y={h - 8}
              textAnchor="middle"
              fontSize={12}
              fontFamily="inherit"
              fill={alpha(m.navy, 0.65)}
            >
              {xLabel}
            </text>
          </svg>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pt: 1.3,
          }}
        >
          <BodyText
            sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.45) }}
          >
            {data.length === 0
              ? "0–0 of 0"
              : `${startIdx + 1}–${Math.min(startIdx + pageData.length, data.length)} of ${data.length}`}
          </BodyText>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ButtonBase
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{
                px: 0.9,
                py: 0.5,
                borderRadius: "6px",
                color: alpha(m.navy, 0.55),
              }}
              aria-label="Previous page"
            >
              ‹
            </ButtonBase>

            {Array.from({ length: Math.min(4, totalPages) }).map((_, i) => {
              const p = i + 1;
              const active = p === safePage;
              return (
                <ButtonBase
                  key={p}
                  onClick={() => setPage(p)}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "6px",
                    bgcolor: active ? m.teal : "transparent",
                    border: `1px solid ${active ? alpha(m.teal, 0.25) : alpha(m.navy, 0.12)}`,
                  }}
                >
                  <BodyText
                    component="span"
                    sx={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: active ? "#fff" : alpha(m.navy, 0.55),
                    }}
                  >
                    {p}
                  </BodyText>
                </ButtonBase>
              );
            })}

            <ButtonBase
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              sx={{
                px: 0.9,
                py: 0.5,
                borderRadius: "6px",
                color: alpha(m.navy, 0.55),
              }}
              aria-label="Next page"
            >
              ›
            </ButtonBase>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default function ProfessionalFixedLocationSalesVolumeAnalytics({
  data,
}: ProfessionalFixedLocationSalesVolumeAnalyticsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const section21 = data.salesByCategoriesAndServices;
  const section22 = data.productSales;
  const section23 = data.refundsAndAdjustments;
  const section25 = data.netSalesOverview;

  const headers23 = [
    "Adjustment Type",
    "Amount (€)",
    "Share of Gross Sales",
  ] as const;
  const headers25 = ["Metric", "Amount (€)"] as const;

  return (
    <Box sx={{ px: 2.25, pb: 2.5 }}>
      <Box sx={{ pt: 2.25, pb: 1.4 }}>
        <BodyText
          sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}
        >
          {section21.title}
        </BodyText>
      </Box>

      <SalesByCategoriesServicesTable rows={section21.rows} />

      <SalesVolumeStackedBarChart
        title={section21.chartTitle || undefined}
        maxEur={section21.chartMaxEur}
        bars={section21.categoryBars}
        legend={section21.legend}
      />

      {section21.explanationContent ? (
        <AnalyticsSectionExplanation
          label={section21.explanationLabel}
          content={section21.explanationContent}
        />
      ) : null}

      {/* 2.2 Product Sales */}
      <Box sx={{ pt: 2.7, pb: 1.4 }}>
        <BodyText
          sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}
        >
          {section22.title}
        </BodyText>
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
            <TableRow sx={{ bgcolor: alpha("#9BA3B5", 0.14) }}>
              {(["Products", "Count", "Sales (€)", "Share (%)"] as const).map(
                (h) => (
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
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {section22.rows.map((r, idx) => {
              const isTotal = Boolean(r.isTotal);
              return (
                <TableRow
                  key={`${r.product}-${idx}`}
                  sx={{
                    bgcolor: isTotal ? alpha(m.teal, 0.04) : "transparent",
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell
                    sx={{
                      borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                      py: 1,
                    }}
                  >
                    <BodyText
                      component="span"
                      sx={{
                        fontSize: 12,
                        fontWeight: isTotal ? 900 : 700,
                        color: alpha(m.navy, isTotal ? 0.82 : 0.68),
                      }}
                    >
                      {r.product}
                    </BodyText>
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                      py: 1,
                    }}
                  >
                    <BodyText
                      component="span"
                      sx={{
                        fontSize: 12,
                        fontWeight: isTotal ? 900 : 700,
                        color: alpha(m.navy, isTotal ? 0.82 : 0.68),
                      }}
                    >
                      {r.count}
                    </BodyText>
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                      py: 1,
                    }}
                  >
                    <BodyText
                      component="span"
                      sx={{
                        fontSize: 12,
                        fontWeight: isTotal ? 900 : 700,
                        color: alpha(m.navy, isTotal ? 0.82 : 0.68),
                      }}
                    >
                      {`€${r.salesEur.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </BodyText>
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                      py: 1,
                    }}
                  >
                    <BodyText
                      component="span"
                      sx={{
                        fontSize: 12,
                        fontWeight: isTotal ? 900 : 700,
                        color: alpha(m.navy, isTotal ? 0.82 : 0.68),
                      }}
                    >
                      {`${r.sharePct.toFixed(1)}%`}
                    </BodyText>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Product Sales bar chart */}
      <HorizontalBarChart
        title=""
        data={section22.rows
          .filter((r) => !r.isTotal)
          .map((r) => ({
            label: r.product,
            value: r.salesEur,
            sharePct: r.sharePct,
          }))}
        xLabel="Sales€"
      />

      {section22.explanationContent ? (
        <AnalyticsSectionExplanation
          label={section22.explanationLabel}
          content={section22.explanationContent}
        />
      ) : null}

      <Box sx={{ pt: 2.7, pb: 1.4 }}>
        <BodyText
          sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}
        >
          {section23.title}
        </BodyText>
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
              {headers23.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.15,
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
            {section23.rows.map((r) => (
              <TableRow
                key={r.adjustmentType}
                hover
                sx={{
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                }}
              >
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.65),
                    }}
                  >
                    {r.adjustmentType}
                  </BodyText>
                </TableCell>

                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color:
                        r.amountEur < 0
                          ? alpha(theme.palette.error.main, 0.9)
                          : alpha(m.navy, 0.65),
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatAmountEur(r.amountEur)}
                  </BodyText>
                </TableCell>

                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color:
                        r.shareOfGrossSalesPct < 0
                          ? alpha(theme.palette.error.main, 0.9)
                          : alpha(m.navy, 0.65),
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatPct(r.shareOfGrossSalesPct)}
                  </BodyText>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {section23.explanationContent ? (
        <AnalyticsSectionExplanation
          label={section23.explanationLabel}
          content={section23.explanationContent}
        />
      ) : null}

      <Box sx={{ pt: 2.7, pb: 1.4 }}>
        <BodyText
          sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}
        >
          {section25.title}
        </BodyText>
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
              {headers25.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.15,
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
            {section25.rows.map((r, idx) => {
              const isSubtotal = r.metric.toLowerCase().startsWith("subtotal");
              const isFinal = r.metric.toLowerCase().startsWith("final");
              const isNegative = r.amountEur < 0;
              const isHighlight = isSubtotal || isFinal;
              return (
                <TableRow
                  key={`${r.metric}-${idx}`}
                  hover
                  sx={{
                    bgcolor: isHighlight ? alpha(m.teal, 0.04) : "transparent",
                    "& td": {
                      borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                    },
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText
                      component="span"
                      sx={{
                        fontSize: 12.5,
                        fontWeight: isHighlight ? 900 : 700,
                        color: alpha(m.navy, isHighlight ? 0.82 : 0.65),
                      }}
                    >
                      {r.metric}
                    </BodyText>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <BodyText
                      component="span"
                      sx={{
                        fontSize: 12.5,
                        fontWeight: isHighlight ? 900 : 700,
                        color: isNegative
                          ? "#D32F2F"
                          : alpha(m.navy, isHighlight ? 0.82 : 0.65),
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatAmountEur(r.amountEur)}
                    </BodyText>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {section25.explanationContent ? (
        <AnalyticsSectionExplanation
          label={section25.explanationLabel}
          content={section25.explanationContent}
        />
      ) : null}
    </Box>
  );
}
