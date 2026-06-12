"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { getPasswordStrength } from "../../../../lib/passwordStrength";
import { useRegisterMutation } from "../../../../store/services/authApi";
import {
  MarketingSiteHeader,
  MollureAuthLabeledField,
  MollureAuthLabeledPasswordField,
  MollureAuthTextField,
  PasswordStrengthBar,
} from "../../../../components/common";
import { authSignupHeaderProfessional } from "../../../../data/marketingShell.data";
import { BodyText } from "../../../../components/ui/typography";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import { SignupBg, SignupLs, SignupRs } from "../../../../../images";

type FormState = {
  legalName: string;
  cccNumber: string;
  vatNumber: string;
  street: string;
  number: string;
  postalCode: string;
  municipality: string;
  businessType: string;
  website: string;
  instagram: string;
  otherLink: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const initialForm: FormState = {
  legalName: "",
  cccNumber: "",
  vatNumber: "",
  street: "",
  number: "",
  postalCode: "",
  municipality: "",
  businessType: "",
  website: "",
  instagram: "",
  otherLink: "",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const PROFESSIONAL_COUNTRY = "Netherlands";

const MUNICIPALITY_OPTIONS = [
  "Amsterdam",
  "Rotterdam",
  "The Hague",
  "Utrecht",
  "Eindhoven",
  "Groningen",
  "Tilburg",
  "Almere",
  "Breda",
  "Nijmegen",
  "Haarlem",
  "Arnhem",
  "Zaanstad",
  "Amersfoort",
  "Apeldoorn",
  "Den Bosch",
  "Hoofddorp",
  "Maastricht",
  "Leiden",
  "Dordrecht",
] as const;

const COC_NUMBER_REGEX = /^\d{8}$/;
const VAT_NUMBER_REGEX = /^NL\d{9}B\d{2}$/i;

const BUSINESS_TYPE_OPTIONS = [
  { value: "salonOwner", label: "Salon Owner" },
  { value: "freelancer", label: "Freelancer" },
  { value: "other", label: "Other" },
] as const;

export default function ProfessionalSignupPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const { showSnackbar } = useSnackbar();
  const [register, { isLoading }] = useRegisterMutation();
  const passwordStrength = getPasswordStrength(form.password);

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => (prev[name as keyof FormState] ? { ...prev, [name]: undefined } : prev));
  };

  const isValidEmail = React.useCallback((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), []);
  const isValidName = React.useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(trimmed);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.contactEmail.trim()) nextErrors.contactEmail = "Email is required.";
    else if (!isValidEmail(form.contactEmail)) nextErrors.contactEmail = "Enter a valid email address.";

    if (!form.legalName.trim()) nextErrors.legalName = "Legal name is required.";
    else if (!isValidName(form.legalName)) nextErrors.legalName = "Enter a valid legal name.";

    if (!form.contactFirstName.trim()) nextErrors.contactFirstName = "First name is required.";
    else if (!isValidName(form.contactFirstName)) nextErrors.contactFirstName = "Enter a valid first name.";

    if (!form.contactLastName.trim()) nextErrors.contactLastName = "Last name is required.";
    else if (!isValidName(form.contactLastName)) nextErrors.contactLastName = "Enter a valid last name.";

    if (!form.password) nextErrors.password = "Password is required.";
    if (!form.confirmPassword) nextErrors.confirmPassword = "Repeat password is required.";

    if (!form.acceptTerms) nextErrors.acceptTerms = "Please accept the terms and conditions.";

    if (!form.cccNumber.trim()) nextErrors.cccNumber = "COC number is required.";
    else if (!COC_NUMBER_REGEX.test(form.cccNumber.trim())) {
      nextErrors.cccNumber = "COC number must be exactly 8 digits.";
    }

    if (!form.vatNumber.trim()) nextErrors.vatNumber = "VAT number is required.";
    else if (!VAT_NUMBER_REGEX.test(form.vatNumber.trim())) {
      nextErrors.vatNumber = "VAT number must match NL123456789B01 format.";
    }

    const hasPortfolioLink = [form.website, form.instagram, form.otherLink].some((link) => link.trim());
    if (!hasPortfolioLink) {
      nextErrors.website = "At least one portfolio link is required.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const firstMessage = Object.values(nextErrors).find(Boolean);
      if (firstMessage) showSnackbar({ severity: "error", message: firstMessage });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Password and repeat password must match." }));
      showSnackbar({ severity: "error", message: "Password and repeat password must match." });
      return;
    }

    if (!passwordStrength.isStrong) {
      setErrors((prev) => ({ ...prev, password: "Please choose a strong password to continue." }));
      showSnackbar({ severity: "error", message: "Please choose a strong password to continue." });
      return;
    }

    if (!form.acceptTerms) {
      setErrors((prev) => ({ ...prev, acceptTerms: "Please accept the terms and conditions." }));
      showSnackbar({ severity: "error", message: "Please accept the terms and conditions." });
      return;
    }

    try {
      const result = await register({
        user_type: "professional",
        email: form.contactEmail.trim().toLowerCase(),
        password: form.password,
        confirm_password: form.confirmPassword,
        legal_name: form.legalName.trim(),
        ccc_number: form.cccNumber.trim(),
        vat_number: form.vatNumber.trim().toUpperCase(),
        street: form.street.trim() || undefined,
        street_number: form.number.trim() || undefined,
        postal_code: form.postalCode.trim() || undefined,
        municipality: form.municipality.trim() || undefined,
        business_type: form.businessType || undefined,
        website: form.website.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        other_link: form.otherLink.trim() || undefined,
        contact_first_name: form.contactFirstName.trim(),
        contact_last_name: form.contactLastName.trim(),
      }).unwrap();

      showSnackbar({
        severity: "success",
        message:
          result.message || "Professional account created successfully. Please check your email.",
      });
      setForm(initialForm);
      router.push("/auth/professional/login");
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Registration failed. Please check the details."),
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: m.white ?? "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupBg}
            alt=""
            width={1440}
            height={553}
            priority
            sizes="100vw"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(52vw, 240px)", sm: 280, md: 323 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupLs}
            alt=""
            width={323}
            height={469}
            sizes="(max-width: 600px) 52vw, 323px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(56vw, 260px)", sm: 300, md: 364 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupRs}
            alt=""
            width={364}
            height={413}
            sizes="(max-width: 600px) 56vw, 364px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <MarketingSiteHeader
          navItems={[...authSignupHeaderProfessional.navItems]}
          localeLabel={authSignupHeaderProfessional.localeLabel}
          loginLabel={authSignupHeaderProfessional.loginLabel}
          loginHref={authSignupHeaderProfessional.loginHref}
          professionalLinkLabel={authSignupHeaderProfessional.professionalLinkLabel}
          professionalHref={authSignupHeaderProfessional.professionalHref}
          homeHref="/"
        />

        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: { xs: 3, sm: 4 },
              pb: { xs: 5, sm: 6 },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 720,
                borderRadius: "14px",
                border: `1px solid ${cardBorder}`,
                boxShadow: `0 18px 48px ${alpha(m.navy, 0.08)}, 0 4px 14px ${alpha(m.navy, 0.04)}`,
                bgcolor: m.white ?? "#fff",
                px: { xs: 3, sm: 4.5 },
                py: { xs: 3.5, sm: 4.25 },
              }}
            >
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.5rem", sm: "1.75rem" },
                      lineHeight: 1.2,
                      color: m.navy,
                    }}
                  >
                    Create An Account
                  </Typography>
                  <BodyText
                    sx={{
                      mt: 1,
                      color: alpha(m.navy, 0.52),
                      fontSize: "0.875rem",
                      lineHeight: 1.45,
                    }}
                  >
                    Join Us And Start Your Journey Today.
                  </BodyText>
                </Box>

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
                        Company Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <MollureAuthLabeledField
                            fieldLabel="Legal Name"
                            labelPlacement="inCell"
                            name="legalName"
                            value={form.legalName}
                            onChange={handleChange}
                            error={Boolean(errors.legalName)}
                            helperText={errors.legalName}
                            required
                            placeholder="e.g. Jane"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="COC number"
                            labelPlacement="inCell"
                            name="cccNumber"
                            value={form.cccNumber}
                            onChange={handleChange}
                            error={Boolean(errors.cccNumber)}
                            helperText={errors.cccNumber}
                            required
                            placeholder="12345678"
                            inputProps={{ inputMode: "numeric", maxLength: 8 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="VAT number"
                            labelPlacement="inCell"
                            name="vatNumber"
                            value={form.vatNumber}
                            onChange={handleChange}
                            error={Boolean(errors.vatNumber)}
                            helperText={errors.vatNumber}
                            required
                            placeholder="NL123456789B01"
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
                            Business Address
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <MollureAuthLabeledField
                            fieldLabel="Country"
                            labelPlacement="inCell"
                            value={PROFESSIONAL_COUNTRY}
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="Street"
                            labelPlacement="inCell"
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            placeholder="e.g. Damrak"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="Number"
                            labelPlacement="inCell"
                            name="number"
                            value={form.number}
                            onChange={handleChange}
                            placeholder="e.g. 1"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="Postal Code"
                            labelPlacement="inCell"
                            name="postalCode"
                            value={form.postalCode}
                            onChange={handleChange}
                            placeholder="e.g. 1012 LG"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="Municipality"
                            labelPlacement="inCell"
                            select
                            name="municipality"
                            value={form.municipality}
                            onChange={handleChange}
                            SelectProps={{ displayEmpty: true }}
                          >
                            <MenuItem value="">
                              <em>Select Municipality</em>
                            </MenuItem>
                            {MUNICIPALITY_OPTIONS.map((c) => (
                              <MenuItem key={c} value={c}>
                                {c}
                              </MenuItem>
                            ))}
                          </MollureAuthLabeledField>
                        </Grid>

                        <Grid item xs={12}>
                          <MollureAuthLabeledField
                            fieldLabel="Select Business Type"
                            labelPlacement="inCell"
                            select
                            name="businessType"
                            value={form.businessType}
                            onChange={handleChange}
                            SelectProps={{ displayEmpty: true }}
                          >
                            <MenuItem value="">
                              <em>Select Business Type</em>
                            </MenuItem>
                            {BUSINESS_TYPE_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </MollureAuthLabeledField>
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
                            Portfolio links
                          </Typography>
                          {errors.website ? (
                            <Typography sx={{ fontSize: 12, color: "error.main", mb: 0.5 }}>
                              {errors.website}
                            </Typography>
                          ) : null}
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <MollureAuthTextField
                            name="website"
                            placeholder="Website"
                            value={form.website}
                            onChange={handleChange}
                            error={Boolean(errors.website)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <MollureAuthTextField
                            name="instagram"
                            placeholder="Instagram"
                            value={form.instagram}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <MollureAuthTextField
                            name="otherLink"
                            placeholder="Other"
                            value={form.otherLink}
                            onChange={handleChange}
                          />
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
                        Contact Person
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="First Name"
                            labelPlacement="inCell"
                            name="contactFirstName"
                            value={form.contactFirstName}
                            onChange={handleChange}
                            error={Boolean(errors.contactFirstName)}
                            helperText={errors.contactFirstName}
                            required
                            placeholder="e.g. Jane"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="Last Name"
                            labelPlacement="inCell"
                            name="contactLastName"
                            value={form.contactLastName}
                            onChange={handleChange}
                            error={Boolean(errors.contactLastName)}
                            helperText={errors.contactLastName}
                            required
                            placeholder="e.g. Doe"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <MollureAuthLabeledField
                            type="email"
                            fieldLabel="Email"
                            labelPlacement="inCell"
                            name="contactEmail"
                            value={form.contactEmail}
                            onChange={handleChange}
                            error={Boolean(errors.contactEmail)}
                            helperText={errors.contactEmail}
                            required
                            autoComplete="email"
                            placeholder="you@gmail.com"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledPasswordField
                            fieldLabel="Password"
                            labelPlacement="inCell"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            error={Boolean(errors.password)}
                            helperText={errors.password}
                            required
                            autoComplete="new-password"
                            placeholder="Enter password"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledPasswordField
                            fieldLabel="Repeat password"
                            labelPlacement="inCell"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            error={Boolean(errors.confirmPassword)}
                            helperText={errors.confirmPassword}
                            required
                            autoComplete="new-password"
                            placeholder="Confirm password"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <PasswordStrengthBar password={form.password} />
                        </Grid>
                      </Grid>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={form.acceptTerms}
                          onChange={handleChange}
                          name="acceptTerms"
                          sx={{
                            color: alpha(m.navy, 0.35),
                            "&.Mui-checked": { color: m.teal },
                          }}
                        />
                      }
                      label={
                        <BodyText component="span" sx={{ fontSize: "0.875rem", color: alpha(m.navy, 0.55) }}>
                          Accept our{" "}
                          <Link
                            href="/terms"
                            style={{
                              color: m.teal,
                              fontWeight: 600,
                              textDecoration: "underline",
                            }}
                          >
                            Terms & Conditions
                          </Link>
                          <Typography component="span" sx={{ color: "error.main", fontWeight: 600 }}>
                            *
                          </Typography>
                        </BodyText>
                      }
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disableElevation
                      fullWidth
                      disabled={isLoading || !passwordStrength.isStrong}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "1rem",
                        py: 1.2,
                        minHeight: 44,
                        bgcolor: m.teal,
                        color: m.white,
                        "&:hover": { bgcolor: m.tealDark },
                      }}
                    >
                      {isLoading ? (
                        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center">
                          <CircularProgress size={20} sx={{ color: m.white }} />
                          <span>Registering...</span>
                        </Stack>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
