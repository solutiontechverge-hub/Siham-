"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  CLIENT_PROFILE_KEY,
  SIGNUP_EMAIL_KEY,
  SIGNUP_USER_TYPE_KEY,
} from "../../../../lib/auth-storage";
import {
  parseEmail,
  parsePassword,
  parsePersonName,
  rejectInvalid,
} from "../../../../lib/inputSchema";
import { getPasswordStrength } from "../../../../lib/passwordStrength";
import { useRegisterMutation } from "../../../../store/services/authApi";
import { findCountryDialCode } from "../../../../data/countryDialCodes";
import { getPhoneValidationErrors } from "../../../../lib/phone-validation";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import {
  REVIEW_NAME_MODES,
  resolveDisplayNameFromMode,
  reviewNameOptionLabel,
  type ReviewNameMode,
} from "../../../../lib/reviewNameDisplay";

export type FormState = {
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

export function useIndividualSignupPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const { showSnackbar } = useSnackbar();
  const [register, { isLoading }] = useRegisterMutation();
  const passwordStrength = getPasswordStrength(form.password);
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
    setErrors((prev) =>
      prev[name as keyof FormState] ? { ...prev, [name]: undefined } : prev,
    );
  };

  const clearPhoneErrors = () =>
    setErrors((prev) => ({
      ...prev,
      countryCode: undefined,
      phone: undefined,
    }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = rejectInvalid({
      email: parseEmail(form.email),
      firstName: parsePersonName(form.firstName, { label: "First name" }),
      lastName: parsePersonName(form.lastName, { label: "Last name" }),
      password: parsePassword(form.password, { strong: true }),
      confirmPassword: parsePassword(form.confirmPassword, {
        label: "Repeat password",
      }),
    });

    const nextErrors: Partial<Record<keyof FormState, string>> = parsed.ok
      ? {}
      : {
          email: parsed.errors.email,
          firstName: parsed.errors.firstName,
          lastName: parsed.errors.lastName,
          password: parsed.errors.password,
          confirmPassword: parsed.errors.confirmPassword,
        };

    if (!form.acceptTerms)
      nextErrors.acceptTerms = "Please accept the terms and conditions.";

    const phoneErrors = getPhoneValidationErrors(form.countryCode, form.phone, {
      required: false,
    });
    if (phoneErrors.countryCode)
      nextErrors.countryCode = phoneErrors.countryCode;
    if (phoneErrors.phone) nextErrors.phone = phoneErrors.phone;
    if (form.phone.trim() && !form.countryCode.trim()) {
      nextErrors.countryCode = "Country code is required.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const firstMessage = Object.values(nextErrors).find(Boolean);
      if (firstMessage)
        showSnackbar({ severity: "error", message: firstMessage });
      return;
    }
    if (!parsed.ok) return;

    if (form.password !== form.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Password and repeat password must match.",
      }));
      showSnackbar({
        severity: "error",
        message: "Password and repeat password must match.",
      });
      return;
    }

    if (!passwordStrength.isStrong) {
      setErrors((prev) => ({
        ...prev,
        password: "Please choose a strong password to continue.",
      }));
      showSnackbar({
        severity: "error",
        message: "Please choose a strong password to continue.",
      });
      return;
    }

    try {
      const result = await register({
        user_type: "individual",
        email: parsed.values.email,
        password: form.password,
        confirm_password: form.confirmPassword,
        first_name: parsed.values.firstName,
        last_name: parsed.values.lastName,
        display_name:
          resolveDisplayNameFromMode(
            form.reviewNameMode,
            form.firstName,
            form.lastName,
          ) || undefined,
        date_of_birth: form.birthDate || undefined,
        gender: form.gender || undefined,
        country_code:
          (findCountryDialCode(form.countryCode)?.dialCode ??
            form.countryCode.trim()) ||
          undefined,
        phone: form.phone.trim() || undefined,
      }).unwrap();

      // Persist client details for pre-filling the client profile page.
      try {
        window.localStorage.setItem(
          CLIENT_PROFILE_KEY,
          JSON.stringify({
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            display_name:
              resolveDisplayNameFromMode(
                form.reviewNameMode,
                form.firstName,
                form.lastName,
              ) || undefined,
            date_of_birth: form.birthDate || undefined,
            gender: form.gender || undefined,
            country_code:
              (findCountryDialCode(form.countryCode)?.dialCode ??
                form.countryCode.trim()) ||
              undefined,
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
        message:
          result.message ||
          "Account created successfully. Please check your email.",
      });
      setForm(initialForm);
      try {
        window.sessionStorage.setItem(
          SIGNUP_EMAIL_KEY,
          form.email.trim().toLowerCase(),
        );
        window.sessionStorage.setItem(SIGNUP_USER_TYPE_KEY, "individual");
      } catch {
        // ignore
      }
      router.push(
        `/auth/check-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}&type=individual`,
      );
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Registration failed. Please check the details.",
        ),
      });
    }
  };

  return {
    m,
    form,
    errors,
    isLoading,
    passwordStrength,
    maxDob,
    reviewNameOptions,
    handleChange,
    clearPhoneErrors,
    handleSubmit,
  };
}
