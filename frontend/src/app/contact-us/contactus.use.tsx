"use client";

import * as React from "react";
import { useAppSelector } from "../../store/hooks";
import { useSubmitContactMessageMutation } from "../../store/services/contactApi";
import {
  INPUT_LIMITS,
  parseEmail,
  parseText,
  rejectInvalid,
} from "../../lib/inputSchema";

export type ContactUsFormValues = {
  persona: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  attachments: File[];
};

export type ContactUsFieldErrors = Partial<
  Record<keyof ContactUsFormValues, string>
>;

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

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
  const parsed = rejectInvalid({
    persona: parseText(values.persona, {
      label: "Who you are",
      max: 64,
    }),
    name: parseText(values.name, {
      label: "Name",
      max: INPUT_LIMITS.personName,
    }),
    email: parseEmail(values.email),
    subject: parseText(values.subject, {
      label: "Subject",
      max: INPUT_LIMITS.subject,
    }),
    message: parseText(values.message, {
      label: "Message",
      min: INPUT_LIMITS.messageMin,
      max: INPUT_LIMITS.messageMax,
    }),
  });

  const errors: ContactUsFieldErrors = parsed.ok
    ? {}
    : { ...parsed.errors };

  if (!values.consent)
    errors.consent = "Please accept the privacy policy consent to continue.";

  return errors;
}

export function useContactUsForm() {
  const isSignedIn = useAppSelector((s) => Boolean(s.auth.accessToken));
  const [submitContactMessage] = useSubmitContactMessageMutation();
  const [values, setValues] =
    React.useState<ContactUsFormValues>(initialValues);
  const [touched, setTouched] = React.useState<
    Partial<Record<keyof ContactUsFormValues, boolean>>
  >({});
  const [errors, setErrors] = React.useState<ContactUsFieldErrors>({});
  const [showSignInGate, setShowSignInGate] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<
    "idle" | "submitting" | "success"
  >("idle");
  const [attachmentError, setAttachmentError] = React.useState<
    string | undefined
  >();

  const setField = React.useCallback(
    <K extends keyof ContactUsFormValues>(
      key: K,
      value: ContactUsFormValues[K],
    ) => {
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
    const list = Array.from(files);
    const tooLarge = list.find((file) => file.size > MAX_ATTACHMENT_BYTES);
    if (tooLarge) {
      setAttachmentError(
        `"${tooLarge.name}" is too large. Maximum size is 10 MB.`,
      );
      return;
    }
    setAttachmentError(undefined);
    setValues((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...list],
    }));
  }, []);

  const removeFile = React.useCallback((idx: number) => {
    setAttachmentError(undefined);
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
    try {
      await submitContactMessage({
        persona: values.persona,
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject,
        message: values.message.trim(),
      }).unwrap();
      setSubmitState("success");
    } catch {
      setSubmitState("idle");
    }
  }, [isSignedIn, submitContactMessage, values]);

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
    attachmentError,
    submit,
    submitState,
    showSignInGate,
    closeGate,
    setShowSignInGate,
    setSubmitState,
  };
}
