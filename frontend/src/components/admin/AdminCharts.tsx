"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
} from "../../theme/mollureHierarchy";
import { ADMIN_CHART_COLORS, ADMIN_CHART_SERIES } from "./adminChartColors";
import AdminSectionCard from "./AdminSectionCard";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E6EEF4",
  fontSize: 12,
};

function useChartReady() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return ready;
}

function ChartPlaceholder({ height = 280 }: { height?: number }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: "100%",
        height,
        borderRadius: 2,
        bgcolor: theme.palette.mollure.surface,
      }}
    />
  );
}

type ChartCardProps = {
  title: string;
  description?: string;
  height?: number;
  children: React.ReactNode;
};

function ChartCard({
  title,
  description,
  height = 280,
  children,
}: ChartCardProps) {
  return (
    <AdminSectionCard title={title} description={description} compact>
      <Box sx={{ width: "100%", height, pt: 0.5 }}>{children}</Box>
    </AdminSectionCard>
  );
}

type AreaSeries = { dataKey: string; name: string; color?: string };

export function AdminAreaChart({
  title,
  description,
  data,
  xKey,
  series,
  height,
}: {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: AreaSeries[];
  height?: number;
}) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const ready = useChartReady();
  const chartHeight = height ?? 280;

  return (
    <ChartCard title={title} description={description} height={chartHeight}>
      {!ready ? (
        <ChartPlaceholder height={chartHeight} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              {series.map((s, i) => {
                const color =
                  s.color ?? ADMIN_CHART_SERIES[i % ADMIN_CHART_SERIES.length];
                return (
                  <linearGradient
                    key={s.dataKey}
                    id={`grad-${s.dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={tokens.cardBorder}
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: tokens.slate }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tokens.slate }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => {
              const color =
                s.color ?? ADMIN_CHART_SERIES[i % ADMIN_CHART_SERIES.length];
              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={color}
                  fill={`url(#grad-${s.dataKey})`}
                  strokeWidth={2}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function AdminLineChart({
  title,
  description,
  data,
  xKey,
  lines,
  height,
}: {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  xKey: string;
  lines: { dataKey: string; name: string; color?: string; dashed?: boolean }[];
  height?: number;
}) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const ready = useChartReady();
  const chartHeight = height ?? 300;

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return String(value);
  };

  return (
    <ChartCard title={title} description={description} height={chartHeight}>
      {!ready ? (
        <ChartPlaceholder height={chartHeight} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={tokens.cardBorder}
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: tokens.slate }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tokens.slate }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {lines.map((line, i) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={
                  line.color ??
                  ADMIN_CHART_SERIES[i % ADMIN_CHART_SERIES.length]
                }
                strokeWidth={2.5}
                strokeDasharray={line.dashed ? "6 4" : undefined}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function AdminBarChart({
  title,
  description,
  data,
  xKey,
  bars,
  height,
  stacked,
}: {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  xKey: string;
  bars: { dataKey: string; name: string; color?: string }[];
  height?: number;
  stacked?: boolean;
}) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const ready = useChartReady();
  const chartHeight = height ?? 280;

  return (
    <ChartCard title={title} description={description} height={chartHeight}>
      {!ready ? (
        <ChartPlaceholder height={chartHeight} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={tokens.cardBorder}
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: tokens.slate }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tokens.slate }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {bars.map((b, i) => (
              <Bar
                key={b.dataKey}
                dataKey={b.dataKey}
                name={b.name}
                fill={
                  b.color ?? ADMIN_CHART_SERIES[i % ADMIN_CHART_SERIES.length]
                }
                radius={
                  stacked
                    ? i === bars.length - 1
                      ? [6, 6, 0, 0]
                      : [0, 0, 0, 0]
                    : [6, 6, 0, 0]
                }
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function AdminDonutChart({
  title,
  description,
  data,
  height,
}: {
  title: string;
  description?: string;
  data: { name: string; value: number }[];
  height?: number;
}) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const ready = useChartReady();
  const chartHeight = height ?? 280;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title={title} description={description} height={chartHeight}>
      {!ready ? (
        <ChartPlaceholder height={chartHeight} />
      ) : (
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="78%"
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={ADMIN_CHART_SERIES[i % ADMIN_CHART_SERIES.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: "absolute",
              top: "42%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{ fontSize: 22, fontWeight: 700, color: tokens.navy }}
            >
              {total.toLocaleString()}
            </Typography>
            <Typography sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, color: tokens.slate })}>
              Total
            </Typography>
          </Box>
        </Box>
      )}
    </ChartCard>
  );
}

export { ADMIN_CHART_COLORS };
