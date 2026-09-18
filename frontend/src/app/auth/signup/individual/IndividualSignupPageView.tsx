"use client";

import AppButton from "../../../../components/common/AppButton";
import * as React from "react";
import Link from "next/link";
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  AppDatePicker,
  MollureAuthLabeledField,
  AppCountryPhoneFields,
  MollureAuthLabeledPasswordField,
  PasswordStrengthBar,
} from "../../../../components/common";
import { BodyText } from "../../../../components/ui/typography";
import AuthSignupShell from "../AuthSignupShell";
import { individualSignupPageData as data } from "./individual.data";
import { useIndividualSignupPage } from "./useIndividualSignupPage";

export default function IndividualSignupPageView() {
  const {
    m,
    form,
    errors,
    isLoading,
    passwordStrength,
    maxDob,
    reviewNameOptions,
    handleChange,
    clearPhoneErrors,
    handleSubmit,
  } = useIndividualSignupPage();

  return (
    <AuthSignupShell
      header={data.header}
      title={data.title}
      subtitle={data.subtitle}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: m.navy,
                mb: 1.5,
              }}
            >
              {data.sections.personal}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.firstName.label}
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                  required
                  placeholder={data.fields.firstName.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.lastName.label}
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                  required
                  placeholder={data.fields.lastName.placeholder}
                />
              </Grid>
              <Grid item xs={12}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.reviewNameMode.label}
                  select
                  name="reviewNameMode"
                  value={form.reviewNameMode}
                  onChange={handleChange}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <em>{data.fields.reviewNameMode.emptyLabel}</em>
                  </MenuItem>
                  {reviewNameOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MollureAuthLabeledField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={0.75} sx={{ height: "100%" }}>
                  <Typography
                    component="label"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: alpha(m.navy, 0.9),
                      lineHeight: 1.25,
                    }}
                  >
                    {data.fields.birthDate.label}
                  </Typography>
                  <AppDatePicker
                    name="birthDate"
                    value={form.birthDate}
                    onChange={(iso) =>
                      handleChange({
                        target: { name: "birthDate", value: iso },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    max={maxDob}
                    fullWidth
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.gender.label}
                  select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <em>{data.fields.gender.emptyLabel}</em>
                  </MenuItem>
                  {data.genderOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MollureAuthLabeledField>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: m.navy,
                mb: 1.5,
              }}
            >
              {data.sections.contact}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <AppCountryPhoneFields
                  countryCode={form.countryCode}
                  phone={form.phone}
                  onCountryCodeChange={(dialCode) =>
                    handleChange({
                      target: {
                        name: "countryCode",
                        value: dialCode,
                      },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  onPhoneChange={(phone) =>
                    handleChange({
                      target: { name: "phone", value: phone },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  countryCodeError={errors.countryCode}
                  phoneError={errors.phone}
                  onClearErrors={clearPhoneErrors}
                  phonePlaceholder={data.fields.phone.placeholder}
                  required={false}
                />
              </Grid>
              <Grid item xs={12}>
                <MollureAuthLabeledField
                  type="email"
                  fieldLabel={data.fields.email.label}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  required
                  autoComplete="email"
                  placeholder={data.fields.email.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledPasswordField
                  fieldLabel={data.fields.password.label}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  required
                  autoComplete="new-password"
                  placeholder={data.fields.password.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledPasswordField
                  fieldLabel={data.fields.confirmPassword.label}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                  required
                  autoComplete="new-password"
                  placeholder={data.fields.confirmPassword.placeholder}
                />
              </Grid>
              <Grid item xs={12}>
                <PasswordStrengthBar password={form.password} />
              </Grid>
            </Grid>
          </Box>

          <FormControlLabel
            sx={{
              alignItems: "center",
              ml: 0,
              gap: 0.5,
              "& .MuiFormControlLabel-label": { mt: 0 },
            }}
            control={
              <Checkbox
                size="small"
                checked={form.acceptTerms}
                onChange={handleChange}
                name="acceptTerms"
                sx={{
                  p: 0.5,
                  color: alpha(m.navy, 0.35),
                  "&.Mui-checked": { color: m.teal },
                }}
              />
            }
            label={
              <BodyText
                component="span"
                sx={{
                  fontSize: "0.875rem",
                  lineHeight: 1.4,
                  color: alpha(m.navy, 0.55),
                }}
              >
                {data.acceptPrefix}{" "}
                <Link
                  href={data.links.terms.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: m.teal,
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  {data.links.terms.label}
                </Link>
                {" & "}
                <Link
                  href={data.links.policies.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: m.teal,
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  {data.links.policies.label}
                </Link>
                <Typography
                  component="span"
                  sx={{ color: "error.main", fontWeight: 600 }}
                >
                  *
                </Typography>
              </BodyText>
            }
          />

          <AppButton
            tone="primary"
            type="submit"
            fullWidth
            disabled={isLoading || !passwordStrength.isStrong}
            sx={{
              fontSize: "1rem",
              py: 1.2,
              minHeight: 44,
              color: m.white,
            }}
          >
            {isLoading ? (
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                justifyContent="center"
              >
                <CircularProgress size={20} sx={{ color: m.white }} />
                <span>{data.actions.registering}</span>
              </Stack>
            ) : (
              data.actions.register
            )}
          </AppButton>
        </Stack>
      </Box>
    </AuthSignupShell>
  );
}
