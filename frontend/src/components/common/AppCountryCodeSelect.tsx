"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Box,
  ListSubheader,
  MenuItem,
  Stack,
  Typography,
  type TextFieldProps,
} from "@mui/material";
import AppSearchField from "./AppSearchField";
import AppTextField from "./AppTextField";
import {
  COUNTRY_DIAL_CODES,
  countryDialOptionValue,
  countryFlagEmoji,
  dialCodeFromSelectValue,
  findCountryDialCode,
  resolveCountrySelectValue,
  type CountryDialCode,
} from "../../data/countryDialCodes";

export type AppCountryCodeSelectProps = Omit<
  TextFieldProps,
  "select" | "onChange" | "value"
> & {
  value: string;
  onChange: (dialCode: string) => void;
  placeholder?: string;
};

function matchesCountrySearch(entry: CountryDialCode, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const dialDigits = entry.dialCode.replace(/\D/g, "");
  const queryDigits = q.replace(/\D/g, "");
  return (
    entry.name.toLowerCase().includes(q) ||
    entry.iso.toLowerCase().includes(q) ||
    entry.dialCode.toLowerCase().includes(q) ||
    (queryDigits.length > 0 && dialDigits.includes(queryDigits))
  );
}

function CountryCodeMenuItem({
  iso,
  dialCode,
  name,
}: {
  iso: string;
  dialCode: string;
  name: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ width: "100%", minWidth: 0, lineHeight: 1.2 }}
    >
      <Box
        component="span"
        sx={{
          fontSize: 18,
          lineHeight: 1,
          width: 22,
          textAlign: "center",
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {countryFlagEmoji(iso)}
      </Box>
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
          lineHeight: 1.2,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {dialCode}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontSize: 12,
          color: "text.secondary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {name}
      </Typography>
    </Stack>
  );
}

function CountryCodeSelectedValue({ value }: { value: string }) {
  const entry = findCountryDialCode(value);
  if (!entry) return <>{value}</>;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 0.75,
        height: "100%",
        minHeight: 24,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <Box
        component="span"
        sx={{
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: 0.2,
        }}
      >
        {entry.iso}
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {entry.dialCode}
      </Box>
    </Box>
  );
}

export default function AppCountryCodeSelect({
  value,
  onChange,
  placeholder = "Country Code",
  sx,
  ...props
}: AppCountryCodeSelectProps) {
  const selectValue = resolveCountrySelectValue(value);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const itemRefs = React.useRef<Array<HTMLLIElement | null>>([]);

  const query = search.trim();
  const visibleCountries = COUNTRY_DIAL_CODES.filter((entry) =>
    matchesCountrySearch(entry, query),
  );

  React.useEffect(() => {
    setHighlightIndex(0);
    itemRefs.current = [];
  }, [query, menuOpen]);

  React.useEffect(() => {
    if (!menuOpen || visibleCountries.length === 0) return;
    const el = itemRefs.current[highlightIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, menuOpen, visibleCountries.length]);

  const selectCountryAt = React.useCallback(
    (index: number) => {
      const entry = visibleCountries[index];
      if (!entry) return;
      onChange(dialCodeFromSelectValue(countryDialOptionValue(entry)));
      setMenuOpen(false);
      setSearch("");
      setHighlightIndex(0);
    },
    [onChange, visibleCountries],
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      if (visibleCountries.length === 0) return;
      setHighlightIndex((prev) =>
        Math.min(prev + 1, visibleCountries.length - 1),
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      if (visibleCountries.length === 0) return;
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (visibleCountries.length === 0) return;
      selectCountryAt(highlightIndex);
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      e.stopPropagation();
      if (visibleCountries.length === 0) return;
      setHighlightIndex(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      e.stopPropagation();
      if (visibleCountries.length === 0) return;
      setHighlightIndex(visibleCountries.length - 1);
      return;
    }

    e.stopPropagation();
  };

  return (
    <AppTextField
      select
      value={selectValue}
      onChange={(event) =>
        onChange(dialCodeFromSelectValue(String(event.target.value)))
      }
      sx={[
        {
          "& .MuiOutlinedInput-root": {
            display: "flex",
            alignItems: "center",
          },
          "& .MuiSelect-select": {
            display: "flex !important",
            alignItems: "center",
            justifyContent: "flex-start",
            minHeight: 40,
            height: 40,
            py: 0,
            boxSizing: "border-box",
            whiteSpace: "nowrap",
            overflow: "hidden",
          },
          "& .MuiSelect-select.MuiInputBase-input": {
            display: "flex",
            alignItems: "center",
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      SelectProps={{
        IconComponent: ExpandMoreRoundedIcon,
        displayEmpty: true,
        open: menuOpen,
        onOpen: () => setMenuOpen(true),
        onClose: () => {
          setMenuOpen(false);
          setSearch("");
          setHighlightIndex(0);
        },
        MenuProps: {
          autoFocus: false,
          disableAutoFocusItem: true,
          PaperProps: { sx: { maxHeight: 360 } },
        },
        renderValue: (selected) => {
          if (!selected) {
            return <span style={{ opacity: 0.6 }}>{placeholder}</span>;
          }
          return <CountryCodeSelectedValue value={String(selected)} />;
        },
      }}
      {...props}
    >
      <ListSubheader
        disableSticky
        sx={{ px: 1, py: 0.75, lineHeight: 1, bgcolor: "#fff" }}
      >
        <AppSearchField
          autoFocus
          fullWidth
          placeholder="Search country or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          onKeyDown={handleSearchKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      </ListSubheader>
      <MenuItem
        value=""
        sx={{
          minHeight: 40,
          py: 1,
          alignItems: "center",
          display: "flex",
        }}
      >
        <em>{placeholder}</em>
      </MenuItem>
      {visibleCountries.length === 0 ? (
        <ListSubheader
          disableSticky
          sx={{
            px: 2,
            py: 1.25,
            lineHeight: 1.4,
            bgcolor: "#fff",
            color: "text.secondary",
            fontSize: 13,
            fontWeight: 400,
            fontStyle: "normal",
          }}
        >
          No countries found
        </ListSubheader>
      ) : (
        visibleCountries.map((entry, index) => (
          <MenuItem
            key={countryDialOptionValue(entry)}
            value={countryDialOptionValue(entry)}
            selected={index === highlightIndex}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onMouseEnter={() => setHighlightIndex(index)}
            sx={{
              minHeight: 40,
              py: 1,
              alignItems: "center",
              display: "flex",
            }}
          >
            <CountryCodeMenuItem
              iso={entry.iso}
              dialCode={entry.dialCode}
              name={entry.name}
            />
          </MenuItem>
        ))
      )}
    </AppTextField>
  );
}
