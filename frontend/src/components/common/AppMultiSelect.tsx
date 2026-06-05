"use client";

import * as React from "react";
import type { TextFieldProps } from "@mui/material";
import AppDropdown, { type AppDropdownOption } from "./AppDropdown";

export type AppMultiSelectOption = AppDropdownOption;

type AppMultiSelectProps = Omit<TextFieldProps, "select" | "onChange" | "value"> & {
  options: AppMultiSelectOption[];
  value: string[];
  placeholder?: string;
  onChange: (value: string[]) => void;
  /** Labels shown in the field before collapsing to "N selected". */
  maxLabelsShown?: number;
  renderValue?: (selected: readonly string[]) => React.ReactNode;
};

function formatMultiSelectValue(
  selected: readonly string[],
  options: AppMultiSelectOption[],
  placeholder: string,
  maxLabelsShown: number,
) {
  if (!selected.length) {
    return <span style={{ opacity: 0.6 }}>{placeholder}</span>;
  }
  const labels = selected
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .filter(Boolean);
  if (labels.length <= maxLabelsShown) return labels.join(", ");
  return `${labels.length} selected`;
}

/** Multi-select dropdown with checkboxes; wraps `AppDropdown` with `multiple` enabled. */
export default function AppMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  maxLabelsShown = 2,
  renderValue,
  ...props
}: AppMultiSelectProps) {
  return (
    <AppDropdown
      multiple
      options={options}
      value={value}
      placeholder={placeholder}
      onChange={(val) => {
        if (Array.isArray(val)) {
          onChange([...val]);
          return;
        }
        onChange([]);
      }}
      renderValue={
        renderValue ??
        ((selected) =>
          formatMultiSelectValue(
            Array.isArray(selected) ? selected : [],
            options,
            placeholder,
            maxLabelsShown,
          ))
      }
      {...props}
    />
  );
}
