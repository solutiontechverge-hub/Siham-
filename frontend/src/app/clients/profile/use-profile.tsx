"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { profilePageData } from "./data-profile";
import { getPersistedAuthSession } from "../../../lib/auth-storage";

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
};

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
};

function readPersistedClientProfile(): PersistedClientProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("mollure:client_profile");
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedClientProfile;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function writePersistedClientProfile(next: PersistedClientProfile) {
  try {
    window.localStorage.setItem("mollure:client_profile", JSON.stringify(next));
  } catch {
    // ignore storage failures
  }
}

export function useClientProfilePage() {
  const tokens = useProfileTokens();
  const [isSaving, setIsSaving] = React.useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = React.useState<HTMLElement | null>(
    null,
  );
  const [isManageSharingOpen, setIsManageSharingOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const [sharingVisibility, setSharingVisibility] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    for (const field of profilePageData.popovers.manageSharing.fields) {
      initial[field.key] = field.defaultChecked;
    }
    return initial;
  });

  // Start with stable empty values to avoid SSR/CSR hydration mismatches,
  // then hydrate from storage after mount.
  const [profile, setProfile] = React.useState(() => ({
    first_name: "",
    last_name: "",
    display_name: "",
    date_of_birth: "",
    gender: "",
    country_code: "",
    phone: "",
    email: "",
    avatar_url: null as string | null,
  }));

  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState<ProfileFormState>({
    firstName: profile.first_name,
    lastName: profile.last_name,
    reviewNameMode: "first_name",
    birthDate: profile.date_of_birth,
    gender: profile.gender,
    countryCode: profile.country_code,
    phone: profile.phone,
    email: profile.email,
    password: "",
    confirmPassword: "",
  });
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const displayName =
    profile
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
        profilePageData.header.userDisplayNameFallback
      : profilePageData.header.userDisplayNameFallback;

  React.useEffect(() => {
    const authedEmail = getPersistedAuthSession()?.user?.email?.trim().toLowerCase();
    const persisted = readPersistedClientProfile();
    const persistedEmail = persisted?.email?.trim().toLowerCase();
    const canUsePersisted = Boolean(persisted && persistedEmail && authedEmail && persistedEmail === authedEmail);

    const nextProfile = {
      first_name: canUsePersisted ? persisted?.first_name ?? "" : "",
      last_name: canUsePersisted ? persisted?.last_name ?? "" : "",
      display_name: canUsePersisted ? persisted?.display_name ?? "" : "",
      date_of_birth: canUsePersisted ? persisted?.date_of_birth ?? "" : "",
      gender: canUsePersisted ? persisted?.gender ?? "" : "",
      country_code: canUsePersisted ? persisted?.country_code ?? "" : "",
      phone: canUsePersisted ? persisted?.phone ?? "" : "",
      email: authedEmail ?? (canUsePersisted ? persisted?.email ?? "" : ""),
      avatar_url: (canUsePersisted ? persisted?.avatar_url : null) as string | null,
    };

    setProfile(nextProfile);
    // Keep form in sync with profile on first hydrate (do not stomp user edits).
    setForm((prev) => ({
      ...prev,
      firstName: nextProfile.first_name,
      lastName: nextProfile.last_name,
      birthDate: nextProfile.date_of_birth,
      gender: nextProfile.gender,
      countryCode: nextProfile.country_code,
      phone: nextProfile.phone,
      email: nextProfile.email,
    }));
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const setReviewNameMode = (mode: ProfileFormState["reviewNameMode"]) => {
    setForm((prev) => (prev ? { ...prev, reviewNameMode: mode } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        setErrorMessage("Password and repeat password must match.");
        return;
      }
    }

    try {
      setIsSaving(true);
      const nextProfile = {
        ...profile,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        display_name: computedDisplayName(form),
        date_of_birth: form.birthDate,
        country_code: form.countryCode.trim(),
        phone: form.phone.trim(),
        email: form.email,
        avatar_url: profile.avatar_url,
      };

      setProfile((prev) => ({
        ...prev,
        ...nextProfile,
      }));
      writePersistedClientProfile(nextProfile);
      setSuccessMessage("Profile updated.");
      setIsEditing(false);
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (_err) {
      setErrorMessage("Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const setAvatarUrl = React.useCallback((nextUrl: string | null) => {
    setProfile((prev) => {
      const nextProfile = { ...prev, avatar_url: nextUrl };
      writePersistedClientProfile(nextProfile);
      return nextProfile;
    });
  }, []);

  const fieldsDisabled = !isEditing;

  const openProfileMenu = (anchor: HTMLElement) => setProfileMenuAnchor(anchor);
  const closeProfileMenu = () => setProfileMenuAnchor(null);

  const openManageSharing = () => {
    closeProfileMenu();
    setIsManageSharingOpen(true);
  };
  const closeManageSharing = () => setIsManageSharingOpen(false);

  const openNotifications = () => setIsNotificationsOpen(true);
  const closeNotifications = () => setIsNotificationsOpen(false);

  const toggleSharingField = (key: string) => {
    setSharingVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    // Preview-only; integrate with authSlice later.
    closeProfileMenu();
  };

  return {
    tokens,
    pageBg: profilePageData.pageBg,
    profile,
    setAvatarUrl,
    form,
    isLoading: false,
    loadError: null as unknown,
    isSaving,
    isEditing,
    setIsEditing,
    successMessage,
    errorMessage,
    displayName,
    handleChange,
    setReviewNameMode,
    handleSubmit,
    fieldsDisabled,
    refetch: () => undefined,

    profileMenuAnchor,
    openProfileMenu,
    closeProfileMenu,
    isManageSharingOpen,
    openManageSharing,
    closeManageSharing,
    isNotificationsOpen,
    openNotifications,
    closeNotifications,
    sharingVisibility,
    toggleSharingField,
    handleLogout,
  };
}
