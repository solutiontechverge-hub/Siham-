"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { getPasswordStrength } from "../../../../lib/passwordStrength";
import { useRegisterMutation } from "../../../../store/services/authApi";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import {
  SIGNUP_EMAIL_KEY,
  SIGNUP_USER_TYPE_KEY,
} from "../../../../lib/auth-storage";
import {
  parseCoc,
  parseEmail,
  parsePassword,
  parsePersonName,
  parseText,
  parseVat,
  rejectInvalid,
  INPUT_LIMITS,
} from "../../../../lib/inputSchema";

export type FormState = {
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

export function useCompanySignupPage() {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = rejectInvalid({
      contactEmail: parseEmail(form.contactEmail),
      legalName: parseText(form.legalName, {
        label: "Legal name",
        max: INPUT_LIMITS.personName,
      }),
      contactFirstName: parsePersonName(form.contactFirstName, {
        label: "First name",
      }),
      contactLastName: parsePersonName(form.contactLastName, {
        label: "Last name",
      }),
      cccNumber: parseCoc(form.cccNumber),
      vatNumber: parseVat(form.vatNumber),
      street: parseText(form.street, {
        required: false,
        label: "Street",
        max: INPUT_LIMITS.textShort,
      }),
      number: parseText(form.number, {
        required: false,
        label: "Street number",
        max: INPUT_LIMITS.streetNumber,
      }),
      postalCode: parseText(form.postalCode, {
        required: false,
        label: "Postal code",
        max: INPUT_LIMITS.postalCode,
      }),
      password: parsePassword(form.password, { strong: true }),
      confirmPassword: parsePassword(form.confirmPassword, {
        label: "Repeat password",
      }),
    });

    const nextErrors: Partial<Record<keyof FormState, string>> = parsed.ok
      ? {}
      : {
          contactEmail: parsed.errors.contactEmail,
          legalName: parsed.errors.legalName,
          contactFirstName: parsed.errors.contactFirstName,
          contactLastName: parsed.errors.contactLastName,
          cccNumber: parsed.errors.cccNumber,
          vatNumber: parsed.errors.vatNumber,
          street: parsed.errors.street,
          number: parsed.errors.number,
          postalCode: parsed.errors.postalCode,
          password: parsed.errors.password,
          confirmPassword: parsed.errors.confirmPassword,
        };

    if (!form.acceptTerms)
      nextErrors.acceptTerms = "Please accept the terms and conditions.";

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
        user_type: "company",
        email: parsed.values.contactEmail,
        password: form.password,
        confirm_password: form.confirmPassword,
        legal_name: parsed.values.legalName,
        ccc_number: parsed.values.cccNumber,
        vat_number: parsed.values.vatNumber,
        street: form.street.trim() || undefined,
        street_number: form.number.trim() || undefined,
        postal_code: form.postalCode.trim() || undefined,
        province: form.province.trim() || undefined,
        municipality: form.municipality.trim() || undefined,
        contact_first_name: parsed.values.contactFirstName,
        contact_last_name: parsed.values.contactLastName,
      }).unwrap();

      showSnackbar({
        severity: "success",
        message:
          result.message ||
          "Company account created successfully. Please check your email.",
      });
      setForm(initialForm);
      try {
        window.sessionStorage.setItem(
          SIGNUP_EMAIL_KEY,
          form.contactEmail.trim().toLowerCase(),
        );
        window.sessionStorage.setItem(SIGNUP_USER_TYPE_KEY, "company");
      } catch {
        // ignore
      }
      router.push(
        `/auth/check-email?email=${encodeURIComponent(form.contactEmail.trim().toLowerCase())}&type=company`,
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
    handleChange,
    handleSubmit,
  };
}
