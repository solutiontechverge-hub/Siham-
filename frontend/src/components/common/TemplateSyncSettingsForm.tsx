"use client";

import * as React from "react";
import {
  Box,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CONFIGURABLE_SYNC_SECTION_IDS,
  SYNC_SECTION_LABELS,
  TEMPLATE_SYNC_MODE_OPTIONS,
  type TemplateSyncMode,
  type TemplateSyncSectionId,
  type TemplateSyncSettings,
} from "./businessSetupTemplateSync";

type TemplateSyncSettingsFormProps = {
  value: TemplateSyncSettings;
  disabled?: boolean;
  onChange: (next: TemplateSyncSettings) => void;
};

function LockedSectionRow({
  title,
  status,
  helper,
}: {
  title: string;
  status: string;
  helper: string;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: alpha(m.navy, 0.02),
        px: 1.75,
        py: 1.5,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.85) }}>{title}</Typography>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: "6px",
            bgcolor: alpha(m.teal, 0.12),
            color: m.tealDark,
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {status}
        </Box>
      </Stack>
      <Typography sx={{ fontSize: 12, color: alpha(m.navy, 0.55), lineHeight: 1.45 }}>{helper}</Typography>
    </Box>
  );
}

function ConfigurableSectionBlock({
  sectionId,
  mode,
  disabled,
  onChange,
}: {
  sectionId: TemplateSyncSectionId;
  mode: TemplateSyncMode;
  disabled?: boolean;
  onChange: (mode: TemplateSyncMode) => void;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        px: 1.75,
        py: 1.5,
      }}
    >
      <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.85), mb: 1 }}>
        {SYNC_SECTION_LABELS[sectionId]}
      </Typography>
      <RadioGroup
        value={mode}
        onChange={(e) => onChange(e.target.value as TemplateSyncMode)}
      >
        {TEMPLATE_SYNC_MODE_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            disabled={disabled}
            control={
              <Radio
                size="small"
                sx={{
                  color: alpha(m.navy, 0.28),
                  "&.Mui-checked": { color: "primary.main" },
                }}
              />
            }
            sx={{ alignItems: "flex-start", mr: 0, ml: 0, mb: 0.75 }}
            label={
              <Box sx={{ pt: 0.35 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.8) }}>
                  {option.label}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: alpha(m.navy, 0.52), lineHeight: 1.4 }}>
                  {option.description}
                </Typography>
              </Box>
            }
          />
        ))}
      </RadioGroup>
    </Box>
  );
}

export default function TemplateSyncSettingsForm({
  value,
  disabled = false,
  onChange,
}: TemplateSyncSettingsFormProps) {
  const m = useTheme().palette.mollure;

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.58), lineHeight: 1.5 }}>
        Choose how Fixed and Desired location templates share information. They behave as two separate
        setups. Only shared sections can sync. Desired-only items (project booking, kilometer allowance)
        always stay on Desired.
      </Typography>

      <LockedSectionRow
        title={SYNC_SECTION_LABELS.profile}
        status="Always sync"
        helper="Profile is always synced automatically. Changes in either template update both in real-time."
      />

      <LockedSectionRow
        title={SYNC_SECTION_LABELS.location}
        status="Always separate"
        helper="Fixed address and Desired service areas stay separate. They never sync."
      />

      <Divider sx={{ borderColor: alpha(m.navy, 0.06) }} />

      {CONFIGURABLE_SYNC_SECTION_IDS.map((sectionId) => (
        <ConfigurableSectionBlock
          key={sectionId}
          sectionId={sectionId}
          mode={value[sectionId]}
          disabled={disabled}
          onChange={(mode) => onChange({ ...value, [sectionId]: mode, profile: "sync", location: "independent" })}
        />
      ))}
    </Stack>
  );
}
