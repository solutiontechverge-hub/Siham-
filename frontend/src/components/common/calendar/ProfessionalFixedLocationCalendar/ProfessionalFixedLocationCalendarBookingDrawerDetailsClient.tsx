"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import AddRoundedIcon from "@mui/icons-material/AddRounded";

import {
  Box,
  ButtonBase,
  Stack,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import {
  participantRoleHeading,
} from "../../client-booking/buildBookingSummarySections";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsClientIdentity from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsClientIdentity";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsClientItems from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsClientItems";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsClientBag = Pick<
  Vm,
  | "addClientSource"
  | "addIdentityToClientList"
  | "addMenuButtonRef"
  | "addMenuTarget"
  | "beginExistingBookingEdit"
  | "bookingDrawerNotListedIdentity"
  | "bookingUniqueItems"
  | "canEditBookingLineItems"
  | "canMutateDrawerContents"
  | "data"
  | "handleClientNameClick"
  | "incomingRequestEditMode"
  | "isAddingClient"
  | "isGuestClientPath"
  | "isMollureClientPath"
  | "isViewingBooking"
  | "m"
  | "mainCancelledServices"
  | "openBookingMessages"
  | "openDrawerLineTagComparison"
  | "openEditBookingProductLine"
  | "openEditBookingUniqueLine"
  | "openEditServiceFromLineItem"
  | "primaryMainClientServices"
  | "removeClientService"
  | "reorderClientServices"
  | "resolveProductEditTag"
  | "resolveServiceEditTag"
  | "resolvedSelectedClientKind"
  | "resourceNameById"
  | "selectedClient"
  | "selectedProducts"
  | "setAddMenuTarget"
  | "setBookingPhoneDraft"
  | "setBookingUniqueItems"
  | "setProductSelectionDraft"
  | "setSelectedClient"
  | "setSelectedProducts"
  | "setSlotAddMenuAnchor"
  | "setSlotBookingScreen"
  | "setSlotClientAdded"
  | "showClientRemoveButton"
  | "showLineItemRemoveButton"
  | "slotAddMenuAnchor"
  | "slotClientAdded"
  | "slotErrors"
  | "theme"
  | "viewingBookingEvent"
  | "viewingBookingUnread"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsClientProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsClientBag;
};

/** Requester / client card or Add Client CTA */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsClient({
  bag,
}: ProfessionalFixedLocationCalendarBookingDrawerDetailsClientProps) {
  const {
    m,
    setSlotBookingScreen,
    slotClientAdded,
    slotErrors,
    theme,
  } = bag;

  return (
    <>
      {/* Client */}
      <Box data-booking-section="client">
        <BodyText
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: alpha(m.navy, 0.65),
            mb: 0.75,
          }}
        >
          {participantRoleHeading("requester")}
        </BodyText>
        {slotClientAdded ? (
          <Box
            sx={{
              border: `1px solid ${alpha(m.teal, 0.22)}`,
              borderRadius: "12px",
              px: 1.5,
              py: 1.25,
              bgcolor: theme.palette.secondary.main,
            }}
          >
            <Stack spacing={1.25}>
              <ProfessionalFixedLocationCalendarBookingDrawerDetailsClientIdentity bag={bag} />
              <ProfessionalFixedLocationCalendarBookingDrawerDetailsClientItems bag={bag} />
            </Stack>
          </Box>
        ) : (
          <ButtonBase
            onClick={() => setSlotBookingScreen("add-client-choice")}
            sx={{
              width: "100%",
              border: `1px solid ${alpha(m.navy, 0.14)}`,
              borderRadius: "10px",
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 1.25,
              px: 1.5,
              bgcolor: "#fff",
              transition: "border-color 0.15s, background-color 0.15s",
              "&:hover": {
                bgcolor: alpha(m.navy, 0.02),
                borderColor: m.teal,
              },
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: "999px",
                bgcolor: m.addSoftBg,
                color: m.addSoftFg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: `1px solid ${alpha(m.teal, 0.22)}`,
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
            <BodyText
              component="span"
              sx={{
                ...mollureLabelSx(m.navy),
                lineHeight: 1,
              }}
            >
              Add Client
            </BodyText>
          </ButtonBase>
        )}
        {slotErrors.bookingClient ? (
          <BodyText
            sx={{
              mt: 0.6,
              fontSize: 11.5,
              fontWeight: 800,
              color: theme.palette.error.main,
            }}
          >
            {slotErrors.bookingClient}
          </BodyText>
        ) : null}
      </Box>
    </>
  );
}
