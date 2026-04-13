"use client";

import * as React from "react";
import { useAppSelector } from "../../store/hooks";

export type ContactUsFormValues = {
  persona: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  attachments: File[];
};

export type ContactUsFieldErrors = Partial<Record<keyof ContactUsFormValues, string>>;

const initialValues: ContactUsFormValues = {
  persona: "Client",
  name: "",
  email: "",
  subject: "",
  message: "",
  consent: false,
  attachments: [],
};

function validate(values: ContactUsFormValues): ContactUsFieldErrors {
  const errors: ContactUsFieldErrors = {};

  if (!values.persona?.trim()) errors.persona = "Please select who you are.";

  if (!values.name.trim()) errors.name = "Please enter your name.";

  if (!values.email.trim()) {
    errors.email = "Please enter your email.";
  } else {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
    if (!emailOk) errors.email = "Please enter a valid email address.";
  }

  if (!values.subject?.trim()) errors.subject = "Please select a subject.";

  if (!values.message.trim()) {
    errors.message = "Please enter your message.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message should be at least 10 characters.";
  }

  if (!values.consent) errors.consent = "Please accept the privacy policy consent to continue.";

  return errors;
}

export function useContactUsForm() {
  const isSignedIn = useAppSelector((s) => Boolean(s.auth.accessToken));
  const [values, setValues] = React.useState<ContactUsFormValues>(initialValues);
  const [touched, setTouched] = React.useState<Partial<Record<keyof ContactUsFormValues, boolean>>>(
    {},
  );
  const [errors, setErrors] = React.useState<ContactUsFieldErrors>({});
  const [showSignInGate, setShowSignInGate] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<
    "idle" | "submitting" | "success"
  >("idle");

  const setField = React.useCallback(
    <K extends keyof ContactUsFormValues>(key: K, value: ContactUsFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const touch = React.useCallback((key: keyof ContactUsFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  React.useEffect(() => {
    setErrors(validate(values));
  }, [values]);

  const addFiles = React.useCallback((files: FileList | null) => {
    if (!files?.length) return;
    setValues((prev) => ({ ...prev, attachments: [...prev.attachments, ...Array.from(files)] }));
  }, []);

  const removeFile = React.useCallback((idx: number) => {
    setValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
    }));
  }, []);

  const submit = React.useCallback(async () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({
      persona: true,
      name: true,
      email: true,
      subject: true,
      message: true,
      consent: true,
    });
    if (Object.keys(nextErrors).length) return;

    if (!isSignedIn) {
      setShowSignInGate(true);
      return;
    }

    setSubmitState("submitting");
    // TODO: wire to backend when contact endpoint is defined.
    await new Promise((r) => setTimeout(r, 500));
    setSubmitState("success");
  }, [isSignedIn, values]);

  const closeGate = React.useCallback(() => setShowSignInGate(false), []);

  return {
    isSignedIn,
    values,
    setField,
    touched,
    errors,
    touch,
    addFiles,
    removeFile,
    submit,
    submitState,
    showSignInGate,
    closeGate,
    setShowSignInGate,
    setSubmitState,
  };
}

