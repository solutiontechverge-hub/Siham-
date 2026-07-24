"use client";

import * as React from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Box, Checkbox, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import {
  bookingServiceCatalog,
  formatBookingServiceMeta,
  type BookingCatalogService,
  type BookingServiceCategory,
} from "../../../data/bookingServiceCatalog.data";
import {
  formatBookingServiceLineMeta,
  type BookingServiceLineItem,
} from "../../../data/bookingServiceEdit.data";

type BookingSelectServicesScreenProps = {
  selectedIds: readonly string[];
  catalog?: readonly BookingServiceCategory[];
  serviceOverrides?: Readonly<Record<string, Partial<BookingServiceLineItem>>>;
  onToggle: (service: BookingCatalogService) => void;
  onEdit?: (service: BookingCatalogService) => void;
  disabled?: boolean;
};

export default function BookingSelectServicesScreen({
  selectedIds,
  catalog = bookingServiceCatalog,
  serviceOverrides = {},
  onToggle,
  onEdit,
  disabled = false,
}: BookingSelectServicesScreenProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const groups = catalog.length > 0 ? catalog : bookingServiceCatalog;

  const getServiceMeta = React.useCallback(
    (service: BookingCatalogService) => {
      const override = serviceOverrides[service.id];
      if (!override) return formatBookingServiceMeta(service);
      return formatBookingServiceLineMeta({
        id: service.id,
        name: override.name ?? service.name,
        price: override.price ?? service.price,
        durationMins: override.durationMins ?? service.durationMins,
        startTime: override.startTime,
        endTime: override.endTime,
        priceType: override.priceType,
        discount: override.discount ?? null,
        staffResourceId: override.staffResourceId,
      });
    },
    [serviceOverrides],
  );

  const getServiceName = React.useCallback(
    (service: BookingCatalogService) =>
      serviceOverrides[service.id]?.name ?? service.name,
    [serviceOverrides],
  );

  return (
    <Stack spacing={1.5}>
      <BodyText
        sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}
      >
        Select Services
      </BodyText>

      <Stack spacing={1.25}>
        {groups.map((group) => (
          <Box key={group.category}>
            <Box
              sx={{
                px: 1.25,
                py: 0.85,
                bgcolor: alpha(m.navy, 0.04),
                borderRadius: "8px",
                mb: 0.75,
              }}
            >
              <BodyText
                sx={{
                  fontSize: 12.5,
                  fontWeight: 900,
                  color: alpha(m.navy, 0.72),
                }}
              >
                {group.category}
              </BodyText>
            </Box>

            <Stack spacing={0.75}>
              {group.services.map((service) => {
                const checked = selectedSet.has(service.id);
                return (
                  <Box
                    key={service.id}
                    component="button"
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(service)}
                    sx={{
                      width: "100%",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      borderRadius: "10px",
                      px: 1.25,
                      py: 1.1,
                      bgcolor: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      textAlign: "left",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.55 : 1,
                      transition: "border-color 0.15s, background-color 0.15s",
                      "&:hover": {
                        borderColor: disabled
                          ? alpha(m.navy, 0.1)
                          : alpha(m.teal, 0.35),
                        bgcolor: disabled ? "#fff" : alpha(m.teal, 0.03),
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <BodyText
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.82),
                          lineHeight: 1.25,
                        }}
                      >
                        {getServiceName(service)}
                      </BodyText>
                      <BodyText
                        sx={{
                          mt: 0.35,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.48),
                          lineHeight: 1.2,
                        }}
                      >
                        {getServiceMeta(service)}
                      </BodyText>
                    </Box>
                    {onEdit ? (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (disabled) return;
                          onEdit(service);
                        }}
                        disabled={disabled}
                        aria-label={`Edit ${service.name}`}
                        sx={{
                          color: alpha(m.navy, 0.42),
                          "&:hover": {
                            color: m.teal,
                            bgcolor: alpha(m.teal, 0.08),
                          },
                        }}
                      >
                        <EditRoundedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    ) : null}
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        p: 0.25,
                        color: alpha(m.navy, 0.28),
                        "&.Mui-checked": { color: m.teal },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
