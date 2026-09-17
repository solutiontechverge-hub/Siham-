"use client";

import * as React from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { Avatar, Box, ButtonBase, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { mollureSectionTitleSx, mollureLabelSx } from "../../../../theme/mollureHierarchy";

import { BodyText } from "../../../ui/typography";

import AppDropdown from "../../AppDropdown";

import AppSearchField from "../../AppSearchField";

import BookingClientTags from "../BookingClientTags";

import { phoneDraftFromStoredContact } from "../../../../lib/phone-validation";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddClientBag = Pick<
  Vm,
  | "addClientSource"
  | "clientList"
  | "clientListSelectedEmail"
  | "isViewingExisting"
  | "m"
  | "platformEmailInput"
  | "platformEmailMatch"
  | "platformLookupStatus"
  | "setAddClientSource"
  | "setBookingPhoneDraft"
  | "setClientListSelectedEmail"
  | "setNonMollureClientType"
  | "setPaymentMethod"
  | "setPlatformEmailInput"
  | "setSelectedClient"
  | "setSlotBookingScreen"
  | "setSlotClientAdded"
  | "theme"
>;

type Props = { bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddClientBag };

export default function ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddClient({ bag }: Props) {
  const {
    addClientSource,
    clientList,
    clientListSelectedEmail,
    isViewingExisting,
    m,
    platformEmailInput,
    platformEmailMatch,
    platformLookupStatus,
    setAddClientSource,
    setBookingPhoneDraft,
    setClientListSelectedEmail,
    setNonMollureClientType,
    setPaymentMethod,
    setPlatformEmailInput,
    setSelectedClient,
    setSlotBookingScreen,
    setSlotClientAdded,
    theme,
  } = bag;

  return (
      <Stack spacing={1.6}>
        <BodyText
          sx={{
            ...mollureSectionTitleSx(m.navy),
          }}
        >
          Add Client
        </BodyText>

        {(
          [
            {
              label: "Add from client list",
              key: "client-list" as const,
            },
            {
              label: "Add from Mollure platform",
              key: "mollure-platform" as const,
            },
            {
              label: "Add Non-Mollure Client",
              key: "non-mollure" as const,
            },
            { label: "Add Guest", key: "guest" as const },
          ] as const
        ).map((item) => (
          <React.Fragment key={item.key}>
            <ButtonBase
              onClick={() => {
                if (
                  item.key === "client-list" ||
                  item.key === "mollure-platform"
                ) {
                  if (item.key === "client-list") {
                    setClientListSelectedEmail("");
                  }
                  setAddClientSource((p) =>
                    p === item.key ? "" : item.key,
                  );
                  return;
                }
                if (item.key === "non-mollure") {
                  setNonMollureClientType("individual");
                  setSlotBookingScreen("non-mollure-individual");
                  return;
                }
                setSlotBookingScreen("guest");
              }}
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
                transition:
                  "border-color 0.15s, background-color 0.15s",
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
                  textAlign: "left",
                }}
              >
                {item.label}
              </BodyText>
            </ButtonBase>

            {item.key === "client-list" &&
            addClientSource === "client-list" ? (
              <AppDropdown
                label="Client"
                value={clientListSelectedEmail}
                onChange={(val) => {
                  if (isViewingExisting) return;
                  const email = String(val);
                  setClientListSelectedEmail(email);
                  const c = clientList.find(
                    (x) => x.email === email,
                  );
                  if (!c) return;
                  setSelectedClient({
                    name: c.name,
                    email: c.email,
                    mollureUserId: c.mollureUserId ?? null,
                    clientKind: c.clientKind,
                    isMollure: Boolean(c.isMollure),
                  });
                  setBookingPhoneDraft(
                    phoneDraftFromStoredContact(
                      c.phone,
                      c.countryCode,
                    ),
                  );
                  setPaymentMethod("online");
                  setAddClientSource("client-list");
                  setSlotClientAdded(true);
                  setSlotBookingScreen("new-booking");
                }}
                options={clientList.map((c) => ({
                  label: c.name,
                  value: c.email,
                  endAdornment: (
                    <BookingClientTags
                      isMollure={Boolean(c.isMollure)}
                      clientKind={c.clientKind}
                    />
                  ),
                }))}
                fullWidth
                placeholder="Search based on name"
                searchable
                searchPlaceholder="Search based on name"
                disabled={isViewingExisting}
              />
            ) : null}

            {item.key === "mollure-platform" &&
            addClientSource === "mollure-platform" ? (
              <Stack spacing={1}>
                <AppSearchField
                  fullWidth
                  placeholder="Search based on email"
                  value={platformEmailInput}
                  onChange={(e) =>
                    setPlatformEmailInput(e.target.value)
                  }
                  onClear={() => setPlatformEmailInput("")}
                  disabled={isViewingExisting}
                />
                {platformEmailMatch ? (
                  <ButtonBase
                    onClick={() => {
                      if (isViewingExisting) return;
                      setSelectedClient({
                        name: platformEmailMatch.name,
                        email: platformEmailMatch.email,
                        mollureUserId: platformEmailMatch.id ?? "platform",
                        isMollure: true,
                        clientKind:
                          platformEmailMatch.userType === "company" ||
                          clientList.find(
                            (x) =>
                              x.email.toLowerCase() ===
                                platformEmailMatch.email.toLowerCase() ||
                              (platformEmailMatch.id &&
                                x.mollureUserId ===
                                  platformEmailMatch.id),
                          )?.clientKind === "company"
                            ? "company"
                            : "individual",
                      });
                      {
                        const listed = clientList.find(
                          (x) =>
                            x.email.toLowerCase() ===
                              platformEmailMatch.email.toLowerCase() ||
                            (platformEmailMatch.id &&
                              x.mollureUserId ===
                                platformEmailMatch.id),
                        );
                        setBookingPhoneDraft(
                          phoneDraftFromStoredContact(
                            platformEmailMatch.phone ||
                              listed?.phone,
                            platformEmailMatch.countryCode ||
                              listed?.countryCode,
                          ),
                        );
                      }
                      setAddClientSource("mollure-platform");
                      setPaymentMethod("online");
                      setSlotClientAdded(true);
                      setPlatformEmailInput("");
                      setSlotBookingScreen("new-booking");
                    }}
                    sx={{
                      width: "100%",
                      border: `1px solid ${alpha(m.navy, 0.12)}`,
                      borderRadius: "10px",
                      px: 1.5,
                      py: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      bgcolor: "#fff",
                      textAlign: "left",
                      "&:hover": {
                        bgcolor: alpha(m.teal, 0.04),
                        borderColor: m.teal,
                      },
                    }}
                  >
                    <Avatar
                      sx={{ width: 32, height: 32, fontSize: 14 }}
                    >
                      {platformEmailMatch.name
                        .slice(0, 1)
                        .toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        sx={{ minWidth: 0 }}
                      >
                        <BodyText
                          sx={{
                            ...mollureLabelSx(m.navy),
                            lineHeight: 1.2,
                          }}
                        >
                          {platformEmailMatch.name}
                        </BodyText>
                        <BookingClientTags
                          isMollure
                          clientKind={
                            platformEmailMatch.userType ===
                              "company" ||
                            clientList.find(
                              (x) =>
                                x.email.toLowerCase() ===
                                  platformEmailMatch.email.toLowerCase() ||
                                (platformEmailMatch.id &&
                                  x.mollureUserId ===
                                    platformEmailMatch.id),
                            )?.clientKind === "company"
                              ? "company"
                              : "individual"
                          }
                        />
                      </Stack>
                      <BodyText
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.46),
                          lineHeight: 1.2,
                        }}
                      >
                        {platformEmailMatch.email}
                      </BodyText>
                    </Box>
                  </ButtonBase>
                ) : platformLookupStatus === "loading" ? (
                  <BodyText
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.46),
                    }}
                  >
                    Searching Mollure clientsâ€¦
                  </BodyText>
                ) : platformLookupStatus === "not_found" ? (
                  <BodyText
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: theme.palette.error.main,
                    }}
                  >
                    User is not a Mollure client
                  </BodyText>
                ) : null}
              </Stack>
            ) : null}
          </React.Fragment>
        ))}

        <Box sx={{ flex: 1, minHeight: 360 }} />
      </Stack>
  );
}
