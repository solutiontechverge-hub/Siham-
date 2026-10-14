"use client";

import { Box, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import AppDatePicker from "../../AppDatePicker";

import AppTextField from "../../AppTextField";

import AppCountryPhoneFields from "../../AppCountryPhoneFields";

import AppDropdown from "../../AppDropdown";

import ClientPlatformTag from "../../ClientPlatformTag";

import { GENDER_OPTIONS } from "../../../../lib/gender-options";

import { sanitizeNameInput } from "../../../../lib/field-input";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureBag = Pick<
  Vm,
  | "m"
  | "nonMollureClientType"
  | "nonMollureDraft"
  | "setNonMollureClientType"
  | "setNonMollureDraft"
  | "setSlotBookingScreen"
  | "slotErrors"
  | "theme"
  | "todayIso"
>;

type Props = { bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureBag };

export function ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureIndividual({ bag }: Props) {
  const {
    m,
    nonMollureClientType,
    nonMollureDraft,
    setNonMollureClientType,
    setNonMollureDraft,
    setSlotBookingScreen,
    slotErrors,
    theme,
    todayIso,
  } = bag;

  return (
      <Stack spacing={1.6}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BodyText
            sx={{
              fontWeight: 900,
              color: alpha(m.navy, 0.88),
              fontSize: 20,
              letterSpacing: "-0.01em",
            }}
          >
            Add Non-Mollure Client
          </BodyText>
          <ClientPlatformTag clientKind="individual" />
        </Stack>

        <Box sx={{ pt: 0.25 }}>
          <AppDropdown
            label="Client Type"
            value={nonMollureClientType || "individual"}
            onChange={(val) => {
              const next = val as "individual" | "company";
              setNonMollureClientType(next);
              setSlotBookingScreen(
                next === "individual"
                  ? "non-mollure-individual"
                  : "non-mollure-company",
              );
            }}
            options={[
              { label: "Individual Client", value: "individual" },
              { label: "Company Client", value: "company" },
            ]}
            fullWidth
            placeholder="Select Client Type"
          />
        </Box>

        <AppTextField
          label="First Name"
          placeholder="Enter first name"
          value={nonMollureDraft.firstName}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              firstName: sanitizeNameInput(e.target.value),
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureFirstName)}
          helperText={slotErrors.nonMollureFirstName}
        />
        <AppTextField
          label="Last Name"
          placeholder="Enter last name"
          value={nonMollureDraft.lastName}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              lastName: sanitizeNameInput(e.target.value),
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureLastName)}
          helperText={slotErrors.nonMollureLastName}
        />

        <AppDropdown
          label="Gender"
          value={nonMollureDraft.gender}
          onChange={(val) =>
            setNonMollureDraft((p) => ({
              ...p,
              gender: val as any,
            }))
          }
          options={[...GENDER_OPTIONS]}
          fullWidth
          placeholder="Select Gender"
          error={Boolean(slotErrors.nonMollureGender)}
          helperText={slotErrors.nonMollureGender}
        />

        <Box>
          <BodyText
            sx={{
              fontSize: 12,
              fontWeight: 900,
              color: alpha(m.navy, 0.65),
              mb: 0.75,
            }}
          >
            Date of Birth
          </BodyText>
          <AppDatePicker
            value={nonMollureDraft.dob}
            onChange={(iso) =>
              setNonMollureDraft((p) => ({ ...p, dob: iso }))
            }
            max={todayIso}
            fullWidth
          />
          {slotErrors.nonMollureDob ? (
            <BodyText
              sx={{
                mt: 0.5,
                fontSize: 11.5,
                fontWeight: 700,
                color: theme.palette.error.main,
              }}
            >
              {slotErrors.nonMollureDob}
            </BodyText>
          ) : null}
        </Box>

        <AppCountryPhoneFields
          countryCode={nonMollureDraft.phoneCode}
          phone={nonMollureDraft.phoneNumber}
          onCountryCodeChange={(dialCode) =>
            setNonMollureDraft((p) => ({
              ...p,
              phoneCode: dialCode,
            }))
          }
          onPhoneChange={(phone) =>
            setNonMollureDraft((p) => ({
              ...p,
              phoneNumber: phone,
            }))
          }
          countryCodeError={slotErrors.nonMollurePhoneCode}
          phoneError={slotErrors.nonMollurePhoneNumber}
          phonePlaceholder="+316xxxxxxxx"
        />

        <AppTextField
          label="Email Address"
          placeholder="Enter email address"
          value={nonMollureDraft.email}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              email: e.target.value,
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureEmail)}
          helperText={slotErrors.nonMollureEmail}
        />

        <Box sx={{ flex: 1, minHeight: 140 }} />
      </Stack>
  );
}

