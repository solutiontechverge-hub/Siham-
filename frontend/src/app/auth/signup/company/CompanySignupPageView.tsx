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
import { PasswordStrengthBar } from "../../../../components/common";
import {
  MollureAuthLabeledField,
  MollureAuthLabeledPasswordField,
} from "../../../../components/common";
import { BodyText } from "../../../../components/ui/typography";
import AuthSignupShell from "../AuthSignupShell";
import { companySignupPageData as data } from "./company.data";
import { useCompanySignupPage } from "./useCompanySignupPage";

export default function CompanySignupPageView() {
  const {
    m,
    form,
    errors,
    isLoading,
    passwordStrength,
    handleChange,
    handleSubmit,
  } = useCompanySignupPage();

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
              {data.sections.company}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.legalName.label}
                  labelPlacement="inCell"
                  name="legalName"
                  value={form.legalName}
                  onChange={handleChange}
                  error={Boolean(errors.legalName)}
                  helperText={errors.legalName}
                  required
                  placeholder={data.fields.legalName.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.cccNumber.label}
                  labelPlacement="inCell"
                  name="cccNumber"
                  value={form.cccNumber}
                  onChange={handleChange}
                  required
                  placeholder={data.fields.cccNumber.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.vatNumber.label}
                  labelPlacement="inCell"
                  name="vatNumber"
                  value={form.vatNumber}
                  onChange={handleChange}
                  required
                  placeholder={data.fields.vatNumber.placeholder}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: alpha(m.navy, 0.72),
                    mb: 0.5,
                    mt: 0.5,
                  }}
                >
                  {data.sections.businessAddress}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.street.label}
                  labelPlacement="inCell"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder={data.fields.street.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.number.label}
                  labelPlacement="inCell"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  placeholder={data.fields.number.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.postalCode.label}
                  labelPlacement="inCell"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder={data.fields.postalCode.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.province.label}
                  labelPlacement="inCell"
                  select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <em>{data.fields.province.emptyLabel}</em>
                  </MenuItem>
                  {data.provinceOptions.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </MollureAuthLabeledField>
              </Grid>
              <Grid item xs={12}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.municipality.label}
                  labelPlacement="inCell"
                  select
                  name="municipality"
                  value={form.municipality}
                  onChange={handleChange}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <em>{data.fields.municipality.emptyLabel}</em>
                  </MenuItem>
                  {data.municipalityOptions.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
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
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.contactFirstName.label}
                  labelPlacement="inCell"
                  name="contactFirstName"
                  value={form.contactFirstName}
                  onChange={handleChange}
                  error={Boolean(errors.contactFirstName)}
                  helperText={errors.contactFirstName}
                  required
                  placeholder={data.fields.contactFirstName.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledField
                  fieldLabel={data.fields.contactLastName.label}
                  labelPlacement="inCell"
                  name="contactLastName"
                  value={form.contactLastName}
                  onChange={handleChange}
                  error={Boolean(errors.contactLastName)}
                  helperText={errors.contactLastName}
                  required
                  placeholder={data.fields.contactLastName.placeholder}
                />
              </Grid>
              <Grid item xs={12}>
                <MollureAuthLabeledField
                  type="email"
                  fieldLabel={data.fields.contactEmail.label}
                  labelPlacement="inCell"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  error={Boolean(errors.contactEmail)}
                  helperText={errors.contactEmail}
                  required
                  autoComplete="email"
                  placeholder={data.fields.contactEmail.placeholder}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureAuthLabeledPasswordField
                  fieldLabel={data.fields.password.label}
                  labelPlacement="inCell"
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
                  labelPlacement="inCell"
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
