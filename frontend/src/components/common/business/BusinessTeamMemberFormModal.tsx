"use client";

import * as React from "react";
import Image from "next/image";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Box, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../MollureFormField";
import { MollureLabeledSelect } from "../MollureLabeledFields";
import AppDrawer from "../AppDrawer";
import AppDropdown from "../AppDropdown";
import TeamMemberAssignedServicesPanel from "./TeamMemberAssignedServicesPanel";
import { FinanceDrawerActionsFooter } from "../FinanceDrawerFooter";
import {
  buildTeamCategoryOptions,
  buildTeamServiceOptionsForCategory,
  businessTeamMemberModalCopy,
  setTeamMemberCategoryServices,
  TEAM_MEMBER_ALL_SERVICES_VALUE,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
  type TeamMemberServiceGroupSelection,
} from "../../../data/businessTeamMemberModal.data";
import type { BusinessCategoryLike } from "../../../data/businessServiceCategorySlider.data";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_FILE_ACCEPT,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";
import { useSnackbar } from "../AppSnackbar";
import { mollureWhiteFieldInputSx } from "../mollureFormSx";

export type ReusableTeamMemberOption = {
  personKey: string;
  name: string;
  photoSrc: string;
};

type BusinessTeamMemberFormModalProps = {
  open: boolean;
  title: string;
  draft: TeamMemberFormDraft;
  submitLabel: string;
  disabled?: boolean;
  canSubmit?: boolean;
  businessCategories: BusinessCategoryLike[];
  serviceContext: TeamMemberModalServiceContext;
  reusableMembers?: ReusableTeamMemberOption[];
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<TeamMemberFormDraft>) => void;
  onPickService: (categoryId: string, serviceId: string) => void;
  onSetCategoryServices?: (categoryId: string, serviceIds: string[]) => void;
  onRemoveAssignedService: (serviceId: string) => void;
  onChangeSelectedGroups?: (groups: TeamMemberServiceGroupSelection[]) => void;
  onChooseReusableMember?: (personKey: string) => void;
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
  reusableMembers = [],
  photoInputRef,
  onClose,
  onSubmit,
  onChange,
  onPickService,
  onSetCategoryServices,
  onRemoveAssignedService,
  onChangeSelectedGroups,
  onChooseReusableMember,
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
  const isAddMode = title === businessTeamMemberModalCopy.addTitle;

  // Add mode must always start with the category placeholder — never auto-pick.
  React.useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;
    if (!isAddMode) return;
    onChange({ categoryId: "", serviceId: "" });
  }, [open, isAddMode, onChange]);

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
      ).filter((option) => option.value && option.value !== TEAM_MEMBER_ALL_SERVICES_VALUE),
    [activeCategoryId, businessCategories, serviceContext],
  );

  const selectedServiceIdsForCategory = React.useMemo(() => {
    if (!activeCategoryId) return [] as string[];
    return (
      draft.selectedGroups.find((group) => group.categoryId === activeCategoryId)
        ?.subServiceIds ?? []
    );
  }, [activeCategoryId, draft.selectedGroups]);

  const applyCategoryServices = React.useCallback(
    (categoryId: string, serviceIds: string[]) => {
      if (onSetCategoryServices) {
        onSetCategoryServices(categoryId, serviceIds);
        return;
      }
      const next = setTeamMemberCategoryServices(
        draft,
        categoryId,
        serviceIds,
        businessCategories,
        serviceContext,
      );
      onChange({
        categoryId,
        selectedGroups: next.selectedGroups,
        serviceId: "",
      });
    },
    [
      businessCategories,
      draft,
      onChange,
      onSetCategoryServices,
      serviceContext,
    ],
  );

  const footer = (
    <FinanceDrawerActionsFooter
      onCancel={onClose}
      onPrimary={onSubmit}
      cancelLabel={businessTeamMemberModalCopy.cancelLabel}
      primaryLabel={submitLabel}
      cancelDisabled={disabled}
      primaryDisabled={disabled || !canSubmit}
      primaryType="submit"
      cancelSx={{ px: 3 }}
      primarySx={{ px: 4 }}
    />
  );

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={title}
      onFormSubmit={
        disabled || !canSubmit
          ? undefined
          : () => {
              onSubmit();
            }
      }
      footer={footer}
    >
      <Box sx={{ px: 2.5, py: 2, width: "100%", boxSizing: "border-box" }}>
        <Stack spacing={2} sx={{ width: "100%", alignItems: "stretch" }}>
          {isAddMode && reusableMembers.length > 0 && onChooseReusableMember ? (
            <MollureLabeledSelect
              fieldLabel={businessTeamMemberModalCopy.selectExistingLabel}
              value={draft.personKey || ""}
              onChange={(e) =>
                onChooseReusableMember(String(e.target.value ?? ""))
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
                      {businessTeamMemberModalCopy.selectExistingPlaceholder}
                    </Typography>
                  );
                }
                return (
                  reusableMembers.find((option) => option.personKey === value)
                    ?.name ?? value
                );
              }}
              sx={{ bgcolor: "#fff", borderRadius: "10px" }}
            >
              <MenuItem value="">
                <em>{businessTeamMemberModalCopy.selectExistingPlaceholder}</em>
              </MenuItem>
              {reusableMembers.map((option) => (
                <MenuItem key={option.personKey} value={option.personKey}>
                  {option.name}
                </MenuItem>
              ))}
            </MollureLabeledSelect>
          ) : null}

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
              {serviceOptions.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.5) }}>
                  {businessTeamMemberModalCopy.noServicesInCategory}
                </Typography>
              ) : (
                <AppDropdown
                  label={businessTeamMemberModalCopy.selectServicesLabel}
                  options={serviceOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={selectedServiceIdsForCategory}
                  multiple
                  selectAll
                  selectAllLabel={businessTeamMemberModalCopy.allServicesOption}
                  disabled={disabled}
                  onChange={(value) => {
                    const ids = Array.isArray(value)
                      ? value.map(String)
                      : [String(value)];
                    applyCategoryServices(activeCategoryId, ids);
                  }}
                  sx={{ bgcolor: "#fff", borderRadius: "10px" }}
                />
              )}
            </Box>
          ) : null}

          <TeamMemberAssignedServicesPanel
            selectedGroups={draft.selectedGroups}
            businessCategories={businessCategories}
            serviceContext={serviceContext}
            disabled={disabled}
            onRemoveService={onRemoveAssignedService}
            onChangeGroups={onChangeSelectedGroups}
          />
        </Stack>
      </Box>
    </AppDrawer>
  );
}
