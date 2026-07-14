"use client";

import * as React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ADMIN_CARD_PADDING as pad } from "./adminCardPadding";

export type AdminTableColumn<T> = {
  id: string;
  label: React.ReactNode;
  minWidth?: number;
  align?: "left" | "center" | "right";
  render: (row: T) => React.ReactNode;
};

type AdminDataTableProps<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage?: string;
  dense?: boolean;
  /** Highlights rows whose ids appear in this set (e.g. after export selection). */
  highlightedIds?: Set<string>;
};

export default function AdminDataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = "No records found.",
  dense = false,
  highlightedIds,
}: AdminDataTableProps<T>) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <TableContainer sx={{ borderRadius: 2, border: `1px solid ${tokens.cardBorder}` }}>
      <Table size={dense ? "small" : "medium"}>
        <TableHead>
          <TableRow sx={{ bgcolor: tokens.mintSoft }}>
            {columns.map((col) => (
              <TableCell
                key={col.id}
                align={col.align ?? "left"}
                sx={{
                  minWidth: col.minWidth,
                  fontWeight: 600,
                  fontSize: 12,
                  color: tokens.slate,
                  borderBottom: `1px solid ${tokens.cardBorder}`,
                  py: dense ? pad.tableCellY : 1.75,
                  px: pad.tableCellX,
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: 14, color: tokens.bodyText }}>{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowId = getRowId(row);
              const highlighted = highlightedIds?.has(rowId);
              return (
              <TableRow
                key={rowId}
                hover
                sx={{
                  "&:last-child td": { borderBottom: 0 },
                  bgcolor: highlighted ? alpha(tokens.teal, 0.08) : undefined,
                  "&:hover": { bgcolor: highlighted ? alpha(tokens.teal, 0.12) : tokens.surface },
                  transition: "background-color 200ms ease",
                }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align ?? "left"}
                    sx={{
                      fontSize: 13,
                      color: tokens.navy,
                      borderBottom: `1px solid ${tokens.cardBorder}`,
                      py: dense ? pad.tableCellY : 1.75,
                      px: pad.tableCellX,
                      verticalAlign: "top",
                    }}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function AdminSummaryGrid({
  items,
  embedded = false,
}: {
  items: {
    label: string;
    value: string | number;
    sub?: string;
    icon?: React.ElementType;
    iconBg?: string;
    iconColor?: string;
    labelColor?: string;
    cardBg?: string;
  }[];
  embedded?: boolean;
}) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: 2,
        mt: embedded ? 0 : 3,
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Box
            key={item.label}
            sx={{
              p: pad.bodyCompact,
              borderRadius: 2.5,
              border: `1px solid ${tokens.cardBorder}`,
              bgcolor: item.cardBg ?? tokens.white,
              boxShadow: "0 8px 24px rgba(16, 35, 63, 0.05)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  color: item.labelColor ?? tokens.slate,
                  fontWeight: 600,
                  mb: 0.75,
                  lineHeight: 1.35,
                }}
              >
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: tokens.navy, lineHeight: 1.1 }}>
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </Typography>
              {item.sub ? (
                <Typography sx={{ fontSize: 11, color: tokens.bodyText, mt: 0.75 }}>{item.sub}</Typography>
              ) : null}
            </Box>
            {Icon ? (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: item.iconBg ?? tokens.mintSoft,
                  color: item.iconColor ?? tokens.teal,
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Box>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
