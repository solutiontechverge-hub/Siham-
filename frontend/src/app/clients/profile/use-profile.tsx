"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { profilePageData } from "./data-profile";
import { getPasswordStrength } from "../../../lib/passwordStrength";
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
  reviewNameMode: "first_name" | "last_name" | "full_name";
  birthDate: string;
  gender: string;
  countryCode: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  password: "",
  confirmPassword: "",
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

type PersistedClientProfile = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  date_of_birth?: string;
  gender?: string;
  country_code?: string;
  phone?: string;
  email?: string;
  avatar_url?: string | null;
  legal_name?: string;
  ccc_number?: string;
  vat_number?: string;
  street?: string;
  street_number?: string;
  postal_code?: string;
  province?: string;
  municipality?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  logo?: string | null;
};

function writePersistedClientProfile(next: PersistedClientProfile) {
  try {
    window.localStorage.setItem("mollure:client_profile", JSON.stringify(next));
  } catch {
    // ignore storage failures
  }
}

function inferReviewNameMode(displayName: string, firstName: string, lastName: string) {
  const fn = firstName.trim();
  const ln = lastName.trim();
  const full = `${fn} ${ln}`.trim();

  if (displayName === ln && ln) {
    return "last_name";
  }

  if (displayName === full && full) {
    return "full_name";
  }

  return "first_name";
}

function computedDisplayName(form: ProfileFormState): string {
  const fn = form.firstName.trim();
  const ln = form.lastName.trim();

  switch (form.reviewNameMode) {
    case "last_name":
      return ln;
    case "full_name":
      return `${fn} ${ln}`.trim();
    default:
      return fn;
  }
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
  const [profileMenuAnchor, setProfileMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [isManageSharingOpen, setIsManageSharingOpen] = React.useState(false);
  const [sharingVisibility, setSharingVisibility] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const field of profilePageData.popovers.manageSharing.fields) {
      initial[field.key] = field.defaultChecked;
    }
    return initial;
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState<ProfileFormState>(initialForm);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const profile = data?.data ?? null;
  const profileKind = profile?.user_type ?? "individual";
  const isCompanyProfile = profileKind === "company";

  React.useEffect(() => {
    if (!profile) {
      return;
    }

    setForm((prev) => ({
      ...mapProfileToForm(profile),
      password: prev.password,
      confirmPassword: prev.confirmPassword,
    }));
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!profile) {
      setErrorMessage("Profile not found.");
      return;
    }

    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        setErrorMessage("Password and repeat password must match.");
        return;
      }

      if (!getPasswordStrength(form.password).isStrong) {
        setErrorMessage("Only strong passwords are allowed.");
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
              password: form.password || undefined,
              confirm_password: form.confirmPassword || undefined,
            }
          : {
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              display_name: computedDisplayName(form),
              date_of_birth: form.birthDate || undefined,
              gender: form.gender || undefined,
              country_code: form.countryCode.trim() || undefined,
              phone: form.phone.trim() || undefined,
              password: form.password || undefined,
              confirm_password: form.confirmPassword || undefined,
            };

      const result = await updateProfile(payload).unwrap();

      if (result.data.user_type === "company") {
        const companyProfile = result.data.profile as CompanyProfile | null;
        writePersistedClientProfile({
          email: result.data.email,
          legal_name: companyProfile?.legal_name ?? "",
          ccc_number: companyProfile?.ccc_number ?? "",
          vat_number: companyProfile?.vat_number ?? "",
          street: companyProfile?.street ?? "",
          street_number: companyProfile?.street_number ?? "",
          postal_code: companyProfile?.postal_code ?? "",
          province: companyProfile?.province ?? "",
          municipality: companyProfile?.municipality ?? "",
          contact_first_name: companyProfile?.contact_first_name ?? "",
          contact_last_name: companyProfile?.contact_last_name ?? "",
          phone: companyProfile?.phone ?? "",
          logo: companyProfile?.logo ?? null,
        });
      } else {
        const individualProfile = result.data.profile as IndividualProfile | null;
        writePersistedClientProfile({
          first_name: individualProfile?.first_name ?? "",
          last_name: individualProfile?.last_name ?? "",
          display_name: individualProfile?.display_name ?? "",
          date_of_birth: individualProfile?.date_of_birth ?? "",
          gender: individualProfile?.gender ?? "",
          country_code: individualProfile?.country_code ?? "",
          phone: individualProfile?.phone ?? "",
          email: result.data.email,
          avatar_url: individualProfile?.profile_picture ?? null,
        });
      }

      setSuccessMessage("Profile updated.");
      setIsEditing(false);
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch {
      setErrorMessage("Could not update profile.");
    }
  };

  const setAvatarUrl = React.useCallback((nextUrl: string | null) => {
    setForm((prev) => ({ ...prev, logoOrProfilePicture: nextUrl }));
  }, []);

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
    avatarUrl: form.logoOrProfilePicture,
    setAvatarUrl,
    form,
    isLoading,
    loadError,
    isSaving,
    isEditing,
    setIsEditing,
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
