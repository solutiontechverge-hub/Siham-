"use client";

import Link from "next/link";
import { Box, CircularProgress, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AppButton from "../../../components/common/AppButton";
import AuthEmailScreen from "../../../components/auth/AuthEmailScreen";
import { MollureLabeledPasswordField } from "../../../components/common";
import { BodyText, SubHeading } from "../../../components/ui/typography";
import { changePasswordPageData as copy } from "./changePassword.data";
import { useChangePasswordPage } from "./useChangePasswordPage";

export default function ChangePasswordPageView() {
  const {
    m,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleSubmit,
    goBack,
  } = useChangePasswordPage();

  return (
    <AuthEmailScreen>
      <SubHeading sx={{ color: m.navy, mb: 1 }}>{copy.title}</SubHeading>
      <BodyText sx={{ color: alpha(m.navy, 0.62), mb: 3 }}>
        {copy.subtitle}
      </BodyText>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <MollureLabeledPasswordField
            fieldLabel={copy.fields.currentPassword.label}
            placeholder={copy.fields.currentPassword.placeholder}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <MollureLabeledPasswordField
            fieldLabel={copy.fields.newPassword.label}
            placeholder={copy.fields.newPassword.placeholder}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <MollureLabeledPasswordField
            fieldLabel={copy.fields.confirmPassword.label}
            placeholder={copy.fields.confirmPassword.placeholder}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <AppButton
            tone="primary"
            type="submit"
            disabled={isLoading}
            fullWidth
            sx={{ minHeight: 44 }}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              copy.actions.submit
            )}
          </AppButton>
          <BodyText
            component={Link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              goBack();
            }}
            sx={{
              color: alpha(m.navy, 0.52),
              fontSize: "0.8125rem",
              fontWeight: 500,
              textDecoration: "none",
              textAlign: "center",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {copy.backLabel}
          </BodyText>
        </Stack>
      </Box>
    </AuthEmailScreen>
  );
}
