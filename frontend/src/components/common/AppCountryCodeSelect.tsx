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
      sx={{ width: "100%", minWidth: 0 }}
    >
      <Box
        component="span"
        sx={{
          fontSize: 18,
          lineHeight: 1,
          width: 22,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {countryFlagEmoji(iso)}
      </Box>
      <Typography
        component="span"
        sx={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}
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
    <Stack direction="row" spacing={0.75} alignItems="center" component="span">
      <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>
        {countryFlagEmoji(entry.iso)}
      </Box>
      <Box component="span">{entry.dialCode}</Box>
    </Stack>
  );
}

export default function AppCountryCodeSelect({
  value,
  onChange,
  placeholder = "Country Code",
  ...props
}: AppCountryCodeSelectProps) {
  const selectValue = resolveCountrySelectValue(value);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const query = search.trim();
  const visibleCountries = COUNTRY_DIAL_CODES.filter((entry) =>
    matchesCountrySearch(entry, query),
  );

  return (
    <AppTextField
      select
      value={selectValue}
      onChange={(event) =>
        onChange(dialCodeFromSelectValue(String(event.target.value)))
      }
      SelectProps={{
        IconComponent: ExpandMoreRoundedIcon,
        displayEmpty: true,
        open: menuOpen,
        onOpen: () => setMenuOpen(true),
        onClose: () => {
          setMenuOpen(false);
          setSearch("");
        },
        MenuProps: {
          autoFocus: false,
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
          onKeyDown={(e) => {
            if (e.key !== "Escape") e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </ListSubheader>
      <MenuItem value="">
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
        visibleCountries.map((entry) => (
          <MenuItem
            key={countryDialOptionValue(entry)}
            value={countryDialOptionValue(entry)}
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
