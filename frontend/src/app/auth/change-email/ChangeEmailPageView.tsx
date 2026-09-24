"use client";

import Link from "next/link";
import { Alert, Box, CircularProgress, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AppButton from "../../../components/common/AppButton";
import AuthEmailScreen from "../../../components/auth/AuthEmailScreen";
import {
  MollureLabeledField,
  MollureLabeledPasswordField,
} from "../../../components/common";
import { BodyText, SubHeading } from "../../../components/ui/typography";
import { changeEmailPageData as copy } from "./changeEmail.data";
import { useChangeEmailPage } from "./useChangeEmailPage";

export default function ChangeEmailPageView() {
  const {
    m,
    currentEmail,
    newEmail,
    setNewEmail,
    currentPassword,
    setCurrentPassword,
    isProfileLoading,
    isError,
    isSaving,
    handleSubmit,
    goBack,
  } = useChangeEmailPage();

  if (isProfileLoading) {
    return (
      <AuthEmailScreen>
        <CircularProgress sx={{ color: m.teal }} />
      </AuthEmailScreen>
    );
  }

  if (isError) {
    return (
      <AuthEmailScreen>
        <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
          {copy.messages.loadFailed}
        </Alert>
        <AppButton tone="secondary" onClick={goBack} fullWidth>
          {copy.backLabel}
        </AppButton>
      </AuthEmailScreen>
    );
  }

  return (
    <AuthEmailScreen>
      <SubHeading sx={{ color: m.navy, mb: 1 }}>{copy.title}</SubHeading>
      <BodyText sx={{ color: alpha(m.navy, 0.62), mb: 3 }}>
        {copy.subtitle}
      </BodyText>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <MollureLabeledField
            fieldLabel={copy.fields.currentEmail.label}
            placeholder={copy.fields.currentEmail.placeholder}
            value={currentEmail}
            disabled
          />
          <MollureLabeledField
            fieldLabel={copy.fields.newEmail.label}
            placeholder={copy.fields.newEmail.placeholder}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <MollureLabeledPasswordField
            fieldLabel={copy.fields.currentPassword.label}
            placeholder={copy.fields.currentPassword.placeholder}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <AppButton
            tone="primary"
            type="submit"
            disabled={isSaving}
            fullWidth
            sx={{ minHeight: 44 }}
          >
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              copy.actions.submit
            )}
          </AppButton>
          <Box sx={{ textAlign: "center" }}>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                goBack();
              }}
              style={{
                color: alpha(m.navy, 0.52),
                fontSize: "0.8125rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {copy.backLabel}
            </Link>
          </Box>
        </Stack>
      </Box>
    </AuthEmailScreen>
  );
}
