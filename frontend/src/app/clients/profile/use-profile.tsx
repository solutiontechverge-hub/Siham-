"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { profilePageData } from "./data-profile";

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

  // Preview-only state. Replace with backend GET/PATCH when ready.
  const [profile, setProfile] = React.useState({
    first_name: "Sara",
    last_name: "Johnson",
    display_name: "Sara",
    date_of_birth: "1998-06-12",
    gender: "female",
    country_code: "+44",
    phone: "+442xxxxxxxxxxx",
    email: "You@gmail.com",
    avatar_url: null as string | null,
  });

  const [isEditing, setIsEditing] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = React.useState(false);
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
      setProfile((prev) => ({
        ...prev,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        display_name: computedDisplayName(form),
        date_of_birth: form.birthDate,
        country_code: form.countryCode.trim(),
        phone: form.phone.trim(),
      }));
      setSuccessMessage("Profile updated.");
      setIsEditing(false);
      setShowPassword(false);
      setShowRepeatPassword(false);
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (_err) {
      setErrorMessage("Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };

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
    form,
    isLoading: false,
    loadError: null as unknown,
    isSaving,
    isEditing,
    setIsEditing,
    showPassword,
    setShowPassword,
    showRepeatPassword,
    setShowRepeatPassword,
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
