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
  const { data: profileQueryData, isLoading: isProfileLoading } = useGetProfileQuery();

  const requesterName = React.useMemo(() => {
    const fromApi = resolveNameFromProfileResponse(profileQueryData?.data);
    if (fromApi) return fromApi;
    const u = user as { display_name?: string; first_name?: string; last_name?: string; email?: string } | null;
    const fromAuth = u?.display_name?.trim() || `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();
    if (fromAuth) return fromAuth;
    return "Guest";
  }, [profileQueryData?.data, user]);

  const requesterAvatarUrl = React.useMemo(() => {
    const individual = profileQueryData?.data?.profile as IndividualProfile | null | undefined;
    return individual?.profile_picture || undefined;
  }, [profileQueryData?.data?.profile]);

  const requesterCountryCode = React.useMemo(() => {
    const profile = profileQueryData?.data?.profile;
    if (profile && "country_code" in profile && profile.country_code) {
      return profile.country_code;
    }
    return "";
  }, [profileQueryData?.data?.profile]);

  const requesterPhone = React.useMemo(() => {
    const profile = profileQueryData?.data?.profile;
    if (profile && "phone" in profile && profile.phone) return String(profile.phone).trim();
    return "";
  }, [profileQueryData?.data?.profile]);

  return {
    requesterName,
    requesterAvatarUrl,
    requesterCountryCode,
    requesterPhone,
    isProfileLoading,
  };
}
