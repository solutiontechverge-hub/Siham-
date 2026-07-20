"use client";

import * as React from "react";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { Box, ButtonBase, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton, AppCalendarPanel } from "../common";
import { isDateInRange } from "./dashboardRangeUtils";

type AdminFilterDateRangeProps = {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  placeholder?: string;
  minWidth?: number | string | Record<string, number | string>;
  /** Removes outer border for use inside segmented filter bars. */
  embedded?: boolean;
};

function formatDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatRangeLabel(start: string, end: string, placeholder: string) {
  if (!start && !end) return placeholder;
  if (start && end) return `${formatDisplay(start)} – ${formatDisplay(end)}`;
  if (start) return `${formatDisplay(start)} – ...`;
  return placeholder;
}

export default function AdminFilterDateRange({
  start,
  end,
  onChange,
  placeholder = "Select date range",
  minWidth = 240,
  embedded = false,
}: AdminFilterDateRangeProps) {
  const tokens = useTheme().palette.mollure;
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [draftStart, setDraftStart] = React.useState(start);
  const [draftEnd, setDraftEnd] = React.useState(end);
  const [pickingEnd, setPickingEnd] = React.useState(false);

  React.useEffect(() => {
    setDraftStart(start);
    setDraftEnd(end);
  }, [start, end]);

  const rangeStart = draftStart;
  const rangeEnd = draftEnd || draftStart;

  const handleDayPick = (iso: string) => {
    if (!pickingEnd || !draftStart) {
      setDraftStart(iso);
      setDraftEnd("");
      setPickingEnd(true);
      return;
    }
    if (iso < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(iso);
    } else {
      setDraftEnd(iso);
    }
    setPickingEnd(false);
  };

  const handleApply = () => {
    if (!draftStart) return;
    const finish = draftEnd || draftStart;
    const [from, to] = draftStart <= finish ? [draftStart, finish] : [finish, draftStart];
    onChange(from, to);
    setOpen(false);
  };

  const handleClear = () => {
    setDraftStart("");
    setDraftEnd("");
    setPickingEnd(false);
    onChange("", "");
    setOpen(false);
  };

  return (
    <>
      <ButtonBase
        ref={anchorRef}
        onClick={() => setOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.85,
          borderRadius: embedded ? 0 : 2,
          border: embedded
            ? "none"
            : `1px solid ${open ? tokens.teal : tokens.inputBorder ?? tokens.cardBorder}`,
          bgcolor: embedded ? "transparent" : tokens.white,
          minWidth: embedded ? 0 : minWidth,
          width: embedded ? "100%" : undefined,
          height: 40,
          justifyContent: "flex-start",
          transition: "border-color 160ms ease",
          "&:hover": embedded ? { bgcolor: alpha(tokens.teal, 0.04) } : { borderColor: tokens.teal },
        }}
      >
        <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: tokens.teal, flexShrink: 0 }} />
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 500,
            color: start || end ? tokens.navy : tokens.placeholder ?? tokens.slate,
            textAlign: "left",
            flex: 1,
            whiteSpace: "nowrap",
          }}
        >
          {formatRangeLabel(start, end, placeholder)}
        </Typography>
      </ButtonBase>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              borderRadius: 3,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "0 12px 40px rgba(16, 35, 63, 0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box sx={{ p: 2, width: { xs: 310, sm: 340 } }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy, mb: 0.5 }}>
            Select date range
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.bodyText, mb: 1.5 }}>
            {pickingEnd ? "Select end date" : "Select start date"}
          </Typography>

          <AppCalendarPanel
            value={pickingEnd && draftEnd ? draftEnd : draftStart}
            onChange={handleDayPick}
            compact
            daySx={(iso) => {
              if (!rangeStart) return undefined;
              const end = rangeEnd || rangeStart;
              const inRange = isDateInRange(iso, rangeStart, end);
              const isEdge = iso === rangeStart || iso === draftEnd;
              if (isEdge) {
                return { bgcolor: tokens.teal, color: tokens.white, fontWeight: 700 };
              }
              if (inRange) {
                return { bgcolor: alpha(tokens.teal, 0.14), color: tokens.tealDark, fontWeight: 600 };
              }
              return undefined;
            }}
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
            <AppButton variant="outlined" size="small" onClick={handleClear} sx={{ textTransform: "none" }}>
              Clear
            </AppButton>
            <AppButton
              variant="contained"
              size="small"
              onClick={handleApply}
              disabled={!draftStart}
              sx={{ textTransform: "none" }}
            >
              Apply
            </AppButton>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
