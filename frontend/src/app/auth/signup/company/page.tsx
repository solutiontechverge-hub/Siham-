"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
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
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { useRegisterMutation } from "../../../../store/services/authApi";
import { MarketingSiteHeader } from "../../../../components/common";
import { authSignupHeaderClient } from "../../../../data/marketingShell.data";
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
  province: string;
  municipality: string;
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
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const PROVINCE_OPTIONS = [
  "Drenthe",
  "Flevoland",
  "Friesland",
  "Gelderland",
  "Groningen",
  "Limburg",
  "North Brabant",
  "North Holland",
  "Overijssel",
  "South Holland",
  "Utrecht",
  "Zeeland",
  "Antwerp",
  "East Flanders",
  "Flemish Brabant",
  "Hainaut",
  "Liège",
  "Limburg (BE)",
  "Luxembourg (BE)",
  "Namur",
  "Walloon Brabant",
  "West Flanders",
  "Brussels-Capital Region",
] as const;

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
  "Antwerp",
  "Ghent",
  "Charleroi",
  "Brussels",
  "Liège",
  "Schaerbeek",
  "Anderlecht",
  "Bruges",
  "Namur",
  "Leuven",
] as const;

export default function CompanySignupPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { showSnackbar } = useSnackbar();
  const [register, { isLoading }] = useRegisterMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      bgcolor: m.white ?? "#fff",
      "& fieldset": {
        borderColor: m.inputBorder,
      },
      "&:hover fieldset": {
        borderColor: m.inputBorderHover,
      },
      "&.Mui-focused fieldset": {
        borderColor: m.teal,
      },
    },
    "& .MuiInputLabel-root": {
      fontWeight: 600,
      fontSize: "0.8125rem",
      color: alpha(m.navy, 0.88),
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: alpha(m.navy, 0.88),
    },
    "& .MuiOutlinedInput-input::placeholder": {
      color: m.placeholder,
      opacity: 1,
    },
  } as const;

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

    if (!form.acceptTerms) {
      showSnackbar({ severity: "error", message: "Please accept the terms and conditions." });
      return;
    }

    try {
      const result = await register({
        user_type: "company",
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
        contact_first_name: form.contactFirstName.trim(),
        contact_last_name: form.contactLastName.trim(),
      }).unwrap();

      showSnackbar({
        severity: "success",
        message:
          result.message || "Company account created successfully. Please check your email.",
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
                        Company Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Legal Name"
                            name="legalName"
                            value={form.legalName}
                            onChange={handleChange}
                            required
                            placeholder="e.g Jane"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="COC number"
                            name="cccNumber"
                            value={form.cccNumber}
                            onChange={handleChange}
                            required
                            placeholder="676537"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="VAT number"
                            name="vatNumber"
                            value={form.vatNumber}
                            onChange={handleChange}
                            required
                            placeholder="27354323456789"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
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
                        <Grid item xs={12} sm={8}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Street"
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Number"
                            name="number"
                            value={form.number}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Postal Code"
                            name="postalCode"
                            value={form.postalCode}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            select
                            label="Province"
                            name="province"
                            value={form.province}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                            SelectProps={{ displayEmpty: true }}
                          >
                            <MenuItem value="">
                              <em>Select Province</em>
                            </MenuItem>
                            {PROVINCE_OPTIONS.map((p) => (
                              <MenuItem key={p} value={p}>
                                {p}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            select
                            label="Municipality"
                            name="municipality"
                            value={form.municipality}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
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
                          </TextField>
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
                          <TextField
                            fullWidth
                            size="small"
                            label="First Name"
                            name="contactFirstName"
                            value={form.contactFirstName}
                            onChange={handleChange}
                            required
                            placeholder="e.g Jane"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Last Name"
                            name="contactLastName"
                            value={form.contactLastName}
                            onChange={handleChange}
                            required
                            placeholder="e.g Doe"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            type="email"
                            label="Email"
                            name="contactEmail"
                            value={form.contactEmail}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            placeholder="You@gmail.com"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type={showPassword ? "text" : "password"}
                            label="Password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            placeholder="Enter Password"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    type="button"
                                    edge="end"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword((v) => !v)}
                                    size="small"
                                    sx={{ color: alpha(m.navy, 0.45) }}
                                  >
                                    {showPassword ? (
                                      <VisibilityOutlinedIcon fontSize="small" />
                                    ) : (
                                      <VisibilityOffOutlinedIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type={showConfirmPassword ? "text" : "password"}
                            label="Repeat password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            placeholder="Confirm Password"
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    type="button"
                                    edge="end"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                    size="small"
                                    sx={{ color: alpha(m.navy, 0.45) }}
                                  >
                                    {showConfirmPassword ? (
                                      <VisibilityOutlinedIcon fontSize="small" />
                                    ) : (
                                      <VisibilityOffOutlinedIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
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
                      disabled={isLoading}
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
