"use client";

import {
  Popover,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import AppDrawer from "../../AppDrawer";

import CalendarTeamMemberProfileDrawer from "../CalendarTeamMemberProfileDrawer";

import CalendarClientNotInListHint from "../CalendarClientNotInListHint";

import ClientDetailsViewPanel from "../../../../app/professionals/fixed-location/client/ClientDetailsViewPanel";

import {
  canAddIdentityToClientList,
  getAddToClientListDisabledReason,
} from "../calendarClientProfile";

import {
  FinanceDocumentPreviewDrawer,
} from "../../finance-documents";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarOverlaysClientDocsBag = Pick<
  Vm,
  | "addIdentityToClientList"
  | "closeClientDetailsDrawer"
  | "closeNotInListPopover"
  | "drawerDocOpen"
  | "drawerDocType"
  | "drawerInvoiceRow"
  | "drawerReceiptRow"
  | "financeSettings"
  | "isAddingClient"
  | "m"
  | "notInListPopover"
  | "professionalBusinessOverride"
  | "saveClientTechnicalNote"
  | "selectedClient"
  | "setDrawerDocOpen"
  | "setTeamProfileMemberId"
  | "teamProfileMemberId"
  | "viewClient"
  | "viewingBookingEvent"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarOverlaysClientDocsBag;
};

export default function ProfessionalFixedLocationCalendarOverlaysClientDocs({
  bag,
}: Props) {
  const {
    addIdentityToClientList,
    closeClientDetailsDrawer,
    closeNotInListPopover,
    drawerDocOpen,
    drawerDocType,
    drawerInvoiceRow,
    drawerReceiptRow,
    financeSettings,
    isAddingClient,
    m,
    notInListPopover,
    professionalBusinessOverride,
    saveClientTechnicalNote,
    selectedClient,
    setDrawerDocOpen,
    setTeamProfileMemberId,
    teamProfileMemberId,
    viewClient,
    viewingBookingEvent,
  } = bag;

  return (
    <>
      <FinanceDocumentPreviewDrawer
        open={drawerDocOpen}
        onClose={() => setDrawerDocOpen(false)}
        documentType={drawerDocType}
        invoiceType={
          selectedClient?.clientKind === "company" ||
          viewingBookingEvent?.clientKind === "company" ||
          viewingBookingEvent?.details?.clientKind === "company"
            ? "company"
            : "individual"
        }
        settings={financeSettings}
        row={
          drawerDocType === "receipt"
            ? (drawerReceiptRow ?? drawerInvoiceRow)
            : drawerInvoiceRow
        }
        professionalBusinessOverride={professionalBusinessOverride}
      />
      <Popover
        open={Boolean(notInListPopover)}
        anchorEl={notInListPopover?.anchorEl ?? null}
        onClose={closeNotInListPopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              p: 1.5,
              borderRadius: "10px",
              maxWidth: 280,
              boxShadow: "0 12px 32px rgba(16,35,63,0.14)",
            },
          },
        }}
      >
        {notInListPopover ? (
          <CalendarClientNotInListHint
            adding={isAddingClient}
            addDisabled={
              !canAddIdentityToClientList(notInListPopover.identity).ok
            }
            addDisabledReason={getAddToClientListDisabledReason(
              notInListPopover.identity,
            )}
            onAdd={() =>
              void addIdentityToClientList(notInListPopover.identity)
            }
          />
        ) : null}
      </Popover>
      <AppDrawer
        anchor="right"
        open={Boolean(viewClient)}
        onClose={closeClientDetailsDrawer}
        title="Client Details"
        contentSx={{
          bgcolor: alpha(m.navy, 0.03),
          p: 0,
        }}
      >
        {viewClient ? (
          <ClientDetailsViewPanel
            client={viewClient}
            onSaveTechnicalNote={saveClientTechnicalNote}
          />
        ) : null}
      </AppDrawer>
      <CalendarTeamMemberProfileDrawer
        open={Boolean(teamProfileMemberId)}
        memberId={teamProfileMemberId}
        onClose={() => setTeamProfileMemberId(null)}
      />
    </>
  );
}
