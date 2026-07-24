"use client";

import * as React from "react";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Box,
  ButtonBase,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Paper,
  Popover,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton, AppCalendarPanel } from "../common";
import type { AdminTimeRange } from "./AdminTimeRangeFilter";
import {
  RANGE_OPTIONS,
  getRangeLabel,
  isDateInRange,
  type AdminDashboardRangeValue,
} from "./dashboardRangeUtils";

type AdminDateRangeSelectorProps = {
  value: AdminDashboardRangeValue;
  onChange: (value: AdminDashboardRangeValue) => void;
};

export default function AdminDateRangeSelector({
  value,
  onChange,
}: AdminDateRangeSelectorProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [draftStart, setDraftStart] = React.useState(value.customStart);
  const [draftEnd, setDraftEnd] = React.useState(value.customEnd);
  const [pickingEnd, setPickingEnd] = React.useState(false);

  React.useEffect(() => {
    setDraftStart(value.customStart);
    setDraftEnd(value.customEnd);
  }, [value.customStart, value.customEnd]);

  const handlePresetSelect = (preset: AdminTimeRange) => {
    if (preset === "custom") {
      setMenuOpen(false);
      setCalendarOpen(true);
      setPickingEnd(false);
      onChange({ ...value, preset: "custom" });
      return;
    }
    onChange({ ...value, preset });
    setMenuOpen(false);
    setCalendarOpen(false);
  };

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

  const handleApplyCustom = () => {
    if (!draftStart) return;
    const end = draftEnd || draftStart;
    const [start, finish] =
      draftStart <= end ? [draftStart, end] : [end, draftStart];
    onChange({ preset: "custom", customStart: start, customEnd: finish });
    setCalendarOpen(false);
  };

  const rangeStart = draftStart;
  const rangeEnd = draftEnd || draftStart;

  return (
    <>
      <ButtonBase
        ref={anchorRef}
        onClick={() => setMenuOpen((o) => !o)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          borderRadius: 999,
          border: `1.5px solid ${menuOpen || calendarOpen ? tokens.teal : tokens.cardBorder}`,
          bgcolor: tokens.white,
          minWidth: { xs: "100%", sm: 200 },
          justifyContent: "space-between",
          transition: "border-color 160ms ease",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <CalendarTodayOutlinedIcon
            sx={{ fontSize: 18, color: tokens.teal, flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: tokens.navy,
              whiteSpace: "nowrap",
            }}
          >
            {getRangeLabel(value)}
          </Typography>
        </Stack>
        {menuOpen ? (
          <KeyboardArrowUpIcon sx={{ fontSize: 18, color: tokens.slate }} />
        ) : (
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: tokens.slate }} />
        )}
      </ButtonBase>

      <Popper
        open={menuOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
          <Paper
            elevation={4}
            sx={{
              mt: 0.75,
              borderRadius: 2,
              border: `1px solid ${tokens.cardBorder}`,
              overflow: "hidden",
              minWidth: anchorRef.current?.offsetWidth ?? 200,
            }}
          >
            <MenuList dense sx={{ py: 0.5 }}>
              {RANGE_OPTIONS.map((opt) => {
                const active = value.preset === opt.value;
                return (
                  <MenuItem
                    key={opt.value}
                    selected={active}
                    onClick={() => handlePresetSelect(opt.value)}
                    sx={{
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      color: tokens.navy,
                      py: 1.1,
                      "&.Mui-selected": {
                        bgcolor: tokens.mintSoft,
                        "&:hover": { bgcolor: alpha(tokens.teal, 0.14) },
                      },
                      "&:hover": { bgcolor: tokens.surface },
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>

      <Popover
        open={calendarOpen}
        anchorEl={anchorRef.current}
        onClose={() => setCalendarOpen(false)}
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
            sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy, mb: 0.5 }}
          >
            Custom date range
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.bodyText, mb: 1.5 }}>
            {pickingEnd ? "Select end date" : "Select start date"}
            {draftStart && draftEnd
              ? ` · ${getRangeLabel({ preset: "custom", customStart: draftStart, customEnd: draftEnd })}`
              : ""}
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
              onClick={() => {
                setCalendarOpen(false);
                setDraftStart(value.customStart);
                setDraftEnd(value.customEnd);
              }}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="contained"
              size="small"
              onClick={handleApplyCustom}
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
