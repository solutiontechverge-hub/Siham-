"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Checkbox,
  ListSubheader,
  MenuItem,
  type TextFieldProps,
} from "@mui/material";
import AppTextField from "./AppTextField";
import AppSearchField from "./AppSearchField";

export type AppDropdownOption = {
  label: string;
  value: string;
  /** Optional leading icon / logo for the menu row. */
  icon?: React.ReactNode;
  /** Optional text color for the option (and selected value). */
  color?: string;
};

type AppDropdownProps = Omit<
  TextFieldProps,
  "select" | "onChange" | "children" | "value"
> & {
  options: AppDropdownOption[];
  value: string | readonly string[];
  multiple?: boolean;
  /** Close the menu after each selection (useful for multi-select in modals). */
  closeOnSelect?: boolean;
  /** Show a search field at the top of the menu to filter options by label. */
  searchable?: boolean;
  searchPlaceholder?: string;
  renderValue?: (selected: string | readonly string[]) => React.ReactNode;
  onChange: (
    value: string | readonly string[],
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
};

function normalizeSelectValue(
  raw: unknown,
  multiple?: boolean,
): string | readonly string[] {
  if (multiple) {
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "string") return raw === "" ? [] : raw.split(",");
    return [];
  }
  return typeof raw === "string" ? raw : String(raw ?? "");
}

export default function AppDropdown({
  onChange,
  options,
  value,
  multiple,
  closeOnSelect = false,
  searchable = false,
  searchPlaceholder = "Search...",
  renderValue,
  placeholder,
  ...props
}: AppDropdownProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(normalizeSelectValue(event.target.value, multiple), event);
    if (closeOnSelect) {
      setMenuOpen(false);
    }
  };

  const query = search.trim().toLowerCase();
  const visibleOptions =
    searchable && query
      ? options.filter((option) => option.label.toLowerCase().includes(query))
      : options;

  return (
    <AppTextField
      select
      value={value}
      onChange={handleChange}
      SelectProps={{
        IconComponent: ExpandMoreRoundedIcon,
        multiple: Boolean(multiple),
        displayEmpty: true,
        onClose: () => {
          setMenuOpen(false);
          setSearch("");
        },
        ...(closeOnSelect || searchable
          ? {
              open: menuOpen,
              onOpen: () => setMenuOpen(true),
            }
          : {}),
        renderValue:
          (renderValue as any) ??
          ((selected: any) => {
            const isMulti = Array.isArray(selected);
            const isEmpty = isMulti
              ? selected.length === 0
              : selected === "" || selected == null;
            if (isEmpty)
              return (
                <span style={{ opacity: 0.6 }}>{placeholder ?? "Select"}</span>
              );
            const v = isMulti ? selected[0] : selected;
            const option = options.find((o) => o.value === v);
            const label = option?.label;
            return (
              <span style={option?.color ? { color: option.color, fontWeight: 700 } : undefined}>
                {label ?? String(v)}
              </span>
            );
          }),
      }}
      {...props}
    >
      {searchable ? (
        <ListSubheader
          disableSticky
          sx={{ px: 1, py: 0.75, lineHeight: 1, bgcolor: "#fff" }}
        >
          <AppSearchField
            autoFocus
            fullWidth
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            onKeyDown={(e) => {
              if (e.key !== "Escape") e.stopPropagation();
            }}
          />
        </ListSubheader>
      ) : null}
      {visibleOptions.map((option) => {
        const selected = Array.isArray(value)
          ? value.includes(option.value)
          : value === option.value;
        return (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: option.icon ? 1.75 : 1,
              minHeight: 40,
              py: 1,
              lineHeight: 1.2,
              color: option.color,
              fontWeight: option.color ? 700 : undefined,
            }}
          >
            {multiple ? (
              <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
            ) : null}
            {option.icon ? option.icon : null}
            {option.label}
          </MenuItem>
        );
      })}
    </AppTextField>
  );
}
