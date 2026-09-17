"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type {
  ProfileResponse,
  UpdateProfilePayload,
} from "../../../store/services/profileApi";
import AppButton from "../AppButton";
import {
  MollureLabeledField,
  MollureLabeledPasswordField,
  MollureTextField,
} from "../MollureLabeledFields";
import { PROFILE_IMAGE_FILE_ACCEPT } from "../../../lib/profileImageUpload";
import { Typography } from "../../ui/typography";
import {
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";
import { BUSINESS_TYPE_OPTIONS } from "../../../data/businessRegistration.data";
import {
  NETHERLANDS_MUNICIPALITY_SHORTLIST as MUNICIPALITY_OPTIONS,
  NETHERLANDS_PROVINCE_OPTIONS as PROVINCE_OPTIONS,
} from "../../../data/netherlandsLocations.data";
import {
  getProfessionalPhotoSrcFromProfile,
  type ProfessionalEditableDraft,
  type ProfileValidationField,
} from "./useProfessionalFixedLocationSetup";

type AccountFormValues = ProfessionalEditableDraft & {
  professionalPhotoSrc: string;
};

export type ProfessionalAccountSectionProps = {
  m: Theme["palette"]["mollure"];
  values: AccountFormValues;
  setField: <K extends keyof AccountFormValues>(
    key: K,
    value: AccountFormValues[K],
  ) => void;
  profileErrors: Partial<Record<ProfileValidationField, string>>;
  setProfileErrors: React.Dispatch<
    React.SetStateAction<Partial<Record<ProfileValidationField, string>>>
  >;
  professionalFieldsDisabled: boolean;
  professionalPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  onChooseProfessionalPhoto: () => void;
  onProfessionalPhotoSelected: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  isProfessionalEditing: boolean;
  isProfessionalDirty: boolean;
  isProfileSaving: boolean;
  cancelProfessionalEditing: () => void;
  onSaveProfessionalProfile?: (
    payload: UpdateProfilePayload,
  ) => Promise<ProfileResponse | void>;
  pendingProfessionalPhoto: File | null;
  setPendingProfessionalPhoto: (file: File | null) => void;
  professionalDraft: ProfessionalEditableDraft;
  savedProfessionalPhotoSrc: string;
  setSavedProfessionalDraft: (draft: ProfessionalEditableDraft) => void;
  setSavedProfessionalPhotoSrc: (src: string) => void;
  applyProfessionalDraft: (
    draft: ProfessionalEditableDraft,
    photoSrc: string,
  ) => void;
  setIsProfessionalEditing: (editing: boolean) => void;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  // letters (including accented), spaces, apostrophes, and hyphens — no digits
  return /^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF' -]+$/.test(trimmed);
}

export function ProfessionalAccountSection({
  m,
  values,
  setField,
  profileErrors,
  setProfileErrors,
  professionalFieldsDisabled,
  professionalPhotoInputRef,
  onChooseProfessionalPhoto,
  onProfessionalPhotoSelected,
  isProfessionalEditing,
  isProfessionalDirty,
  isProfileSaving,
  cancelProfessionalEditing,
  onSaveProfessionalProfile,
  pendingProfessionalPhoto,
  setPendingProfessionalPhoto,
  professionalDraft,
  savedProfessionalPhotoSrc,
  setSavedProfessionalDraft,
  setSavedProfessionalPhotoSrc,
  applyProfessionalDraft,
  setIsProfessionalEditing,
}: ProfessionalAccountSectionProps) {
  const professionalForm = (
  <Stack spacing={2.1}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        onClick={onChooseProfessionalPhoto}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChooseProfessionalPhoto();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Choose profile picture"
        sx={{
          width: 90,
          height: 90,
          borderRadius: "999px",
          overflow: "hidden",
          bgcolor: alpha(m.navy, 0.06),
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          flex: "0 0 auto",
          position: "relative",
          cursor: "pointer",
          outline: "none",
          "&:hover": {
            borderColor: alpha(m.navy, 0.18),
            bgcolor: alpha(m.navy, 0.08),
          },
          "&:focus-visible": {
            boxShadow: `0 0 0 3px ${alpha(m.teal, 0.35)}`,
          },
        }}
      >
        {values.professionalPhotoSrc ? (
          /^https?:\/\//i.test(values.professionalPhotoSrc) ? (
            <Box
              component="img"
              src={values.professionalPhotoSrc}
              alt="Profile"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                pointerEvents: "none",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                position: "relative",
              }}
            >
              <Image
                src={values.professionalPhotoSrc}
                alt="Profile"
                width={90}
                height={90}
                unoptimized
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          )
        ) : null}
        <IconButton
          size="small"
          onClick={(ev) => {
            ev.stopPropagation();
            onChooseProfessionalPhoto();
          }}
          sx={{
            position: "absolute",
            right: -6,
            bottom: -6,
            width: 32,
            height: 32,
            bgcolor: "#F2F4F7",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            boxShadow: `0 10px 24px ${alpha(m.navy, 0.12)}`,
            "&:hover": { bgcolor: "#EEF2F6" },
          }}
          aria-label="Change profile picture"
        >
          <EditOutlinedIcon
            sx={{ fontSize: 18, color: alpha(m.navy, 0.65) }}
          />
        </IconButton>
      </Box>
      <Typography sx={mollurePageTitleSx(m.navy)}>
        Profile Picture
      </Typography>
      <Box sx={{ flex: 1 }} />
      <input
        ref={professionalPhotoInputRef}
        type="file"
        accept={PROFILE_IMAGE_FILE_ACCEPT}
        hidden
        onChange={onProfessionalPhotoSelected}
      />
    </Stack>

    <Box>
      <Typography sx={mollureSectionTitleSx(m.navy, { mb: 1 })}>
        Company Information
      </Typography>
      <Divider sx={{ mb: 1.5, borderColor: alpha(m.navy, 0.1) }} />
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <MollureLabeledField
            fieldLabel="Legal Name"
            labelPlacement="inCell"
            placeholder="e.g. Jane"
            value={values.companyLegalName}
            onChange={(e) => {
              setField("companyLegalName", e.target.value);
              setProfileErrors((prev) =>
                prev.companyLegalName
                  ? { ...prev, companyLegalName: undefined }
                  : prev,
              );
            }}
            disabled={professionalFieldsDisabled}
            error={Boolean(profileErrors.companyLegalName)}
            helperText={profileErrors.companyLegalName}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="COC number"
            labelPlacement="inCell"
            placeholder="12345678"
            value={values.companyCocNumber}
            onChange={(e) => setField("companyCocNumber", e.target.value)}
            disabled={professionalFieldsDisabled}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="VAT number"
            labelPlacement="inCell"
            placeholder="NL123456789B01"
            value={values.companyVatNumber}
            onChange={(e) => setField("companyVatNumber", e.target.value)}
            disabled={professionalFieldsDisabled}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              color: alpha(m.navy, 0.62),
              mb: 0.75,
            }}
          >
            Business Address
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="Street"
            labelPlacement="inCell"
            placeholder="e.g. Damrak"
            value={values.companyStreet}
            onChange={(e) => setField("companyStreet", e.target.value)}
            disabled={professionalFieldsDisabled}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="Number"
            labelPlacement="inCell"
            placeholder="e.g. 1"
            value={values.companyStreetNumber}
            onChange={(e) => setField("companyStreetNumber", e.target.value)}
            disabled={professionalFieldsDisabled}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="Postal Code"
            labelPlacement="inCell"
            placeholder="e.g. 1012 LG"
            value={values.companyPostalCode}
            onChange={(e) => setField("companyPostalCode", e.target.value)}
            disabled={professionalFieldsDisabled}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="Province"
            labelPlacement="inCell"
            select
            value={values.companyProvince}
            onChange={(e) => setField("companyProvince", e.target.value)}
            disabled={professionalFieldsDisabled}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">
              <em>Select Province</em>
            </MenuItem>
            {PROVINCE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </MollureLabeledField>
        </Grid>
        <Grid item xs={12}>
          <MollureLabeledField
            fieldLabel="Municipality"
            labelPlacement="inCell"
            select
            value={values.companyMunicipality}
            onChange={(e) => setField("companyMunicipality", e.target.value)}
            disabled={professionalFieldsDisabled}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">
              <em>Select Municipality</em>
            </MenuItem>
            {MUNICIPALITY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </MollureLabeledField>
        </Grid>
        <Grid item xs={12}>
          <MollureLabeledField
            fieldLabel="Select Business Type"
            labelPlacement="inCell"
            select
            value={values.companyBusinessType}
            onChange={(e) => setField("companyBusinessType", e.target.value)}
            disabled={professionalFieldsDisabled}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                const value = String(selected ?? "");
                if (!value) {
                  return (
                    <Box
                      component="span"
                      sx={{ color: (theme) => theme.palette.mollure.placeholder }}
                    >
                      Select business type
                    </Box>
                  );
                }
                const option = BUSINESS_TYPE_OPTIONS.find(
                  (entry) => entry.value === value,
                );
                return option?.label ?? value;
              },
            }}
          >
            <MenuItem value="">
              <em>Select business type</em>
            </MenuItem>
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </MollureLabeledField>
        </Grid>
      </Grid>
    </Box>

    <Box>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: alpha(m.navy, 0.82),
          mb: 1,
        }}
      >
        Portfolio links
      </Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={4}>
          <MollureTextField
            placeholder="Website"
            value={values.companyWebsite}
            onChange={(e) => setField("companyWebsite", e.target.value)}
            disabled={professionalFieldsDisabled}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MollureTextField
            placeholder="Instagram"
            value={values.socialInstagram}
            onChange={(e) => setField("socialInstagram", e.target.value)}
            disabled={professionalFieldsDisabled}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MollureTextField
            placeholder="Other"
            value={values.socialOther}
            onChange={(e) => setField("socialOther", e.target.value)}
            disabled={professionalFieldsDisabled}
          />
        </Grid>
      </Grid>
    </Box>

    <Box>
      <Typography sx={mollureSectionTitleSx(m.navy, { mb: 1 })}>
        Contact Person
      </Typography>
      <Divider sx={{ mb: 1.5, borderColor: alpha(m.navy, 0.1) }} />
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="First Name"
            labelPlacement="inCell"
            placeholder="e.g. Jane"
            value={values.contactFirstName}
            onChange={(e) => {
              setField("contactFirstName", e.target.value);
              setProfileErrors((prev) =>
                prev.contactFirstName
                  ? { ...prev, contactFirstName: undefined }
                  : prev,
              );
            }}
            disabled={professionalFieldsDisabled}
            error={Boolean(profileErrors.contactFirstName)}
            helperText={profileErrors.contactFirstName}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledField
            fieldLabel="Last Name"
            labelPlacement="inCell"
            placeholder="e.g. Doe"
            value={values.contactLastName}
            onChange={(e) => {
              setField("contactLastName", e.target.value);
              setProfileErrors((prev) =>
                prev.contactLastName
                  ? { ...prev, contactLastName: undefined }
                  : prev,
              );
            }}
            disabled={professionalFieldsDisabled}
            error={Boolean(profileErrors.contactLastName)}
            helperText={profileErrors.contactLastName}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <MollureLabeledField
            fieldLabel="Email"
            labelPlacement="inCell"
            placeholder="you@gmail.com"
            value={values.contactEmail}
            onChange={(e) => {
              setField("contactEmail", e.target.value);
              setProfileErrors((prev) =>
                prev.contactEmail
                  ? { ...prev, contactEmail: undefined }
                  : prev,
              );
            }}
            disabled={professionalFieldsDisabled}
            error={Boolean(profileErrors.contactEmail)}
            helperText={profileErrors.contactEmail}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledPasswordField
            fieldLabel="Password"
            labelPlacement="inCell"
            placeholder="Enter password"
            value={values.contactPassword}
            onChange={(e) => {
              setField("contactPassword", e.target.value);
              setProfileErrors((prev) =>
                prev.contactPassword
                  ? { ...prev, contactPassword: undefined }
                  : prev,
              );
            }}
            disabled={professionalFieldsDisabled}
            error={Boolean(profileErrors.contactPassword)}
            helperText={profileErrors.contactPassword}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureLabeledPasswordField
            fieldLabel="Repeat password"
            labelPlacement="inCell"
            placeholder="Confirm password"
            value={values.contactRepeatPassword}
            onChange={(e) => {
              setField("contactRepeatPassword", e.target.value);
              setProfileErrors((prev) =>
                prev.contactRepeatPassword
                  ? { ...prev, contactRepeatPassword: undefined }
                  : prev,
              );
            }}
            disabled={professionalFieldsDisabled}
            error={Boolean(profileErrors.contactRepeatPassword)}
            helperText={profileErrors.contactRepeatPassword}
            required
          />
        </Grid>
      </Grid>
    </Box>

    <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 2 }}>
      <Link href="/terms-and-conditions" style={{ textDecoration: "none" }}>
        <Typography
          sx={{
            color: "primary.main",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Terms & Conditions
        </Typography>
      </Link>
      <Link href="/policies" style={{ textDecoration: "none" }}>
        <Typography
          sx={{
            color: "primary.main",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Policies
        </Typography>
      </Link>
    </Box>
  </Stack>
  );


  return (
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={2.1}>
        {professionalForm}

      {isProfessionalEditing ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{ mt: 0.5 }}
        >
          <AppButton
            tone="secondary"
            fullWidth
            onClick={cancelProfessionalEditing}
            disabled={isProfileSaving}
            sx={{
              minHeight: 44,
            }}
          >
            Cancel
          </AppButton>
          <AppButton
            tone="primary"
            fullWidth
            onClick={async () => {
              if (!onSaveProfessionalProfile) {
                setIsProfessionalEditing(false);
                return;
              }

              const nextErrors: Partial<
                Record<ProfileValidationField, string>
              > = {};
              if (!isValidEmail(values.contactEmail))
                nextErrors.contactEmail = "Enter a valid email address.";
              if (!isValidName(values.companyLegalName))
                nextErrors.companyLegalName = "Enter a valid legal name.";
              if (!isValidName(values.contactFirstName))
                nextErrors.contactFirstName = "Enter a valid first name.";
              if (!isValidName(values.contactLastName))
                nextErrors.contactLastName = "Enter a valid last name.";

              const password = values.contactPassword.trim();
              const repeatPassword = values.contactRepeatPassword.trim();
              if (password || repeatPassword) {
                if (!password)
                  nextErrors.contactPassword = "Password is required.";
                if (!repeatPassword)
                  nextErrors.contactRepeatPassword =
                    "Repeat password is required.";
                if (
                  password &&
                  repeatPassword &&
                  password !== repeatPassword
                ) {
                  nextErrors.contactRepeatPassword =
                    "Password and repeat password must match.";
                }
              }

              if (Object.keys(nextErrors).length) {
                setProfileErrors(nextErrors);
                return;
              }

              const jsonPayload = {
                email: values.contactEmail,
                password: values.contactPassword || undefined,
                confirm_password: values.contactRepeatPassword || undefined,
                legal_name: values.companyLegalName,
                ccc_number: values.companyCocNumber,
                vat_number: values.companyVatNumber,
                street: values.companyStreet,
                street_number: values.companyStreetNumber,
                postal_code: values.companyPostalCode,
                province: values.companyProvince,
                municipality: values.companyMunicipality,
                business_type: values.companyBusinessType,
                website: values.companyWebsite,
                instagram: values.socialInstagram,
                other_link: values.socialOther,
                contact_first_name: values.contactFirstName,
                contact_last_name: values.contactLastName,
                phone: values.contactPhone,
              };

              let updated: ProfileResponse | void;
              if (pendingProfessionalPhoto) {
                const fd = new FormData();
                for (const [key, value] of Object.entries(jsonPayload)) {
                  if (value === undefined || value === "") continue;
                  fd.append(key, String(value));
                }
                fd.append("profile_picture", pendingProfessionalPhoto);
                updated = await onSaveProfessionalProfile(fd);
              } else {
                updated = await onSaveProfessionalProfile(jsonPayload);
              }

              const nextPhotoSrc =
                updated && updated.user_type === "professional"
                  ? getProfessionalPhotoSrcFromProfile(updated)
                  : savedProfessionalPhotoSrc;

              const nextSavedProfessionalDraft = {
                ...professionalDraft,
                contactPassword: "",
                contactRepeatPassword: "",
              };
              setSavedProfessionalDraft(nextSavedProfessionalDraft);
              setSavedProfessionalPhotoSrc(nextPhotoSrc);
              applyProfessionalDraft(
                nextSavedProfessionalDraft,
                nextPhotoSrc,
              );
              setPendingProfessionalPhoto(null);
              setProfileErrors({});
              setIsProfessionalEditing(false);
            }}
            disabled={!isProfessionalDirty || isProfileSaving}
            sx={{
              minHeight: 44,
            }}
          >
            {isProfileSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Update"
            )}
          </AppButton>
        </Stack>
      ) : null}
      </Stack>
    </Box>
  );
}
