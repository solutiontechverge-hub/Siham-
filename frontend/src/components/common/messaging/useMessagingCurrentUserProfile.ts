"use client";

import * as React from "react";
import { useAppSelector } from "../../../store/hooks";
import { CLIENT_PROFILE_KEY } from "../../../lib/auth-storage";
import {
  useGetProfileQuery,
  type CompanyProfile,
  type IndividualProfile,
  type ProfessionalProfile,
} from "../../../store/services/profileApi";
import { useGetBusinessSetupQuery } from "../../../store/services/businessApi";
import type { MessagingAudience } from "./messagingRoutes";

function resolveProfilePictureUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return undefined;
}

function readPersistedClientProfile(authedEmail?: string | null) {
  try {
    const raw = window.localStorage.getItem(CLIENT_PROFILE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      avatar_url?: string | null;
      email?: string;
      first_name?: string;
      last_name?: string;
      display_name?: string;
    };
    const persistedEmail = data?.email?.trim().toLowerCase();
    const email = authedEmail?.trim().toLowerCase();
    if (email && persistedEmail && email !== persistedEmail) return null;
    return data;
  } catch {
    return null;
  }
}

/** Current user's display name + avatar for messaging chrome (sidebar header, etc.). */
export function useMessagingCurrentUserProfile(audience: MessagingAudience) {
  const user = useAppSelector((s) => s.auth.user);
  const { data: profileEnvelope } = useGetProfileQuery();
  const { data: businessSetupEnvelope } = useGetBusinessSetupQuery(undefined, {
    skip: audience !== "professional",
  });

  const fallbackDisplayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();

  return React.useMemo(() => {
    let userName =
      fallbackDisplayName.trim() ||
      (audience === "client" ? "User" : "Professional");
    let avatarUrl: string | undefined;

    if (audience === "client") {
      const persisted = typeof window !== "undefined"
        ? readPersistedClientProfile(user?.email)
        : null;
      if (persisted) {
        const fromLocal = resolveProfilePictureUrl(persisted.avatar_url);
        if (fromLocal) avatarUrl = fromLocal;
        const persistedName = (persisted.display_name ?? "").trim();
        const fullName =
          `${persisted.first_name ?? ""} ${persisted.last_name ?? ""}`.trim();
        const resolved = persistedName || fullName;
        if (resolved) userName = resolved;
      }

      const profile = profileEnvelope?.data;
      if (profile && (profile.user_type === "individual" || profile.user_type === "company")) {
        if (profile.user_type === "company") {
          const company = profile.profile as CompanyProfile | null;
          const fromApi = resolveProfilePictureUrl(company?.logo);
          if (fromApi) avatarUrl = fromApi;
          const companyName =
            (company?.legal_name ?? "").trim() ||
            `${company?.contact_first_name ?? ""} ${company?.contact_last_name ?? ""}`.trim();
          if (companyName) userName = companyName;
        } else {
          const individual = profile.profile as IndividualProfile | null;
          const fromApi = resolveProfilePictureUrl(individual?.profile_picture);
          if (fromApi) avatarUrl = fromApi;
          const display = (individual?.display_name ?? "").trim();
          const fullName =
            `${individual?.first_name ?? ""} ${individual?.last_name ?? ""}`.trim();
          const resolved = display || fullName;
          if (resolved) userName = resolved;
        }
      }
    } else {
      const setup = businessSetupEnvelope?.data;
      const businessName = (setup?.business_name ?? "").trim();
      const salonName = (setup?.salon_name ?? "").trim();
      if (businessName || salonName) {
        userName = businessName || salonName;
      }

      const mediaUrl = resolveProfilePictureUrl(setup?.business_media?.[0]);
      if (mediaUrl) {
        avatarUrl = mediaUrl;
      } else {
        const profile = profileEnvelope?.data;
        if (profile?.user_type === "professional") {
          const pro = profile.profile as ProfessionalProfile | null;
          avatarUrl = resolveProfilePictureUrl(pro?.profile_picture);
          if (!businessName && !salonName) {
            const legal = (pro?.legal_name ?? "").trim();
            const fromContacts =
              `${pro?.contact_first_name ?? ""} ${pro?.contact_last_name ?? ""}`.trim();
            const resolved = legal || fromContacts;
            if (resolved) userName = resolved;
          }
        }
      }
    }

    return { userName, avatarUrl };
  }, [
    audience,
    businessSetupEnvelope?.data,
    fallbackDisplayName,
    profileEnvelope?.data,
    user?.email,
  ]);
}
