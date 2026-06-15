"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, MenuItem, Stack, Typography, type TextFieldProps } from "@mui/material";
import AppTextField from "./AppTextField";
import {
  COUNTRY_DIAL_CODES,
  countryDialOptionValue,
  countryFlagEmoji,
  dialCodeFromSelectValue,
  findCountryDialCode,
  resolveCountrySelectValue,
} from "../../data/countryDialCodes";

export type AppCountryCodeSelectProps = Omit<TextFieldProps, "select" | "onChange" | "value"> & {
  value: string;
  onChange: (dialCode: string) => void;
  placeholder?: string;
};

function CountryCodeMenuItem({ iso, dialCode, name }: { iso: string; dialCode: string; name: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
      <Box component="span" sx={{ fontSize: 18, lineHeight: 1, width: 22, textAlign: "center", flexShrink: 0 }}>
        {countryFlagEmoji(iso)}
      </Box>
      <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
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

  return (
    <AppTextField
      select
      value={selectValue}
      onChange={(event) => onChange(dialCodeFromSelectValue(String(event.target.value)))}
      SelectProps={{
        IconComponent: ExpandMoreRoundedIcon,
        displayEmpty: true,
        MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
        renderValue: (selected) => {
          if (!selected) {
            return <span style={{ opacity: 0.6 }}>{placeholder}</span>;
          }
          return <CountryCodeSelectedValue value={String(selected)} />;
        },
      }}
      {...props}
    >
      <MenuItem value="">
        <em>{placeholder}</em>
      </MenuItem>
      {COUNTRY_DIAL_CODES.map((entry) => (
        <MenuItem key={countryDialOptionValue(entry)} value={countryDialOptionValue(entry)}>
          <CountryCodeMenuItem iso={entry.iso} dialCode={entry.dialCode} name={entry.name} />
        </MenuItem>
      ))}
    </AppTextField>
  );
}
