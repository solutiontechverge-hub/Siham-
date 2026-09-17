"use client";

import * as React from "react";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { ButtonBase, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AdminDateRangeCalendar,
  useAdminDateRangeDraft,
} from "./AdminDateRangeCalendar";
import { mollureBodySx } from "../../theme/mollureHierarchy";

type AdminFilterDateRangeProps = {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  placeholder?: string;
  minWidth?: number | string | Record<string, number | string>;
  /** Removes outer border for use inside segmented filter bars. */
  embedded?: boolean;
  height?: number;
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
  height = 40,
}: AdminFilterDateRangeProps) {
  const tokens = useTheme().palette.mollure;
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const {
    draftStart,
    draftEnd,
    pickingEnd,
    setDraftStart,
    setDraftEnd,
    setPickingEnd,
    handleDayPick,
    normalizeRange,
  } = useAdminDateRangeDraft(start, end);

  const handleApply = () => {
    const range = normalizeRange();
    if (!range) return;
    const [from, to] = range;
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
            : `1px solid ${open ? tokens.teal : (tokens.inputBorder ?? tokens.cardBorder)}`,
          bgcolor: embedded ? "transparent" : tokens.white,
          minWidth: embedded ? 0 : minWidth,
          width: embedded || minWidth === 0 || minWidth === "100%" ? "100%" : undefined,
          maxWidth: "100%",
          height,
          justifyContent: "flex-start",
          boxSizing: "border-box",
          transition: "border-color 160ms ease",
          "&:hover": embedded
            ? { bgcolor: alpha(tokens.teal, 0.04) }
            : { borderColor: tokens.teal },
        }}
      >
        <CalendarTodayOutlinedIcon
          sx={{ fontSize: 18, color: tokens.teal, flexShrink: 0 }}
        />
        <Typography
          sx={mollureBodySx(tokens.navy, {
            fontWeight: 500,
            color:
              start || end ? tokens.navy : (tokens.placeholder ?? tokens.slate),
            textAlign: "left",
            flex: 1,
            whiteSpace: "nowrap",
          })}
        >
          {formatRangeLabel(start, end, placeholder)}
        </Typography>
      </ButtonBase>

      <AdminDateRangeCalendar
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        draftStart={draftStart}
        draftEnd={draftEnd}
        pickingEnd={pickingEnd}
        onDayPick={handleDayPick}
        title="Select date range"
        secondaryAction={{ label: "Clear", onClick: handleClear }}
        onApply={handleApply}
      />
    </>
  );
}
