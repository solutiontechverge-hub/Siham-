"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  parseEmail,
  parsePassword,
  rejectInvalid,
} from "../../../lib/inputSchema";
import {
  useChangeEmailMutation,
  useGetProfileQuery,
} from "../../../store/services/profileApi";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import { changeEmailPageData } from "./changeEmail.data";

export function useChangeEmailPage() {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { data, isLoading: isProfileLoading, isError } = useGetProfileQuery();
  const [changeEmail, { isLoading: isSaving }] = useChangeEmailMutation();
  const [newEmail, setNewEmail] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");

  const currentEmail = data?.data?.email ?? "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = rejectInvalid({
      newEmail: parseEmail(newEmail, { label: "New email" }),
      currentPassword: parsePassword(currentPassword, {
        label: "Current password",
      }),
    });
    if (!parsed.ok) {
      showSnackbar({
        severity: "error",
        message:
          parsed.errors.newEmail ||
          parsed.errors.currentPassword ||
          changeEmailPageData.messages.checkPassword,
      });
      return;
    }

    if (parsed.values.newEmail === currentEmail.trim().toLowerCase()) {
      showSnackbar({
        severity: "error",
        message: "Enter a different email address.",
      });
      return;
    }

    try {
      const result = await changeEmail({
        new_email: parsed.values.newEmail,
        current_password: parsed.values.currentPassword,
      }).unwrap();

      showSnackbar({
        severity: "success",
        message: result.message || changeEmailPageData.messages.success,
      });
      window.setTimeout(() => {
        router.back();
      }, 700);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          changeEmailPageData.messages.failed,
        ),
      });
    }
  };

  return {
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
    goBack: () => router.back(),
  };
}
