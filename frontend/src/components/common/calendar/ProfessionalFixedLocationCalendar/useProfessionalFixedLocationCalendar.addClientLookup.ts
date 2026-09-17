import * as React from "react";
import { useLazyLookupMollureClientByEmailQuery } from "../../../../store/services/businessApi";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";

export type UseProfessionalFixedLocationCalendarAddClientLookupArgs = {
  slotBookingScreen: SlotBookingScreen;
};

/** Add-client source + Mollure platform email lookup (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarAddClientLookup({
  slotBookingScreen,
}: UseProfessionalFixedLocationCalendarAddClientLookupArgs) {
  const [addClientSource, setAddClientSource] = React.useState<
    "" | "client-list" | "mollure-platform" | "non-mollure" | "guest"
  >("");
  const [clientListSelectedEmail, setClientListSelectedEmail] =
    React.useState("");
  const [platformEmailInput, setPlatformEmailInput] = React.useState("");
  const [platformEmailMatch, setPlatformEmailMatch] = React.useState<null | {
    id?: string;
    name: string;
    email: string;
    phone?: string | null;
    countryCode?: string | null;
    userType?: string | null;
  }>(null);
  const [platformLookupStatus, setPlatformLookupStatus] = React.useState<
    "idle" | "loading" | "found" | "not_found"
  >("idle");
  const [lookupMollureClientByEmail] = useLazyLookupMollureClientByEmailQuery();

  React.useEffect(() => {
    if (slotBookingScreen !== "add-client-choice") return;
    setAddClientSource("");
    setClientListSelectedEmail("");
    setPlatformEmailInput("");
    setPlatformEmailMatch(null);
    setPlatformLookupStatus("idle");
  }, [slotBookingScreen]);

  const platformEmailQuery = platformEmailInput.trim().toLowerCase();
  const platformEmailComplete = /^\S+@\S+\.\S+$/.test(platformEmailQuery);

  React.useEffect(() => {
    if (addClientSource !== "mollure-platform" || !platformEmailComplete) {
      setPlatformEmailMatch(null);
      setPlatformLookupStatus("idle");
      return;
    }

    let cancelled = false;
    setPlatformLookupStatus("loading");
    setPlatformEmailMatch(null);

    const timer = window.setTimeout(async () => {
      try {
        const response = await lookupMollureClientByEmail({
          email: platformEmailQuery,
        }).unwrap();
        if (cancelled) return;
        const client = response.data;
        if (!client?.email) {
          setPlatformEmailMatch(null);
          setPlatformLookupStatus("not_found");
          return;
        }
        setPlatformEmailMatch({
          id: client.id,
          name: client.name || client.email,
          email: client.email,
          phone: client.phone,
          countryCode: client.country_code,
          userType: client.user_type ?? null,
        });
        setPlatformLookupStatus("found");
      } catch {
        if (cancelled) return;
        setPlatformEmailMatch(null);
        setPlatformLookupStatus("not_found");
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    addClientSource,
    lookupMollureClientByEmail,
    platformEmailComplete,
    platformEmailQuery,
  ]);

  return {
    addClientSource,
    clientListSelectedEmail,
    lookupMollureClientByEmail,
    platformEmailComplete,
    platformEmailInput,
    platformEmailMatch,
    platformEmailQuery,
    platformLookupStatus,
    setAddClientSource,
    setClientListSelectedEmail,
    setPlatformEmailInput,
    setPlatformEmailMatch,
    setPlatformLookupStatus,
  };
}
