"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureSectionTitleSx,
  mollureTableHeaderSx,
} from "../../../theme/mollureHierarchy";
import { BodyText } from "../../ui/typography";

export type ScheduleStatusTab = "active" | "archived";

const DAY_ABBR: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export const formatDayRange = (from: string, to: string) =>
  `${DAY_ABBR[from] ?? from.slice(0, 3)} - ${DAY_ABBR[to] ?? to.slice(0, 3)}`;

export const formatScheduleTime = (time: string) => {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = minuteRaw ?? "00";
  if (Number.isNaN(hour)) return time;
  return `${hour}:${minute}`;
};

/** Panel uses en-dash; team-member schedule keeps hyphen. */
export const formatScheduleTimeRange = (
  start: string,
  end: string,
  separator: "en" | "hyphen" = "en",
) =>
  `${formatScheduleTime(start)}${separator === "en" ? " – " : " - "}${formatScheduleTime(end)}`;

export function scheduleBodyCellSx(navy: string) {
  return {
    fontSize: 13,
    fontWeight: 500,
    color: alpha(navy, 0.82),
    borderBottom: `1px solid ${alpha(navy, 0.06)}`,
    py: 1.15,
    textAlign: "center",
    verticalAlign: "middle",
    borderLeft: 0,
    borderRight: 0,
  } as const;
}

export function ScheduleStatusTabs({
  value,
  onChange,
  fullWidth = false,
}: {
  value: ScheduleStatusTab;
  onChange: (next: ScheduleStatusTab) => void;
  /** Team-member schedule stretches tabs; panel stays compact with border. */
  fullWidth?: boolean;
}) {
  const m = useTheme().palette.mollure;
  const tabs: { id: ScheduleStatusTab; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <Box
      sx={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        borderRadius: "8px",
        bgcolor: "#fff",
        border: fullWidth ? undefined : `1px solid ${alpha(m.navy, 0.08)}`,
        overflow: "hidden",
        p: 0.35,
        gap: 0.35,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Box
            key={tab.id}
            role="button"
            tabIndex={0}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onChange(tab.id);
            }}
            sx={{
              px: 2.5,
              py: 0.75,
              borderRadius: "6px",
              fontSize: 13,
              fontWeight: active ? 800 : 600,
              color: alpha(m.navy, active ? 0.82 : 0.55),
              bgcolor: active ? alpha(m.navy, 0.06) : "transparent",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}

export function ScheduleTableSection({
  title,
  columns,
  rows,
  emptyLabel,
  bordered = false,
}: {
  title: string;
  columns: readonly string[];
  rows: React.ReactNode;
  emptyLabel: string;
  /** Panel tables draw a light border; team-member tables stay borderless. */
  bordered?: boolean;
}) {
  const m = useTheme().palette.mollure;

  const headCellSx = {
    ...mollureTableHeaderSx(m.navy),
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: alpha(m.navy, 0.03),
    py: 1.1,
    textAlign: "center",
    whiteSpace: "nowrap",
    borderLeft: 0,
    borderRight: 0,
  } as const;

  const bodyCellSx = scheduleBodyCellSx(m.navy);
  const hasRows = React.Children.count(rows) > 0;

  return (
    <Box>
      <BodyText sx={mollureSectionTitleSx(m.navy, { mb: 0.85, color: alpha(m.navy, 0.58) })}>
        {title}
      </BodyText>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "none",
          border: bordered ? `1px solid ${alpha(m.navy, 0.06)}` : undefined,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={headCellSx}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {hasRows ? (
              rows
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  sx={{ ...bodyCellSx, color: alpha(m.navy, 0.45) }}
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
