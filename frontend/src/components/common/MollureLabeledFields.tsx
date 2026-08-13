"use client";

import * as React from "react";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  Select,
  Stack,
  Typography,
  type SelectProps,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function useMollureFieldSx() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return React.useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: "6px",
        bgcolor: m.white ?? "#fff",
        minHeight: 40,
        alignItems: "center",
        "& fieldset": {
          borderColor: m.inputBorder,
        },
        "&:hover fieldset": {
          borderColor: m.inputBorderHover,
        },
        "&.Mui-focused fieldset": {
          borderColor: m.teal,
        },
        "&.Mui-disabled": {
          bgcolor: alpha(m.navy, 0.04),
        },
      },
      // When sx is applied directly on Select (e.g. MollureLabeledSelect)
      "&.MuiOutlinedInput-root": {
        borderRadius: "6px",
        bgcolor: m.white ?? "#fff",
        minHeight: 40,
        alignItems: "center",
        "& fieldset": {
          borderColor: m.inputBorder,
        },
        "&:hover fieldset": {
          borderColor: m.inputBorderHover,
        },
        "&.Mui-focused fieldset": {
          borderColor: m.teal,
        },
        "&.Mui-disabled": {
          bgcolor: alpha(m.navy, 0.04),
        },
      },
      "& .MuiOutlinedInput-input": {
        fontSize: "0.8125rem",
        paddingTop: "10px",
        paddingBottom: "10px",
      },
      "& .MuiSelect-select.MuiOutlinedInput-input": {
        display: "flex",
        alignItems: "center",
        alignSelf: "stretch",
        boxSizing: "border-box",
        minHeight: 40,
        height: 40,
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: 1.25,
      },
      "& .MuiInputBase-inputSizeSmall.MuiSelect-select": {
        display: "flex",
        alignItems: "center",
        minHeight: 40,
        height: 40,
        paddingTop: 0,
        paddingBottom: 0,
      },
      "& .MuiSelect-icon": {
        top: "50%",
        transform: "translateY(-50%)",
      },
      "& .MuiSelect-iconOpen": {
        transform: "translateY(-50%) rotate(180deg)",
      },
      "& input::placeholder": {
        color: m.placeholder,
        opacity: 1,
      },
    }),
    [m.inputBorder, m.inputBorderHover, m.navy, m.placeholder, m.teal, m.white],
  );
}

function MollureTopLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: React.ReactNode;
  required?: boolean;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{
        fontSize: "0.75rem",
        fontWeight: 500,
        color: alpha(m.navy, 0.9),
        lineHeight: 1.25,
      }}
    >
      {label}
      {required ? (
        <Box component="span" sx={{ color: "error.main", fontWeight: 700 }}>
          {" "}
          *
        </Box>
      ) : null}
    </Typography>
  );
}

function MollureInCellShell({
  fieldId,
  fieldLabel,
  required,
  error,
  helperText,
  children,
}: {
  fieldId: string;
  fieldLabel: React.ReactNode;
  required?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box>
      <Typography
        component="label"
        htmlFor={fieldId}
        sx={{
          display: "block",
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: alpha(m.navy, 0.52),
          lineHeight: 1.25,
          mb: 0.5,
        }}
      >
        {fieldLabel}
        {required ? (
          <Box component="span" sx={{ color: "error.main", fontWeight: 700 }}>
            {" *"}
          </Box>
        ) : null}
      </Typography>
      {children}
      {helperText ? (
        <FormHelperText error={error} sx={{ mx: 0, mt: 0.5 }}>
          {helperText}
        </FormHelperText>
      ) : null}
    </Box>
  );
}

export type MollureTextFieldProps = TextFieldProps;

export function MollureTextField(props: MollureTextFieldProps) {
  const sxBase = useMollureFieldSx();
  return (
    <TextField
      fullWidth
      size="small"
      {...props}
      label={undefined as any}
      sx={[sxBase, props.sx] as any}
    />
  );
}

export type MollureLabeledFieldProps = MollureTextFieldProps & {
  fieldLabel: React.ReactNode;
  labelPlacement?: "above" | "inCell";
};

