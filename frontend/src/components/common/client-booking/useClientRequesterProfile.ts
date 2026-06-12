"use client";

import * as React from "react";
import { useAppSelector } from "../../../store/hooks";
import {
  useGetProfileQuery,
  type CompanyProfile,
  type IndividualProfile,
  type ProfessionalProfile,
  type ProfileResponse,
} from "../../../store/services/profileApi";

function readClientProfileFromStorage(userEmail?: string) {
  if (typeof window === "undefined") return { name: "", avatarUrl: undefined as string | undefined };
  try {
    const raw = window.localStorage.getItem("mollure:client_profile");
    if (!raw) return { name: "", avatarUrl: undefined };
    const data = JSON.parse(raw) as {
      email?: string;
      first_name?: string;
      last_name?: string;
      display_name?: string;
      avatar_url?: string | null;
    };
    const authedEmail = userEmail?.trim().toLowerCase();
    const persistedEmail = data?.email?.trim().toLowerCase();
    if (authedEmail && persistedEmail && authedEmail !== persistedEmail) return { name: "", avatarUrl: undefined };
    const persistedName = (data.display_name ?? "").trim();
    const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
    return {
      name: persistedName || fullName,
      avatarUrl: typeof data.avatar_url === "string" && data.avatar_url ? data.avatar_url : undefined,
    };
  } catch {
    return { name: "", avatarUrl: undefined };
  }
}

function resolveNameFromProfileResponse(profile: ProfileResponse | null | undefined): string {
  if (!profile) return "";
  if (profile.user_type === "company") {
    const p = profile.profile as CompanyProfile | null;
    return (
      p?.legal_name?.trim() ||
      `${p?.contact_first_name ?? ""} ${p?.contact_last_name ?? ""}`.trim() ||
      ""
    );
  }
  if (profile.user_type === "professional") {
    const p = profile.profile as ProfessionalProfile | null;
    return (
      `${p?.contact_first_name ?? ""} ${p?.contact_last_name ?? ""}`.trim() || p?.legal_name?.trim() || ""
    );
  }
  const p = profile.profile as IndividualProfile | null;
  return p?.display_name?.trim() || `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "";
}

export function useClientRequesterProfile() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: profileQueryData } = useGetProfileQuery();

  const requesterName = React.useMemo(() => {
    const fromApi = resolveNameFromProfileResponse(profileQueryData?.data);
    if (fromApi) return fromApi;
    const u = user as { display_name?: string; first_name?: string; last_name?: string; email?: string } | null;
    const fromAuth = u?.display_name?.trim() || `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();
    if (fromAuth) return fromAuth;
    return readClientProfileFromStorage(u?.email).name || "Guest";
  }, [profileQueryData?.data, user]);

  const requesterAvatarUrl = React.useMemo(() => {
    const individual = profileQueryData?.data?.profile as IndividualProfile | null | undefined;
    if (individual?.profile_picture) return individual.profile_picture;
    return readClientProfileFromStorage(user?.email).avatarUrl;
  }, [profileQueryData?.data?.profile, user?.email]);

  const requesterPhone = React.useMemo(() => {
    const profile = profileQueryData?.data?.profile;
    if (profile && "phone" in profile && profile.phone) return profile.phone;
    return "";
  }, [profileQueryData?.data?.profile]);

  return { requesterName, requesterAvatarUrl, requesterPhone };
}
