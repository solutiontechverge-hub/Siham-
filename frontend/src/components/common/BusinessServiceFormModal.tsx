"use client";

import * as React from "react";
import { Box, Button, InputAdornment, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDatePicker from "./AppDatePicker";
import MollureFormField from "./MollureFormField";
import MollureDrawer from "./MollureDrawer";
import {
  businessServiceModalCopy,
  businessServiceModalDiscountTypes,
  businessServiceModalPriceTypes,
  normalizeBusinessServiceDiscountType,
  sanitizeDurationHours,
  sanitizeDurationMinutes,
  type BusinessServiceFormDraft,
  type BusinessServiceModalMode,
} from "../../data/businessServiceModal.data";

type BusinessServiceFormModalProps = {
  open: boolean;
  mode: BusinessServiceModalMode;
  title: string;
  draft: BusinessServiceFormDraft;
  submitLabel: string;
  disabled?: boolean;
  canSubmit?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<BusinessServiceFormDraft>) => void;
};

export default function BusinessServiceFormModal({
  open,
  mode,
  title,
  draft,
  submitLabel,
  disabled = false,
  canSubmit = true,
  onClose,
  onSubmit,
  onChange,
}: BusinessServiceFormModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const infoLabel =
    mode === "subservice"
      ? businessServiceModalCopy.subserviceInfoLabel
      : businessServiceModalCopy.serviceInfoLabel;

  const fieldInputSx = { "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } } as const;

  const twoColumnRowSx = {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    gap: 1.5,
    width: "100%",
    alignItems: "stretch",
  } as const;

  const twoColumnCellSx = { flex: 1, minWidth: 0, width: "100%" } as const;

  const footer = (
    <Stack direction="row" spacing={1.25} justifyContent="flex-end" sx={{ px: 2.5, py: 1.75 }}>
      <Button
        variant="outlined"
        onClick={onClose}
        disabled={disabled}
        sx={{
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 800,
          height: 36,
          px: 3,
          borderColor: alpha(m.navy, 0.16),
          color: alpha(m.navy, 0.65),
          bgcolor: "#fff",
          "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
        }}
      >
        {businessServiceModalCopy.cancelLabel}
      </Button>
      <Button
        variant="contained"
        disableElevation
        onClick={onSubmit}
        disabled={disabled || !canSubmit}
        sx={{
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 900,
          height: 36,
          px: 4,
          bgcolor: m.teal,
          color: "#fff",
          "&:hover": { bgcolor: m.tealDark },
        }}
      >
        {submitLabel}
      </Button>
    </Stack>
  );

  return (
    <MollureDrawer
      open={open}
      onClose={onClose}
      title={title}
      footer={footer}
    >
      <Box sx={{ px: 2.5, py: 2, width: "100%", boxSizing: "border-box" }}>
        <Stack spacing={2} sx={{ width: "100%", alignItems: "stretch" }}>
          {mode === "subservice" ? (
            <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62), lineHeight: 1.45 }}>
              {businessServiceModalCopy.customServiceHint}
            </Typography>
          ) : null}

          <MollureFormField
            label={businessServiceModalCopy.nameLabel}
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            disabled={disabled}
            fullWidth
            sx={fieldInputSx}
          />

          <MollureFormField
            label={infoLabel}
            placeholder={businessServiceModalCopy.serviceInfoPlaceholder}
            value={draft.info}
            onChange={(e) => onChange({ info: e.target.value })}
            multiline
            minRows={3}
            disabled={disabled}
            fullWidth
            sx={fieldInputSx}
          />

          <Box sx={twoColumnRowSx}>
            <Box sx={twoColumnCellSx}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72), mb: 0.75 }}>
                {businessServiceModalCopy.durationFromLabel}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <MollureFormField
                  label={businessServiceModalCopy.durationHoursLabel}
                  placeholder={businessServiceModalCopy.durationHoursPlaceholder}
                  value={draft.durationFromHours}
                  onChange={(e) => onChange({ durationFromHours: sanitizeDurationHours(e.target.value) })}
                  disabled={disabled}
                  fullWidth
                  sx={fieldInputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                          {businessServiceModalCopy.durationHoursSuffix}
                        </Typography>
                      </InputAdornment>
                    ),
                    inputMode: "numeric",
                  }}
                />
                <MollureFormField
                  label={businessServiceModalCopy.durationMinutesLabel}
                  placeholder={businessServiceModalCopy.durationMinutesPlaceholder}
                  value={draft.durationFromMinutes}
                  onChange={(e) => onChange({ durationFromMinutes: sanitizeDurationMinutes(e.target.value) })}
                  disabled={disabled}
                  fullWidth
                  sx={fieldInputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                          {businessServiceModalCopy.durationMinutesSuffix}
                        </Typography>
                      </InputAdornment>
                    ),
                    inputMode: "numeric",
                  }}
                />
              </Box>
            </Box>
            <Box sx={twoColumnCellSx}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72), mb: 0.75 }}>
                {businessServiceModalCopy.durationToLabel}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <MollureFormField
                  label={businessServiceModalCopy.durationHoursLabel}
                  placeholder={businessServiceModalCopy.durationHoursPlaceholder}
                  value={draft.durationToHours}
                  onChange={(e) => onChange({ durationToHours: sanitizeDurationHours(e.target.value) })}
                  disabled={disabled}
                  fullWidth
                  sx={fieldInputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                          {businessServiceModalCopy.durationHoursSuffix}
                        </Typography>
                      </InputAdornment>
                    ),
                    inputMode: "numeric",
                  }}
                />
                <MollureFormField
                  label={businessServiceModalCopy.durationMinutesLabel}
                  placeholder={businessServiceModalCopy.durationMinutesPlaceholder}
                  value={draft.durationToMinutes}
                  onChange={(e) => onChange({ durationToMinutes: sanitizeDurationMinutes(e.target.value) })}
                  disabled={disabled}
                  fullWidth
                  sx={fieldInputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                          {businessServiceModalCopy.durationMinutesSuffix}
                        </Typography>
                      </InputAdornment>
                    ),
                    inputMode: "numeric",
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={twoColumnRowSx}>
            <Box sx={twoColumnCellSx}>
              <MollureFormField
                select
                label={businessServiceModalCopy.priceTypeLabel}
                value={draft.priceType}
                onChange={(e) => onChange({ priceType: e.target.value as BusinessServiceFormDraft["priceType"] })}
                disabled={disabled}
                fullWidth
                sx={fieldInputSx}
              >
                {businessServiceModalPriceTypes.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MollureFormField>
            </Box>
            <Box sx={twoColumnCellSx}>
              <MollureFormField
                label={businessServiceModalCopy.priceLabel}
                placeholder="0"
                value={draft.priceAmount}
                onChange={(e) => onChange({ priceAmount: e.target.value.replace(/[^\d.,]/g, "") })}
                disabled={disabled}
                fullWidth
                sx={fieldInputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: alpha(m.navy, 0.55) }}>€</Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                        {businessServiceModalCopy.currencyCode}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              borderRadius: "10px",
              bgcolor: alpha(m.navy, 0.045),
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              p: 2,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1.75 }}>
              {businessServiceModalCopy.offerDiscountTitle}
            </Typography>
            <Stack spacing={1.5} sx={{ width: "100%", alignItems: "stretch" }}>
              <Box sx={twoColumnRowSx}>
                <Box sx={twoColumnCellSx}>
                  <MollureFormField
                    select
                    label={businessServiceModalCopy.discountTypeLabel}
                    value={draft.discountType}
                    onChange={(e) =>
                      onChange({ discountType: e.target.value as BusinessServiceFormDraft["discountType"] })
                    }
                    disabled={disabled}
                    fullWidth
                    sx={fieldInputSx}
                  >
                    {businessServiceModalDiscountTypes.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Box>
                <Box sx={twoColumnCellSx}>
                  <MollureFormField
                    label={businessServiceModalCopy.discountAmountLabel}
                    placeholder="0"
                    value={draft.discountAmount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (normalizeBusinessServiceDiscountType(draft.discountType) === "percent") {
                        const v = raw.replace(/[^\d.]/g, "");
                        const dot = v.indexOf(".");
                        if (dot === -1) onChange({ discountAmount: v });
                        else onChange({ discountAmount: v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "") });
                      } else {
                        onChange({ discountAmount: raw.replace(/[^\d.,]/g, "") });
                      }
                    }}
                    disabled={disabled}
                    fullWidth
                    sx={fieldInputSx}
                    InputProps={
                      draft.discountType === "percent"
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>%</Typography>
                              </InputAdornment>
                            ),
                          }
                        : {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: alpha(m.navy, 0.55) }}>€</Typography>
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                                  {businessServiceModalCopy.currencyCode}
                                </Typography>
                              </InputAdornment>
                            ),
                          }
                    }
                  />
                </Box>
              </Box>

              <Box sx={twoColumnRowSx}>
                <Box sx={twoColumnCellSx}>
                  <AppDatePicker
                    value={draft.discountStartDate}
                    onChange={(iso) => onChange({ discountStartDate: iso })}
                    disabled={disabled}
                    fullWidth
                    max={draft.discountEndDate || undefined}
                  />
                </Box>
                <Box sx={twoColumnCellSx}>
                  <AppDatePicker
                    value={draft.discountEndDate}
                    onChange={(iso) => onChange({ discountEndDate: iso })}
                    disabled={disabled}
                    fullWidth
                    min={draft.discountStartDate || undefined}
                  />
                </Box>
              </Box>

              <MollureFormField
                label={businessServiceModalCopy.discountDescriptionLabel}
                value={draft.discountDescription}
                onChange={(e) => onChange({ discountDescription: e.target.value })}
                disabled={disabled}
                fullWidth
                sx={fieldInputSx}
              />
            </Stack>
          </Box>
        </Stack>
      </Box>
    </MollureDrawer>
  );
}