export function MollureLabeledField({
  fieldLabel,
  required,
  id,
  labelPlacement = "above",
  helperText,
  error,
  ...props
}: MollureLabeledFieldProps) {
  const autoId = React.useId();
  const fieldId = id ?? `mollure-field-${autoId}`;

  if (labelPlacement === "inCell") {
    return (
      <MollureInCellShell
        fieldId={fieldId}
        fieldLabel={fieldLabel}
        required={required}
        error={error}
        helperText={helperText}
      >
        <MollureTextField
          id={fieldId}
          required={required}
          error={error}
          helperText={undefined}
          {...props}
        />
      </MollureInCellShell>
    );
  }

  return (
    <Stack spacing={0.75}>
      <MollureTopLabel
        htmlFor={fieldId}
        label={fieldLabel}
        required={required}
      />
      <MollureTextField
        id={fieldId}
        required={required}
        error={error}
        helperText={helperText}
        {...props}
      />
    </Stack>
  );
}

export type MollurePasswordFieldProps = Omit<
  TextFieldProps,
  "type" | "InputProps"
> & {
  /** Defaults to "password". */
  typeWhenHidden?: "password" | "text";
};

export function MollurePasswordField({
  typeWhenHidden = "password",
  ...props
}: MollurePasswordFieldProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [show, setShow] = React.useState(false);

  return (
    <MollureTextField
      {...props}
      type={show ? "text" : typeWhenHidden}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              type="button"
              edge="end"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow((v) => !v)}
              size="small"
              sx={{ color: alpha(m.navy, 0.45) }}
            >
              {show ? (
                <VisibilityOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOffOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

export type MollureLabeledPasswordFieldProps = MollurePasswordFieldProps & {
  fieldLabel: React.ReactNode;
  labelPlacement?: "above" | "inCell";
};

export function MollureLabeledPasswordField({
  fieldLabel,
  required,
  id,
  labelPlacement = "above",
  helperText,
  error,
  ...props
}: MollureLabeledPasswordFieldProps) {
  const autoId = React.useId();
  const fieldId = id ?? `mollure-field-${autoId}`;

  if (labelPlacement === "inCell") {
    return (
      <MollureInCellShell
        fieldId={fieldId}
        fieldLabel={fieldLabel}
        required={required}
        error={error}
        helperText={helperText}
      >
        <MollurePasswordField
          id={fieldId}
          required={required}
          error={error}
          helperText={undefined}
          {...props}
        />
      </MollureInCellShell>
    );
  }

  return (
    <Stack spacing={0.75}>
      <MollureTopLabel
        htmlFor={fieldId}
        label={fieldLabel}
        required={required}
      />
      <MollurePasswordField
        id={fieldId}
        required={required}
        error={error}
        helperText={helperText}
        {...props}
      />
    </Stack>
  );
}

export type MollureLabeledSelectProps<T> = Omit<
  SelectProps<T>,
  "label" | "notched"
> & {
  fieldLabel: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  required?: boolean;
};

export function MollureLabeledSelect<T>(props: MollureLabeledSelectProps<T>) {
  const {
    fieldLabel,
    helperText,
    errorText,
    required,
    id,
    disabled,
    sx,
    ...selectProps
  } = props;

  const autoId = React.useId();
  const fieldId = id ?? `mollure-field-${autoId}`;
  const sxBase = useMollureFieldSx();
  const hasError = Boolean(errorText);

  return (
    <Stack spacing={0.75}>
      <MollureTopLabel
        htmlFor={fieldId}
        label={fieldLabel}
        required={required}
      />
      <FormControl fullWidth size="small" disabled={disabled} error={hasError}>
        <Select
          {...selectProps}
          id={fieldId}
          displayEmpty
          notched={false}
          sx={[sxBase, sx] as any}
        />
        {hasError ? (
          <FormHelperText>{errorText}</FormHelperText>
        ) : helperText ? (
          <FormHelperText>{helperText}</FormHelperText>
        ) : null}
      </FormControl>
    </Stack>
  );
}
