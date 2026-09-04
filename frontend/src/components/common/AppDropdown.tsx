"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Checkbox,
  ListSubheader,
  MenuItem,
  Tooltip,
  type TextFieldProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppTextField from "./AppTextField";
import AppSearchField from "./AppSearchField";

export type AppDropdownOption = {
  label: string;
  value: string;
  /** Optional leading icon / logo for the menu row. */
  icon?: React.ReactNode;
  /** Optional text color for the option (and selected value). */
  color?: string;
  /** Grey, not selectable (e.g. booked team member). */
  disabled?: boolean;
  /** Hover text, including for disabled rows. */
  tooltip?: string;
};

const SELECT_ALL_VALUE = "__select_all__";

type AppDropdownProps = Omit<
  TextFieldProps,
  "select" | "onChange" | "children" | "value"
> & {
  options: AppDropdownOption[];
  value: string | readonly string[];
  multiple?: boolean;
  /** Add a Select All row at the top of a multi-select menu. */
  selectAll?: boolean;
  selectAllLabel?: string;
  /** Close the menu after each selection (useful for multi-select in modals). */
  closeOnSelect?: boolean;
  /** Show a search field at the top of the menu to filter options by label. */
  searchable?: boolean;
  searchPlaceholder?: string;
  renderValue?: (selected: string | readonly string[]) => React.ReactNode;
  onChange: (
    value: string | readonly string[],
    event?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
  selectAll = false,
  selectAllLabel = "Select All",
  closeOnSelect = false,
  searchable = false,
  searchPlaceholder = "Search...",
  renderValue,
  placeholder,
  SelectProps: callerSelectProps,
  disabled,
  ...props
}: AppDropdownProps) {
  const m = useTheme().palette.mollure;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const query = search.trim().toLowerCase();
  const visibleOptions =
    searchable && query
      ? options.filter((option) => option.label.toLowerCase().includes(query))
      : options;
  const selectedValues = Array.isArray(value) ? value.map(String) : [];
  const selectAllTargets = (
    searchable && query ? visibleOptions : options
  )
    .filter((option) => !option.disabled)
    .map((option) => option.value);
  const allSelected =
    selectAllTargets.length > 0 &&
    selectAllTargets.every((id) => selectedValues.includes(id));
  const someSelected = selectAllTargets.some((id) =>
    selectedValues.includes(id),
  );
  const showSelectAll =
    Boolean(multiple && selectAll) && selectAllTargets.length > 1;

  const applySelectAll = (
    event?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (disabled) return;
    if (allSelected) {
      onChange(
        selectedValues.filter((id) => !selectAllTargets.includes(id)),
        event,
      );
      return;
    }
    onChange([...new Set([...selectedValues, ...selectAllTargets])], event);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const next = normalizeSelectValue(event.target.value, multiple);
    if (
      multiple &&
      Array.isArray(next) &&
      next.includes(SELECT_ALL_VALUE)
    ) {
      applySelectAll(event);
      return;
    }
    if (
      !multiple &&
      typeof next === "string" &&
      options.some((option) => option.value === next && option.disabled)
    ) {
      return;
    }
    onChange(next, event);
    if (closeOnSelect) {
      setMenuOpen(false);
    }
  };

  const { MenuProps: callerMenuProps, ...restCallerSelectProps } =
    callerSelectProps ?? {};

  return (
    <AppTextField
      select
      value={value}
      onChange={handleChange}
      disabled={disabled}
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
            const ids = isMulti
              ? selected.filter((id: string) => id !== SELECT_ALL_VALUE)
              : selected;
            const isEmpty = isMulti
              ? ids.length === 0
              : ids === "" || ids == null;
            if (isEmpty)
              return (
                <span style={{ opacity: 0.6 }}>{placeholder ?? "Select"}</span>
              );
            if (isMulti) {
              return ids
                .map((id: string) => {
                  const option = options.find((o) => o.value === String(id));
                  return option?.label ?? String(id);
                })
                .join(", ");
            }
            const option = options.find((o) => o.value === ids);
            const label = option?.label;
            return (
              <span style={option?.color ? { color: option.color, fontWeight: 700 } : undefined}>
                {label ?? String(ids)}
              </span>
            );
          }),
        ...restCallerSelectProps,
        MenuProps: {
          disablePortal: false,
          ...callerMenuProps,
        },
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
      {showSelectAll ? (
        <MenuItem
          value={SELECT_ALL_VALUE}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minHeight: 40,
            py: 1,
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            sx={{ p: 0.5 }}
          />
          {selectAllLabel}
        </MenuItem>
      ) : null}
      {visibleOptions.map((option) => {
        const selected = Array.isArray(value)
          ? value.includes(option.value)
          : value === option.value;
        const rowColor = option.disabled
          ? m.placeholder
          : option.color;
        const item = (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: option.icon ? 1.75 : 1,
              minHeight: 40,
              py: 1,
              lineHeight: 1.2,
              color: rowColor,
              fontWeight: option.color && !option.disabled ? 700 : undefined,
              "&.Mui-disabled": {
                opacity: 1,
                color: m.placeholder,
                pointerEvents: "auto",
                cursor: "not-allowed",
              },
            }}
          >
            {multiple ? (
              <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
            ) : null}
            {option.icon ? option.icon : null}
            {option.tooltip ? (
              <Tooltip title={option.tooltip} placement="right">
                <span>{option.label}</span>
              </Tooltip>
            ) : (
              option.label
            )}
          </MenuItem>
        );
        return item;
      })}
    </AppTextField>
  );
}
