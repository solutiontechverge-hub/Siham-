"use client";

import AppButton from "../AppButton";
import * as React from "react";
import Image from "next/image";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import MollureFormField from "../MollureFormField";
import { MollureLabeledSelect } from "../MollureLabeledFields";
import AppPillTabs from "../AppPillTabs";
import TeamMemberAssignedServicesPanel from "../business/TeamMemberAssignedServicesPanel";
import { useSnackbar } from "../AppSnackbar";
import { getApiErrorMessage } from "../../../lib/api-error";
import { resolveMediaUrl } from "../../../lib/resolveMediaUrl";
import {
  addTeamMemberServiceSelection,
  buildTeamBusinessServiceRefs,
  buildTeamCategoryOptions,
  buildTeamServiceOptionsForCategory,
  businessTeamMemberModalCopy,
  createEmptyTeamMemberFormDraft,
  groupsFromAssignedServices,
  groupsToTeamService,
  removeTeamMemberAssignedService,
  TEAM_MEMBER_MAX_PERSONAL_DOCUMENTS,
  TEAM_SERVICE_SLOT_KEYS,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
} from "../../../data/businessTeamMemberModal.data";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_FILE_ACCEPT,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";
import {
  MESSAGING_ATTACHMENT_FILE_ACCEPT,
  validateMessagingAttachmentFile,
} from "../messaging/messagingFileUtils";
import {
  useGetBusinessCategoriesQuery,
  useGetBusinessSetupQuery,
  useUpdateTeamMemberMutation,
  type BusinessTeamMember,
} from "../../../store/services/businessApi";

type LocationTab = "FL" | "DL";

type CalendarTeamMemberProfileDrawerProps = {
  open: boolean;
  memberId: string | null;
  onClose: () => void;
};

