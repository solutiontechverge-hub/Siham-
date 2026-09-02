"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppModal from "../AppModal";
import { BodyText } from "../../ui/typography";
import type { CalendarBookingStatus } from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type CalendarDesignDraft = {
  scope: "Categories" | "Services";
  colorsByCategory: Record<string, string>;
  colorsByService?: Record<string, string>;
  /** @deprecated Legacy persisted data — not user-configurable. */
  colorsByStatus?: Partial<Record<CalendarBookingStatus, string>>;
  /** @deprecated Legacy persisted data — not user-configurable. */
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
  categoryOptions?: readonly { key: string; label: string }[];
};

export function getCalendarDesignCategoryLabel(
  key: string,
  categoryOptions: readonly { key: string; label: string }[] = [],
): string {
  const entry = categoryOptions.find((item) => item.key === key);
  return entry?.label ?? key;
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
  categoryOptions = [],
}: CalendarDesignModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isServices = draft.scope === "Services";

  const colorRows = React.useMemo<ColorRow[]>(() => {
    if (isServices) {
      return serviceOptions.map((label) => ({ key: label, label }));
    }
    return categoryOptions.map((entry) => ({
      key: entry.key,
      label: getCalendarDesignCategoryLabel(entry.key, categoryOptions),
    }));
  }, [isServices, serviceOptions, categoryOptions]);

  const setColor = React.useCallback(
    (key: string, hex: string) => {
      const safe = hex?.startsWith("#") ? hex : `#${hex}`;
      setDraft((p) => {
        if (isServices) {
          return {
            ...p,
            colorsByService: { ...(p.colorsByService ?? {}), [key]: safe },
          };
        }
        return {
          ...p,
          colorsByCategory: { ...p.colorsByCategory, [key]: safe },
        };
      });
    },
    [isServices, setDraft],
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Background colour"
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <AppButton
              tone="secondary"
              onClick={onClose}
              sx={{
                height: 38,
                minWidth: 110,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={onApply}
              sx={{
                height: 38,
                minWidth: 110,
              }}
            >
              Apply
            </AppButton>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.5}>
          <AppDropdown
            label="Design by"
            value={draft.scope}
            onChange={(val) =>
              setDraft((p) => ({
                ...p,
                scope: String(val) as CalendarDesignDraft["scope"],
              }))
            }
            options={[
              { label: "Categories", value: "Categories" },
              { label: "Services", value: "Services" },
            ]}
            placeholder="Select scope"
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
              const color = isServices
                ? draft.colorsByService?.[key]
                : draft.colorsByCategory[key];
              return (
                <Box
                  key={key}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: 1,
                    px: 1.75,
                    py: 1.1,
                    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                    "&:last-of-type": { borderBottom: "none" },
                  }}
                >
                  <BodyText
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.7),
                    }}
                  >
                    {label}
                  </BodyText>

                  <AppButton
                    tone="secondary"
                    component="label"
                    sx={{
                      height: 30,
                      px: 1.25,
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
                            ? {
                                borderStyle: "solid",
                                borderColor: alpha(m.navy, 0.18),
                              }
                            : null),
                        }}
                      />
                      <span>
                        {color ? color.toUpperCase() : "Choose color"}
                      </span>
                    </Stack>
                    <input
                      type="color"
                      // Uncontrolled: no colour is selected until the professional picks one.
                      key={`${key}-${color || "unset"}`}
                      defaultValue={color || "#FFFFFF"}
                      onChange={(e) => {
                        setColor(key, e.target.value);
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                  </AppButton>
                </Box>
              );
            })}
          </Box>
        </Stack>
      </Box>
    </AppModal>
  );
}
