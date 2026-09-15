"use client";

import AppButton from "../AppButton";
import * as React from "react";
import Image from "next/image";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Box, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../MollureFormField";
import { MollureLabeledSelect } from "../MollureLabeledFields";
import AppDrawer from "../AppDrawer";
import TeamMemberAssignedServicesPanel from "./TeamMemberAssignedServicesPanel";
import { FinanceDrawerActionsFooter } from "../FinanceDrawerFooter";
import {
  addTeamMemberServiceSelection,
  buildTeamCategoryOptions,
  buildTeamServiceOptionsForCategory,
  businessTeamMemberModalCopy,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
} from "../../../data/businessTeamMemberModal.data";
import type { BusinessCategoryLike } from "../../../data/businessServiceCategorySlider.data";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_FILE_ACCEPT,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";
import { useSnackbar } from "../AppSnackbar";
import { mollureWhiteFieldInputSx } from "../mollureFormSx";

type BusinessTeamMemberFormModalProps = {
  open: boolean;
  title: string;
  draft: TeamMemberFormDraft;
  submitLabel: string;
  disabled?: boolean;
  canSubmit?: boolean;
  businessCategories: BusinessCategoryLike[];
  serviceContext: TeamMemberModalServiceContext;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<TeamMemberFormDraft>) => void;
  onPickService: (categoryId: string, serviceId: string) => void;
  onRemoveAssignedService: (serviceId: string) => void;
  onChoosePhoto: () => void;
  onPhotoSelected: (file: File, objectUrl: string) => void;
};

