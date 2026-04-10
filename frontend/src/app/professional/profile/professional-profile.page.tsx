"use client";

import * as React from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Profile as AvatarPlaceholder } from "../../../../images";
import { AppSegmentTabs } from "../../../components/common";
import { professionalProfilePageData as pageData } from "./professional-profile.data";

function imgSrc(img: unknown): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null) {
    const o = img as Record<string, unknown>;
    if (typeof o.src === "string") return o.src;
    if (typeof o.default === "string") return o.default;
    if (typeof o.default === "object" && o.default !== null) return imgSrc(o.default);
  }
  return String(img);
}

type FormState = {
  legalName: string;
  cocNumber: string;
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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  repeatPassword: string;
};

const dummyProfessional: FormState = {
  legalName: "",
  cocNumber: "",
  vatNumber: "",
  street: "",
  number: "",
  postalCode: "",
  province: "",
  municipality: "",
  businessType: "Salon Owner",
  website: "",
  instagram: "",
  otherLink: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  repeatPassword: "",
};

export default function ProfessionalProfilePage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const pathname = usePathname();

  const [segment, setSegment] = React.useState<(typeof pageData.segmentTabs)[number]["id"]>("userInfo");
  const [isEditing, setIsEditing] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(dummyProfessional);

  const fieldsDisabled = !isEditing;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "#fff",
      borderRadius: 2,
      fontSize: 14,
      color: tokens.navy,
      "& fieldset": { borderColor: tokens.inputBorder },
      "&:hover fieldset": { borderColor: tokens.inputBorderHover },
      "&.Mui-focused fieldset": { borderColor: tokens.teal, borderWidth: 1 },
    },
    "& .MuiInputLabel-root": { color: tokens.slate, fontSize: 13 },
    "& input::placeholder": { color: tokens.placeholder, opacity: 1 },
  } as const;

  const pageBg = `linear-gradient(180deg, ${tokens.heroGradientStart} 0%, ${tokens.heroGradientEnd} 100%)`;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          bgcolor: tokens.whiteOverlay,
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box component={Link} href="/professional/profile" sx={{ display: "inline-flex" }}>
              <Image src={Logo} alt="Mollure" width={150} height={36} priority />
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />}
                startIcon={<LanguageRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  borderRadius: 999,
                  border: `1px solid ${tokens.border}`,
                  color: tokens.navy,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.5,
                  minWidth: 0,
                  bgcolor: "#fff",
                }}
              >
                {pageData.header.localeLabel}
              </Button>

              <IconButton sx={{ color: tokens.navy }} aria-label="Notifications">
                <NotificationsNoneRoundedIcon />
              </IconButton>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 0.5, userSelect: "none" }}>
                <Avatar
                  src={imgSrc(AvatarPlaceholder)}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: tokens.avatarBg,
                    border: `1px solid ${alpha(tokens.border, 0.9)}`,
                  }}
                />
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: tokens.navy,
                    fontSize: 14,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {pageData.header.userName}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Top Tabs */}
      <Box sx={{ bgcolor: tokens.whiteOverlay, borderBottom: `1px solid ${tokens.border}` }}>
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" spacing={{ xs: 3, sm: 7 }} sx={{ py: 0 }}>
            {pageData.topTabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Box
                  key={tab.id}
                  component={Link}
                  href={tab.href}
                  sx={{
                    py: 1.75,
                    textDecoration: "none",
                    color: active ? tokens.navy : tokens.slate,
                    fontWeight: active ? 700 : 600,
                    fontSize: 15,
                    borderBottom: active ? `3px solid ${tokens.teal}` : "3px solid transparent",
                    mb: "-1px",
                  }}
                >
                  {tab.label}
                </Box>
              );
            })}
          </Stack>
        </Container>
      </Box>

      {/* Segment Tabs (User Info / Business Setup) */}
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 2, md: 2.5 } }}>
        <Stack alignItems="center">
          <AppSegmentTabs
            tabs={pageData.segmentTabs}
            value={segment}
            onChange={(id) => setSegment(id as (typeof pageData.segmentTabs)[number]["id"])}
          />
        </Stack>
      </Container>

      {/* Card */}
      <Container maxWidth="md" sx={{ pb: { xs: 5, md: 7 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 16px 40px rgba(40, 92, 112, 0.08)",
            p: { xs: 2.5, sm: 3.5 },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 400, fontSize: 34, color: tokens.navy, letterSpacing: "-0.02em" }}>
              {pageData.card.title}
            </Typography>
            <IconButton
              onClick={() => setIsEditing((v) => !v)}
              sx={{
                bgcolor: "rgba(52, 74, 102, 0.06)",
                color: tokens.slate,
                "&:hover": { bgcolor: "rgba(33, 184, 191, 0.12)", color: tokens.teal },
              }}
              aria-label="Edit"
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Avatar
              src={imgSrc(AvatarPlaceholder)}
              sx={{ width: 72, height: 72, bgcolor: tokens.avatarBg, border: `1px solid ${tokens.border}` }}
            />
            <Typography sx={{ fontWeight: 600, color: tokens.navy, fontSize: 15 }}>
              {pageData.card.profilePictureLabel}
            </Typography>
            <IconButton
              sx={{
                width: 28,
                height: 28,
                ml: -1,
                bgcolor: alpha(tokens.teal, 0.08),
                color: tokens.teal,
                "&:hover": { bgcolor: alpha(tokens.teal, 0.14) },
              }}
              aria-label="Edit profile picture"
            >
              <EditRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {/* Company Information */}
            <Typography sx={{ fontWeight: 800, color: tokens.navy, mb: 1 }}>
              {pageData.sections.company}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

            <Grid container spacing={2.25}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="legalName"
                  label={pageData.fields.legalName.label}
                  placeholder={pageData.fields.legalName.placeholder}
                  value={form.legalName}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="cocNumber"
                  label={pageData.fields.cocNumber.label}
                  placeholder={pageData.fields.cocNumber.placeholder}
                  value={form.cocNumber}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="vatNumber"
                  label={pageData.fields.vatNumber.label}
                  placeholder={pageData.fields.vatNumber.placeholder}
                  value={form.vatNumber}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>

            {/* Business Address */}
            <Typography sx={{ fontWeight: 800, color: tokens.navy, mb: 1, mt: 3.25 }}>
              {pageData.sections.address}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

            <Grid container spacing={2.25}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="street"
                  label={pageData.fields.street.label}
                  value={form.street}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="number"
                  label={pageData.fields.number.label}
                  value={form.number}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="postalCode"
                  label={pageData.fields.postalCode.label}
                  value={form.postalCode}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name="province"
                  label={pageData.fields.province.label}
                  value={form.province}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                >
                  {pageData.options.provinces.map((opt) => (
                    <MenuItem key={opt} value={opt === "Province" ? "" : opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name="municipality"
                  label={pageData.fields.municipality.label}
                  value={form.municipality}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                >
                  {pageData.options.municipalities.map((opt) => (
                    <MenuItem key={opt} value={opt === "Municipality" ? "" : opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  name="businessType"
                  label={pageData.fields.businessType.label}
                  value={form.businessType}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                >
                  {pageData.options.businessTypes.map((opt) => (
                    <MenuItem key={opt} value={opt === "Business Type" ? "" : opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ color: tokens.slate, fontWeight: 800, fontSize: 13, mb: 1 }}>
                  {pageData.fields.website.label}
                </Typography>
                <Grid container spacing={2.25}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      name="website"
                      placeholder={pageData.fields.website.placeholder}
                      value={form.website}
                      onChange={handleChange}
                      disabled={fieldsDisabled}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      name="instagram"
                      placeholder={pageData.fields.instagram.placeholder}
                      value={form.instagram}
                      onChange={handleChange}
                      disabled={fieldsDisabled}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      name="otherLink"
                      placeholder={pageData.fields.otherLink.placeholder}
                      value={form.otherLink}
                      onChange={handleChange}
                      disabled={fieldsDisabled}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Contact Person */}
            <Typography sx={{ fontWeight: 800, color: tokens.navy, mb: 1, mt: 3.25 }}>
              {pageData.sections.contact}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

            <Grid container spacing={2.25}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label={pageData.fields.firstName.label}
                  placeholder={pageData.fields.firstName.placeholder}
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="lastName"
                  label={pageData.fields.lastName.label}
                  placeholder={pageData.fields.lastName.placeholder}
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  label={pageData.fields.email.label}
                  placeholder={pageData.fields.email.placeholder}
                  value={form.email}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? "text" : "password"}
                  label={pageData.fields.password.label}
                  placeholder={pageData.fields.password.placeholder}
                  value={form.password}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="repeatPassword"
                  type={showRepeatPassword ? "text" : "password"}
                  label={pageData.fields.repeatPassword.label}
                  placeholder={pageData.fields.repeatPassword.placeholder}
                  value={form.repeatPassword}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowRepeatPassword((v) => !v)}
                          aria-label="Toggle repeat password visibility"
                        >
                          {showRepeatPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              disabled={fieldsDisabled}
              variant="contained"
              disableElevation
              sx={{
                mt: 3.5,
                py: 1.35,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 800,
                fontSize: 16,
                bgcolor: tokens.teal,
                "&:hover": { bgcolor: tokens.tealDark },
              }}
            >
              {pageData.actions.update}
            </Button>

            <Typography sx={{ mt: 2, textAlign: "center", color: alpha(tokens.slate, 0.75), fontSize: 12.5 }}>
              {segment === "businessSetup"
                ? "Business Setup content can be added here later."
                : "User Info form shown (dummy state)."}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

