"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppCountryCodeSelect from "./AppCountryCodeSelect";
import AppTextField from "./AppTextField";
import { BodyText } from "../ui/typography";
import {
  getPhoneValidationErrors,
  sanitizePhoneInput,
} from "../../lib/phone-validation";

export type AppCountryPhoneFieldsProps = {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (dialCode: string) => void;
  onPhoneChange: (phone: string) => void;
  label?: string;
  phonePlaceholder?: string;
  countryCodeError?: string;
  phoneError?: string;
  onClearErrors?: () => void;
  required?: boolean;
  disabled?: boolean;
  validateOnBlur?: boolean;
  countryCodeWidth?: number;
};

export default function AppCountryPhoneFields({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  label = "Contact Number",
  phonePlaceholder = "Phone number",
  countryCodeError,
  phoneError,
  onClearErrors,
  required = true,
  disabled = false,
  validateOnBlur = true,
  countryCodeWidth = 150,
}: AppCountryPhoneFieldsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [localErrors, setLocalErrors] = React.useState<{
    countryCode?: string;
    phone?: string;
  }>({});

  const runValidation = React.useCallback(() => {
    const next = getPhoneValidationErrors(countryCode, phone, { required });
    setLocalErrors(next);
    return next;
  }, [countryCode, phone, required]);

  React.useEffect(() => {
    if (!phone.trim() && !countryCode.trim()) {
      setLocalErrors({});
    }
  }, [countryCode, phone]);

  const displayCountryCodeError = countryCodeError || localErrors.countryCode;
  const displayPhoneError = phoneError || localErrors.phone;

  return (
    <Box>
      {label ? (
        <BodyText
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: alpha(m.navy, 0.65),
            mb: 0.75,
          }}
        >
          {label}
        </BodyText>
      ) : null}
      <Stack direction="row" spacing={1.25}>
        <Box sx={{ width: countryCodeWidth, flexShrink: 0 }}>
          <AppCountryCodeSelect
            value={countryCode}
            onChange={(dialCode) => {
              onCountryCodeChange(dialCode);
              onClearErrors?.();
              setLocalErrors((prev) => ({ ...prev, countryCode: undefined }));
              if (phone.trim()) {
                const next = getPhoneValidationErrors(dialCode, phone, {
                  required,
                });
                setLocalErrors((prev) => ({ ...prev, phone: next.phone }));
              }
            }}
            disabled={disabled}
            error={Boolean(displayCountryCodeError)}
            helperText={displayCountryCodeError}
            onBlur={() => {
              if (!validateOnBlur) return;
              runValidation();
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: disabled ? alpha(m.navy, 0.04) : "#fff",
              },
            }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppTextField
            value={phone}
            onChange={(e) => {
              onPhoneChange(sanitizePhoneInput(e.target.value));
              onClearErrors?.();
              setLocalErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            onBlur={() => {
              if (!validateOnBlur) return;
              runValidation();
            }}
            placeholder={phonePlaceholder}
            fullWidth
            disabled={disabled}
            error={Boolean(displayPhoneError)}
            helperText={displayPhoneError}
            inputProps={{ inputMode: "tel", autoComplete: "tel-national" }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: disabled ? alpha(m.navy, 0.04) : "#fff",
              },
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
