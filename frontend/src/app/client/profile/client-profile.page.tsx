"use client";

import * as React from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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
  FormControl,
  Grid,
  InputAdornment,
  MenuItem,
  Popover,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Profile as AvatarPlaceholder } from "../../../../images";
import { profilePageData } from "./data-profile";
import { useClientProfilePage } from "./use-profile";

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
    form,
    isLoading,
    loadError,
    isSaving,
    isEditing,
    setIsEditing,
    showPassword,
    setShowPassword,
    showRepeatPassword,
    setShowRepeatPassword,
    successMessage,
    errorMessage,
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
    isNotificationsOpen,
    openNotifications,
    closeNotifications,
    sharingVisibility,
    toggleSharingField,
    handleLogout,
  } = useClientProfilePage();

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
      <Box
        component="header"
        sx={{
          bgcolor: "#fff",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box component={Link} href="/client" sx={{ display: "inline-flex" }}>
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
                }}
              >
                EN
              </Button>
              <IconButton
                sx={{ color: tokens.navy }}
                aria-label="Notifications"
                onClick={openNotifications}
              >
                <NotificationsNoneRoundedIcon />
              </IconButton>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ ml: 0.5, cursor: "pointer", userSelect: "none" }}
                onClick={(e) => openProfileMenu(e.currentTarget)}
                role="button"
                aria-label="Open profile menu"
              >
                <Avatar
                  src={profile?.avatar_url || imgSrc(AvatarPlaceholder)}
                  sx={{ width: 40, height: 40, bgcolor: tokens.avatarBg }}
                />
                <Typography sx={{ fontWeight: 700, color: tokens.navy, fontSize: 14, display: { xs: "none", sm: "block" } }}>
                  {displayName}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
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
        open={isNotificationsOpen}
        onClose={closeNotifications}
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
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, bgcolor: "#fff" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontWeight: 900, color: tokens.navy, fontSize: 20 }}>
                {profilePageData.popovers.notifications.title}
              </Typography>
              <IconButton
                onClick={closeNotifications}
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: "rgba(52, 74, 102, 0.06)",
                  color: tokens.slate,
                  "&:hover": { bgcolor: "rgba(33, 184, 191, 0.12)", color: tokens.teal },
                }}
                aria-label="Close notifications"
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Box>
          <Divider sx={{ borderColor: tokens.border }} />

          <Box sx={{ bgcolor: "#fff", p: 0 }}>
            {profilePageData.popovers.notifications.items.map((n, idx) => {
              const statusIcon =
                n.statusType === "accepted" ? (
                  <CheckCircleRoundedIcon sx={{ fontSize: 16, color: tokens.teal }} />
                ) : n.statusType === "rejected" ? (
                  <CancelRoundedIcon sx={{ fontSize: 16, color: "#EE4B4B" }} />
                ) : n.statusType === "updated" ? (
                  <AutorenewRoundedIcon sx={{ fontSize: 16, color: tokens.slate }} />
                ) : (
                  <AutorenewRoundedIcon sx={{ fontSize: 16, color: tokens.slate }} />
                );

              return (
                <Box key={n.id}>
                  <Box sx={{ px: 3, py: 2.25 }}>
                    <Typography sx={{ fontWeight: 800, color: tokens.navy, fontSize: 14 }}>
                      {n.professionalName}
                    </Typography>

                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                      <Typography sx={{ color: tokens.slate, fontSize: 13 }}>
                        {n.statusLabel}
                      </Typography>
                      {statusIcon}
                    </Stack>

                    <Typography sx={{ color: tokens.slate, fontSize: 13, mt: 0.5 }}>
                      {n.bookingIdLabel}
                    </Typography>

                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
                      <AccessTimeRoundedIcon sx={{ fontSize: 16, color: alpha(tokens.slate, 0.65) }} />
                      <Typography sx={{ color: alpha(tokens.slate, 0.8), fontSize: 12.5 }}>
                        {n.timeLabel}
                      </Typography>
                    </Stack>
                  </Box>
                  {idx < profilePageData.popovers.notifications.items.length - 1 ? (
                    <Divider sx={{ borderColor: alpha(tokens.border, 0.8) }} />
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>

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

      <Box sx={{ bgcolor: "#fff", borderBottom: `1px solid ${tokens.border}` }}>
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" spacing={{ xs: 4, sm: 8 }} sx={{ py: 0 }}>
            {profilePageData.tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Box
                  key={tab.id}
                  component={Link}
                  href={tab.href}
                  sx={{
                    py: 1.75,
                    textDecoration: "none",
                    color: active ? "#000" : tokens.slate,
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

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
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
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: tokens.navy }}>
              {profilePageData.card.title}
            </Typography>
            <IconButton
              onClick={() => setIsEditing((v) => !v)}
              sx={{
                bgcolor: "rgba(52, 74, 102, 0.06)",
                color: tokens.slate,
                "&:hover": { bgcolor: "rgba(33, 184, 191, 0.12)", color: tokens.teal },
              }}
              aria-label="Edit profile"
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Avatar
              src={profile?.avatar_url || imgSrc(AvatarPlaceholder)}
              sx={{ width: 72, height: 72, bgcolor: tokens.avatarBg }}
            />
            <Typography sx={{ fontWeight: 600, color: tokens.navy, fontSize: 15 }}>
              {profilePageData.card.profilePictureLabel}
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            {successMessage ? <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> : null}
            {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}

            <Typography sx={{ fontWeight: 800, color: tokens.navy, mb: 1 }}>
              {profilePageData.sections.personal}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

            <Grid container spacing={2.25}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label={profilePageData.fields.firstName.label}
                  placeholder={profilePageData.fields.firstName.placeholder}
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
                  label={profilePageData.fields.lastName.label}
                  placeholder={profilePageData.fields.lastName.placeholder}
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
                  select
                  label={profilePageData.fields.reviewName.label}
                  value={form.reviewNameMode}
                  onChange={(e) => setReviewNameMode(e.target.value as typeof form.reviewNameMode)}
                  disabled={fieldsDisabled}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                >
                  {profilePageData.reviewNameOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="birthDate"
                  type="date"
                  label={profilePageData.fields.birthDate.label}
                  value={form.birthDate}
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
                  label={profilePageData.fields.gender.label}
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    ...fieldSx,
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
                </TextField>
              </Grid>
            </Grid>

            <Typography sx={{ fontWeight: 800, color: tokens.navy, mb: 1, mt: 3.5 }}>
              {profilePageData.sections.contact}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

            <Grid container spacing={2.25}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <TextField
                    select
                    name="countryCode"
                    label={profilePageData.fields.countryCode.label}
                    value={form.countryCode || ""}
                    onChange={handleChange}
                    disabled={fieldsDisabled}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  >
                    <MenuItem value="">
                      <em>Code</em>
                    </MenuItem>
                    {profilePageData.countryCodeOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  name="phone"
                  label={profilePageData.fields.phone.label}
                  placeholder={profilePageData.fields.phone.placeholder}
                  value={form.phone}
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
                  label={profilePageData.fields.email.label}
                  placeholder={profilePageData.fields.email.placeholder}
                  value={form.email}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    ...fieldSx,
                    "& .MuiOutlinedInput-root": { bgcolor: "rgba(52, 74, 102, 0.03)" },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? "text" : "password"}
                  label={profilePageData.fields.password.label}
                  placeholder={profilePageData.fields.password.placeholder}
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
                  name="confirmPassword"
                  type={showRepeatPassword ? "text" : "password"}
                  label={profilePageData.fields.repeatPassword.label}
                  placeholder={profilePageData.fields.repeatPassword.placeholder}
                  value={form.confirmPassword}
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
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 800,
                fontSize: 16,
                bgcolor: tokens.teal,
                "&:hover": { bgcolor: tokens.tealDark },
              }}
            >
              {isSaving ? <CircularProgress size={22} color="inherit" /> : profilePageData.actions.update}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
