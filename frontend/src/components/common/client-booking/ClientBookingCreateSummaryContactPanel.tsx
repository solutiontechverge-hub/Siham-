"use client";

import { mollureLabelSx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppCountryPhoneFields from "../AppCountryPhoneFields";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import type { ClientBookingDesiredLocation } from "./types";

type Props = {
  isDesired: boolean;
  countryCode: string;
  phone: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  hasProfilePhone: boolean;
  address: ClientBookingDesiredLocation;
  onAddressChange: React.Dispatch<
    React.SetStateAction<ClientBookingDesiredLocation>
  >;
  municipalityOptions: string[];
};

export default function ClientBookingCreateSummaryContactPanel({
  isDesired,
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  hasProfilePhone,
  address,
  onAddressChange,
  municipalityOptions,
}: Props) {
  const m = useTheme().palette.mollure;
  const addressFieldLabelSx = {
    fontSize: 12,
    fontWeight: 900,
    color: alpha(m.navy, 0.65),
    mb: 0.75,
  } as const;
  const addressFieldInputSx = {
    "& .MuiOutlinedInput-root": {
      height: 40,
      minHeight: 40,
      alignItems: "center",
    },
  } as const;

  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.22)}`,
        bgcolor: "#fff",
        px: { xs: 1.5, md: 2 },
        py: 1.75,
      }}
    >
      <Typography
        sx={mollureLabelSx(m.navy, {
          fontWeight: 900,
          fontSize: 14,
          mb: 1.5,
        })}
      >
        {isDesired ? "Contact & Address Details" : "Contact"}
      </Typography>

      <Stack spacing={1.35} sx={{ width: "100%" }}>
        <AppCountryPhoneFields
          countryCode={countryCode}
          phone={phone}
          onCountryCodeChange={onCountryCodeChange}
          onPhoneChange={onPhoneChange}
          label="Contact Number"
          phonePlaceholder={
            hasProfilePhone ? "Phone number" : "Enter your phone number"
          }
          required
          disabled={hasProfilePhone}
          validateOnBlur={!hasProfilePhone}
          countryCodeWidth={140}
        />

        {isDesired ? (
          <Box
            sx={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              columnGap: 1.25,
              rowGap: 1.35,
            }}
          >
            <Box>
              <Typography sx={addressFieldLabelSx}>Street Address</Typography>
              <AppTextField
                value={address.street}
                onChange={(e) =>
                  onAddressChange((prev) => ({
                    ...prev,
                    street: e.target.value,
                  }))
                }
                placeholder="Churchill-laan"
                fullWidth
                size="small"
                sx={addressFieldInputSx}
              />
            </Box>
            <Box>
              <Typography sx={addressFieldLabelSx}>Street Number</Typography>
              <AppTextField
                value={address.number}
                onChange={(e) =>
                  onAddressChange((prev) => ({
                    ...prev,
                    number: e.target.value,
                  }))
                }
                placeholder="34234"
                fullWidth
                size="small"
                sx={addressFieldInputSx}
              />
            </Box>
            <Box>
              <Typography sx={addressFieldLabelSx}>Postal Code</Typography>
              <AppTextField
                value={address.postalCode}
                onChange={(e) =>
                  onAddressChange((prev) => ({
                    ...prev,
                    postalCode: e.target.value,
                  }))
                }
                placeholder="1234 AB"
                fullWidth
                size="small"
                sx={addressFieldInputSx}
              />
            </Box>
            <Box>
              <Typography sx={addressFieldLabelSx}>Municipality</Typography>
              <AppDropdown
                value={address.municipality}
                onChange={(val) =>
                  onAddressChange((prev) => ({
                    ...prev,
                    municipality: String(val ?? ""),
                    province: "",
                  }))
                }
                options={[
                  ...(address.municipality &&
                  !municipalityOptions.includes(address.municipality)
                    ? [
                        {
                          value: address.municipality,
                          label: address.municipality,
                        },
                      ]
                    : []),
                  ...municipalityOptions.map((muni) => ({
                    value: muni,
                    label: muni,
                  })),
                ]}
                placeholder="Municipality"
                fullWidth
                size="small"
                sx={addressFieldInputSx}
              />
            </Box>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
