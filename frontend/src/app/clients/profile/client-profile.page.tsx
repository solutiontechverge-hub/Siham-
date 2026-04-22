"use client";

import * as React from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
  Grid,
  MenuItem,
  Popover,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Profile as AvatarPlaceholder } from "../../../../images";
import { profilePageData } from "./data-profile";
import { useClientProfilePage } from "./use-profile";
import { ClientTopTabs, MollureMarketingHeader } from "../../../components/common";
import { MarketingSiteFooter } from "../../../components/common";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { MollureLabeledField, MollureLabeledPasswordField } from "../../../components/common";

const clientTopTabs = [
  { label: "Booking", href: "/clients/booking" },
  { label: "Favorites", href: "/clients/favourites" },
  { label: "Profile", href: "/clients/profile" },
] as const;

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

export default function ClientProfilePage() {
  const pathname = usePathname();
  const {
    tokens,
    pageBg,
    profile,
    setAvatarUrl,
    form,
    isLoading,
    loadError,
    isSaving,
    isEditing,
    setIsEditing,
    successMessage,
    errorMessage,
    clearMessages,
    displayName,
    handleChange,
    setReviewNameMode,
    handleSubmit,
    fieldsDisabled,
    refetch,
    profileMenuAnchor,
    openProfileMenu,
    closeProfileMenu,
    isManageSharingOpen,
    openManageSharing,
    closeManageSharing,
    sharingVisibility,
    toggleSharingField,
    handleLogout,
  } = useClientProfilePage();

  const handleAvatarPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
    // allow picking same file again
    event.target.value = "";
  };

  if (isLoading || !form) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: pageBg, display: "grid", placeItems: "center" }}>
        <CircularProgress sx={{ color: tokens.teal }} />
      </Box>
    );
  }

  if (loadError && !profile) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: pageBg, py: 8 }}>
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ mb: 2 }}>
            Could not load profile. Ensure <code>GET /api/users/me</code> returns the same fields as individual signup.
          </Alert>
          <Button variant="contained" onClick={() => refetch()} sx={{ bgcolor: tokens.teal }}>
            Retry
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={profile?.email || form.email}
        userName={displayName}
        userAvatarSrc={profile?.avatar_url || undefined}
        homeHref="/clients/listing"
      />

      <Box sx={{ mt: 2, bgcolor: "transparent" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1.5 }}>
          <ClientTopTabs
            tabs={clientTopTabs}
            activeLabel={pathname?.includes("/clients/booking") ? "Booking" : pathname?.includes("/clients/favourites") ? "Favorites" : "Profile"}
          />
        </Container>
      </Box>

      <Popover
        open={Boolean(profileMenuAnchor)}
        anchorEl={profileMenuAnchor}
        onClose={closeProfileMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 360,
            borderRadius: 3,
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 18px 45px rgba(16, 24, 40, 0.14)",
            p: 2.25,
          },
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={profile?.avatar_url || imgSrc(AvatarPlaceholder)}
              sx={{ width: 54, height: 54, bgcolor: tokens.avatarBg }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, color: tokens.navy, fontSize: 18, lineHeight: 1.2 }}>
                {displayName}
              </Typography>
              <Typography sx={{ color: tokens.slate, fontSize: 13, mt: 0.25 }}>
                {profile?.email || form.email}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<PersonOutlineRoundedIcon />}
            onClick={openManageSharing}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              color: tokens.navy,
              borderColor: tokens.border,
              py: 1.1,
              "&:hover": { borderColor: tokens.inputBorderHover, bgcolor: "rgba(52, 74, 102, 0.03)" },
            }}
          >
            {profilePageData.popovers.profileMenu.managePrivacyLabel}
          </Button>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<DeleteOutlineRoundedIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              color: tokens.navy,
              borderColor: tokens.border,
              py: 1.1,
              "&:hover": { borderColor: tokens.inputBorderHover, bgcolor: "rgba(52, 74, 102, 0.03)" },
            }}
          >
            {profilePageData.popovers.profileMenu.deleteAccountLabel}
          </Button>

          <Button
            variant="contained"
            fullWidth
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: tokens.teal,
              py: 1.2,
              "&:hover": { bgcolor: tokens.tealDark },
            }}
          >
            {profilePageData.popovers.profileMenu.logoutLabel}
          </Button>
        </Stack>
      </Popover>

      <Dialog
        open={isManageSharingOpen}
        onClose={closeManageSharing}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 22px 70px rgba(16, 24, 40, 0.22)",
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 900, color: tokens.navy, fontSize: 22 }}>
                {profilePageData.popovers.manageSharing.title}
              </Typography>
              <Typography sx={{ mt: 1.25, color: tokens.slate, lineHeight: 1.7 }}>
                {profilePageData.popovers.manageSharing.description}
              </Typography>
            </Box>
            <IconButton
              onClick={closeManageSharing}
              sx={{
                width: 42,
                height: 42,
                bgcolor: "rgba(52, 74, 102, 0.06)",
                color: tokens.slate,
                "&:hover": { bgcolor: "rgba(33, 184, 191, 0.12)", color: tokens.teal },
              }}
              aria-label="Close dialog"
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              mt: 3,
              borderRadius: 3,
              border: `1px solid ${tokens.border}`,
              p: 2,
              bgcolor: "#fff",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                src={profile?.avatar_url || imgSrc(AvatarPlaceholder)}
                sx={{ width: 44, height: 44, bgcolor: tokens.avatarBg }}
              />
              <Typography sx={{ fontWeight: 900, color: tokens.navy, fontSize: 16 }}>
                {displayName}
              </Typography>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <Stack spacing={1.5}>
                {profilePageData.popovers.manageSharing.fields.map((field) => (
                  <Box
                    key={field.key}
                    sx={{
                      borderRadius: 2.5,
                      border: `1px solid ${tokens.border}`,
                      bgcolor: "rgba(52, 74, 102, 0.03)",
                      px: 2,
                      py: 1.35,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ color: tokens.slate, fontWeight: 700 }}>
                      {field.label}
                    </Typography>
                    <Checkbox
                      checked={Boolean(sharingVisibility[field.key])}
                      onChange={() => toggleSharingField(field.key)}
                      sx={{
                        p: 0,
                        color: tokens.teal,
                        "&.Mui-checked": { color: tokens.teal },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button
              onClick={closeManageSharing}
              variant="outlined"
              sx={{
                minWidth: 120,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 800,
                color: tokens.navy,
                borderColor: tokens.border,
                "&:hover": { borderColor: tokens.inputBorderHover, bgcolor: "rgba(52, 74, 102, 0.03)" },
              }}
            >
              {profilePageData.popovers.manageSharing.cancelLabel}
            </Button>
            <Button
              onClick={closeManageSharing}
              variant="contained"
              disableElevation
              sx={{
                minWidth: 120,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                bgcolor: tokens.teal,
                "&:hover": { bgcolor: tokens.tealDark },
              }}
            >
              {profilePageData.popovers.manageSharing.doneLabel}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 16px 40px rgba(40, 92, 112, 0.08)",
            overflow: "hidden",
          }}
        >
          {/* Card header strip */}
          <Box
            sx={{
              px: { xs: 2.5, sm: 3.5 },
              py: 2,
              borderBottom: `1px solid ${tokens.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#fff",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: tokens.navy }}>
              {profilePageData.card.title}
            </Typography>
            <IconButton
              onClick={() => setIsEditing((v) => !v)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                border: `1px solid ${tokens.border}`,
                bgcolor: "#fff",
                color: tokens.slate,
                "&:hover": { bgcolor: "rgba(52, 74, 102, 0.03)", color: tokens.teal },
              }}
              aria-label="Edit profile"
            >
              <EditRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3, pb: { xs: 2.5, sm: 3.5 } }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Box component="label" sx={{ cursor: "pointer", display: "inline-flex" }}>
                <input type="file" accept="image/*" hidden onChange={handleAvatarPick} />
                <Avatar
                  src={profile?.avatar_url || imgSrc(AvatarPlaceholder)}
                  sx={{ width: 72, height: 72, bgcolor: tokens.avatarBg }}
                />
              </Box>
              <Typography sx={{ fontWeight: 700, color: tokens.navy, fontSize: 16 }}>
                {profilePageData.card.profilePictureLabel}
              </Typography>
            </Stack>

            <Box component="form" onSubmit={handleSubmit}>
            {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}
            <Snackbar
              open={Boolean(successMessage)}
              autoHideDuration={3000}
              onClose={clearMessages}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert onClose={clearMessages} severity="success" variant="filled" sx={{ fontWeight: 700 }}>
                {successMessage || "Profile Updated"}
              </Alert>
            </Snackbar>

            <Typography sx={{ fontWeight: 800, color: tokens.navy, mb: 1 }}>
              {profilePageData.sections.personal}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

            <Grid container spacing={2.25}>
              <Grid item xs={12} sm={6}>
                <MollureLabeledField
                  name="firstName"
                  fieldLabel={profilePageData.fields.firstName.label}
                  placeholder={profilePageData.fields.firstName.placeholder}
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureLabeledField
                  name="lastName"
                  fieldLabel={profilePageData.fields.lastName.label}
                  placeholder={profilePageData.fields.lastName.placeholder}
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                />
              </Grid>
              <Grid item xs={12}>
                <MollureLabeledField
                  select
                  fieldLabel={profilePageData.fields.reviewName.label}
                  value={form.reviewNameMode}
                  onChange={(e) => setReviewNameMode(e.target.value as typeof form.reviewNameMode)}
                  disabled={fieldsDisabled}
                >
                  {profilePageData.reviewNameOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MollureLabeledField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureLabeledField
                  name="birthDate"
                  type="date"
                  fieldLabel={profilePageData.fields.birthDate.label}
                  value={form.birthDate}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureLabeledField
                  select
                  fieldLabel={profilePageData.fields.gender.label}
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  disabled
                  sx={{
                    "& .MuiSelect-select": { color: tokens.placeholder },
                  }}
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {profilePageData.genderOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MollureLabeledField>
              </Grid>
            </Grid>

            <Typography sx={{ fontWeight: 800, color: tokens.navy, mb: 1, mt: 3.5 }}>
              {profilePageData.sections.contact}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

            <Grid container spacing={2.25}>
              <Grid item xs={12} sm={4}>
                <MollureLabeledField
                  select
                  name="countryCode"
                  fieldLabel={profilePageData.fields.countryCode.label}
                  value={form.countryCode || ""}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                >
                  <MenuItem value="">
                    <em>Code</em>
                  </MenuItem>
                  {profilePageData.countryCodeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MollureLabeledField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <MollureLabeledField
                  name="phone"
                  fieldLabel={profilePageData.fields.phone.label}
                  placeholder={profilePageData.fields.phone.placeholder}
                  value={form.phone}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                />
              </Grid>
              <Grid item xs={12}>
                <MollureLabeledField
                  name="email"
                  type="email"
                  fieldLabel={profilePageData.fields.email.label}
                  placeholder={profilePageData.fields.email.placeholder}
                  value={form.email}
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "rgba(52, 74, 102, 0.03)" },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureLabeledPasswordField
                  name="password"
                  fieldLabel={profilePageData.fields.password.label}
                  placeholder={profilePageData.fields.password.placeholder}
                  value={form.password}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MollureLabeledPasswordField
                  name="confirmPassword"
                  fieldLabel={profilePageData.fields.repeatPassword.label}
                  placeholder={profilePageData.fields.repeatPassword.placeholder}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography
                component={Link}
                href={profilePageData.links.terms.href}
                sx={{ color: tokens.teal, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
              >
                {profilePageData.links.terms.label}
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              disabled={isSaving || fieldsDisabled}
              variant="contained"
              disableElevation
              sx={{
                mt: 3,
                py: 1.35,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 16,
                color: "#fff",
                bgcolor: tokens.teal,
                "&:hover": { bgcolor: tokens.tealDark },
              }}
            >
              {isSaving ? <CircularProgress size={22} color="inherit" /> : profilePageData.actions.update}
            </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={marketingShellFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
