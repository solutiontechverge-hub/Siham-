"use client";

import * as React from "react";
import type { ProfileResponse } from "../../../store/services/profileApi";
import type { FixedLocationFormState } from "../../../app/professionals/fixed-location/fixedLocation.use";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";
import { professionalEditableFieldKeys } from "./professionalFixedLocationSetup.data";
import {
  buildProfessionalDraftFromProfile,
  getProfessionalPhotoSrcFromProfile,
  type ProfessionalEditableDraft,
} from "./useProfessionalFixedLocationSetup.helpers";
import type { ProfileValidationField } from "./useProfessionalFixedLocationSetup.types";

export type UseProfessionalFixedLocationSetupProfessionalDraftArgs = {
  profileData: ProfileResponse | null;
  values: FixedLocationFormState;
  setField: <K extends keyof FixedLocationFormState>(
    key: K,
    value: FixedLocationFormState[K],
  ) => void;
  showSnackbar: (opts: {
    severity: "error" | "warning" | "success" | "info";
    message: string;
  }) => void;
  savedProfessionalDraft: ProfessionalEditableDraft;
  setSavedProfessionalDraft: React.Dispatch<
    React.SetStateAction<ProfessionalEditableDraft>
  >;
  savedProfessionalPhotoSrc: string;
  setSavedProfessionalPhotoSrc: React.Dispatch<React.SetStateAction<string>>;
  setProfileErrors: React.Dispatch<
    React.SetStateAction<Partial<Record<ProfileValidationField, string>>>
  >;
  addedBlobUrlsRef: React.MutableRefObject<string[]>;
};

/** Professional account draft / photo editing (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupProfessionalDraft(
  args: UseProfessionalFixedLocationSetupProfessionalDraftArgs,
) {
  const {
    profileData,
    values,
    setField,
    showSnackbar,
    savedProfessionalDraft,
    setSavedProfessionalDraft,
    savedProfessionalPhotoSrc,
    setSavedProfessionalPhotoSrc,
    setProfileErrors,
    addedBlobUrlsRef,
  } = args;

  const professionalPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pendingProfessionalPhoto, setPendingProfessionalPhoto] =
    React.useState<File | null>(null);
  const onChooseProfessionalPhoto = React.useCallback(() => {
    professionalPhotoInputRef.current?.click();
  }, []);
  const onProfessionalPhotoSelected = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const url = URL.createObjectURL(file);
      addedBlobUrlsRef.current.push(url);
      setPendingProfessionalPhoto(file);
      setField("professionalPhotoSrc", url);
      setIsProfessionalEditing(true);
      e.target.value = "";
    },
    [setField, showSnackbar],
  );

  const [isProfessionalEditing, setIsProfessionalEditing] =
    React.useState(false);
  const professionalFieldsDisabled = !isProfessionalEditing;
  const hydratedProfileRef = React.useRef<string | null>(null);
  const applyProfessionalDraft = React.useCallback(
    (draft: ProfessionalEditableDraft, photoSrc: string) => {
      setField("professionalPhotoSrc", photoSrc);
      setField("companyLegalName", draft.companyLegalName);
      setField("companyCocNumber", draft.companyCocNumber);
      setField("companyVatNumber", draft.companyVatNumber);
      setField("companyStreet", draft.companyStreet);
      setField("companyStreetNumber", draft.companyStreetNumber);
      setField("companyPostalCode", draft.companyPostalCode);
      setField("companyProvince", draft.companyProvince);
      setField("companyMunicipality", draft.companyMunicipality);
      setField("companyBusinessType", draft.companyBusinessType);
      setField("companyWebsite", draft.companyWebsite);
      setField("socialInstagram", draft.socialInstagram);
      setField("socialOther", draft.socialOther);
      setField("contactFirstName", draft.contactFirstName);
      setField("contactLastName", draft.contactLastName);
      setField("contactEmail", draft.contactEmail);
      setField("contactPhone", draft.contactPhone);
      setField("contactPassword", draft.contactPassword);
      setField("contactRepeatPassword", draft.contactRepeatPassword);
    },
    [setField],
  );
  const professionalDraft = React.useMemo<ProfessionalEditableDraft>(
    () => ({
      companyLegalName: values.companyLegalName,
      companyCocNumber: values.companyCocNumber,
      companyVatNumber: values.companyVatNumber,
      companyStreet: values.companyStreet,
      companyStreetNumber: values.companyStreetNumber,
      companyPostalCode: values.companyPostalCode,
      companyProvince: values.companyProvince,
      companyMunicipality: values.companyMunicipality,
      companyBusinessType: values.companyBusinessType,
      companyWebsite: values.companyWebsite,
      socialInstagram: values.socialInstagram,
      socialOther: values.socialOther,
      contactFirstName: values.contactFirstName,
      contactLastName: values.contactLastName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      contactPassword: values.contactPassword,
      contactRepeatPassword: values.contactRepeatPassword,
    }),
    [
      values.companyBusinessType,
      values.companyCocNumber,
      values.companyLegalName,
      values.companyMunicipality,
      values.companyPostalCode,
      values.companyProvince,
      values.companyStreet,
      values.companyStreetNumber,
      values.companyVatNumber,
      values.companyWebsite,
      values.contactEmail,
      values.contactFirstName,
      values.contactLastName,
      values.contactPassword,
      values.contactPhone,
      values.contactRepeatPassword,
      values.socialInstagram,
      values.socialOther,
    ],
  );
  const isProfessionalDirty = React.useMemo(
    () =>
      Boolean(pendingProfessionalPhoto) ||
      professionalEditableFieldKeys.some(
        (key) => professionalDraft[key] !== savedProfessionalDraft[key],
      ),
    [pendingProfessionalPhoto, professionalDraft, savedProfessionalDraft],
  );
  const cancelProfessionalEditing = React.useCallback(() => {
    setPendingProfessionalPhoto(null);
    applyProfessionalDraft(savedProfessionalDraft, savedProfessionalPhotoSrc);
    setProfileErrors({});
    setIsProfessionalEditing(false);
  }, [
    applyProfessionalDraft,
    savedProfessionalDraft,
    savedProfessionalPhotoSrc,
  ]);

  React.useEffect(() => {
    if (!profileData || profileData.user_type !== "professional") {
      return;
    }

    const hydrationKey = `${profileData.id}:${profileData.updated_at}`;
    if (hydratedProfileRef.current === hydrationKey) {
      return;
    }

    const nextProfessionalDraft =
      buildProfessionalDraftFromProfile(profileData);
    const nextProfessionalPhotoSrc =
      getProfessionalPhotoSrcFromProfile(profileData);

    setPendingProfessionalPhoto(null);
    applyProfessionalDraft(nextProfessionalDraft, nextProfessionalPhotoSrc);
    setSavedProfessionalDraft(nextProfessionalDraft);
    setSavedProfessionalPhotoSrc(nextProfessionalPhotoSrc);
    hydratedProfileRef.current = hydrationKey;
  }, [applyProfessionalDraft, profileData]);

  return {
    professionalPhotoInputRef,
    pendingProfessionalPhoto,
    setPendingProfessionalPhoto,
    onChooseProfessionalPhoto,
    onProfessionalPhotoSelected,
    isProfessionalEditing,
    setIsProfessionalEditing,
    professionalFieldsDisabled,
    hydratedProfileRef,
    applyProfessionalDraft,
    professionalDraft,
    isProfessionalDirty,
    cancelProfessionalEditing,
  };
}
