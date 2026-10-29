import * as React from "react";
import type { CalendarBookingGuestItem } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { resolveDesiredVisitMunicipalityOptions } from "../../../../data/businessPublicProfile.data";
import type { BusinessPublicProfileDesiredLocation } from "../../../../data/businessPublicProfile.data";

export type UseProfessionalFixedLocationCalendarDrawerParticipantStateArgs = {
  desiredLocationSetup?: BusinessPublicProfileDesiredLocation | null;
  kilometerAllowanceEurPerKmDefault?: string;
};

/** Inline guest / buffer / project / DL drafts (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerParticipantState({
  desiredLocationSetup = null,
  kilometerAllowanceEurPerKmDefault,
}: UseProfessionalFixedLocationCalendarDrawerParticipantStateArgs) {
  const [showInlineGuestField, setShowInlineGuestField] = React.useState(false);
  const [inlineGuestDraft, setInlineGuestDraft] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "",
    phoneNumber: "",
  });
  const [editingInlineGuestId, setEditingInlineGuestId] = React.useState<
    string | null
  >(null);
  const [inlineGuestParticipantType, setInlineGuestParticipantType] =
    React.useState<"guest" | "model">("guest");
  const [bookingProjectEnabled, setBookingProjectEnabled] =
    React.useState(false);
  const [bookingProjectDescription, setBookingProjectDescription] =
    React.useState("");
  const [bookingProjectUploads, setBookingProjectUploads] = React.useState<
    Array<{
      id: string;
      name: string;
      previewUrl?: string;
      file?: File;
      url?: string;
      mimeType?: string;
      kind?: "image" | "document";
    }>
  >([]);
  const projectFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [bufferDraft, setBufferDraft] = React.useState({
    title: "",
    teamMemberIds: [] as string[],
    durationMins: "",
    startTime: "",
    endTime: "",
  });
  const [editingBufferId, setEditingBufferId] = React.useState<string | null>(
    null,
  );
  const [bookingGuests, setBookingGuests] = React.useState<
    CalendarBookingGuestItem[]
  >([]);
  const [desiredLocationDraft, setDesiredLocationDraft] = React.useState<{
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  }>(() => ({
    street: "",
    number: "",
    postalCode: "",
    province: "",
    municipality: "",
  }));
  const desiredVisitMunicipalityOptions = React.useMemo(
    () => resolveDesiredVisitMunicipalityOptions(desiredLocationSetup),
    [desiredLocationSetup],
  );
  const [showInternalNote, setShowInternalNote] = React.useState(false);
  const [bookingInternalNote, setBookingInternalNote] = React.useState("");
  const [drawerDocOpen, setDrawerDocOpen] = React.useState(false);
  const [drawerDocType, setDrawerDocType] = React.useState<"invoice" | "receipt">(
    "invoice",
  );
  const [showKilometerAllowance, setShowKilometerAllowance] =
    React.useState(false);
  const [kilometerAllowanceDraft, setKilometerAllowanceDraft] = React.useState<{
    eurPerKm: string;
    totalKilometer: string;
  }>(() => ({
    eurPerKm: "",
    totalKilometer: "",
  }));
  const applyDesiredLocationKilometerDefaults = React.useCallback(() => {
    setShowKilometerAllowance(true);
    setKilometerAllowanceDraft((prev) => ({
      eurPerKm:
        prev.eurPerKm.trim() ||
        String(kilometerAllowanceEurPerKmDefault ?? "").trim(),
      totalKilometer: prev.totalKilometer,
    }));
  }, [kilometerAllowanceEurPerKmDefault]);

  return {
    showInlineGuestField,
    setShowInlineGuestField,
    inlineGuestDraft,
    setInlineGuestDraft,
    editingInlineGuestId,
    setEditingInlineGuestId,
    inlineGuestParticipantType,
    setInlineGuestParticipantType,
    bookingProjectEnabled,
    setBookingProjectEnabled,
    bookingProjectDescription,
    setBookingProjectDescription,
    bookingProjectUploads,
    setBookingProjectUploads,
    projectFileInputRef,
    bufferDraft,
    setBufferDraft,
    editingBufferId,
    setEditingBufferId,
    bookingGuests,
    setBookingGuests,
    desiredLocationDraft,
    setDesiredLocationDraft,
    desiredVisitMunicipalityOptions,
    showInternalNote,
    setShowInternalNote,
    bookingInternalNote,
    setBookingInternalNote,
    drawerDocOpen,
    setDrawerDocOpen,
    drawerDocType,
    setDrawerDocType,
    showKilometerAllowance,
    setShowKilometerAllowance,
    kilometerAllowanceDraft,
    setKilometerAllowanceDraft,
    applyDesiredLocationKilometerDefaults,
  };
}
