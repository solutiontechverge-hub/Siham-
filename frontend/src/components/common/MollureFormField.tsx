"use client";

import * as React from "react";
import type { TextFieldProps } from "@mui/material";
import { MollureLabeledField, MollureTextField } from ".";

export default function MollureFormField(props: TextFieldProps) {
  // Many existing professional pages pass labels like "Legal Name*".
  // To keep behavior but match the new design (label above field),
  // infer required from a trailing asterisk and strip it from the label.
  const label =
    typeof props.label === "string" ? props.label.trim() : props.label;

  const hasInlineAsterisk =
    typeof label === "string" ? /\*\s*$/.test(label) : false;

  if (props.label) {
    const cleanLabel =
      typeof label === "string" ? label.replace(/\*\s*$/, "").trim() : label;

    const { label: _ignoredLabel, required, ...rest } = props;
    return (
      <MollureLabeledField
        fieldLabel={cleanLabel as any}
        required={required ?? hasInlineAsterisk}
        {...rest}
      />
    );
  }

  return <MollureTextField {...props} />;
}

