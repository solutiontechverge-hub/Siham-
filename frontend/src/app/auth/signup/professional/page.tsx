"use client";

import * as React from "react";
import Link from "next/link";
import {
  Alert,
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
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { useRegisterMutation } from "../../../../store/services/authApi";

type FormState = {
  legalName: string;
  cccNumber: string;
  vatNumber: string;
  street: string;
  number: string;
  postalCode: string;
  province: string;
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
  province: "",
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

export default function ProfessionalSignupPage() {
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [register, { isLoading }] = useRegisterMutation();

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
    setSuccessMessage("");
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Password and repeat password must match.");
      return;
    }

    if (!form.acceptTerms) {
      setErrorMessage("Please accept the terms and conditions.");
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
          vat_number: form.vatNumber.trim(),
          street: form.street.trim() || undefined,
          street_number: form.number.trim() || undefined,
          postal_code: form.postalCode.trim() || undefined,
          province: form.province.trim() || undefined,
          municipality: form.municipality.trim() || undefined,
          business_type: form.businessType || undefined,
          website: form.website.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          other_link: form.otherLink.trim() || undefined,
          contact_first_name: form.contactFirstName.trim(),
          contact_last_name: form.contactLastName.trim(),
      }).unwrap();

      setSuccessMessage(
        result.message ||
          "Professional account created successfully. Please check your email.",
      );
      setForm(initialForm);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Registration failed. Please check the details."),
      );
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
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "#10233f",
                }}
              >
                Mollure
              </Typography>
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
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: "-0.05em",
                      color: "#10233f",
                      fontSize: { xs: "2rem", sm: "2.75rem" },
                    }}
                  >
                    Create An Account
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.5,
                      color: alpha("#10233f", 0.72),
                      fontSize: "1rem",
                    }}
                  >
                    Join us and start your journey today.
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography sx={{ mb: 2, fontWeight: 800, color: "#10233f" }}>
                        Company Information
                      </Typography>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="Legal Name" name="legalName" value={form.legalName} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={6} />
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="CCC Number" name="cccNumber" value={form.cccNumber} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="VAT Number" name="vatNumber" value={form.vatNumber} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField fullWidth label="Business Address" name="street" value={form.street} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField fullWidth label="Number" name="number" value={form.number} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField fullWidth label="Postal Code" name="postalCode" value={form.postalCode} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField fullWidth label="Province" name="province" value={form.province} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="Municipality" name="municipality" value={form.municipality} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            select
                            label="Select Business Type"
                            name="businessType"
                            value={form.businessType}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                          >
                            <MenuItem value="">Select</MenuItem>
                            <MenuItem value="salonOwner">Salon Owner</MenuItem>
                            <MenuItem value="freelancer">Freelancer</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField fullWidth label="Website" name="website" value={form.website} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField fullWidth label="Instagram" name="instagram" value={form.instagram} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField fullWidth label="Other" name="otherLink" value={form.otherLink} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box>
                      <Typography sx={{ mb: 2, fontWeight: 800, color: "#10233f" }}>
                        Contact Person
                      </Typography>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="First Name" name="contactFirstName" value={form.contactFirstName} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="Last Name" name="contactLastName" value={form.contactLastName} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth type="email" label="Email" name="contactEmail" value={form.contactEmail} onChange={handleChange} required autoComplete="email" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth type="password" label="Password" name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth type="password" label="Repeat Password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" InputLabelProps={{ shrink: true }} />
                        </Grid>
                      </Grid>
                    </Box>

                    <FormControlLabel
                      control={<Checkbox checked={form.acceptTerms} onChange={handleChange} name="acceptTerms" />}
                      label={<Typography variant="body2" color="text.secondary">Accept our Terms & Conditions</Typography>}
                    />

                    {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
                    {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

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
