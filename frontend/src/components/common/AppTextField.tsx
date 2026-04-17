"use client";

import * as React from "react";
import type { TextFieldProps } from "@mui/material";
import { MollureLabeledField, MollureTextField } from ".";

export default function AppTextField(props: TextFieldProps) {
  if (props.label) {
    const { label, ...rest } = props;
    return <MollureLabeledField fieldLabel={label} {...rest} />;
  }

  return <MollureTextField {...props} />;
}
