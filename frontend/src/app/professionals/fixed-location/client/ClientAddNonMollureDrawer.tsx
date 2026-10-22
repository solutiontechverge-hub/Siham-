"use client";

import * as React from "react";
import { Box, Grid, MenuItem, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../../theme/mollureHierarchy";
import { mollureWhiteFieldInputSx } from "../../../../components/common/mollureFormSx";
import { GENDER_MENU_OPTIONS } from "../../../../lib/gender-options";
import AppDatePicker from "../../../../components/common/AppDatePicker";
import MollureFormField from "../../../../components/common/MollureFormField";
import AppDrawer from "../../../../components/common/AppDrawer";
import { FinanceDrawerActionsFooter } from "../../../../components/common/FinanceDrawerFooter";
import { AppCountryPhoneFields } from "../../../../components/common";
import {
  getTodayIsoDate,
  NETHERLANDS_MUNICIPALITY_OPTIONS,
  NETHERLANDS_PROVINCE_OPTIONS,
} from "./client.data";
import type { NonMollureClientType } from "./client.types";
import { Typography } from "../../../../components/ui/typography";
import { useEmptySelectRenderProps } from "./useEmptySelectRenderProps";

type FieldErrors = Partial<Record<string, string>>;
type StrSet = React.Dispatch<React.SetStateAction<string>>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  clientType: NonMollureClientType;
  setClientType: React.Dispatch<React.SetStateAction<NonMollureClientType>>;
  typeError: string;
  setTypeError: StrSet;
  indFirstName: string;
  setIndFirstName: StrSet;
  indLastName: string;
  setIndLastName: StrSet;
  indGender: string;
  setIndGender: StrSet;
  indDob: string;
  setIndDob: StrSet;
  indCountryCode: string;
  setIndCountryCode: StrSet;
  indPhone: string;
  setIndPhone: StrSet;
  indEmail: string;
  setIndEmail: StrSet;
  indResidentialArea: string;
  setIndResidentialArea: StrSet;
  indErrors: FieldErrors;
  setIndErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  coLegalName: string;
  setCoLegalName: StrSet;
  coCoc: string;
  setCoCoc: StrSet;
  coVat: string;
  setCoVat: StrSet;
  coContactFirst: string;
  setCoContactFirst: StrSet;
  coContactLast: string;
  setCoContactLast: StrSet;
  coGender: string;
  setCoGender: StrSet;
  coStreet: string;
  setCoStreet: StrSet;
  coStreetNumber: string;
  setCoStreetNumber: StrSet;
  coPostal: string;
  setCoPostal: StrSet;
  coProvince: string;
  setCoProvince: StrSet;
  coMunicipality: string;
  setCoMunicipality: StrSet;
  coCountryCode: string;
  setCoCountryCode: StrSet;
  coPhone: string;
  setCoPhone: StrSet;
  coEmail: string;
  setCoEmail: StrSet;
  compErrors: FieldErrors;
  setCompErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  technicalNote: string;
  setTechnicalNote: StrSet;
};

