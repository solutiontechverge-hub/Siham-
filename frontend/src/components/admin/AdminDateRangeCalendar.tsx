"use client";

import * as React from "react";
import { Box, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton, AppCalendarPanel } from "../common";
import { isDateInRange } from "./dashboardRangeUtils";
import {
  mollureLabelSx,
  mollureBodyMutedSx,
} from "../../theme/mollureHierarchy";

/** Shared draft + day-pick state for admin date-range calendars. */
export function useAdminDateRangeDraft(start: string, end: string) {
  const [draftStart, setDraftStart] = React.useState(start);
  const [draftEnd, setDraftEnd] = React.useState(end);
  const [pickingEnd, setPickingEnd] = React.useState(false);

  React.useEffect(() => {
    setDraftStart(start);
    setDraftEnd(end);
  }, [start, end]);

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

  /** Ordered [start, end], or null if no start yet. */
  const normalizeRange = (): [string, string] | null => {
    if (!draftStart) return null;
    const finish = draftEnd || draftStart;
    return draftStart <= finish
      ? [draftStart, finish]
      : [finish, draftStart];
  };

  return {
    draftStart,
    draftEnd,
    pickingEnd,
    setDraftStart,
    setDraftEnd,
    setPickingEnd,
    handleDayPick,
    normalizeRange,
  };
}

type AdminDateRangeCalendarProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  draftStart: string;
  draftEnd: string;
  pickingEnd: boolean;
  onDayPick: (iso: string) => void;
  title: string;
  /** Appended after the select start/end hint when both drafts are set. */
  hintSuffix?: string;
  secondaryAction: { label: string; onClick: () => void };
  onApply: () => void;
};

/** Shared calendar popover used by AdminDateRangeSelector and AdminFilterDateRange. */
export function AdminDateRangeCalendar({
  open,
  anchorEl,
  onClose,
  draftStart,
  draftEnd,
  pickingEnd,
  onDayPick,
  title,
  hintSuffix,
  secondaryAction,
  onApply,
}: AdminDateRangeCalendarProps) {
  const tokens = useTheme().palette.mollure;
  const rangeStart = draftStart;
  const rangeEnd = draftEnd || draftStart;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
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
        <Typography
          sx={mollureLabelSx(tokens.navy, {
            fontWeight: 600,
            color: tokens.navy,
            mb: 0.5,
          })}
        >
          {title}
        </Typography>
        <Typography
          sx={mollureBodyMutedSx(tokens.navy, {
            color: tokens.bodyText,
            mb: 1.5,
          })}
        >
          {pickingEnd ? "Select end date" : "Select start date"}
          {hintSuffix ?? ""}
        </Typography>

        <AppCalendarPanel
          value={pickingEnd && draftEnd ? draftEnd : draftStart}
          onChange={onDayPick}
          compact
          daySx={(iso) => {
            if (!rangeStart) return undefined;
            const end = rangeEnd || rangeStart;
            const inRange = isDateInRange(iso, rangeStart, end);
            const isEdge = iso === rangeStart || iso === draftEnd;
            if (isEdge) {
              return {
                bgcolor: tokens.teal,
                color: tokens.white,
                fontWeight: 700,
              };
            }
            if (inRange) {
              return {
                bgcolor: alpha(tokens.teal, 0.14),
                color: tokens.tealDark,
                fontWeight: 600,
              };
            }
            return undefined;
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-end"
          sx={{ mt: 2 }}
        >
          <AppButton
            variant="outlined"
            size="small"
            onClick={secondaryAction.onClick}
            sx={{ textTransform: "none" }}
          >
            {secondaryAction.label}
          </AppButton>
          <AppButton
            variant="contained"
            size="small"
            onClick={onApply}
            disabled={!draftStart}
            sx={{ textTransform: "none" }}
          >
            Apply
          </AppButton>
        </Stack>
      </Box>
    </Popover>
  );
}
