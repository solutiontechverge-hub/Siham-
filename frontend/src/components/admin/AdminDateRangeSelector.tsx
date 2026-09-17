"use client";

import * as React from "react";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  ButtonBase,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { AdminTimeRange } from "./AdminTimeRangeFilter";
import {
  AdminDateRangeCalendar,
  useAdminDateRangeDraft,
} from "./AdminDateRangeCalendar";
import {
  RANGE_OPTIONS,
  getRangeLabel,
  type AdminDashboardRangeValue,
} from "./dashboardRangeUtils";
import { mollureLabelSx } from "../../theme/mollureHierarchy";

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
  const {
    draftStart,
    draftEnd,
    pickingEnd,
    setDraftStart,
    setDraftEnd,
    setPickingEnd,
    handleDayPick,
    normalizeRange,
  } = useAdminDateRangeDraft(value.customStart, value.customEnd);

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

  const handleApplyCustom = () => {
    const range = normalizeRange();
    if (!range) return;
    const [start, finish] = range;
    onChange({ preset: "custom", customStart: start, customEnd: finish });
    setCalendarOpen(false);
  };

  const hintSuffix =
    draftStart && draftEnd
      ? ` · ${getRangeLabel({ preset: "custom", customStart: draftStart, customEnd: draftEnd })}`
      : "";

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
            sx={mollureLabelSx(tokens.navy, {
              fontWeight: 600,
              color: tokens.navy,
              whiteSpace: "nowrap",
            })}
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

      <AdminDateRangeCalendar
        open={calendarOpen}
        anchorEl={anchorRef.current}
        onClose={() => setCalendarOpen(false)}
        draftStart={draftStart}
        draftEnd={draftEnd}
        pickingEnd={pickingEnd}
        onDayPick={handleDayPick}
        title="Custom date range"
        hintSuffix={hintSuffix}
        secondaryAction={{
          label: "Cancel",
          onClick: () => {
            setCalendarOpen(false);
            setDraftStart(value.customStart);
            setDraftEnd(value.customEnd);
          },
        }}
        onApply={handleApplyCustom}
      />
    </>
  );
}
