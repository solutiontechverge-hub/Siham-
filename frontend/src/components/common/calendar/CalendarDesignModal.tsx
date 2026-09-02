"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppModal from "../AppModal";
import { BodyText } from "../../ui/typography";
import type { CalendarBookingStatus } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { TemplateCategoryRow } from "../../../lib/businessTemplateCatalog";
import {
  isConfiguredColor,
  UNCONFIGURED_GRAY,
} from "../../../lib/calendarDesign.utils";

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
  templateCategoryRows?: readonly TemplateCategoryRow[];
};

export function getCalendarDesignCategoryLabel(
  key: string,
  categoryOptions: readonly { key: string; label: string }[] = [],
): string {
  const entry = categoryOptions.find((item) => item.key === key);
  return entry?.label ?? key;
}

type ColorRow =
  | { kind: "group"; key: string; label: string }
  | { kind: "color"; key: string; label: string };

export default function CalendarDesignModal({
  open,
  onClose,
  onApply,
  onColorSelect,
  draft,
  setDraft,
  serviceOptions = [],
  categoryOptions = [],
  templateCategoryRows = [],
}: CalendarDesignModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isServices = draft.scope === "Services";

  const colorRows = React.useMemo<ColorRow[]>(() => {
    if (isServices) {
      if (templateCategoryRows.length) {
        const rows: ColorRow[] = [];
        for (const category of templateCategoryRows) {
          rows.push({
            kind: "group",
            key: `group:${category.key}`,
            label: category.label,
          });
          for (const serviceName of category.services) {
            rows.push({
              kind: "color",
              key: serviceName,
              label: serviceName,
            });
          }
        }
        return rows;
      }
      return serviceOptions.map((label) => ({
        kind: "color" as const,
        key: label,
        label,
      }));
    }
    const source = templateCategoryRows.length
      ? templateCategoryRows.map((row) => ({ key: row.key, label: row.label }))
      : categoryOptions;
    return source.map((entry) => ({
      kind: "color" as const,
      key: entry.key,
      label: getCalendarDesignCategoryLabel(entry.key, categoryOptions),
    }));
  }, [isServices, serviceOptions, categoryOptions, templateCategoryRows]);

  const setColor = React.useCallback(
    (key: string, hex: string) => {
      const safe = hex?.startsWith("#") ? hex : `#${hex}`;
      onColorSelect?.(key, safe);
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
    [isServices, onColorSelect, setDraft],
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
              { label: "Category-based", value: "Categories" },
              { label: "Service-based", value: "Services" },
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
            {colorRows.map((row) => {
              if (row.kind === "group") {
                return (
                  <Box
                    key={row.key}
                    sx={{
                      px: 1.75,
                      py: 0.85,
                      bgcolor: alpha(m.navy, 0.03),
                      borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                    }}
                  >
                    <BodyText
                      sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                        color: alpha(m.navy, 0.45),
                      }}
                    >
                      {row.label}
                    </BodyText>
                  </Box>
                );
              }

              const rawColor = isServices
                ? draft.colorsByService?.[row.key]
                : draft.colorsByCategory[row.key];
              const configured = isConfiguredColor(rawColor);
              const color = configured ? rawColor : undefined;
              const swatch = color || UNCONFIGURED_GRAY;

              return (
                <Box
                  key={row.key}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: 1,
                    px: 1.75,
                    py: 1.1,
                    pl: isServices ? 2.5 : 1.75,
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
                    {row.label}
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
                          bgcolor: swatch,
                          border: `1px solid ${alpha(m.navy, 0.18)}`,
                          opacity: configured ? 1 : 0.7,
                        }}
                      />
                      <span>
                        {configured
                          ? (color as string).toUpperCase()
                          : "Choose color"}
                      </span>
                    </Stack>
                    <input
                      type="color"
                      // Uncontrolled: no colour is selected until the professional picks one.
                      key={`${row.key}-${color || "unset"}`}
                      defaultValue={color || UNCONFIGURED_GRAY}
                      onChange={(e) => {
                        setColor(row.key, e.target.value);
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
