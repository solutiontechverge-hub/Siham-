"use client";

import * as React from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import MollureModal from "../MollureModal";
import { BodyText } from "../../ui/typography";
import { BUSINESS_SERVICE_CATEGORY_CATALOG } from "../../../data/businessServiceCategorySlider.data";
import type { CalendarBookingStatus } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { BOOKING_STATUS_THEME } from "./bookingStatus";

export type CalendarDesignDraft = {
  scope: "Categories" | "Services" | "Status" | "Team Members";
  colorsByCategory: Record<string, string>;
  colorsByService?: Record<string, string>;
  colorsByStatus?: Partial<Record<CalendarBookingStatus, string>>;
  colorsByTeamMember?: Record<string, string>;
};

type CalendarDesignModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onColorSelect?: (key: string, color: string) => void;
  draft: CalendarDesignDraft;
  setDraft: React.Dispatch<React.SetStateAction<CalendarDesignDraft>>;
  serviceOptions?: readonly string[];
  teamMemberOptions?: readonly { id: string; name: string }[];
};

export function getCalendarDesignServiceLabel(key: string): string {
  const entry = BUSINESS_SERVICE_CATEGORY_CATALOG.find((item) => item.key === key);
  if (!entry) return key;
  if (entry.key === "hair") return "Haar";
  return entry.label;
}

type ColorRow = { key: string; label: string };

export default function CalendarDesignModal({
  open,
  onClose,
  onApply,
  onColorSelect,
  draft,
  setDraft,
  serviceOptions = [],
  teamMemberOptions = [],
}: CalendarDesignModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isServices = draft.scope === "Services";
  const isStatus = draft.scope === "Status";
  const isTeamMembers = draft.scope === "Team Members";

  const colorRows = React.useMemo<ColorRow[]>(() => {
    if (isTeamMembers) {
      return teamMemberOptions.map((member) => ({ key: member.id, label: member.name }));
    }
    if (isStatus) {
      return (Object.keys(BOOKING_STATUS_THEME) as CalendarBookingStatus[]).map((status) => ({
        key: status,
        label: status,
      }));
    }
    if (isServices) {
      return serviceOptions.map((label) => ({ key: label, label }));
    }
    return BUSINESS_SERVICE_CATEGORY_CATALOG.map((entry) => ({
      key: entry.key,
      label: getCalendarDesignServiceLabel(entry.key),
    }));
  }, [isServices, isStatus, isTeamMembers, serviceOptions, teamMemberOptions]);

  const setColor = React.useCallback(
    (key: string, hex: string) => {
      const safe = hex?.startsWith("#") ? hex : `#${hex}`;
      setDraft((p) => {
        if (isTeamMembers) {
          return { ...p, colorsByTeamMember: { ...(p.colorsByTeamMember ?? {}), [key]: safe } };
        }
        if (isStatus) {
          return {
            ...p,
            colorsByStatus: { ...(p.colorsByStatus ?? {}), [key as CalendarBookingStatus]: safe },
          };
        }
        if (isServices) {
          return { ...p, colorsByService: { ...(p.colorsByService ?? {}), [key]: safe } };
        }
        return { ...p, colorsByCategory: { ...p.colorsByCategory, [key]: safe } };
      });
    },
    [isServices, isStatus, isTeamMembers, setDraft],
  );

  const clearColor = React.useCallback(
    (key: string) => {
      setDraft((p) => {
        if (isTeamMembers) {
          const next = { ...(p.colorsByTeamMember ?? {}) };
          delete next[key];
          return { ...p, colorsByTeamMember: next };
        }
        if (isStatus) {
          const next = { ...(p.colorsByStatus ?? {}) };
          delete next[key as CalendarBookingStatus];
          return { ...p, colorsByStatus: next };
        }
        if (isServices) {
          const next = { ...(p.colorsByService ?? {}) };
          delete next[key];
          return { ...p, colorsByService: next };
        }
        const next = { ...p.colorsByCategory };
        delete next[key];
        return { ...p, colorsByCategory: next };
      });
    },
    [isServices, isStatus, isTeamMembers, setDraft],
  );

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <span>Background colour</span>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: `1px solid ${alpha(m.tealDark, 0.35)}`,
              color: m.teal,
              display: "grid",
              placeItems: "center",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            i
          </Box>
        </Stack>
      }
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 38,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                minWidth: 110,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={onApply}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 38,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
                minWidth: 110,
              }}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.5}>
          <AppDropdown
            label=""
            value={draft.scope}
            onChange={(val) => setDraft((p) => ({ ...p, scope: String(val) as CalendarDesignDraft["scope"] }))}
            options={[
              { label: "Categories", value: "Categories" },
              { label: "Services", value: "Services" },
              { label: "Status", value: "Status" },
              { label: "Team Members", value: "Team Members" },
            ]}
            placeholder="Categories"
            fullWidth
          />

          <Box
            sx={{
              borderRadius: "12px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              bgcolor: "#fff",
              overflow: "hidden",
            }}
          >
            {colorRows.map(({ key, label }) => {
              const color = isTeamMembers
                ? draft.colorsByTeamMember?.[key]
                : isStatus
                  ? draft.colorsByStatus?.[key as CalendarBookingStatus]
                  : isServices
                    ? draft.colorsByService?.[key]
                    : draft.colorsByCategory[key];
              return (
                <Box
                  key={key}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    gap: 1,
                    px: 1.75,
                    py: 1.1,
                    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                    "&:last-of-type": { borderBottom: "none" },
                  }}
                >
                  <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.7) }}>{label}</BodyText>

                  <Button
                    component="label"
                    variant="outlined"
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 800,
                      height: 30,
                      px: 1.25,
                      borderColor: alpha(m.navy, 0.12),
                      color: alpha(m.navy, 0.6),
                      bgcolor: "#fff",
                      "&:hover": { borderColor: alpha(m.navy, 0.18), bgcolor: alpha(m.navy, 0.02) },
                      minWidth: 110,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "4px",
                          bgcolor: color || "transparent",
                          border: `1px dashed ${alpha(m.navy, color ? 0.18 : 0.22)}`,
                          ...(color
                            ? { borderStyle: "solid", borderColor: alpha(m.navy, 0.18) }
                            : null),
                        }}
                      />
                      <span>{color ? color.toUpperCase() : "Choose color"}</span>
                    </Stack>
                    <input
                      type="color"
                      // Uncontrolled: no colour is selected until the professional picks one.
                      key={`${key}-${color || "unset"}`}
                      defaultValue={color || "#FFFFFF"}
                      onChange={(e) => {
                        setColor(key, e.target.value);
                      }}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    />
                  </Button>

                  <IconButton
                    size="small"
                    onClick={() => clearColor(key)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      bgcolor: "#fff",
                      color: alpha(m.navy, 0.55),
                      "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </Stack>
      </Box>
    </MollureModal>
  );
}
