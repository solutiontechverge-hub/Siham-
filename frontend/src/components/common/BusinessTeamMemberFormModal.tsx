"use client";

import * as React from "react";
import Image from "next/image";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Box, Button, IconButton, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "./MollureFormField";
import MollureDrawer from "./MollureDrawer";
import {
  addTeamMemberServiceSelection,
  buildTeamCategoryOptions,
  buildTeamServiceOptionsForCategory,
  businessTeamMemberModalCopy,
  formatTeamMemberGroupLabel,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
} from "../../data/businessTeamMemberModal.data";
import type { BusinessCategoryLike } from "../../data/businessServiceCategorySlider.data";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_FILE_ACCEPT,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../lib/profileImageUpload";
import { useSnackbar } from "./AppSnackbar";

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
  onRemoveServiceGroup: (categoryId: string) => void;
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
  onRemoveServiceGroup,
  onChoosePhoto,
  onPhotoSelected,
}: BusinessTeamMemberFormModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const fieldInputSx = { "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } } as const;

  const categoryOptions = React.useMemo(
    () => buildTeamCategoryOptions(businessCategories, serviceContext),
    [businessCategories, serviceContext],
  );

  const activeCategoryId = draft.categoryId;

  React.useEffect(() => {
    if (!open || categoryOptions.length === 0) return;
    if (!draft.categoryId || !categoryOptions.some((option) => option.value === draft.categoryId)) {
      onChange({ categoryId: categoryOptions[0].value, serviceId: "" });
    }
  }, [open, categoryOptions, draft.categoryId, onChange]);

  const serviceOptions = React.useMemo(
    () => buildTeamServiceOptionsForCategory(activeCategoryId, businessCategories, serviceContext),
    [activeCategoryId, businessCategories, serviceContext],
  );

  const selectableServices = React.useMemo(
    () => serviceOptions.filter((option) => option.value),
    [serviceOptions],
  );

  const displaySelectedGroups = React.useMemo(() => {
    if (!draft.categoryId || !draft.serviceId) return draft.selectedGroups;
    return addTeamMemberServiceSelection(draft, businessCategories, serviceContext).selectedGroups;
  }, [businessCategories, draft, serviceContext]);

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
        }}
      >
        {businessTeamMemberModalCopy.cancelLabel}
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
          "&.Mui-disabled": {
            bgcolor: alpha(m.navy, 0.12),
            color: alpha(m.navy, 0.35),
          },
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
      panelWidth={{ xs: "100vw", sm: 520 }}
      footer={footer}
    >
      <Box sx={{ px: 2.5, py: 2, width: "100%", boxSizing: "border-box" }}>
        <Stack spacing={2} sx={{ width: "100%", alignItems: "stretch" }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1 }}>
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
              <Image
                src={draft.photoSrc}
                alt="Team member"
                fill
                unoptimized
                sizes="120px"
                style={{ objectFit: "cover" }}
              />
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
                  <UploadFileRoundedIcon sx={{ fontSize: 22, color: alpha(m.navy, 0.55) }} />
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
                  showSnackbar({ severity: "error", message: PROFILE_IMAGE_INVALID_MESSAGE });
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
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            disabled={disabled}
            fullWidth
            sx={fieldInputSx}
          />

          {categoryOptions.length > 0 ? (
            <MollureFormField
              label={businessTeamMemberModalCopy.selectCategoryLabel}
              select
              value={draft.categoryId}
              onChange={(e) => onChange({ categoryId: e.target.value, serviceId: "" })}
              disabled={disabled}
              fullWidth
              sx={fieldInputSx}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">
                <em>{businessTeamMemberModalCopy.selectCategoryPlaceholder}</em>
              </MenuItem>
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MollureFormField>
          ) : (
            <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.5) }}>
              {businessTeamMemberModalCopy.noCategories}
            </Typography>
          )}

          {activeCategoryId ? (
            <Box sx={{ width: "100%" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1.25 }}>
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
                      draft.categoryId === activeCategoryId && draft.serviceId === option.value;

                    return (
                      <Button
                        key={option.value}
                        variant="outlined"
                        disabled={disabled}
                        onClick={() => onPickService(activeCategoryId, option.value)}
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: 13,
                          px: 1.75,
                          py: 0.75,
                          borderColor: isSelected ? m.teal : alpha(m.navy, 0.14),
                          color: isSelected ? m.teal : alpha(m.navy, 0.78),
                          bgcolor: isSelected ? alpha(m.teal, 0.08) : "#fff",
                          "&:hover": {
                            borderColor: m.teal,
                            bgcolor: alpha(m.teal, 0.06),
                          },
                        }}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </Box>
              )}
            </Box>
          ) : null}

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
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1.5 }}>
              {businessTeamMemberModalCopy.selectedHeading}
            </Typography>

            {displaySelectedGroups.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.5) }}>
                {businessTeamMemberModalCopy.noSelections}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 1.25,
                }}
              >
                {displaySelectedGroups.map((group) => (
                  <Box
                    key={group.categoryId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      minWidth: 0,
                    }}
                  >
                    <MollureFormField
                      select
                      value={group.categoryId}
                      disabled={disabled}
                      fullWidth
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        ...fieldInputSx,
                        "& .MuiSelect-select": { display: "flex", alignItems: "center" },
                      }}
                      SelectProps={{
                        readOnly: true,
                        IconComponent: KeyboardArrowDownRoundedIcon,
                      }}
                    >
                      <MenuItem value={group.categoryId}>
                        {formatTeamMemberGroupLabel(group, businessCategories, serviceContext)}
                      </MenuItem>
                    </MollureFormField>
                    <IconButton
                      size="small"
                      aria-label={`Remove ${group.categoryTitle}`}
                      onClick={() => onRemoveServiceGroup(group.categoryId)}
                      disabled={disabled}
                      sx={{ color: alpha(m.navy, 0.45) }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    </MollureDrawer>
  );
}
