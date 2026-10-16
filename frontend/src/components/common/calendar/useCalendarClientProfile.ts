"use client";

import * as React from "react";
import { useSnackbar } from "../AppSnackbar";
import { getApiErrorMessage } from "../../../lib/api-error";
import { INPUT_LIMITS, parseText } from "../../../lib/inputSchema";
import { mapApiProfessionalClientToRecord } from "../../../app/professionals/fixed-location/client/mapApiProfessionalClient";
import type { ClientRecord } from "../../../app/professionals/fixed-location/client/data/clientList";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ApiProfessionalClient } from "../../../store/services/businessApi";
import {
  useCreateProfessionalClientMutation,
  useUpdateProfessionalClientTechnicalNoteMutation,
} from "../../../store/services/businessApi";
import {
  canAddIdentityToClientList,
  findListedProfessionalClient,
  identityFromCalendarEvent,
  splitDisplayName,
  type CalendarClientIdentity,
} from "./calendarClientProfile";

export type CalendarClientNotInListPopoverState = {
  anchorEl: HTMLElement;
  identity: CalendarClientIdentity;
};

export function useCalendarClientProfile(
  professionalClients: readonly ApiProfessionalClient[],
) {
  const { showSnackbar } = useSnackbar();
  const [createProfessionalClient, { isLoading: isAddingClient }] =
    useCreateProfessionalClientMutation();
  const [updateProfessionalClientTechnicalNote] =
    useUpdateProfessionalClientTechnicalNoteMutation();

  const [viewClientId, setViewClientId] = React.useState<string | null>(null);
  const [notInListPopover, setNotInListPopover] =
    React.useState<CalendarClientNotInListPopoverState | null>(null);
  const [bookingDrawerNotListedIdentity, setBookingDrawerNotListedIdentity] =
    React.useState<CalendarClientIdentity | null>(null);

  const viewClient = React.useMemo<ClientRecord | null>(() => {
    if (!viewClientId) return null;
    const row = professionalClients.find((client) => client.id === viewClientId);
    return row ? mapApiProfessionalClientToRecord(row) : null;
  }, [professionalClients, viewClientId]);

  const closeClientDetailsDrawer = React.useCallback(() => {
    setViewClientId(null);
  }, []);

  const closeNotInListPopover = React.useCallback(() => {
    setNotInListPopover(null);
  }, []);

  const openListedClient = React.useCallback((clientId: string) => {
    setBookingDrawerNotListedIdentity(null);
    setNotInListPopover(null);
    setViewClientId(clientId);
  }, []);

  const handleClientNameClick = React.useCallback(
    (
      source: CalendarEvent | CalendarClientIdentity,
      anchorEl: HTMLElement | null,
      context: "overview" | "booking-drawer",
    ) => {
      const identity: CalendarClientIdentity =
        "details" in source || "showClientName" in source
          ? identityFromCalendarEvent(source as CalendarEvent)
          : source;

      if (identity.isGuest) return;

      const listed = findListedProfessionalClient(identity, professionalClients);
      if (listed) {
        openListedClient(listed.id);
        return;
      }

      if (context === "overview" && anchorEl) {
        setBookingDrawerNotListedIdentity(null);
        setNotInListPopover({ anchorEl, identity });
        return;
      }

      setNotInListPopover(null);
      setBookingDrawerNotListedIdentity(identity);
    },
    [openListedClient, professionalClients],
  );

  const addIdentityToClientList = React.useCallback(
    async (
      identity: CalendarClientIdentity,
      options?: { silent?: boolean },
    ) => {
      const eligibility = canAddIdentityToClientList(identity);
      if (!eligibility.ok) {
        if (!options?.silent) {
          showSnackbar({ severity: "warning", message: eligibility.reason });
        }
        return false;
      }

      try {
        // Only trust booking customerId for Mollure — email lookup promoted Non-Mollure to Mollure.
        const mollureUserId = String(identity.customerId ?? "").trim();

        if (mollureUserId) {
          const created = await createProfessionalClient({
            mollure_user_id: mollureUserId,
          }).unwrap();
          if (!options?.silent) {
            showSnackbar({
              severity: "success",
              message: "Client added to your Client List.",
            });
            setNotInListPopover(null);
            setBookingDrawerNotListedIdentity(null);
            openListedClient(created.data.id);
          } else {
            setNotInListPopover(null);
            setBookingDrawerNotListedIdentity(null);
          }
          return true;
        }

        const email = identity.email!.trim().toLowerCase();
        const isCompany = identity.clientKind === "company";
        const { first_name, last_name } = splitDisplayName(
          identity.name ?? "Client",
        );

        const created = await createProfessionalClient(
          isCompany
            ? {
                client_kind: "company",
                email,
                legal_name: identity.name?.trim() || "Company Client",
                contact_person_name: identity.name?.trim() || undefined,
                phone: identity.phone?.trim() || undefined,
              }
            : {
                client_kind: "individual",
                email,
                first_name,
                last_name,
                phone: identity.phone?.trim() || undefined,
              },
        ).unwrap();

        if (!options?.silent) {
          showSnackbar({
            severity: "success",
            message: "Client added to your Client List.",
          });
          setNotInListPopover(null);
          setBookingDrawerNotListedIdentity(null);
          openListedClient(created.data.id);
        } else {
          setNotInListPopover(null);
          setBookingDrawerNotListedIdentity(null);
        }
        return true;
      } catch (error) {
        if (!options?.silent) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to add client."),
          });
        }
        return false;
      }
    },
    [createProfessionalClient, openListedClient, showSnackbar],
  );

  const saveClientTechnicalNote = React.useCallback(
    async (note: string) => {
      if (!viewClientId) return;
      const parsed = parseText(note, {
        required: false,
        label: "Technical note",
        min: INPUT_LIMITS.notesMin,
        max: null,
      });
      if (!parsed.ok) {
        showSnackbar({
          severity: "error",
          message: parsed.error,
        });
        return;
      }
      try {
        await updateProfessionalClientTechnicalNote({
          id: viewClientId,
          technical_note: parsed.value,
        }).unwrap();
        showSnackbar({
          severity: "success",
          message: "Technical note saved",
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to save technical note."),
        });
      }
    },
    [showSnackbar, updateProfessionalClientTechnicalNote, viewClientId],
  );

  const clearBookingDrawerNotListedHint = React.useCallback(() => {
    setBookingDrawerNotListedIdentity(null);
  }, []);

  return {
    viewClientId,
    viewClient,
    closeClientDetailsDrawer,
    handleClientNameClick,
    notInListPopover,
    closeNotInListPopover,
    bookingDrawerNotListedIdentity,
    clearBookingDrawerNotListedHint,
    addIdentityToClientList,
    isAddingClient,
    saveClientTechnicalNote,
    findListedClient: (identity: CalendarClientIdentity) =>
      findListedProfessionalClient(identity, professionalClients),
  };
}
