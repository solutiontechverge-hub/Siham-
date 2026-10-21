"use client";

import * as React from "react";
import { extractUuidFromSyntheticId } from "./clientBookingApi.mapper";
import {
  addMinutesToTime,
  parseDurationMinsLabel,
} from "../../../data/bookingServiceEdit.data";
import {
  FIXED_LOCATION_MAX_GUESTS,
  UUID_RE,
  isAdditionalGuest,
  isNotesPerson,
  sortPeopleByCanonicalBookingOrder,
  buildAddServiceCatalog,
  createNotesPerson,
  servicesMissingTeamMember,
} from "./booking.page.data";
import type {
  BookingPerson,
  CatalogService,
  Service,
} from "./booking.page.types";

export type UseClientBookingCreatePeopleServicesArgs = {
  people: BookingPerson[];
  setPeople: React.Dispatch<React.SetStateAction<BookingPerson[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  selectedPersonId: string;
  setSelectedPersonId: React.Dispatch<React.SetStateAction<string>>;
  selectedTeamMemberId: string;
  setSelectedTeamMemberId: React.Dispatch<React.SetStateAction<string>>;
  serviceTab: "assigned" | "unassigned";
  setServiceTab: React.Dispatch<
    React.SetStateAction<"assigned" | "unassigned">
  >;
  selectedServiceIds: Record<string, boolean>;
  setSelectedServiceIds: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  selectedTime: string;
  isDesiredLocation: boolean;
  isCompanyClient: boolean;
  bookingProjectEnabled: boolean;
  setBookingProjectEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  clientNote: string;
  setClientNote: React.Dispatch<React.SetStateAction<string>>;
  isNonServicePerson: (p: BookingPerson) => boolean;
  isPlanningPerson: (p: BookingPerson) => boolean;
  isPlanningCardSelected: boolean;
  selectedPerson: BookingPerson | null;
  locationServiceCatalog: CatalogService[];
  hasAssignableTeamMembers: boolean;
  addServiceTeamMemberId: string;
  profileHydrated: boolean;
  fromProfile: boolean;
  planningPersonId: string | null;
  setPlanningPersonId: React.Dispatch<React.SetStateAction<string | null>>;
  planningActivity: string;
  setPlanningActivity: React.Dispatch<React.SetStateAction<string>>;
  planningDuration: string;
  setPlanningDuration: React.Dispatch<React.SetStateAction<string>>;
  setParticipantMenuAnchor: React.Dispatch<
    React.SetStateAction<HTMLElement | null>
  >;
  setProjectDescription: React.Dispatch<React.SetStateAction<string>>;
  setProjectUploads: React.Dispatch<
    React.SetStateAction<
      Array<{ id: string; name: string; previewUrl: string; file?: File }>
    >
  >;
  setAddServiceDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addServiceCatalogIds: Record<string, boolean>;
  setAddServiceCatalogIds: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  addServiceCatalogQty: Record<string, number>;
  setAddServiceCatalogQty: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
};

export function useClientBookingCreatePeopleServices(
  args: UseClientBookingCreatePeopleServicesArgs,
) {
  const {
    people,
    setPeople,
    services,
    setServices,
    selectedPersonId,
    setSelectedPersonId,
    selectedTeamMemberId,
    setSelectedTeamMemberId,
    serviceTab,
    setServiceTab,
    selectedServiceIds,
    setSelectedServiceIds,
    selectedTime,
    isDesiredLocation,
    isCompanyClient,
    bookingProjectEnabled,
    setBookingProjectEnabled,
    clientNote,
    setClientNote,
    isNonServicePerson,
    isPlanningPerson,
    isPlanningCardSelected,
    selectedPerson,
    locationServiceCatalog,
    hasAssignableTeamMembers,
    addServiceTeamMemberId,
    profileHydrated,
    fromProfile,
    planningPersonId,
    setPlanningPersonId,
    planningActivity,
    setPlanningActivity,
    planningDuration,
    setPlanningDuration,
    setParticipantMenuAnchor,
    setProjectDescription,
    setProjectUploads,
    setAddServiceDialogOpen,
    addServiceCatalogIds,
    setAddServiceCatalogIds,
    addServiceCatalogQty,
    setAddServiceCatalogQty,
  } = args;

  /** Full location catalog — do not filter by team-member slots in the add modal. */
  const addServiceCatalog = React.useMemo(
    () => buildAddServiceCatalog(locationServiceCatalog),
    [locationServiceCatalog],
  );


  const additionalGuests = React.useMemo(
    () => people.filter(isAdditionalGuest),
    [people],
  );
  const canAddFixedLocationGuest =
    !isDesiredLocation &&
    additionalGuests.length < FIXED_LOCATION_MAX_GUESTS;
  const serviceAssignees = React.useMemo(() => {
    // Jane / Model / Guest can all receive services; Planning / Notes cannot.
    return people.filter((p) => !isNonServicePerson(p));
  }, [isNonServicePerson, people]);
  /** Add-to-list stays available even when the pro has no selectable team members. */
  const canAddService = serviceAssignees.length > 0;

  const serviceCountLabel = React.useCallback(
    (personId: string) => {
      const n = services.filter((s) => s.guestId === personId).length;
      return n === 1 ? "1 Service" : `${n} Services`;
    },
    [services],
  );

  const personCardSubtitle = React.useCallback(
    (person: BookingPerson) => {
      if (isNotesPerson(person)) {
        return clientNote.trim() ? "Added" : "Add a note";
      }
      return serviceCountLabel(person.id);
    },
    [clientNote, serviceCountLabel],
  );

  const selectedServicesCount = React.useMemo(
    () => Object.values(selectedServiceIds).filter(Boolean).length,
    [selectedServiceIds],
  );

  const requiresPersonAssignment = React.useMemo(() => {
    const assignees = people.filter((p) => !isNonServicePerson(p));
    return (
      assignees.length > 1 || assignees.some((p) => !p.isRequester)
    );
  }, [isNonServicePerson, people]);

  /**
   * Multi-person / Model / Guest: every service needs a person.
   * Solo requester with no staff pick: Continue can default person to requester.
   */
  const allServicesAssigned = React.useMemo(() => {
    if (services.length === 0) return false;
    if (requiresPersonAssignment || selectedTeamMemberId) {
      return services.every((s) => Boolean(s.guestId));
    }
    return true;
  }, [requiresPersonAssignment, selectedTeamMemberId, services]);
  // Per-service blanks only — shared picker empty is fine when every service has a TM.
  const needsTeamMemberProvidedByPro = React.useMemo(
    () => services.length > 0 && servicesMissingTeamMember(services),
    [services],
  );

  /** Services already given to the selected person (Jane / Model / Guest). */
  const assigned = React.useMemo(
    () =>
      services.filter(
        (s) => Boolean(s.guestId) && s.guestId === selectedPersonId,
      ),
    [selectedPersonId, services],
  );
  /** Pending rows without a person — catalog never lives here. */
  const unassigned = React.useMemo(
    () => services.filter((s) => !s.guestId),
    [services],
  );

  const isModelOrGuestSelected = Boolean(
    selectedPerson &&
    !selectedPerson.isRequester &&
    !isNonServicePerson(selectedPerson),
  );

  React.useEffect(() => {
    if (!profileHydrated && fromProfile) return;
    if (
      unassigned.length === 0 &&
      assigned.length > 0 &&
      serviceTab === "unassigned"
    ) {
      setServiceTab("assigned");
    }
  }, [
    assigned.length,
    fromProfile,
    profileHydrated,
    serviceTab,
    unassigned.length,
  ]);

  const selectedUnassignedServices = React.useMemo(
    () => unassigned.filter((s) => selectedServiceIds[s.id]),
    [unassigned, selectedServiceIds],
  );
  /** Assign selected unassigned rows to the current person (staff is optional). */
  const canDirectAssign =
    !isPlanningCardSelected &&
    Boolean(selectedPersonId) &&
    selectedUnassignedServices.length > 0;
  const visible = serviceTab === "assigned" ? assigned : unassigned;
  const hasUnassigned = unassigned.length > 0;

  const allVisibleSelected =
    visible.length > 0 && visible.every((s) => selectedServiceIds[s.id]);
  const someVisibleSelected =
    visible.some((s) => selectedServiceIds[s.id]) && !allVisibleSelected;

  const total = React.useMemo(
    () => services.reduce((sum, s) => sum + s.price, 0),
    [services],
  );


  const reorderPeople = React.useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setPeople((prev) => {
      const fromIdx = prev.findIndex((p) => p.id === fromId);
      const toIdx = prev.findIndex((p) => p.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return sortPeopleByCanonicalBookingOrder(next);
    });
  }, []);

  const planningWindowFromDraft = React.useCallback(
    (duration: string, existingStart?: string) => {
      const startTime = existingStart?.trim() || selectedTime || "";
      const durationMins = parseDurationMinsLabel(duration) ?? 60;
      return {
        planningStartTime: startTime || undefined,
        planningEndTime: startTime
          ? addMinutesToTime(startTime, durationMins)
          : undefined,
      };
    },
    [selectedTime],
  );

  const syncPlanningDraftToPerson = (
    personId: string,
    activity: string,
    duration: string,
  ) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId
          ? {
              ...p,
              planningActivity: activity.trim(),
              planningDuration: duration.trim(),
              ...planningWindowFromDraft(duration, p.planningStartTime),
            }
          : p,
      ),
    );
  };

  const selectPlanningCard = (person: BookingPerson) => {
    if (planningPersonId && planningPersonId !== person.id) {
      syncPlanningDraftToPerson(
        planningPersonId,
        planningActivity,
        planningDuration,
      );
    }
    setPlanningPersonId(person.id);
    setPlanningActivity(person.planningActivity ?? "");
    setPlanningDuration(person.planningDuration ?? "");
    setSelectedPersonId(person.id);
    setServiceTab("assigned");
  };

  const selectNonPlanningPerson = (personId: string) => {
    if (planningPersonId)
      syncPlanningDraftToPerson(
        planningPersonId,
        planningActivity,
        planningDuration,
      );
    setPlanningPersonId(null);

    const selectedIds = Object.entries(selectedServiceIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    const selectedPending = services.filter(
      (s) => !s.guestId && selectedIds.includes(s.id),
    );

    // Banner flow: select services in Unassigned, then tap a person to assign them.
    if (selectedPending.length > 0) {
      const idSet = new Set(selectedPending.map((s) => s.id));
      setServices((prev) =>
        prev.map((s) =>
          idSet.has(s.id)
            ? {
                ...s,
                guestId: personId,
                teamMemberId: s.teamMemberId || null,
              }
            : s,
        ),
      );
      setSelectedServiceIds({});
      setSelectedPersonId(personId);
      setServiceTab("assigned");
      return;
    }

    setSelectedPersonId(personId);
    setSelectedServiceIds({});
    const person = people.find((p) => p.id === personId);
    const isModelOrGuest = Boolean(
      person && !person.isRequester && !isNonServicePerson(person),
    );
    if (isModelOrGuest) {
      const hasPending = services.some((s) => !s.guestId);
      const personHasAssigned = services.some((s) => s.guestId === personId);
      setServiceTab(
        hasPending && !personHasAssigned ? "unassigned" : "assigned",
      );
      return;
    }
    const personHasAssigned = services.some((s) => s.guestId === personId);
    const hasPending = services.some((s) => !s.guestId);
    setServiceTab(hasPending && !personHasAssigned ? "unassigned" : "assigned");
  };

  const addParticipant = (cardName: string) => {
    const isPlanning = cardName === "Planning";
    const isModel = cardName === "Model";
    const isGuest = cardName === "Guest";
    const isNotes = cardName === "Notes";

    if (isModel && !isCompanyClient) return;
    if (isPlanning && (!isCompanyClient || !bookingProjectEnabled)) return;
    // Desired + company: Guest without project, Model with project.
    if (
      isGuest &&
      isCompanyClient &&
      isDesiredLocation &&
      bookingProjectEnabled
    )
      return;
    if (
      isModel &&
      isCompanyClient &&
      isDesiredLocation &&
      !bookingProjectEnabled
    )
      return;

    if (isNotes) {
      const existing = people.find(isNotesPerson);
      setParticipantMenuAnchor(null);
      if (existing) {
        setSelectedPersonId(existing.id);
        return;
      }
      const nextPerson = createNotesPerson();
      setPeople((prev) =>
        sortPeopleByCanonicalBookingOrder([...prev, nextPerson]),
      );
      setSelectedPersonId(nextPerson.id);
      return;
    }

    if (
      !isDesiredLocation &&
      isGuest &&
      additionalGuests.length >= FIXED_LOCATION_MAX_GUESTS
    ) {
      return;
    }

    const id = `p-guest-${Date.now()}`;
    const nextPerson: BookingPerson = {
      id,
      name: cardName,
      isRequester: false,
      participantType: isPlanning ? "planning" : isModel ? "model" : "guest",
      ...(isPlanning
        ? {
            planningActivity: "Photoshoot",
            ...planningWindowFromDraft(planningDuration),
          }
        : {}),
    };
    setPeople((prev) =>
      sortPeopleByCanonicalBookingOrder([...prev, nextPerson]),
    );
    setParticipantMenuAnchor(null);
    if (isPlanning) {
      selectPlanningCard(nextPerson);
    } else {
      selectNonPlanningPerson(id);
      if (isModel || isGuest) setServiceTab("unassigned");
    }
  };

  const savePlanning = () => {
    if (!planningPersonId) return;
    syncPlanningDraftToPerson(
      planningPersonId,
      planningActivity,
      planningDuration,
    );
    setPeople((prev) =>
      prev.map((p) =>
        p.id === planningPersonId ? { ...p, planningIsLocked: true } : p,
      ),
    );
  };

  const startPlanningEdit = () => {
    if (!planningPersonId) return;
    setPeople((prev) =>
      prev.map((p) =>
        p.id === planningPersonId ? { ...p, planningIsLocked: false } : p,
      ),
    );
  };

  const planningFormIsLocked = Boolean(selectedPerson?.planningIsLocked);

  const handleProjectFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const stamp = Date.now();
    setProjectUploads((prev) => [
      ...prev,
      ...files.map((file, index) => ({
        id: `upload-${stamp}-${prev.length + index}`,
        name: file.name || `upload-${prev.length + index + 1}`,
        previewUrl: URL.createObjectURL(file),
        file,
      })),
    ]);
    e.target.value = "";
  };

  const deleteProjectUpload = (uploadId: string) => {
    setProjectUploads((prev) => {
      const target = prev.find((u) => u.id === uploadId);
      if (target?.previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(target.previewUrl);
      return prev.filter((u) => u.id !== uploadId);
    });
  };

  const setBookingProjectEnabledWithCleanup = React.useCallback(
    (enabled: boolean) => {
      setBookingProjectEnabled(enabled);
      if (enabled) return;

      setProjectDescription("");
      setProjectUploads((prev) => {
        for (const u of prev) {
          if (u.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(u.previewUrl);
          }
        }
        return [];
      });
      setPeople((prev) => {
        const next = prev.filter((p) => !isPlanningPerson(p));
        setSelectedPersonId((current) => {
          if (current && next.some((p) => p.id === current)) return current;
          return next.find((p) => p.isRequester)?.id ?? next[0]?.id ?? "";
        });
        return next;
      });
      setPlanningPersonId(null);
      setPlanningActivity("");
      setPlanningDuration("");
    },
    [isPlanningPerson],
  );

  const deleteGuest = (guestId: string) => {
    const person = people.find((p) => p.id === guestId);
    if (!person || person.isRequester) return;
    if (isNotesPerson(person)) setClientNote("");
    setPeople((prev) => prev.filter((p) => p.id !== guestId));
    // Remove this guest's services from the booking (do not send them to Unassigned).
    setServices((prev) => prev.filter((s) => s.guestId !== guestId));
    if (planningPersonId === guestId) {
      setPlanningPersonId(null);
      setPlanningActivity("");
      setPlanningDuration("");
    }
    if (selectedPersonId === guestId) {
      setSelectedPersonId(
        people.find((p) => p.isRequester)?.id ?? people[0]?.id ?? "",
      );
    }
  };

  const updateGuestName = (guestId: string, name: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === guestId ? { ...p, name } : p)),
    );
  };

  const assignSelectedDirect = () => {
    if (!canDirectAssign) return;
    const ids = new Set(selectedUnassignedServices.map((s) => s.id));
    setServices((prev) =>
      prev.map((s) => {
        if (!ids.has(s.id)) return s;
        return {
          ...s,
          guestId: selectedPersonId,
          // Keep row TM, else shared picker, else blank for backend assign.
          teamMemberId: s.teamMemberId || selectedTeamMemberId || null,
        };
      }),
    );
    setSelectedServiceIds({});
    setServiceTab("assigned");
  };

  const unassignService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, guestId: null } : s)),
    );
    setSelectedServiceIds((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
    setServiceTab("unassigned");
  };

  const removeService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    setSelectedServiceIds((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  const openAddServiceDialog = () => {
    setAddServiceCatalogIds({});
    setAddServiceCatalogQty({});
    setAddServiceDialogOpen(true);
  };

  const toggleAddServiceCatalog = (id: string, checked: boolean) => {
    setAddServiceCatalogIds((prev) => ({ ...prev, [id]: checked }));
    if (checked) {
      setAddServiceCatalogQty((prev) => ({ ...prev, [id]: prev[id] ?? 1 }));
    }
  };

  const adjustAddServiceCatalogQty = (id: string, delta: number) => {
    setAddServiceCatalogQty((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) + delta),
    }));
  };

  const confirmAddService = () => {
    const catalog = addServiceCatalog;
    const selectedIds = Object.entries(addServiceCatalogIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    if (!selectedIds.length) return;

    const stamped: Service[] = [];
    for (const catalogId of selectedIds) {
      const picked = catalog.find((c) => c.id === catalogId);
      if (!picked) continue;
      const quantity = Math.max(1, addServiceCatalogQty[catalogId] ?? 1);
      for (let index = 0; index < quantity; index += 1) {
        stamped.push({
          id: UUID_RE.test(picked.id)
            ? `${picked.id}-${Date.now()}-${stamped.length}`
            : `svc-${Date.now()}-${stamped.length}`,
          catalogServiceId: UUID_RE.test(picked.id)
            ? picked.id
            : extractUuidFromSyntheticId(picked.id),
          name: picked.name,
          durationMins: picked.durationMins,
          price: picked.price,
          originalPrice: picked.originalPrice,
          discountPct: picked.discountPct,
          guestId: null,
          // Leave null — availability auto-assign picks a free TM for the slot.
          teamMemberId: hasAssignableTeamMembers && isDesiredLocation
            ? selectedTeamMemberId || addServiceTeamMemberId || null
            : null,
        });
      }
    }
    if (!stamped.length) return;

    setServices((prev) => [...prev, ...stamped]);
    setServiceTab("unassigned");
    setAddServiceDialogOpen(false);
    setAddServiceCatalogIds({});
    setAddServiceCatalogQty({});
  };

  /** Desired: stamp all. FL shared picker: unassigned only (keep Guest/CLIENT picks). */
  const applySharedTeamMember = (teamMemberId: string) => {
    if (teamMemberId.startsWith("__")) return;
    setSelectedTeamMemberId(teamMemberId);
    const nextId = teamMemberId || null;
    setServices((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        if (!isDesiredLocation && s.guestId) return s;
        if ((s.teamMemberId ?? null) === nextId) return s;
        changed = true;
        return { ...s, teamMemberId: nextId };
      });
      return changed ? next : prev;
    });
  };

  const updateServiceTeamMember = (
    serviceId: string,
    teamMemberId: string,
    guestId?: string | null,
  ) => {
    if (teamMemberId.startsWith("__")) return;
    // "" = Any — optional per service; backend create assigns blanks.
    const nextId = teamMemberId || null;
    if (isDesiredLocation) {
      setSelectedTeamMemberId(teamMemberId);
      setServices((prev) => {
        if (prev.every((s) => (s.teamMemberId ?? null) === nextId)) return prev;
        return prev.map((s) => ({ ...s, teamMemberId: nextId }));
      });
      return;
    }
    // Scope by guestId so CLIENT+Guest rows with the same catalog service id
    // do not steal each other's teamMemberId updates.
    const matches = (s: Service) =>
      s.id === serviceId &&
      (guestId === undefined || (s.guestId ?? null) === (guestId ?? null));
    setServices((prev) => {
      const row = prev.find(matches);
      if (!row || (row.teamMemberId ?? null) === nextId) return prev;
      return prev.map((s) => (matches(s) ? { ...s, teamMemberId: nextId } : s));
    });
  };

  const toggleServiceSelection = (serviceId: string, checked: boolean) => {
    setSelectedServiceIds((prev) => ({ ...prev, [serviceId]: checked }));
  };


  return {
    addServiceCatalog,
    additionalGuests,
    canAddFixedLocationGuest,
    serviceAssignees,
    canAddService,
    serviceCountLabel,
    personCardSubtitle,
    selectedServicesCount,
    requiresPersonAssignment,
    allServicesAssigned,
    needsTeamMemberProvidedByPro,
    assigned,
    unassigned,
    isModelOrGuestSelected,
    selectedUnassignedServices,
    canDirectAssign,
    visible,
    hasUnassigned,
    allVisibleSelected,
    someVisibleSelected,
    total,
    reorderPeople,
    planningWindowFromDraft,
    syncPlanningDraftToPerson,
    selectPlanningCard,
    selectNonPlanningPerson,
    addParticipant,
    savePlanning,
    startPlanningEdit,
    planningFormIsLocked,
    handleProjectFilePick,
    deleteProjectUpload,
    setBookingProjectEnabledWithCleanup,
    deleteGuest,
    updateGuestName,
    assignSelectedDirect,
    unassignService,
    removeService,
    openAddServiceDialog,
    toggleAddServiceCatalog,
    adjustAddServiceCatalogQty,
    confirmAddService,
    applySharedTeamMember,
    updateServiceTeamMember,
    toggleServiceSelection,
  };
}
