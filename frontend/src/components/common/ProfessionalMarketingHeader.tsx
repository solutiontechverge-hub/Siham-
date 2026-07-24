"use client";

import * as React from "react";
import MarketingSiteHeader from "./MarketingSiteHeader";
import type { MarketingSiteHeaderProps } from "./MarketingSiteHeader";
import type {
  ProfessionalProfile,
  ProfileResponse,
} from "../../store/services/profileApi";
import { useGetProfileQuery } from "../../store/services/profileApi";

function professionalAvatarSrc(
  profile: ProfileResponse | undefined,
): string | undefined {
  if (!profile || profile.user_type !== "professional") return undefined;
  const p = profile.profile as ProfessionalProfile | null;
  const url = p?.profile_picture?.trim();
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return undefined;
}

function professionalDisplayName(
  profile: ProfileResponse | undefined,
): string | undefined {
  if (!profile || profile.user_type !== "professional") return undefined;
  const p = profile.profile as ProfessionalProfile | null;
  if (!p) return undefined;
  const legal = (p.legal_name ?? "").trim();
  if (legal) return legal;
  const fromContacts =
    `${p.contact_first_name ?? ""} ${p.contact_last_name ?? ""}`.trim();
  if (fromContacts) return fromContacts;
  return undefined;
}

/**
 * Same as {@link MarketingSiteHeader} but fills `userAvatarSrc`, `userName`, and `userLabel` from
 * `GET /api/user/profile` for signed-in professionals (header + menu avatar).
 */
export default function ProfessionalMarketingHeader(
  props: MarketingSiteHeaderProps,
) {
  const { data } = useGetProfileQuery();
  const pr = data?.data;
  const fromApi = pr?.user_type === "professional" ? pr : undefined;

  const userAvatarSrc = professionalAvatarSrc(fromApi) ?? props.userAvatarSrc;
  const userName = professionalDisplayName(fromApi) ?? props.userName;
  const userLabel = fromApi?.email ?? props.userLabel;

  return (
    <MarketingSiteHeader
      {...props}
      homeHref={props.homeHref ?? "/professionals"}
      isAuthed={props.isAuthed ?? true}
      userAvatarSrc={userAvatarSrc}
      userName={userName}
      userLabel={userLabel}
    />
  );
}
