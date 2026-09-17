"use client";

import * as React from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import AppButton from "../AppButton";
import MollureFormField from "../MollureFormField";
import { Typography } from "../../ui/typography";
import { formatBusinessSetupValidationMessage } from "../businessSetupPublishValidation";
import { normalizeTemplateSyncSettings } from "../businessSetupTemplateSync";
import type { TemplateSyncSettings } from "../businessSetupTemplateSync";
import type { FixedLocationPageData } from "../../../app/professionals/fixed-location/fixedLocation.data";
import type {
  OfferingOption,
  OfferingSelectOption,
} from "./useProfessionalFixedLocationSetup.types";

export type ProfessionalFixedLocationSetupToolbarProps = {
  m: { navy: string; teal: string };
  data: FixedLocationPageData;
  businessOfferingSelect: OfferingSelectOption;
  setBusinessOfferingSelect: (v: OfferingSelectOption) => void;
  onSwitchActiveBusinessTemplate: (opt: OfferingOption) => void;
  setIsBusinessPublishEnabled: (v: boolean) => void;
  setTemplateSyncModalOpen: (v: boolean) => void;
  businessFormDisabled: boolean;
  offeringSelectOptions: readonly OfferingSelectOption[];
  isBothOffering: boolean;
  templateSyncSettings: TemplateSyncSettings;
  setTemplateSyncDraft: (v: TemplateSyncSettings) => void;
  setTemplateSyncDrawerOpen: (v: boolean) => void;
  onAttemptPublishBusinessSetup: () => void;
  isBusinessPublishEnabled: boolean;
  isBusinessSetupSaving: boolean;
  publishBlockedByValidation: boolean;
  businessSetupPublishValidation: { missingFields: string[] };
  visibleLocationCards: OfferingOption[];
  activeBusinessTemplate: OfferingOption;
  businessStatusMenuAnchor: HTMLElement | null;
  setBusinessStatusMenuAnchor: (el: HTMLElement | null) => void;
  isBusinessProfileStatusSaving: boolean;
  setBusinessProfileActive: (active: boolean) => void | Promise<void>;
  isBusinessProfileActive: boolean;
  onToggleBusinessProfileActive: () => void | Promise<void>;
};

