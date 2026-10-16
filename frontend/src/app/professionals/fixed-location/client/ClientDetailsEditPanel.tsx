"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Grid,
  MenuItem,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../../theme/mollureHierarchy";
import { mollureWhiteFieldInputSx } from "../../../../components/common/mollureFormSx";
import { GENDER_MENU_OPTIONS } from "../../../../lib/gender-options";
import AppDatePicker, {
  normalizeDateToIso,
} from "../../../../components/common/AppDatePicker";
import MollureFormField from "../../../../components/common/MollureFormField";
import { AppCountryPhoneFields } from "../../../../components/common";
import ClientPlatformTag from "../../../../components/common/ClientPlatformTag";
import {
  getTodayIsoDate,
  NETHERLANDS_MUNICIPALITY_OPTIONS,
  NETHERLANDS_PROVINCE_OPTIONS,
} from "./client.data";
import type {
  ClientPhoneErrors,
  EditCompanyFormState,
  EditIndividualFormState,
} from "./client.types";
import type { ClientRecord } from "./data/clientList";
import { isMollureClient } from "./data/clientListFilters";
import { Typography } from "../../../../components/ui/typography";
import { useEmptySelectRenderProps } from "./useEmptySelectRenderProps";

type Props = {
  client: ClientRecord;
  editCompanyForm: EditCompanyFormState;
  setEditCompanyForm: React.Dispatch<React.SetStateAction<EditCompanyFormState>>;
  editIndividualForm: EditIndividualFormState;
  setEditIndividualForm: React.Dispatch<
    React.SetStateAction<EditIndividualFormState>
  >;
  editPhoneErrors: ClientPhoneErrors;
  setEditPhoneErrors: React.Dispatch<React.SetStateAction<ClientPhoneErrors>>;
};

