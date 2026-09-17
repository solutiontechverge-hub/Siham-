"use client";

import { Box, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import AppTextField from "../../AppTextField";

import AppCountryPhoneFields from "../../AppCountryPhoneFields";

import { sanitizeNameInput } from "../../../../lib/field-input";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensGuestBag = Pick<
  Vm,
  | "guestDraft"
  | "m"
  | "setGuestDraft"
  | "slotErrors"
>;

type Props = { bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensGuestBag };

export default function ProfessionalFixedLocationCalendarBookingDrawerSubScreensGuest({ bag }: Props) {
  const { guestDraft, m, setGuestDraft, slotErrors } = bag;

  return (
      <Stack spacing={1.6}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BodyText
            sx={{
              fontWeight: 900,
              color: alpha(m.navy, 0.88),
              fontSize: 22,
              letterSpacing: "-0.01em",
            }}
          >
            Add Guest
          </BodyText>
          <Box
            sx={{
              px: 1,
              height: 22,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.06),
              color: alpha(m.navy, 0.72),
              display: "inline-flex",
              alignItems: "center",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            Guest
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.25}>
          <AppTextField
            label="First Name"
            placeholder="Enter first name"
            value={guestDraft.firstName}
            onChange={(e) =>
              setGuestDraft((p) => ({
                ...p,
                firstName: sanitizeNameInput(e.target.value),
              }))
            }
            fullWidth
            required
            error={Boolean(slotErrors.guestFirstName)}
            helperText={slotErrors.guestFirstName}
          />
          <AppTextField
            label="Last Name"
            placeholder="Enter last name (optional)"
            value={guestDraft.lastName}
            onChange={(e) =>
              setGuestDraft((p) => ({
                ...p,
                lastName: sanitizeNameInput(e.target.value),
              }))
            }
            fullWidth
            error={Boolean(slotErrors.guestLastName)}
            helperText={slotErrors.guestLastName}
          />
        </Stack>

        <AppCountryPhoneFields
          countryCode={guestDraft.phoneCode}
          phone={guestDraft.phoneNumber}
          onCountryCodeChange={(dialCode) =>
            setGuestDraft((p) => ({
              ...p,
              phoneCode: dialCode,
            }))
          }
          onPhoneChange={(phone) =>
            setGuestDraft((p) => ({
              ...p,
              phoneNumber: phone,
            }))
          }
          countryCodeError={slotErrors.guestPhoneCode}
          phoneError={slotErrors.guestPhoneNumber}
          phonePlaceholder="+316xxxxxxxx"
          required
        />

        <AppTextField
          label="Email Address"
          placeholder="Enter email address"
          value={guestDraft.email}
          onChange={(e) =>
            setGuestDraft((p) => ({
              ...p,
              email: e.target.value,
            }))
          }
          fullWidth
          required
          error={Boolean(slotErrors.guestEmail)}
          helperText={slotErrors.guestEmail}
        />

        <Box sx={{ flex: 1, minHeight: 140 }} />
      </Stack>
  );
}