export default function BusinessTeamMemberFormModal({
  open,
  title,
  draft,
  submitLabel,
  disabled = false,
  canSubmit = true,
  businessCategories,
  serviceContext,
  photoInputRef,
  onClose,
  onSubmit,
  onChange,
  onPickService,
  onRemoveAssignedService,
  onChoosePhoto,
  onPhotoSelected,
}: BusinessTeamMemberFormModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const fieldInputSx = mollureWhiteFieldInputSx;

  const categoryOptions = React.useMemo(
    () => buildTeamCategoryOptions(businessCategories, serviceContext),
    [businessCategories, serviceContext],
  );

  const activeCategoryId = draft.categoryId;
  const wasOpenRef = React.useRef(false);

  // Add mode must always start with the category placeholder — never auto-pick.
  React.useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;
    if (title !== businessTeamMemberModalCopy.addTitle) return;
    onChange({ categoryId: "", serviceId: "" });
  }, [open, title, onChange]);

  React.useEffect(() => {
    if (!open || !draft.categoryId) return;
    if (!categoryOptions.some((option) => option.value === draft.categoryId)) {
      onChange({ categoryId: "", serviceId: "" });
    }
  }, [open, categoryOptions, draft.categoryId, onChange]);

  const serviceOptions = React.useMemo(
    () =>
      buildTeamServiceOptionsForCategory(
        activeCategoryId,
        businessCategories,
        serviceContext,
      ),
    [activeCategoryId, businessCategories, serviceContext],
  );

  const selectableServices = React.useMemo(
    () => serviceOptions.filter((option) => option.value),
    [serviceOptions],
  );

  const displaySelectedGroups = React.useMemo(() => {
    if (!draft.categoryId || !draft.serviceId) return draft.selectedGroups;
    return addTeamMemberServiceSelection(
      draft,
      businessCategories,
      serviceContext,
    ).selectedGroups;
  }, [businessCategories, draft, serviceContext]);

  const footer = (
    <FinanceDrawerActionsFooter
      onCancel={onClose}
      onPrimary={onSubmit}
      cancelLabel={businessTeamMemberModalCopy.cancelLabel}
      primaryLabel={submitLabel}
      cancelDisabled={disabled}
      primaryDisabled={disabled || !canSubmit}
      cancelSx={{ px: 3 }}
      primarySx={{ px: 4 }}
    />
  );

  return (
    <AppDrawer open={open} onClose={onClose} title={title} footer={footer}>
      <Box sx={{ px: 2.5, py: 2, width: "100%", boxSizing: "border-box" }}>
        <Stack spacing={2} sx={{ width: "100%", alignItems: "stretch" }}>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 14,
                color: alpha(m.navy, 0.88),
                mb: 1,
              }}
            >
              {businessTeamMemberModalCopy.profilePictureLabel}
            </Typography>
            <Box
              onClick={disabled ? undefined : onChoosePhoto}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChoosePhoto();
                }
              }}
              role="button"
              tabIndex={disabled ? -1 : 0}
              sx={{
                position: "relative",
                width: 120,
                height: 120,
                borderRadius: "12px",
                overflow: "hidden",
                border: `1px solid ${alpha(m.navy, 0.12)}`,
                bgcolor: alpha(m.navy, 0.04),
                cursor: disabled ? "default" : "pointer",
              }}
            >
              {draft.photoSrc ? (
                <Image
                  src={draft.photoSrc}
                  alt="Team member"
                  fill
                  unoptimized
                  sizes="120px"
                  style={{ objectFit: "cover" }}
                />
              ) : null}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#000", 0.18),
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "999px",
                    bgcolor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px rgba(16,35,63,0.18)",
                  }}
                >
                  <UploadFileRoundedIcon
                    sx={{ fontSize: 22, color: alpha(m.navy, 0.55) }}
                  />
                </Box>
              </Box>
            </Box>
            <input
              ref={photoInputRef}
              type="file"
              accept={PROFILE_IMAGE_FILE_ACCEPT}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!isAllowedProfileImageFile(file)) {
                  showSnackbar({
                    severity: "error",
                    message: PROFILE_IMAGE_INVALID_MESSAGE,
                  });
                  e.target.value = "";
                  return;
                }
                onPhotoSelected(file, URL.createObjectURL(file));
                e.target.value = "";
              }}
            />
          </Box>

          <MollureFormField
            label={businessTeamMemberModalCopy.nameLabel}
            placeholder={businessTeamMemberModalCopy.namePlaceholder}
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            disabled={disabled}
            fullWidth
            sx={fieldInputSx}
          />

          {categoryOptions.length > 0 ? (
            <MollureLabeledSelect
              fieldLabel={businessTeamMemberModalCopy.selectCategoryLabel}
              value={draft.categoryId || ""}
              onChange={(e) =>
                onChange({
                  categoryId: String(e.target.value ?? ""),
                  serviceId: "",
                })
              }
              disabled={disabled}
              displayEmpty
              renderValue={(selected) => {
                const value = String(selected ?? "");
                if (!value) {
                  return (
                    <Typography
                      component="span"
                      sx={{
                        color: alpha(m.navy, 0.42),
                        fontSize: "0.8125rem",
                      }}
                    >
                      {businessTeamMemberModalCopy.selectCategoryPlaceholder}
                    </Typography>
                  );
                }
                return (
                  categoryOptions.find((option) => option.value === value)
                    ?.label ?? value
                );
              }}
              sx={{
                bgcolor: "#fff",
                borderRadius: "10px",
              }}
            >
              <MenuItem value="">
                <em>{businessTeamMemberModalCopy.selectCategoryPlaceholder}</em>
              </MenuItem>
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MollureLabeledSelect>
          ) : (
            <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.5) }}>
              {businessTeamMemberModalCopy.noCategories}
            </Typography>
          )}

          {activeCategoryId ? (
            <Box sx={{ width: "100%" }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 14,
                  color: alpha(m.navy, 0.88),
                  mb: 1.25,
                }}
              >
                {businessTeamMemberModalCopy.selectServicesLabel}
              </Typography>
              {selectableServices.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.5) }}>
                  {businessTeamMemberModalCopy.noServicesInCategory}
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {selectableServices.map((option) => {
                    const isSelected =
                      draft.categoryId === activeCategoryId &&
                      draft.serviceId === option.value;

                    return (
                      <AppButton
                        key={option.value}
                        variant="outlined"
                        disabled={disabled}
                        onClick={() =>
                          onPickService(activeCategoryId, option.value)
                        }
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: 13,
                          px: 1.75,
                          py: 0.75,
                          borderColor: isSelected
                            ? m.teal
                            : alpha(m.navy, 0.14),
                          color: isSelected ? m.teal : alpha(m.navy, 0.78),
                          bgcolor: isSelected ? alpha(m.teal, 0.08) : "#fff",
                          "&:hover": {
                            borderColor: m.teal,
                            bgcolor: alpha(m.teal, 0.06),
                          },
                        }}
                      >
                        {option.label}
                      </AppButton>
                    );
                  })}
                </Box>
              )}
            </Box>
          ) : null}

          <TeamMemberAssignedServicesPanel
            selectedGroups={displaySelectedGroups}
            businessCategories={businessCategories}
            serviceContext={serviceContext}
            disabled={disabled}
            onRemoveService={onRemoveAssignedService}
          />
        </Stack>
      </Box>
    </AppDrawer>
  );
}
