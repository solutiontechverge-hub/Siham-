"use client";

import * as React from "react";
import Link from "next/link";
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
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PasswordStrengthBar } from "../../../../components/common";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { getPasswordStrength } from "../../../../lib/passwordStrength";
import { useRegisterMutation } from "../../../../store/services/authApi";
import { BodyText, CardTitle, MainHeading, SubHeading } from "../../../../components/ui/typography";
import { useSnackbar } from "../../../../components/common/AppSnackbar";

type FormState = {
  firstName: string;
  lastName: string;
  displayName: string;
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
  displayName: "",
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
  const [form, setForm] = React.useState<FormState>(initialForm);
  const { showSnackbar } = useSnackbar();
  const [register, { isLoading }] = useRegisterMutation();
  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      showSnackbar({ severity: "error", message: "Password and repeat password must match." });
      return;
    }

    if (!passwordStrength.isStrong) {
      setErrorMessage("Please choose a strong password to continue.");
      return;
    }

    if (!form.acceptTerms) {
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
        display_name: form.displayName.trim() || undefined,
        date_of_birth: form.birthDate || undefined,
        gender: form.gender || undefined,
        country_code: form.countryCode.trim() || undefined,
        phone: form.phone.trim() || undefined,
      }).unwrap();

      showSnackbar({
        severity: "success",
        message: result.message || "Account created successfully. Please check your email.",
      });
      setForm(initialForm);
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
        background:
          "radial-gradient(circle at top left, #d8ffff 0%, #f6fffd 34%, #f5f7fb 100%)",
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 5, md: 8 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, #00c2b8 0%, #1177ff 100%)",
                  boxShadow: "0 12px 30px rgba(17, 119, 255, 0.22)",
                }}
              />
              <CardTitle sx={{ fontSize: "1.25rem", letterSpacing: "-0.04em", color: "#10233f" }}>Mollure</CardTitle>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: alpha("#10233f", 0.14),
                  color: "#10233f",
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                EN
              </Button>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: "#00b3b3",
                  "&:hover": {
                    backgroundColor: "#009c9c",
                  },
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                href="/auth/professional/login"
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: alpha("#10233f", 0.14),
                  color: "#10233f",
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                For professional
              </Button>
            </Stack>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 980,
                borderRadius: "32px",
                px: { xs: 3, sm: 5 },
                py: { xs: 4, sm: 5 },
                backgroundColor: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(16, 35, 63, 0.08)",
                boxShadow: "0 24px 80px rgba(16, 35, 63, 0.10)",
              }}
            >
              <Stack spacing={4}>
                <Box textAlign="center">
                  <MainHeading sx={{ letterSpacing: "-0.05em", color: "#10233f", fontSize: { xs: "2rem", sm: "2.75rem" } }}>
                    Create An Account
                  </MainHeading>
                  <BodyText sx={{ mt: 1.5, color: alpha("#10233f", 0.72), fontSize: "1rem" }}>
                    Join us and start your journey today.
                  </BodyText>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={4}>
                    <Box>
                      <SubHeading sx={{ mb: 2, fontSize: "1.125rem", color: "#10233f" }}>Personal Information</SubHeading>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Select name for rating/review"
                            name="displayName"
                            value={form.displayName}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            select
                            label="Select Gender"
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                          >
                            <MenuItem value="">Select</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Birth Date"
                            name="birthDate"
                            value={form.birthDate}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box>
                      <SubHeading sx={{ mb: 2, fontSize: "1.125rem", color: "#10233f" }}>Contact Information</SubHeading>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Country Code"
                            name="countryCode"
                            value={form.countryCode}
                            onChange={handleChange}
                            placeholder="+44"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth
                            label="Contact Number"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+442xxxxxxxxxx"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="email"
                            label="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Box>
                            <TextField
                              fullWidth
                              type="password"
                              label="Password"
                              name="password"
                              value={form.password}
                              onChange={handleChange}
                              required
                              autoComplete="new-password"
                              InputLabelProps={{ shrink: true }}
                            />
                            <PasswordStrengthBar password={form.password} />
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            type="password"
                            label="Repeat Password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.acceptTerms}
                          onChange={handleChange}
                          name="acceptTerms"
                        />
                      }
                      label={
                        <BodyText color="text.secondary">Accept our Terms & Conditions</BodyText>
                      }
                    />

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                          minWidth: 220,
                          minHeight: 54,
                          borderRadius: 999,
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 800,
                          background:
                            "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)",
                          boxShadow: "0 18px 40px rgba(0, 169, 180, 0.24)",
                        }}
                      >
                        {isLoading ? (
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <CircularProgress size={18} sx={{ color: "#fff" }} />
                            <span>Registering...</span>
                          </Stack>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
