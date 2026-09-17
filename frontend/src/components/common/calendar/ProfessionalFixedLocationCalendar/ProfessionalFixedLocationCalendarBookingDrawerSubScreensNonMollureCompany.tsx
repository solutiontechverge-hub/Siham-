"use client";

import { Box, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import AppTextField from "../../AppTextField";

import AppCountryPhoneFields from "../../AppCountryPhoneFields";

import AppDropdown from "../../AppDropdown";

import ClientPlatformTag from "../../ClientPlatformTag";

import { GENDER_OPTIONS } from "../../../../lib/gender-options";

import { sanitizeNameInput } from "../../../../lib/field-input";

import {
  type ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureBag,
} from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureIndividual";

type Props = { bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureBag };

export function ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureCompany({ bag }: Props) {
  const {
    m,
    nonMollureClientType,
    nonMollureDraft,
    setNonMollureClientType,
    setNonMollureDraft,
    setSlotBookingScreen,
    slotErrors,
  } = bag;

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
            Add Non-Mollure Client
          </BodyText>
          <ClientPlatformTag clientKind="company" />
        </Stack>

        <Box sx={{ pt: 0.25 }}>
          <AppDropdown
            label="Client Type"
            value={nonMollureClientType || "company"}
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
          label="Legal Name"
          placeholder="Enter legal name"
          value={nonMollureDraft.legalName}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              legalName: e.target.value,
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureLegalName)}
          helperText={slotErrors.nonMollureLegalName}
        />
        <AppTextField
          label="COC"
          placeholder="Enter COC"
          value={nonMollureDraft.coc}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              coc: e.target.value,
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureCoc)}
          helperText={slotErrors.nonMollureCoc}
        />
        <AppTextField
          label="VAT"
          placeholder="Enter VAT"
          value={nonMollureDraft.vat}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              vat: e.target.value,
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureVat)}
          helperText={slotErrors.nonMollureVat}
        />

        <AppTextField
          label="Contact Personâ€™s First Name"
          placeholder="Enter first name"
          value={nonMollureDraft.contactFirstName}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              contactFirstName: sanitizeNameInput(e.target.value),
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureContactFirstName)}
          helperText={slotErrors.nonMollureContactFirstName}
        />
        <AppTextField
          label="Contact Personâ€™s Last Name"
          placeholder="Enter last name"
          value={nonMollureDraft.contactLastName}
          onChange={(e) =>
            setNonMollureDraft((p) => ({
              ...p,
              contactLastName: e.target.value,
            }))
          }
          fullWidth
          error={Boolean(slotErrors.nonMollureContactLastName)}
          helperText={slotErrors.nonMollureContactLastName}
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

        <Box sx={{ pt: 0.5 }}>
          <BodyText
            sx={{
              fontSize: 12,
              fontWeight: 900,
              color: alpha(m.navy, 0.65),
              mb: 0.75,
            }}
          >
            Business Address
          </BodyText>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1.25}>
              <AppTextField
                label="Street"
                placeholder="Enter street"
                value={nonMollureDraft.street}
                onChange={(e) =>
                  setNonMollureDraft((p) => ({
                    ...p,
                    street: e.target.value,
                  }))
                }
                fullWidth
                error={Boolean(slotErrors.nonMollureStreet)}
                helperText={slotErrors.nonMollureStreet}
              />
              <AppTextField
                label="Number"
                placeholder="Enter number"
                value={nonMollureDraft.streetNumber}
                onChange={(e) =>
                  setNonMollureDraft((p) => ({
                    ...p,
                    streetNumber: e.target.value,
                  }))
                }
                fullWidth
                error={Boolean(slotErrors.nonMollureStreetNumber)}
                helperText={slotErrors.nonMollureStreetNumber}
              />
            </Stack>
            <Stack direction="row" spacing={1.25}>
              <AppTextField
                label="Postal Code"
                placeholder="Enter postal code"
                value={nonMollureDraft.postalCode}
                onChange={(e) =>
                  setNonMollureDraft((p) => ({
                    ...p,
                    postalCode: e.target.value,
                  }))
                }
                fullWidth
                error={Boolean(slotErrors.nonMollurePostalCode)}
                helperText={slotErrors.nonMollurePostalCode}
              />
              <AppDropdown
                label="Province"
                value={nonMollureDraft.province}
                onChange={(val) =>
                  setNonMollureDraft((p) => ({
                    ...p,
                    province: val as string,
                  }))
                }
                options={[
                  { label: "Province", value: "" },
                  { label: "Province A", value: "province-a" },
                  { label: "Province B", value: "province-b" },
                ]}
                fullWidth
                placeholder="Select province"
                error={Boolean(slotErrors.nonMollureProvince)}
                helperText={slotErrors.nonMollureProvince}
              />
            </Stack>
            <AppDropdown
              label="Municipality"
              value={nonMollureDraft.municipality}
              onChange={(val) =>
                setNonMollureDraft((p) => ({
                  ...p,
                  municipality: val as string,
                }))
              }
              options={[
                { label: "Municipality", value: "" },
                {
                  label: "Municipality A",
                  value: "municipality-a",
                },
                {
                  label: "Municipality B",
                  value: "municipality-b",
                },
              ]}
              fullWidth
              placeholder="Select municipality"
              error={Boolean(slotErrors.nonMollureMunicipality)}
              helperText={slotErrors.nonMollureMunicipality}
            />
          </Stack>
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