export default function ClientDetailsEditPanel({
  client,
  editCompanyForm,
  setEditCompanyForm,
  editIndividualForm,
  setEditIndividualForm,
  editPhoneErrors,
  setEditPhoneErrors,
}: Props) {
  const m = useTheme().palette.mollure;
  const genderSelectProps = useEmptySelectRenderProps("Select gender");
  const fieldsLocked = isMollureClient(client);

  if (client.kind === "company") {
    return (
<Box sx={{ px: 2.5, py: 2 }}>
  <Stack spacing={1.5}>
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: "12px",
        bgcolor: alpha(m.navy, 0.04),
        border: `1px solid ${alpha(m.navy, 0.06)}`,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar
          src={client.photoSrc}
          sx={{
            width: 44,
            height: 44,
            bgcolor: alpha(m.navy, 0.08),
            color: alpha(m.navy, 0.78),
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {client.name
            .split(" ")
            .map((p: string) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography
              sx={mollureSectionTitleSx(m.navy, {
                fontSize: 13.5,
              })}
            >
              {client.name}
            </Typography>
            <ClientPlatformTag
              isMollure={isMollureClient(client)}
              clientKind={client.kind}
            />
          </Stack>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: alpha(m.navy, 0.5),
              mt: 0.25,
            }}
          >
            {client.email}
          </Typography>
        </Box>
      </Stack>
    </Paper>

    <Stack spacing={1.25}>
      <MollureFormField
        placeholder="Legal Name"
        value={editCompanyForm.legalName}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            legalName: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        placeholder="COC"
        value={editCompanyForm.coc}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            coc: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        placeholder="VAT"
        value={editCompanyForm.vat}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            vat: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        placeholder="Contact Person's First Name"
        value={editCompanyForm.contactFirst}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            contactFirst: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        placeholder="Contact Person's Last Name"
        value={editCompanyForm.contactLast}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            contactLast: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        select
        label="Gender"
        value={editCompanyForm.gender}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            gender: e.target.value,
          }))
        }
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

      <AppCountryPhoneFields
        countryCode={editCompanyForm.countryCode}
        phone={editCompanyForm.phone}
        disabled={fieldsLocked}
        onCountryCodeChange={(dialCode) =>
          setEditCompanyForm((p) => ({
            ...p,
            countryCode: dialCode,
          }))
        }
        onPhoneChange={(phone) =>
          setEditCompanyForm((p) => ({ ...p, phone }))
        }
        countryCodeError={editPhoneErrors.countryCode}
        phoneError={editPhoneErrors.phone}
        onClearErrors={() => setEditPhoneErrors({})}
        phonePlaceholder="+316xxxxxxxxx"
      />

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
            value={editCompanyForm.street}
            disabled={fieldsLocked}
            onChange={(e) =>
              setEditCompanyForm((p) => ({
                ...p,
                street: e.target.value,
              }))
            }
            sx={mollureWhiteFieldInputSx}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MollureFormField
            placeholder="Number"
            value={editCompanyForm.streetNumber}
            disabled={fieldsLocked}
            onChange={(e) =>
              setEditCompanyForm((p) => ({
                ...p,
                streetNumber: e.target.value,
              }))
            }
            sx={mollureWhiteFieldInputSx}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureFormField
            placeholder="Postal Code"
            value={editCompanyForm.postal}
            disabled={fieldsLocked}
            onChange={(e) =>
              setEditCompanyForm((p) => ({
                ...p,
                postal: e.target.value,
              }))
            }
            sx={mollureWhiteFieldInputSx}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MollureFormField
            select
            value={editCompanyForm.province || "Province"}
            disabled={fieldsLocked}
            onChange={(e) =>
              setEditCompanyForm((p) => ({
                ...p,
                province: e.target.value,
              }))
            }
            sx={mollureWhiteFieldInputSx}
          >
            {NETHERLANDS_PROVINCE_OPTIONS.map((o) => (
              <MenuItem key={o} value={o === "Province" ? "" : o}>
                {o}
              </MenuItem>
            ))}
          </MollureFormField>
        </Grid>
        <Grid item xs={12}>
          <MollureFormField
            select
            value={editCompanyForm.municipality || "Municipality"}
            disabled={fieldsLocked}
            onChange={(e) =>
              setEditCompanyForm((p) => ({
                ...p,
                municipality: e.target.value,
              }))
            }
            sx={mollureWhiteFieldInputSx}
          >
            {NETHERLANDS_MUNICIPALITY_OPTIONS.map((o) => (
              <MenuItem
                key={o}
                value={o === "Municipality" ? "" : o}
              >
                {o}
              </MenuItem>
            ))}
          </MollureFormField>
        </Grid>
      </Grid>

      <MollureFormField
        placeholder="Email Address"
        value={editCompanyForm.email}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            email: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />

      <Typography
        sx={mollureLabelSx(m.navy, { pt: 0.5 })}
      >
        Technical Note (Optional)
      </Typography>
      <MollureFormField
        multiline
        minRows={4}
        placeholder="Any Technical note about Client"
        value={editCompanyForm.technicalNote}
        onChange={(e) =>
          setEditCompanyForm((p) => ({
            ...p,
            technicalNote: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
    </Stack>
  </Stack>
</Box>
    );
  }

  return (
<Box sx={{ px: 2.5, py: 2 }}>
  <Stack spacing={1.5}>
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: "12px",
        bgcolor: alpha(m.navy, 0.04),
        border: `1px solid ${alpha(m.navy, 0.06)}`,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar
          src={client.photoSrc}
          sx={{
            width: 44,
            height: 44,
            bgcolor: alpha(m.navy, 0.08),
            color: alpha(m.navy, 0.78),
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {client.name
            .split(" ")
            .map((p: string) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography
              sx={mollureSectionTitleSx(m.navy, {
                fontSize: 13.5,
              })}
            >
              {client.name}
            </Typography>
            <ClientPlatformTag
              isMollure={isMollureClient(client)}
              clientKind={client.kind}
            />
          </Stack>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: alpha(m.navy, 0.5),
              mt: 0.25,
            }}
          >
            {client.email}
          </Typography>
        </Box>
      </Stack>
    </Paper>

    <Stack spacing={1.25}>
      <MollureFormField
        placeholder="First Name"
        value={editIndividualForm.firstName}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditIndividualForm((p) => ({
            ...p,
            firstName: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        placeholder="Last Name"
        value={editIndividualForm.lastName}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditIndividualForm((p) => ({
            ...p,
            lastName: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        select
        label="Gender"
        value={editIndividualForm.gender}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditIndividualForm((p) => ({
            ...p,
            gender: e.target.value,
          }))
        }
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
          value={normalizeDateToIso(editIndividualForm.dob)}
          onChange={(iso) =>
            setEditIndividualForm((p) => ({ ...p, dob: iso }))
          }
          max={getTodayIsoDate()}
          disabled={fieldsLocked}
          fullWidth
        />
      </Box>
      <AppCountryPhoneFields
        countryCode={editIndividualForm.countryCode}
        phone={editIndividualForm.phone}
        disabled={fieldsLocked}
        onCountryCodeChange={(dialCode) =>
          setEditIndividualForm((p) => ({
            ...p,
            countryCode: dialCode,
          }))
        }
        onPhoneChange={(phone) =>
          setEditIndividualForm((p) => ({ ...p, phone }))
        }
        countryCodeError={editPhoneErrors.countryCode}
        phoneError={editPhoneErrors.phone}
        onClearErrors={() => setEditPhoneErrors({})}
        phonePlaceholder="+316xxxxxxxx"
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
        placeholder="Residential Address"
        value={editIndividualForm.residentialAddress}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditIndividualForm((p) => ({
            ...p,
            residentialAddress: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        placeholder="Residential Area"
        value={editIndividualForm.residentialArea}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditIndividualForm((p) => ({
            ...p,
            residentialArea: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <MollureFormField
        placeholder="Email Address"
        value={editIndividualForm.email}
        disabled={fieldsLocked}
        onChange={(e) =>
          setEditIndividualForm((p) => ({
            ...p,
            email: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
      <Typography
        sx={mollureLabelSx(m.navy, { pt: 0.5 })}
      >
        Technical Note (Optional)
      </Typography>
      <MollureFormField
        multiline
        minRows={4}
        placeholder="Any Technical note about Client"
        value={editIndividualForm.technicalNote}
        onChange={(e) =>
          setEditIndividualForm((p) => ({
            ...p,
            technicalNote: e.target.value,
          }))
        }
        sx={mollureWhiteFieldInputSx}
      />
    </Stack>
  </Stack>
</Box>
  );
}
