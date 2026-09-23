"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";

import {
  Avatar,
  Badge,
  Box,
  ButtonBase,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import CalendarClientNotInListHint from "../CalendarClientNotInListHint";

import {
  canAddIdentityToClientList,
  getAddToClientListDisabledReason,
  identityFromCalendarEvent,
} from "../calendarClientProfile";

import BookingClientTags from "../BookingClientTags";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsClientIdentityBag = Pick<
  Vm,
  | "addClientSource"
  | "addIdentityToClientList"
  | "bookingDrawerNotListedIdentity"
  | "handleClientNameClick"
  | "isAddingClient"
  | "isGuestClientPath"
  | "isMollureClientPath"
  | "isViewingBooking"
  | "m"
  | "openBookingMessages"
  | "resolvedSelectedClientKind"
  | "selectedClient"
  | "setBookingPhoneDraft"
  | "setSelectedClient"
  | "setSlotClientAdded"
  | "showClientRemoveButton"
  | "viewingBookingEvent"
  | "viewingBookingUnread"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsClientIdentityBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsClientIdentity({
  bag,
}: Props) {
  const {
    addClientSource,
    addIdentityToClientList,
    bookingDrawerNotListedIdentity,
    handleClientNameClick,
    isAddingClient,
    isGuestClientPath,
    isMollureClientPath,
    isViewingBooking,
    m,
    openBookingMessages,
    resolvedSelectedClientKind,
    selectedClient,
    setBookingPhoneDraft,
    setSelectedClient,
    setSlotClientAdded,
    showClientRemoveButton,
    viewingBookingEvent,
    viewingBookingUnread,
  } = bag;

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Avatar
          src="/images/testimonial.webp"
          sx={{ width: 34, height: 34 }}
        >
          {!selectedClient?.name
            ? null
            : selectedClient.name.slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            sx={{ minWidth: 0, overflow: "visible" }}
          >
            {isGuestClientPath ? (
              <BodyText
                sx={{
                  ...mollureLabelSx(m.navy),
                  lineHeight: 1.2,
                }}
              >
                {selectedClient?.name ?? "Guest"}
              </BodyText>
            ) : (
              <ButtonBase
                onClick={(e) => {
                  const identity = viewingBookingEvent
                    ? identityFromCalendarEvent(viewingBookingEvent)
                    : {
                        name: selectedClient?.name,
                        email: selectedClient?.email,
                        customerId: selectedClient?.mollureUserId,
                        clientKind: selectedClient?.clientKind,
                      };
                  handleClientNameClick(
                    identity,
                    e.currentTarget,
                    "booking-drawer",
                  );
                }}
                sx={{
                  textAlign: "left",
                  borderRadius: "6px",
                  px: 0.25,
                  py: 0.15,
                  "&:hover": {
                    bgcolor: alpha(m.navy, 0.05),
                  },
                }}
              >
                <BodyText
                  sx={{
                    ...mollureLabelSx(m.navy),
                    lineHeight: 1.2,
                  }}
                >
                  {selectedClient?.name ?? "Client"}
                </BodyText>
              </ButtonBase>
            )}
            {isGuestClientPath ? (
              <BookingClientTags isGuest />
            ) : (
              <BookingClientTags
                isMollure={
                  Boolean(selectedClient?.isMollure) ||
                  Boolean(selectedClient?.mollureUserId) ||
                  addClientSource === "mollure-platform"
                }
                clientKind={
                  (resolvedSelectedClientKind ??
                    selectedClient?.clientKind) === "company"
                    ? "company"
                    : null
                }
              />
            )}
            {isViewingBooking &&
            viewingBookingEvent &&
            isMollureClientPath ? (
              <Tooltip title="Open chat with client">
                <IconButton
                  size="small"
                  aria-label="Open messaging"
                  onClick={() =>
                    openBookingMessages(viewingBookingEvent)
                  }
                  sx={{
                    color: alpha(m.navy, 0.45),
                    p: 0.35,
                  }}
                >
                  {viewingBookingUnread > 0 ? (
                    <Badge
                      badgeContent={
                        viewingBookingUnread > 9
                          ? "9+"
                          : viewingBookingUnread
                      }
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          minWidth: 16,
                          height: 16,
                        },
                      }}
                    >
                      <ChatBubbleOutlineRoundedIcon
                        sx={{ fontSize: 18 }}
                      />
                    </Badge>
                  ) : (
                    <ChatBubbleOutlineRoundedIcon
                      sx={{ fontSize: 18 }}
                    />
                  )}
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
          <BodyText
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              color: alpha(m.navy, 0.46),
              lineHeight: 1.2,
            }}
          >
            {selectedClient?.email ?? ""}
          </BodyText>
        </Box>
        {showClientRemoveButton ? (
          <IconButton
            size="small"
            onClick={() => {
              setSlotClientAdded(false);
              setSelectedClient(null);
              setBookingPhoneDraft({
                phoneCode: "",
                phoneNumber: "",
              });
            }}
            sx={{ color: alpha(m.navy, 0.35) }}
            aria-label="Remove client"
          >
            <CloseRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        ) : null}
      </Stack>

      {bookingDrawerNotListedIdentity && !isGuestClientPath ? (
        <CalendarClientNotInListHint
          adding={isAddingClient}
          addDisabled={
            !canAddIdentityToClientList(bookingDrawerNotListedIdentity)
              .ok
          }
          addDisabledReason={getAddToClientListDisabledReason(
            bookingDrawerNotListedIdentity,
          )}
          onAdd={() =>
            void addIdentityToClientList(bookingDrawerNotListedIdentity)
          }
        />
      ) : null}
    </>
  );
}