export default function CalendarTeamMemberProfileDrawer({
  open,
  memberId,
  onClose,
}: CalendarTeamMemberProfileDrawerProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const documentInputRef = React.useRef<HTMLInputElement>(null);

  const { data: setupResponse } = useGetBusinessSetupQuery(undefined, {
    skip: !open,
  });
  const { data: categoriesResponse } = useGetBusinessCategoriesQuery(undefined, {
    skip: !open,
  });
  const [updateTeamMember, { isLoading: isSaving }] = useUpdateTeamMemberMutation();

  const setup = setupResponse?.data ?? null;
  const businessCategories = categoriesResponse?.data ?? [];
  const member = React.useMemo(
    () =>
      setup?.team_members?.find((row) => String(row.id) === String(memberId ?? "")) ??
      null,
    [memberId, setup?.team_members],
  );

  const manageTeamSync =
    setup?.location_mode !== "both" ||
    setup?.section_sync_settings?.manageTeam === "sync";
  const showLocationTabs =
    setup?.location_mode === "both" && !manageTeamSync;

  const [locationTab, setLocationTab] = React.useState<LocationTab>("FL");
  const [publicDraft, setPublicDraft] = React.useState<TeamMemberFormDraft>(
    createEmptyTeamMemberFormDraft(),
  );
  const [pendingPhotoFile, setPendingPhotoFile] = React.useState<File | null>(null);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [contactNumber, setContactNumber] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = React.useState("");
  const [personalNote, setPersonalNote] = React.useState("");
  const [personalDocuments, setPersonalDocuments] = React.useState<
    NonNullable<BusinessTeamMember["personal_documents"]>
  >([]);
  const [pendingDocumentFiles, setPendingDocumentFiles] = React.useState<File[]>([]);

  const documentInputId = React.useId();

  const serviceContext = React.useMemo<TeamMemberModalServiceContext>(() => {
    const businessServices = buildTeamBusinessServiceRefs(
      (setup?.service_details ?? []).map((service) => ({
        serviceId: String(service.service_id),
        categoryId: String(service.category_id),
        name: String(service.service_title ?? ""),
      })),
    );
    return { businessServices };
  }, [setup?.service_details]);

  React.useEffect(() => {
    if (!open || !member) return;

    const resolvedGroups = groupsFromAssignedServices(
      member.assigned_services ?? [],
      businessCategories,
      serviceContext,
    );

    setPublicDraft({
      name: member.full_name?.trim() ?? "",
      photoSrc: resolveMediaUrl(member.profile_photo) ?? "",
      selectedGroups: resolvedGroups,
      categoryId: "",
      serviceId: "",
      pendingPhotoFile: null,
    });
    setPendingPhotoFile(null);
    setFirstName(member.first_name ?? "");
    setLastName(member.last_name ?? "");
    setContactNumber(member.contact_number ?? "");
    setEmail(member.email ?? "");
    setEmergencyContactName(member.emergency_contact_name ?? "");
    setEmergencyContactNumber(member.emergency_contact_number ?? "");
    setPersonalNote(member.personal_note ?? "");
    setPersonalDocuments(member.personal_documents ?? []);
    setPendingDocumentFiles([]);
    setLocationTab("FL");
  }, [open, memberId, member, businessCategories, serviceContext]);

  const totalDocumentCount = personalDocuments.length + pendingDocumentFiles.length;
  const canUploadMoreDocuments = totalDocumentCount < TEAM_MEMBER_MAX_PERSONAL_DOCUMENTS;

  const pendingDocumentPreviewUrls = React.useMemo(
    () =>
      pendingDocumentFiles.map((file) =>
        file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      ),
    [pendingDocumentFiles],
  );

  React.useEffect(() => {
    return () => {
      pendingDocumentPreviewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [pendingDocumentPreviewUrls]);

  const categoryOptions = React.useMemo(
    () => buildTeamCategoryOptions(businessCategories, serviceContext),
    [businessCategories, serviceContext],
  );

  const selectableServices = React.useMemo(() => {
    if (!publicDraft.categoryId) return [];
    return buildTeamServiceOptionsForCategory(
      publicDraft.categoryId,
      businessCategories,
      serviceContext,
    );
  }, [businessCategories, publicDraft.categoryId, serviceContext]);

  const displaySelectedGroups = React.useMemo(() => {
    if (!publicDraft.categoryId || !publicDraft.serviceId) {
      return publicDraft.selectedGroups;
    }
    return addTeamMemberServiceSelection(
      publicDraft,
      businessCategories,
      serviceContext,
    ).selectedGroups;
  }, [businessCategories, publicDraft, serviceContext]);

  const drawerTitle = `${publicDraft.name.trim() || member?.full_name?.trim() || "Team Member"} Profile`;

  const handleSave = async () => {
    if (!member?.id) return;
    const fullName = publicDraft.name.trim();
    if (!fullName) {
      showSnackbar({ severity: "warning", message: "Team member name is required." });
      return;
    }

    try {
      const slots = groupsToTeamService(publicDraft.selectedGroups);
      const assigned_services = TEAM_SERVICE_SLOT_KEYS.map((key) => slots[key])
        .filter(Boolean)
        .map((serviceId) => {
          const matched = serviceContext.businessServices?.find(
            (service) => service.serviceId === serviceId,
          );
          return {
            service_id: serviceId,
            title: matched?.label ?? null,
          };
        });

      await updateTeamMember({
        id: String(member.id),
        full_name: fullName,
        assigned_services,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        contact_number: contactNumber.trim() || null,
        email: email.trim() || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_number: emergencyContactNumber.trim() || null,
        personal_note: personalNote.trim() || null,
        personal_documents: personalDocuments,
        profilePhotoFile: pendingPhotoFile,
        personalDocumentFiles:
          pendingDocumentFiles.length > 0 ? pendingDocumentFiles : undefined,
      }).unwrap();

      showSnackbar({ severity: "success", message: "Team member profile saved." });
      setPendingPhotoFile(null);
      setPendingDocumentFiles([]);
      onClose();
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to save team member profile."),
      });
    }
  };

  const fieldInputSx = {
    "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
  } as const;

  return (
    <AppDrawer
      anchor="right"
      open={open && Boolean(member)}
      onClose={onClose}
      title={drawerTitle}
      contentSx={{ bgcolor: alpha(m.navy, 0.03), p: 0 }}
      footer={
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
          <AppButton tone="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
          <AppButton variant="contained" disableElevation onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </AppButton>
        </Stack>
      }
    >
      {member ? (
        <Stack spacing={2.5} sx={{ px: 2.5, py: 2 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "12px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              bgcolor: "#fff",
              p: 2,
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1.5 }}>
              Business Template
            </Typography>
            {showLocationTabs ? (
              <Box sx={{ mb: 2 }}>
                <AppPillTabs
                  active={locationTab}
                  onChange={(next) => setLocationTab(next as LocationTab)}
                  tabs={[
                    { value: "FL", label: "Fixed Location" },
                    { value: "DL", label: "Desired Location" },
                  ]}
                />
                {locationTab === "DL" ? (
                  <Typography sx={{ mt: 1, fontSize: 11.5, color: alpha(m.navy, 0.5) }}>
                    Desired Location team assignments follow your Business Template draft when locations are not synced.
                  </Typography>
                ) : null}
              </Box>
            ) : null}

            <Stack spacing={2}>
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
                  onClick={() => photoInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      photoInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  sx={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: `1px solid ${alpha(m.navy, 0.12)}`,
                    bgcolor: alpha(m.navy, 0.04),
                    cursor: "pointer",
                  }}
                >
                  {publicDraft.photoSrc ? (
                    <Image
                      src={publicDraft.photoSrc}
                      alt={publicDraft.name || "Team member"}
                      fill
                      unoptimized
                      sizes="120px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.75,
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
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.55),
                          px: 1,
                          textAlign: "center",
                        }}
                      >
                        {businessTeamMemberModalCopy.uploadProfileLabel}
                      </Typography>
                    </Box>
                  )}
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
                  setPendingPhotoFile(file);
                  setPublicDraft((prev) => ({
                    ...prev,
                    photoSrc: URL.createObjectURL(file),
                  }));
                  e.target.value = "";
                }}
              />

              <MollureFormField
                label={businessTeamMemberModalCopy.nameLabel}
                placeholder={businessTeamMemberModalCopy.namePlaceholder}
                value={publicDraft.name}
                onChange={(e) =>
                  setPublicDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                fullWidth
                sx={fieldInputSx}
              />

              {categoryOptions.length > 0 ? (
                <MollureLabeledSelect
                  fieldLabel={businessTeamMemberModalCopy.selectCategoryLabel}
                  value={publicDraft.categoryId || ""}
                  onChange={(e) =>
                    setPublicDraft((prev) => ({
                      ...prev,
                      categoryId: String(e.target.value ?? ""),
                      serviceId: "",
                    }))
                  }
                  displayEmpty
                  sx={{ bgcolor: "#fff", borderRadius: "10px" }}
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
              ) : null}

              {publicDraft.categoryId && selectableServices.length > 0 ? (
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
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectableServices.map((option) => {
                      const isSelected =
                        publicDraft.categoryId &&
                        publicDraft.serviceId === option.value;

                      return (
                        <AppButton
                          key={option.value}
                          variant="outlined"
                          onClick={() =>
                            setPublicDraft((prev) =>
                              addTeamMemberServiceSelection(
                                { ...prev, serviceId: option.value },
                                businessCategories,
                                serviceContext,
                              ),
                            )
                          }
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
                        </AppButton>
                      );
                    })}
                  </Box>
                </Box>
              ) : null}

              <TeamMemberAssignedServicesPanel
                selectedGroups={displaySelectedGroups}
                businessCategories={businessCategories}
                serviceContext={serviceContext}
                onRemoveService={(serviceId) =>
                  setPublicDraft((prev) =>
                    removeTeamMemberAssignedService(prev, serviceId),
                  )
                }
              />
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "12px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              bgcolor: "#fff",
              p: 2,
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1.5 }}>
              Personal Information
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <MollureFormField
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  sx={fieldInputSx}
                />
                <MollureFormField
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  sx={fieldInputSx}
                />
              </Stack>
              <MollureFormField
                label="Contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                fullWidth
                sx={fieldInputSx}
              />
              <MollureFormField
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                sx={fieldInputSx}
              />
              <MollureFormField
                label="Emergency contact name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                fullWidth
                sx={fieldInputSx}
              />
              <MollureFormField
                label="Emergency contact number"
                value={emergencyContactNumber}
                onChange={(e) => setEmergencyContactNumber(e.target.value)}
                fullWidth
                sx={fieldInputSx}
              />
              <MollureFormField
                label="Note"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                sx={fieldInputSx}
              />
              <Divider />
              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                Documents
                {totalDocumentCount > 0
                  ? ` (${totalDocumentCount}/${TEAM_MEMBER_MAX_PERSONAL_DOCUMENTS})`
                  : ""}
              </Typography>
              <AppButton
                component="label"
                htmlFor={documentInputId}
                tone="secondary"
                type="button"
                disabled={!canUploadMoreDocuments}
                sx={{ borderRadius: "999px", py: 1.25, cursor: "pointer" }}
              >
                Upload document
              </AppButton>
              <input
                id={documentInputId}
                ref={documentInputRef}
                type="file"
                multiple
                accept={MESSAGING_ATTACHMENT_FILE_ACCEPT}
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;

                  const remainingSlots =
                    TEAM_MEMBER_MAX_PERSONAL_DOCUMENTS -
                    personalDocuments.length -
                    pendingDocumentFiles.length;

                  if (remainingSlots <= 0) {
                    showSnackbar({
                      severity: "warning",
                      message: `Maximum ${TEAM_MEMBER_MAX_PERSONAL_DOCUMENTS} documents allowed.`,
                    });
                    e.target.value = "";
                    return;
                  }

                  const acceptedFiles: File[] = [];
                  for (const file of files) {
                    if (acceptedFiles.length >= remainingSlots) break;
                    const validationError = validateMessagingAttachmentFile(file);
                    if (validationError) {
                      showSnackbar({
                        severity: "error",
                        message: validationError,
                      });
                      continue;
                    }
                    acceptedFiles.push(file);
                  }

                  if (files.length > remainingSlots) {
                    showSnackbar({
                      severity: "warning",
                      message: `Only ${remainingSlots} more document(s) can be added (max ${TEAM_MEMBER_MAX_PERSONAL_DOCUMENTS}).`,
                    });
                  }

                  if (acceptedFiles.length > 0) {
                    setPendingDocumentFiles((prev) => [...prev, ...acceptedFiles]);
                  }
                  e.target.value = "";
                }}
              />
              {(personalDocuments.length > 0 || pendingDocumentFiles.length > 0) && (
                <Stack spacing={1}>
                  {personalDocuments.map((doc, index) => {
                    const docUrl = resolveMediaUrl(doc.url);
                    const isImage = /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(
                      doc.filename ?? "",
                    );

                    return (
                      <Box
                        key={`${doc.url}-${index}`}
                        sx={{
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                          bgcolor: alpha(m.navy, 0.03),
                          overflow: "hidden",
                        }}
                      >
                        {isImage && docUrl ? (
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              height: 140,
                              bgcolor: alpha(m.navy, 0.04),
                            }}
                          >
                            <Image
                              src={docUrl}
                              alt={doc.filename}
                              fill
                              unoptimized
                              sizes="360px"
                              style={{ objectFit: "cover" }}
                            />
                          </Box>
                        ) : null}
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ px: 1.25, py: 0.9 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                            {!isImage ? (
                              <InsertDriveFileRoundedIcon
                                sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }}
                              />
                            ) : null}
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 700,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.filename}
                            </Typography>
                          </Stack>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setPersonalDocuments((prev) =>
                                prev.filter((_, docIndex) => docIndex !== index),
                              )
                            }
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    );
                  })}
                  {pendingDocumentFiles.map((file, index) => {
                    const previewUrl = pendingDocumentPreviewUrls[index];

                    return (
                      <Box
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        sx={{
                          borderRadius: "10px",
                          border: `1px dashed ${alpha(m.teal, 0.35)}`,
                          bgcolor: alpha(m.teal, 0.06),
                          overflow: "hidden",
                        }}
                      >
                        {previewUrl ? (
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              height: 140,
                              bgcolor: alpha(m.navy, 0.04),
                            }}
                          >
                            <Image
                              src={previewUrl}
                              alt={file.name}
                              fill
                              unoptimized
                              sizes="360px"
                              style={{ objectFit: "cover" }}
                            />
                          </Box>
                        ) : null}
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ px: 1.25, py: 0.9 }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ minWidth: 0 }}
                          >
                            {!previewUrl ? (
                              <InsertDriveFileRoundedIcon
                                sx={{ fontSize: 20, color: m.teal }}
                              />
                            ) : null}
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: m.teal,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {file.name}
                            </Typography>
                          </Stack>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setPendingDocumentFiles((prev) =>
                                prev.filter((_, fileIndex) => fileIndex !== index),
                              )
                            }
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      ) : null}
    </AppDrawer>
  );
}