export function ProfessionalFixedLocationSetupToolbar(
  props: ProfessionalFixedLocationSetupToolbarProps,
) {
  const {
    m,
    data,
    businessOfferingSelect,
    setBusinessOfferingSelect,
    onSwitchActiveBusinessTemplate,
    setIsBusinessPublishEnabled,
    setTemplateSyncModalOpen,
    businessFormDisabled,
    offeringSelectOptions,
    isBothOffering,
    templateSyncSettings,
    setTemplateSyncDraft,
    setTemplateSyncDrawerOpen,
    onAttemptPublishBusinessSetup,
    isBusinessPublishEnabled,
    isBusinessSetupSaving,
    publishBlockedByValidation,
    businessSetupPublishValidation,
    visibleLocationCards,
    activeBusinessTemplate,
    businessStatusMenuAnchor,
    setBusinessStatusMenuAnchor,
    isBusinessProfileStatusSaving,
    setBusinessProfileActive,
    isBusinessProfileActive,
    onToggleBusinessProfileActive,
  } = props;

  return (
    <>
      <Stack spacing={1.25} sx={{ width: "100%" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "flex-end" }}
          justifyContent="space-between"
          sx={{ width: "100%", minWidth: 0 }}
        >
          <Box
            sx={{
              flex: "1 1 auto",
              minWidth: 0,
              width: { xs: "100%", md: "auto" },
              maxWidth: { xs: "100%", md: 520 },
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: "text.secondary",
                mb: 0.75,
              }}
            >
              {data.offeringLabel}
            </Typography>
            <MollureFormField
              select
              value={businessOfferingSelect}
              onChange={(e) => {
                const v = String(e.target.value) as OfferingSelectOption;
                if (v === "Both") {
                  setTemplateSyncModalOpen(true);
                  return;
                }
                setBusinessOfferingSelect(v);
                onSwitchActiveBusinessTemplate(v);
                setIsBusinessPublishEnabled(true);
              }}
              disabled={businessFormDisabled}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                },
              }}
              SelectProps={{
                renderValue: (selected) => {
                  if (selected === "Both")
                    return "Fixed and Desired location";
                  return String(selected);
                },
              }}
            >
              {offeringSelectOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt === "Both" ? "Fixed and Desired location" : opt}
                </MenuItem>
              ))}
            </MollureFormField>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              flexShrink: 0,
              alignSelf: { xs: "flex-end", md: "flex-end" },
              pb: { md: 0.15 },
            }}
          >
            {isBothOffering ? (
              <IconButton
                size="small"
                aria-label="Template Sync Settings"
                disabled={businessFormDisabled}
                onClick={() => {
                  setTemplateSyncDraft(
                    normalizeTemplateSyncSettings(templateSyncSettings),
                  );
                  setTemplateSyncDrawerOpen(true);
                }}
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: "8px",
                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                  bgcolor: "#fff",
                  color: "primary.main",
                  "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                }}
              >
                <SettingsRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            ) : null}
            <AppButton
              variant="contained"
              disableElevation
              onClick={onAttemptPublishBusinessSetup}
              disabled={
                !isBusinessPublishEnabled ||
                isBusinessSetupSaving ||
                publishBlockedByValidation
              }
              title={
                isBusinessPublishEnabled && publishBlockedByValidation
                  ? formatBusinessSetupValidationMessage(
                      businessSetupPublishValidation.missingFields,
                    )
                  : undefined
              }
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                minHeight: 40,
                px: 2.5,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "mollure.tealDark" },
              }}
            >
              {isBusinessSetupSaving ? "Saving..." : data.publishLabel}
            </AppButton>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          sx={{ width: "100%", minWidth: 0 }}
        >
          <Box
            sx={{
              flex: "1 1 auto",
              minWidth: 0,
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "100%", md: 520 },
              p: 0.5,
              borderRadius: "12px",
              bgcolor: alpha(m.navy, 0.06),
              display: "flex",
              gap: 0.5,
              overflow: "hidden",
            }}
          >
            {visibleLocationCards.map((opt) => {
              const isActive = activeBusinessTemplate === opt;
              const canSwitch = isBothOffering;

              return (
                <Box
                  key={opt}
                  component="button"
                  type="button"
                  onClick={() => {
                    if (!canSwitch) return;
                    onSwitchActiveBusinessTemplate(opt);
                  }}
                  disabled={businessFormDisabled || !canSwitch}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 40,
                    px: { xs: 1.25, sm: 2 },
                    py: 0.85,
                    borderRadius: "10px",
                    border: "none",
                    bgcolor: isActive ? alpha(m.navy, 0.1) : "#fff",
                    boxShadow: isActive
                      ? "none"
                      : "0 1px 2px rgba(16, 35, 63, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: canSwitch ? "pointer" : "default",
                    transition:
                      "background-color 0.18s ease, box-shadow 0.18s ease",
                    outline: "none",
                    font: "inherit",
                    "&:hover": {
                      bgcolor: canSwitch
                        ? isActive
                          ? alpha(m.navy, 0.12)
                          : alpha(m.navy, 0.02)
                        : isActive
                          ? alpha(m.navy, 0.1)
                          : "#fff",
                    },
                    "&:focus-visible": {
                      boxShadow: canSwitch
                        ? `0 0 0 3px ${alpha(m.teal, 0.22)}`
                        : undefined,
                    },
                    "&.Mui-disabled, &:disabled": {
                      opacity: 1,
                      color: "inherit",
                    },
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontSize: { xs: 13, sm: 14 },
                      fontWeight: 700,
                      color: isActive
                        ? alpha(m.navy, 0.88)
                        : alpha(m.navy, 0.55),
                      lineHeight: 1.2,
                      textAlign: "center",
                      maxWidth: "100%",
                    }}
                  >
                    {opt}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              alignSelf: { xs: "flex-end", md: "center" },
            }}
          >
            <IconButton
              size="small"
              aria-label="Business status options"
              aria-haspopup="menu"
              aria-expanded={Boolean(businessStatusMenuAnchor)}
              disabled={isBusinessProfileStatusSaving}
              onClick={(e) => setBusinessStatusMenuAnchor(e.currentTarget)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                border: `1px solid ${alpha(m.navy, 0.12)}`,
                bgcolor: "#fff",
                color: alpha(m.navy, 0.65),
                "&:hover": { bgcolor: alpha(m.navy, 0.03) },
              }}
            >
              <MoreVertRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Menu
              anchorEl={businessStatusMenuAnchor}
              open={Boolean(businessStatusMenuAnchor)}
              onClose={() => setBusinessStatusMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.75,
                    minWidth: 140,
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.1)}`,
                    boxShadow: "0 10px 24px rgba(16, 35, 63, 0.12)",
                  },
                },
              }}
            >
              <MenuItem
                disabled={isBusinessProfileStatusSaving}
                onClick={() => {
                  setBusinessStatusMenuAnchor(null);
                  void setBusinessProfileActive(!isBusinessProfileActive);
                }}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.82),
                  py: 1,
                }}
              >
                {isBusinessProfileStatusSaving
                  ? "Saving..."
                  : isBusinessProfileActive
                    ? "Deactive"
                    : "Active"}
              </MenuItem>
            </Menu>
          </Box>
        </Stack>
      </Stack>

      {!isBusinessProfileActive ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            bgcolor: alpha("#E53935", 0.06),
            border: `1px solid ${alpha("#E53935", 0.18)}`,
            px: 2,
            py: 1.35,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: "#E53935",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ErrorOutlineRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              flex: 1,
              minWidth: 200,
              fontWeight: 600,
              fontSize: 13,
              color: "#C62828",
            }}
          >
            Template Has Temporarily Been Deactivated
          </Typography>
          <AppButton
            variant="contained"
            disableElevation
            onClick={() => void onToggleBusinessProfileActive()}
            disabled={isBusinessProfileStatusSaving}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              minHeight: 34,
              px: 2.25,
              bgcolor: alpha(m.navy, 0.12),
              color: alpha(m.navy, 0.82),
              boxShadow: "none",
              "&:hover": { bgcolor: alpha(m.navy, 0.18), boxShadow: "none" },
            }}
          >
            {isBusinessProfileStatusSaving ? "Saving..." : "Reactivate"}
          </AppButton>
        </Paper>
      ) : null}

    </>
  );
}
