"use client";

import * as React from "react";
import Image from "next/image";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Box, Button, IconButton, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "./MollureFormField";
import MollureModal from "./MollureModal";
import {
  buildTeamCategoryOptions,
  buildTeamServiceOptionsForCategory,
  businessTeamMemberModalCopy,
  formatTeamMemberGroupLabel,
  type BusinessCategoryLike,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
} from "../../data/businessTeamMemberModal.data";
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
  onAddServiceSelection: () => void;
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
  onAddServiceSelection,
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

  const serviceOptions = React.useMemo(
    () => buildTeamServiceOptionsForCategory(draft.categoryId, businessCategories, serviceContext),
    [businessCategories, draft.categoryId, serviceContext],
  );

  const pickerRowSx = {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    gap: 1.5,
    width: "100%",
    alignItems: { xs: "stretch", sm: "flex-end" },
  } as const;

  const pickerCellSx = { flex: 1, minWidth: 0, width: "100%" } as const;

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
        }}
      >
        {submitLabel}
      </Button>
    </Stack>
  );

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { maxWidth: { xs: "min(560px, 92vw)", sm: 560 } } }}
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

          <Box sx={pickerRowSx}>
            <Box sx={pickerCellSx}>
              <MollureFormField
                select
                label={businessTeamMemberModalCopy.selectCategoryLabel}
                value={draft.categoryId}
                onChange={(e) => onChange({ categoryId: String(e.target.value), serviceId: "" })}
                disabled={disabled}
                fullWidth
                displayEmpty
                sx={fieldInputSx}
              >
                <MenuItem value="">
                  <Typography sx={{ color: alpha(m.navy, 0.45) }}>
                    {businessTeamMemberModalCopy.selectCategoryPlaceholder}
                  </Typography>
                </MenuItem>
                {categoryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </MollureFormField>
            </Box>
            <Box sx={pickerCellSx}>
              <MollureFormField
                select
                label={businessTeamMemberModalCopy.selectServicesLabel}
                value={draft.serviceId}
                onChange={(e) => onChange({ serviceId: String(e.target.value) })}
                disabled={disabled || !draft.categoryId}
                fullWidth
                displayEmpty
                sx={fieldInputSx}
              >
                <MenuItem value="">
                  <Typography sx={{ color: alpha(m.navy, 0.45) }}>
                    {businessTeamMemberModalCopy.selectServicePlaceholder}
                  </Typography>
                </MenuItem>
                {serviceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </MollureFormField>
            </Box>
            <IconButton
              onClick={onAddServiceSelection}
              disabled={disabled || !draft.categoryId || !draft.serviceId}
              aria-label="Add selected service"
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "999px",
                bgcolor: m.addSoftBg,
                color: m.addSoftFg,
                border: `1px solid ${m.addSoftBorder}`,
                alignSelf: { xs: "flex-start", sm: "flex-end" },
                mb: { sm: 0.25 },
                "&:hover": { bgcolor: m.addSoftBgHover },
              }}
            >
              <AddRoundedIcon />
            </IconButton>
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
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1.5 }}>
              {businessTeamMemberModalCopy.selectedHeading}
            </Typography>

            {draft.selectedGroups.length === 0 ? (
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
                {draft.selectedGroups.map((group) => (
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
    </MollureModal>
  );
}
