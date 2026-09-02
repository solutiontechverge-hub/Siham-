"use client";

import AppButton from "../AppButton";
import * as React from "react";
import Image from "next/image";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import {
  Avatar,
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
  formatTeamMemberGroupLabel,
  groupsFromTeamService,
  groupsToTeamService,
  removeTeamMemberServiceGroup,
  TEAM_SERVICE_SLOT_KEYS,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
  type TeamServiceSlots,
} from "../../../data/businessTeamMemberModal.data";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_FILE_ACCEPT,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";
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
  const [pendingDocumentFile, setPendingDocumentFile] = React.useState<File | null>(
    null,
  );

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
    if (!member) return;
    const slots = {
      slot1: "",
      slot2: "",
      slot3: "",
      slot4: "",
      slot5: "",
      slot6: "",
      slot7: "",
    } as TeamServiceSlots;
    member.assigned_services?.forEach((service, index) => {
      const key = `slot${index + 1}` as keyof TeamServiceSlots;
      if (index < 7) slots[key] = String(service.service_id ?? "");
    });
    const resolvedGroups = groupsFromTeamService(
      slots,
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
    setPendingDocumentFile(null);
    setLocationTab("FL");
  }, [member, businessCategories, serviceContext]);

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

  const displaySelectedGroups = publicDraft.selectedGroups;

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
        personalDocumentFile: pendingDocumentFile,
      }).unwrap();

      showSnackbar({ severity: "success", message: "Team member profile saved." });
      setPendingPhotoFile(null);
      setPendingDocumentFile(null);
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
      title="Team Member Profile"
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
              <Box
                onClick={() => photoInputRef.current?.click()}
                sx={{
                  position: "relative",
                  width: 96,
                  height: 96,
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
                    sizes="96px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <Avatar sx={{ width: 96, height: 96, fontWeight: 900 }}>
                    {(publicDraft.name || "T").slice(0, 1).toUpperCase()}
                  </Avatar>
                )}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha("#000", 0.12),
                  }}
                >
                  <UploadFileRoundedIcon sx={{ color: "#fff" }} />
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
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectableServices.map((option) => (
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
                      sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
                    >
                      {option.label}
                    </AppButton>
                  ))}
                </Box>
              ) : null}

              <Box
                sx={{
                  borderRadius: "10px",
                  bgcolor: alpha(m.navy, 0.045),
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  p: 1.5,
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 1 }}>
                  {businessTeamMemberModalCopy.selectedHeading}
                </Typography>
                {displaySelectedGroups.length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: alpha(m.navy, 0.5) }}>
                    {businessTeamMemberModalCopy.noSelections}
                  </Typography>
                ) : (
                  displaySelectedGroups.map((group) => (
                    <Stack
                      key={group.categoryId}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 0.75 }}
                    >
                      <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>
                        {formatTeamMemberGroupLabel(
                          group,
                          businessCategories,
                          serviceContext,
                        )}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setPublicDraft((prev) =>
                            removeTeamMemberServiceGroup(prev, group.categoryId),
                          )
                        }
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))
                )}
              </Box>
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
              </Typography>
              {personalDocuments.map((doc, index) => (
                <Stack
                  key={`${doc.url}-${index}`}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderRadius: "8px",
                    bgcolor: alpha(m.navy, 0.04),
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                    {doc.filename}
                  </Typography>
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
              ))}
              <AppButton
                tone="secondary"
                onClick={() => documentInputRef.current?.click()}
              >
                Upload document
              </AppButton>
              <input
                ref={documentInputRef}
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPendingDocumentFile(file);
                  e.target.value = "";
                }}
              />
            </Stack>
          </Paper>
        </Stack>
      ) : null}
    </AppDrawer>
  );
}