export default function ClientAddNonMollureDrawer({
  open,
  onClose,
  onSave,
  clientType: nonMollureClientType,
  setClientType: setNonMollureClientType,
  typeError: nonMollureTypeError,
  setTypeError: setNonMollureTypeError,
  indFirstName,
  setIndFirstName,
  indLastName,
  setIndLastName,
  indGender,
  setIndGender,
  indDob,
  setIndDob,
  indCountryCode,
  setIndCountryCode,
  indPhone,
  setIndPhone,
  indEmail,
  setIndEmail,
  indResidentialArea,
  setIndResidentialArea,
  indErrors,
  setIndErrors,
  coLegalName,
  setCoLegalName,
  coCoc,
  setCoCoc,
  coVat,
  setCoVat,
  coContactFirst,
  setCoContactFirst,
  coContactLast,
  setCoContactLast,
  coGender,
  setCoGender,
  coStreet,
  setCoStreet,
  coStreetNumber,
  setCoStreetNumber,
  coPostal,
  setCoPostal,
  coProvince,
  setCoProvince,
  coMunicipality,
  setCoMunicipality,
  coCountryCode,
  setCoCountryCode,
  coPhone,
  setCoPhone,
  coEmail,
  setCoEmail,
  compErrors,
  setCompErrors,
  technicalNote: nonMollureTechnicalNote,
  setTechnicalNote: setNonMollureTechnicalNote,
}: Props) {
  const m = useTheme().palette.mollure;
  const genderSelectProps = useEmptySelectRenderProps("Select gender");
  const clientTypeSelectProps = useEmptySelectRenderProps("Select client type");

  return (
<AppDrawer
  anchor="right"
  open={open}
  onClose={onClose}
  title="Add Non-Mollure Client"
  footer={
    <FinanceDrawerActionsFooter
      onCancel={onClose}
      onPrimary={onSave}
      primaryLabel="Save"
      spacing={1}
      stackSx={{ py: 2 }}
      primarySx={{
        borderRadius: "8px",
        textTransform: "none",
        fontWeight: 900,
        bgcolor: "primary.main",
        color: "#fff",
        "&:hover": { bgcolor: "mollure.tealDark" },
        height: 36,
        px: 3,
      }}
    />
  }
>
  <Box sx={{ px: 2.5, py: 2 }}>
    <Stack spacing={2}>
      <Box>
        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            color: alpha(m.navy, 0.62),
            mb: 0.75,
          }}
        >
          Client Type
        </Typography>
        <MollureFormField
          select
          value={nonMollureClientType}
          onChange={(e) => {
            const raw = e.target.value;
            const nextType = raw as
              "" | "Individual Client" | "Company Client";
            setNonMollureClientType(nextType);
            setNonMollureTypeError("");
            setIndErrors({});
            setCompErrors({});
          }}
          error={Boolean(nonMollureTypeError)}
          helperText={nonMollureTypeError}
          sx={mollureWhiteFieldInputSx}
          SelectProps={clientTypeSelectProps}
        >
          <MenuItem value="">
            <Typography sx={{ color: alpha(m.navy, 0.5) }}>
              Select client type
            </Typography>
          </MenuItem>
          <MenuItem value="Individual Client">Individual Client</MenuItem>
          <MenuItem value="Company Client">Company Client</MenuItem>
        </MollureFormField>
      </Box>

      {nonMollureClientType === "Individual Client" && (
        <Stack spacing={1.25}>
          <MollureFormField
            placeholder="First Name"
            value={indFirstName}
            onChange={(e) => {
              setIndFirstName(e.target.value);
              setIndErrors((p) => ({ ...p, firstName: undefined }));
            }}
            error={Boolean(indErrors.firstName)}
            helperText={indErrors.firstName}
          />
          <MollureFormField
            placeholder="Last Name"
            value={indLastName}
            onChange={(e) => {
              setIndLastName(e.target.value);
              setIndErrors((p) => ({ ...p, lastName: undefined }));
            }}
            error={Boolean(indErrors.lastName)}
            helperText={indErrors.lastName}
          />

          <MollureFormField
            select
            label="Gender"
            value={indGender}
            onChange={(e) => {
              setIndGender(e.target.value);
              setIndErrors((p) => ({ ...p, gender: undefined }));
            }}
            error={Boolean(indErrors.gender)}
            helperText={indErrors.gender}
            sx={mollureWhiteFieldInputSx}
            SelectProps={genderSelectProps}
          >
            <MenuItem value="">
              <Typography sx={{ color: alpha(m.navy, 0.5) }}>
                Select gender
              </Typography>
            </MenuItem>
            {GENDER_MENU_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MollureFormField>

          <Box sx={{ pt: 0.25 }}>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.62),
                mb: 0.75,
              }}
            >
              Date of Birth
            </Typography>
            <AppDatePicker
              value={indDob}
              onChange={(iso) => {
                setIndDob(iso);
                setIndErrors((p) => ({ ...p, dob: undefined }));
              }}
              max={getTodayIsoDate()}
              fullWidth
            />
          </Box>

          <AppCountryPhoneFields
            countryCode={indCountryCode}
            phone={indPhone}
            onCountryCodeChange={setIndCountryCode}
            onPhoneChange={setIndPhone}
            countryCodeError={indErrors.countryCode}
            phoneError={indErrors.phone}
            onClearErrors={() =>
              setIndErrors((p) => ({
                ...p,
                countryCode: undefined,
                phone: undefined,
              }))
            }
            phonePlaceholder="+316xxxxxxxx"
          />

          <MollureFormField
            placeholder="Email Address"
            value={indEmail}
            onChange={(e) => {
              setIndEmail(e.target.value);
              setIndErrors((p) => ({ ...p, email: undefined }));
            }}
            error={Boolean(indErrors.email)}
            helperText={indErrors.email}
            sx={mollureWhiteFieldInputSx}
          />

          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              color: alpha(m.navy, 0.62),
              pt: 0.5,
            }}
          >
            Address
          </Typography>
          <MollureFormField
            placeholder="Residential Area"
            value={indResidentialArea}
            onChange={(e) => {
              setIndResidentialArea(e.target.value);
              setIndErrors((p) => ({ ...p, residentialArea: undefined }));
            }}
            error={Boolean(indErrors.residentialArea)}
            helperText={indErrors.residentialArea}
            sx={mollureWhiteFieldInputSx}
          />
        </Stack>
      )}

      {nonMollureClientType === "Company Client" && (
        <Stack spacing={1.25}>
          <MollureFormField
            placeholder="Legal Name"
            value={coLegalName}
            onChange={(e) => {
              setCoLegalName(e.target.value);
              setCompErrors((p) => ({ ...p, legalName: undefined }));
            }}
            error={Boolean(compErrors.legalName)}
            helperText={compErrors.legalName}
          />
          <MollureFormField
            placeholder="COC"
            value={coCoc}
            onChange={(e) => {
              setCoCoc(e.target.value);
              setCompErrors((p) => ({ ...p, coc: undefined }));
            }}
            error={Boolean(compErrors.coc)}
            helperText={compErrors.coc}
          />
          <MollureFormField
            placeholder="VAT"
            value={coVat}
            onChange={(e) => {
              setCoVat(e.target.value);
              setCompErrors((p) => ({ ...p, vat: undefined }));
            }}
            error={Boolean(compErrors.vat)}
            helperText={compErrors.vat}
          />
          <MollureFormField
            placeholder="Contact Person's First Name"
            value={coContactFirst}
            onChange={(e) => {
              setCoContactFirst(e.target.value);
              setCompErrors((p) => ({ ...p, contactFirst: undefined }));
            }}
            error={Boolean(compErrors.contactFirst)}
            helperText={compErrors.contactFirst}
          />
          <MollureFormField
            placeholder="Contact Person's Last Name"
            value={coContactLast}
            onChange={(e) => {
              setCoContactLast(e.target.value);
              setCompErrors((p) => ({ ...p, contactLast: undefined }));
            }}
            error={Boolean(compErrors.contactLast)}
            helperText={compErrors.contactLast}
          />
          <MollureFormField
            select
            label="Gender"
            value={coGender}
            onChange={(e) => {
              setCoGender(e.target.value);
              setCompErrors((p) => ({ ...p, gender: undefined }));
            }}
            error={Boolean(compErrors.gender)}
            helperText={compErrors.gender}
            sx={mollureWhiteFieldInputSx}
            SelectProps={genderSelectProps}
          >
            <MenuItem value="">
              <Typography sx={{ color: alpha(m.navy, 0.5) }}>
                Select gender
              </Typography>
            </MenuItem>
            {GENDER_MENU_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MollureFormField>

          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              color: alpha(m.navy, 0.62),
              pt: 0.5,
            }}
          >
            Business Address
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={8}>
              <MollureFormField
                placeholder="Street"
                value={coStreet}
                onChange={(e) => {
                  setCoStreet(e.target.value);
                  setCompErrors((p) => ({ ...p, street: undefined }));
                }}
                error={Boolean(compErrors.street)}
                helperText={compErrors.street}
                sx={mollureWhiteFieldInputSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MollureFormField
                placeholder="Number"
                value={coStreetNumber}
                onChange={(e) => {
                  setCoStreetNumber(e.target.value);
                  setCompErrors((p) => ({
                    ...p,
                    streetNumber: undefined,
                  }));
                }}
                error={Boolean(compErrors.streetNumber)}
                helperText={compErrors.streetNumber}
                sx={mollureWhiteFieldInputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MollureFormField
                placeholder="Postal Code"
                value={coPostal}
                onChange={(e) => {
                  setCoPostal(e.target.value);
                  setCompErrors((p) => ({ ...p, postal: undefined }));
                }}
                error={Boolean(compErrors.postal)}
                helperText={compErrors.postal}
                sx={mollureWhiteFieldInputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MollureFormField
                select
                value={coProvince || "Province"}
                onChange={(e) => {
                  setCoProvince(e.target.value);
                  setCompErrors((p) => ({ ...p, province: undefined }));
                }}
                error={Boolean(compErrors.province)}
                helperText={compErrors.province}
                sx={mollureWhiteFieldInputSx}
              >
                {NETHERLANDS_PROVINCE_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o === "Province" ? "" : o}>
                    {o}
                  </MenuItem>
                ))}
              </MollureFormField>
            </Grid>
            <Grid item xs={12} md={6}>
              <MollureFormField
                select
                value={coMunicipality || "Municipality"}
                onChange={(e) => {
                  setCoMunicipality(e.target.value);
                  setCompErrors((p) => ({
                    ...p,
                    municipality: undefined,
                  }));
                }}
                error={Boolean(compErrors.municipality)}
                helperText={compErrors.municipality}
                sx={mollureWhiteFieldInputSx}
              >
                {NETHERLANDS_MUNICIPALITY_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o === "Municipality" ? "" : o}>
                    {o}
                  </MenuItem>
                ))}
              </MollureFormField>
            </Grid>
          </Grid>

          <AppCountryPhoneFields
            countryCode={coCountryCode}
            phone={coPhone}
            onCountryCodeChange={setCoCountryCode}
            onPhoneChange={setCoPhone}
            countryCodeError={compErrors.countryCode}
            phoneError={compErrors.phone}
            onClearErrors={() =>
              setCompErrors((p) => ({
                ...p,
                countryCode: undefined,
                phone: undefined,
              }))
            }
            phonePlaceholder="+316xxxxxxxxx"
          />

          <MollureFormField
            placeholder="Email Address"
            value={coEmail}
            onChange={(e) => {
              setCoEmail(e.target.value);
              setCompErrors((p) => ({ ...p, email: undefined }));
            }}
            error={Boolean(compErrors.email)}
            helperText={compErrors.email}
            sx={mollureWhiteFieldInputSx}
          />
        </Stack>
      )}

      <Typography
        sx={mollureLabelSx(m.navy, { pt: 0.5 })}
      >
        Technical Note (Optional)
      </Typography>
      <MollureFormField
        multiline
        minRows={3}
        placeholder="Any technical note about client"
        value={nonMollureTechnicalNote}
        onChange={(e) => setNonMollureTechnicalNote(e.target.value)}
        sx={mollureWhiteFieldInputSx}
      />
    </Stack>
  </Box>
</AppDrawer>
  );
}
