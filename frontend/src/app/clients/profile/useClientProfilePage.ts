"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { profilePageData } from "./profile.data";
import { getOptionalPhoneValidationErrors } from "../../../lib/phone-validation";
import {
  INPUT_LIMITS,
  parseCoc,
  parsePersonName,
  parseText,
  parseVat,
  rejectInvalid,
} from "../../../lib/inputSchema";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";
import {
  inferReviewNameMode,
  resolveDisplayNameFromMode,
  type ReviewNameMode,
} from "../../../lib/reviewNameDisplay";
import {
  type CompanyProfile,
  type IndividualProfile,
  type ProfileResponse,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../../store/services/profileApi";

export function useProfileTokens() {
  return useTheme().palette.mollure;
}

export type ProfileFormState = {
  firstName: string;
  lastName: string;
  reviewNameMode: ReviewNameMode;
  birthDate: string;
  gender: string;
  countryCode: string;
  phone: string;
  email: string;
  legalName: string;
  cccNumber: string;
  vatNumber: string;
  street: string;
  streetNumber: string;
  postalCode: string;
  province: string;
  municipality: string;
  contactFirstName: string;
  contactLastName: string;
  logoOrProfilePicture: string | null;
};

const initialForm: ProfileFormState = {
  firstName: "",
  lastName: "",
  reviewNameMode: "first_name",
  birthDate: "",
  gender: "",
  countryCode: "",
  phone: "",
  email: "",
  legalName: "",
  cccNumber: "",
  vatNumber: "",
  street: "",
  streetNumber: "",
  postalCode: "",
  province: "",
  municipality: "",
  contactFirstName: "",
  contactLastName: "",
  logoOrProfilePicture: null,
};

function computedDisplayName(form: ProfileFormState): string {
  return resolveDisplayNameFromMode(
    form.reviewNameMode,
    form.firstName,
    form.lastName,
  );
}

const COMPANY_FORM_KEYS = [
  "legalName",
  "cccNumber",
  "vatNumber",
  "street",
  "streetNumber",
  "postalCode",
  "province",
  "municipality",
  "contactFirstName",
  "contactLastName",
  "phone",
] as const satisfies readonly (keyof ProfileFormState)[];

const INDIVIDUAL_FORM_KEYS = [
  "firstName",
  "lastName",
  "reviewNameMode",
  "birthDate",
  "gender",
  "countryCode",
  "phone",
] as const satisfies readonly (keyof ProfileFormState)[];

function normalizeFormValue(value: string) {
  return value.trim();
}

function profileFormHasChanges(
  current: ProfileFormState,
  baseline: ProfileFormState,
  isCompany: boolean,
  hasPendingAvatar: boolean,
) {
  if (hasPendingAvatar) return true;

  const keys = isCompany ? COMPANY_FORM_KEYS : INDIVIDUAL_FORM_KEYS;
  return keys.some(
    (key) =>
      normalizeFormValue(String(current[key] ?? "")) !==
      normalizeFormValue(String(baseline[key] ?? "")),
  );
}

function mapProfileToForm(data: ProfileResponse): ProfileFormState {
  if (data.user_type === "company") {
    const profile = (data.profile ?? {}) as CompanyProfile;

    return {
      ...initialForm,
      email: data.email ?? "",
      legalName: profile.legal_name ?? "",
      cccNumber: profile.ccc_number ?? "",
      vatNumber: profile.vat_number ?? "",
      street: profile.street ?? "",
      streetNumber: profile.street_number ?? "",
      postalCode: profile.postal_code ?? "",
      province: profile.province ?? "",
      municipality: profile.municipality ?? "",
      contactFirstName: profile.contact_first_name ?? "",
      contactLastName: profile.contact_last_name ?? "",
      phone: profile.phone ?? "",
      logoOrProfilePicture: profile.logo ?? null,
    };
  }

  const profile = (data.profile ?? {}) as IndividualProfile;
  const displayName = profile.display_name ?? "";

  return {
    ...initialForm,
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    reviewNameMode: inferReviewNameMode(
      displayName,
      profile.first_name ?? "",
      profile.last_name ?? "",
    ),
    birthDate: profile.date_of_birth ?? "",
    gender: profile.gender ?? "",
    countryCode: profile.country_code ?? "",
    phone: profile.phone ?? "",
    email: data.email ?? "",
    logoOrProfilePicture: profile.profile_picture ?? null,
  };
}

export function useClientProfilePage() {
  const tokens = useProfileTokens();
  const { data, isLoading, error: loadError, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [profileMenuAnchor, setProfileMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [isManageSharingOpen, setIsManageSharingOpen] = React.useState(false);
  const [sharingVisibility, setSharingVisibility] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    for (const field of profilePageData.popovers.manageSharing.fields) {
      initial[field.key] = field.defaultChecked;
    }
    return initial;
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState<ProfileFormState>(initialForm);
  const [pendingAvatarFile, setPendingAvatarFile] = React.useState<File | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const profile = data?.data ?? null;
  const profileKind = profile?.user_type ?? "individual";
  const isCompanyProfile = profileKind === "company";

  const avatarObjectUrl = React.useMemo(() => {
    if (!pendingAvatarFile) return null;
    return URL.createObjectURL(pendingAvatarFile);
  }, [pendingAvatarFile]);

  React.useEffect(() => {
    return () => {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    };
  }, [avatarObjectUrl]);

  const prevProfileVersionRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!profile) {
      prevProfileVersionRef.current = null;
      return;
    }
    const version = `${profile.id}:${profile.updated_at}`;
    if (prevProfileVersionRef.current === null) {
      prevProfileVersionRef.current = version;
      return;
    }
    if (prevProfileVersionRef.current !== version) {
      prevProfileVersionRef.current = version;
      setPendingAvatarFile(null);
    }
  }, [profile?.id, profile?.updated_at, profile]);

  React.useEffect(() => {
    if (!profile) {
      return;
    }

    setForm(mapProfileToForm(profile));
  }, [profile]);

  const clearMessages = React.useCallback(() => {
    setSuccessMessage("");
    setErrorMessage("");
  }, []);

  const displayName = React.useMemo(() => {
    if (!profile) {
      return profilePageData.header.userDisplayNameFallback;
    }

    if (profile.user_type === "company") {
      const companyProfile = profile.profile as CompanyProfile | null;
      return (
        companyProfile?.legal_name ||
        `${companyProfile?.contact_first_name ?? ""} ${companyProfile?.contact_last_name ?? ""}`.trim() ||
        profilePageData.header.userDisplayNameFallback
      );
    }

    const individualProfile = profile.profile as IndividualProfile | null;
    return (
      `${individualProfile?.first_name ?? ""} ${individualProfile?.last_name ?? ""}`.trim() ||
      individualProfile?.display_name ||
      profilePageData.header.userDisplayNameFallback
    );
  }, [profile]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setReviewNameMode = (mode: ProfileFormState["reviewNameMode"]) => {
    setForm((prev) => ({ ...prev, reviewNameMode: mode }));
  };

  const baselineForm = React.useMemo(
    () => (profile ? mapProfileToForm(profile) : null),
    [profile],
  );

  const hasProfileChanges = React.useMemo(() => {
    if (!baselineForm) return false;
    return profileFormHasChanges(
      form,
      baselineForm,
      isCompanyProfile,
      Boolean(pendingAvatarFile),
    );
  }, [form, baselineForm, isCompanyProfile, pendingAvatarFile]);

  const toggleEditing = React.useCallback(() => {
    setIsEditing((editing) => {
      const next = !editing;
      if (!next && profile) {
        setForm(mapProfileToForm(profile));
        setPendingAvatarFile(null);
        clearMessages();
      }
      return next;
    });
  }, [profile, clearMessages]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!profile) {
      setErrorMessage("Profile not found.");
      return;
    }

    if (!hasProfileChanges) {
      return;
    }

    const schema = isCompanyProfile
      ? rejectInvalid({
          legalName: parseText(form.legalName, {
            label: "Legal name",
            max: INPUT_LIMITS.personName,
          }),
          cccNumber: parseCoc(form.cccNumber, { required: false }),
          vatNumber: parseVat(form.vatNumber, { required: false }),
          street: parseText(form.street, {
            required: false,
            label: "Street",
            max: INPUT_LIMITS.textShort,
          }),
          streetNumber: parseText(form.streetNumber, {
            required: false,
            label: "Street number",
            max: INPUT_LIMITS.streetNumber,
          }),
          postalCode: parseText(form.postalCode, {
            required: false,
            label: "Postal code",
            max: INPUT_LIMITS.postalCode,
          }),
          province: parseText(form.province, {
            required: false,
            label: "Province",
            max: INPUT_LIMITS.textShort,
          }),
          municipality: parseText(form.municipality, {
            required: false,
            label: "Municipality",
            max: INPUT_LIMITS.textShort,
          }),
          contactFirstName: parsePersonName(form.contactFirstName, {
            required: false,
            label: "First name",
          }),
          contactLastName: parsePersonName(form.contactLastName, {
            required: false,
            label: "Last name",
          }),
          phone: parseText(form.phone, {
            required: false,
            label: "Phone",
            max: 32,
          }),
        })
      : rejectInvalid({
          firstName: parsePersonName(form.firstName, { label: "First name" }),
          lastName: parsePersonName(form.lastName, { label: "Last name" }),
          phone: parseText(form.phone, {
            required: false,
            label: "Phone",
            max: 32,
          }),
          gender: parseText(form.gender, {
            required: false,
            label: "Gender",
            max: 32,
          }),
        });

    if (!schema.ok) {
      const first = Object.values(schema.errors).find(Boolean);
      setErrorMessage(first || "Please check your profile details.");
      return;
    }

    if (!isCompanyProfile) {
      const phoneErrors = getOptionalPhoneValidationErrors(
        form.countryCode,
        form.phone,
      );
      if (phoneErrors.phone || phoneErrors.countryCode) {
        setErrorMessage(
          phoneErrors.phone ??
            phoneErrors.countryCode ??
            "Enter a valid phone number.",
        );
        return;
      }
    }

    try {
      const payload =
        profile.user_type === "company"
          ? {
              legal_name: form.legalName.trim(),
              ccc_number: form.cccNumber.trim(),
              vat_number: form.vatNumber.trim(),
              street: form.street.trim(),
              street_number: form.streetNumber.trim(),
              postal_code: form.postalCode.trim(),
              province: form.province.trim(),
              municipality: form.municipality.trim(),
              contact_first_name: form.contactFirstName.trim(),
              contact_last_name: form.contactLastName.trim(),
              phone: form.phone.trim(),
            }
          : {
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              display_name: computedDisplayName(form),
              date_of_birth: form.birthDate || undefined,
              gender: form.gender || undefined,
              country_code: form.countryCode.trim() || undefined,
              phone: form.phone.trim() || undefined,
            };

      let result;
      if (pendingAvatarFile) {
        const fd = new FormData();
        for (const [key, value] of Object.entries(payload)) {
          if (value === undefined || value === "") continue;
          fd.append(key, String(value));
        }
        if (profile.user_type === "company") {
          fd.append("logo", pendingAvatarFile);
        } else {
          fd.append("profile_picture", pendingAvatarFile);
        }
        result = await updateProfile(fd).unwrap();
      } else {
        result = await updateProfile(payload).unwrap();
      }

      setPendingAvatarFile(null);
      setSuccessMessage("Profile updated.");
      setIsEditing(false);
    } catch {
      setErrorMessage("Could not update profile.");
    }
  };

  const registerAvatarFile = React.useCallback(
    (file: File | null) => {
      if (!isEditing) return;
      if (!file) {
        setPendingAvatarFile(null);
        return;
      }
      if (!isAllowedProfileImageFile(file)) {
        setErrorMessage(PROFILE_IMAGE_INVALID_MESSAGE);
        return;
      }
      setErrorMessage("");
      setPendingAvatarFile(file);
    },
    [isEditing],
  );

  const fieldsDisabled = !isEditing;

  const openProfileMenu = (anchor: HTMLElement) => setProfileMenuAnchor(anchor);
  const closeProfileMenu = () => setProfileMenuAnchor(null);

  const openManageSharing = () => {
    closeProfileMenu();
    setIsManageSharingOpen(true);
  };
  const closeManageSharing = () => setIsManageSharingOpen(false);

  const toggleSharingField = (key: string) => {
    setSharingVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    closeProfileMenu();
  };

  return {
    tokens,
    pageBg: profilePageData.pageBg,
    profile,
    profileKind,
    isCompanyProfile,
    avatarUrl: avatarObjectUrl ?? form.logoOrProfilePicture,
    registerAvatarFile,
    form,
    isLoading,
    loadError,
    isSaving,
    isEditing,
    setIsEditing,
    toggleEditing,
    hasProfileChanges,
    successMessage,
    errorMessage,
    clearMessages,
    displayName,
    handleChange,
    setReviewNameMode,
    handleSubmit,
    fieldsDisabled,
    refetch,
    profileMenuAnchor,
    openProfileMenu,
    closeProfileMenu,
    isManageSharingOpen,
    openManageSharing,
    closeManageSharing,
    sharingVisibility,
    toggleSharingField,
    handleLogout,
  };
}
