"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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
  AppDatePicker,
  MarketingSiteHeader,
  MollureAuthLabeledField,
  AppCountryPhoneFields,
  MollureAuthLabeledPasswordField,
  PasswordStrengthBar,
} from "../../../../components/common";
import { authSignupHeaderClient } from "../../../../data/marketingShell.data";
import { findCountryDialCode } from "../../../../data/countryDialCodes";
import { getPhoneValidationErrors } from "../../../../lib/phone-validation";
import { BodyText } from "../../../../components/ui/typography";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import {
  REVIEW_NAME_MODES,
  resolveDisplayNameFromMode,
  reviewNameOptionLabel,
  type ReviewNameMode,
} from "../../../../lib/reviewNameDisplay";
import { SignupBg, SignupLs, SignupRs } from "../../../../../images";

type FormState = {
  firstName: string;
  lastName: string;
  reviewNameMode: "" | ReviewNameMode;
  birthDate: string;
  gender: string;
  countryCode: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  reviewNameMode: "",
  birthDate: "",
  gender: "",
  countryCode: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export default function IndividualSignupPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const { showSnackbar } = useSnackbar();
  const [register, { isLoading }] = useRegisterMutation();
  const passwordStrength = getPasswordStrength(form.password);

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);
  const maxDob = React.useMemo(() => {
    // Use local date (not UTC) to avoid off-by-one in some timezones.
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const reviewNameOptions = React.useMemo(
    () =>
      REVIEW_NAME_MODES.map((mode) => ({
        value: mode,
        label: reviewNameOptionLabel(mode, form.firstName, form.lastName),
      })),
    [form.firstName, form.lastName],
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!isValidEmail(form.email)) nextErrors.email = "Enter a valid email address.";

    if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
    else if (!isValidName(form.firstName)) nextErrors.firstName = "Enter a valid first name.";

    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
    else if (!isValidName(form.lastName)) nextErrors.lastName = "Enter a valid last name.";

    if (!form.password) nextErrors.password = "Password is required.";
    if (!form.confirmPassword) nextErrors.confirmPassword = "Repeat password is required.";

    if (!form.acceptTerms) nextErrors.acceptTerms = "Please accept the terms and conditions.";

    const phoneErrors = getPhoneValidationErrors(form.countryCode, form.phone, { required: false });
    if (phoneErrors.countryCode) nextErrors.countryCode = phoneErrors.countryCode;
    if (phoneErrors.phone) nextErrors.phone = phoneErrors.phone;
    if (form.phone.trim() && !form.countryCode.trim()) {
      nextErrors.countryCode = "Country code is required.";
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
        user_type: "individual",
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirm_password: form.confirmPassword,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        display_name:
          resolveDisplayNameFromMode(form.reviewNameMode, form.firstName, form.lastName) || undefined,
        date_of_birth: form.birthDate || undefined,
        gender: form.gender || undefined,
        country_code:
          (findCountryDialCode(form.countryCode)?.dialCode ?? form.countryCode.trim()) || undefined,
        phone: form.phone.trim() || undefined,
      }).unwrap();

      // Persist client details for pre-filling the client profile page.
      try {
        window.localStorage.setItem(
          "mollure:client_profile",
          JSON.stringify({
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            display_name:
          resolveDisplayNameFromMode(form.reviewNameMode, form.firstName, form.lastName) || undefined,
            date_of_birth: form.birthDate || undefined,
            gender: form.gender || undefined,
            country_code:
          (findCountryDialCode(form.countryCode)?.dialCode ?? form.countryCode.trim()) || undefined,
            phone: form.phone.trim() || undefined,
            email: form.email.trim().toLowerCase(),
            avatar_url: null,
          }),
        );
      } catch {
        // ignore storage failures
      }

      showSnackbar({
        severity: "success",
        message: result.message || "Account created successfully. Please check your email.",
      });
      setForm(initialForm);
      router.push("/auth/login");
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
          navItems={[...authSignupHeaderClient.navItems]}
          localeLabel={authSignupHeaderClient.localeLabel}
          loginLabel={authSignupHeaderClient.loginLabel}
          loginHref={authSignupHeaderClient.loginHref}
          professionalLinkLabel={authSignupHeaderClient.professionalLinkLabel}
          professionalHref={authSignupHeaderClient.professionalHref}
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
                        Personal Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="First Name"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            error={Boolean(errors.firstName)}
                            helperText={errors.firstName}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="Last Name"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            error={Boolean(errors.lastName)}
                            helperText={errors.lastName}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <MollureAuthLabeledField
                            fieldLabel="Select name for rating/review"
                            select
                            name="reviewNameMode"
                            value={form.reviewNameMode}
                            onChange={handleChange}
                            SelectProps={{ displayEmpty: true }}
                          >
                            <MenuItem value="">
                              <em>Select name for rating/review</em>
                            </MenuItem>
                            {reviewNameOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </MollureAuthLabeledField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Stack spacing={0.75}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
                              Birth date
                            </Typography>
                            <AppDatePicker
                              name="birthDate"
                              value={form.birthDate}
                              onChange={(iso) => handleChange({ target: { name: "birthDate", value: iso } } as React.ChangeEvent<HTMLInputElement>)}
                              max={maxDob}
                              fullWidth
                            />
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledField
                            fieldLabel="Select Gender"
                            select
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                          >
                            <MenuItem value="">
                              <em>Select Gender</em>
                            </MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="male">Male</MenuItem>
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
                        Contact Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <AppCountryPhoneFields
                            countryCode={form.countryCode}
                            phone={form.phone}
                            onCountryCodeChange={(dialCode) =>
                              handleChange({
                                target: { name: "countryCode", value: dialCode },
                              } as React.ChangeEvent<HTMLInputElement>)
                            }
                            onPhoneChange={(phone) =>
                              handleChange({
                                target: { name: "phone", value: phone },
                              } as React.ChangeEvent<HTMLInputElement>)
                            }
                            countryCodeError={errors.countryCode}
                            phoneError={errors.phone}
                            onClearErrors={() =>
                              setErrors((prev) => ({ ...prev, countryCode: undefined, phone: undefined }))
                            }
                            phonePlaceholder="Enter phone number"
                            required={false}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <MollureAuthLabeledField
                            type="email"
                            fieldLabel="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            error={Boolean(errors.email)}
                            helperText={errors.email}
                            required
                            autoComplete="email"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledPasswordField
                            fieldLabel="Password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            error={Boolean(errors.password)}
                            helperText={errors.password}
                            required
                            autoComplete="new-password"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MollureAuthLabeledPasswordField
                            fieldLabel="Repeat password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            error={Boolean(errors.confirmPassword)}
                            helperText={errors.confirmPassword}
                            required
                            autoComplete="new-password"
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
                          Accept{" "}
                          <Link
                            href="/terms"
                            style={{
                              color: m.teal,
                              fontWeight: 600,
                              textDecoration: "underline",
                            }}
                          >
                            terms and conditions
                          </Link>
                          {" & "}
                          <Link
                            href="/policies"
                            style={{
                              color: m.teal,
                              fontWeight: 600,
                              textDecoration: "underline",
                            }}
                          >
                            Policies
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
