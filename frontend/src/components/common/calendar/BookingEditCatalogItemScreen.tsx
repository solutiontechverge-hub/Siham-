"use client";

import * as React from "react";
import { Box, InputAdornment, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import type { BookingUniqueItemDraft } from "../../../data/bookingUniqueItem.data";
import { sanitizeDecimalInput } from "../../../lib/field-input";

type BookingEditCatalogItemScreenProps = {
  draft: BookingUniqueItemDraft;
  errors?: Partial<Record<"productName" | "price", string>>;
  onChange: (patch: Partial<BookingUniqueItemDraft>) => void;
  disabled?: boolean;
  heading?: string;
  namePlaceholder?: string;
};

const priceTypeOptions = [
  { label: "Fixed price", value: "fixed" },
  { label: "Starting from", value: "starting_from" },
];

const discountTypeOptions = [
  { label: "Fixed discount", value: "fixed" },
  { label: "Percentage discount", value: "percentage" },
];

/** Edit Product / Item screen — inline price & discount fields (same as Add Product drawer). */
export default function BookingEditCatalogItemScreen({
  draft,
  errors = {},
  onChange,
  disabled = false,
  heading = "Edit Product",
  namePlaceholder = "Product Name",
}: BookingEditCatalogItemScreenProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [priceType, setPriceType] = React.useState<"fixed" | "starting_from">(
    "fixed",
  );

  return (
    <Stack spacing={1.6}>
      <BodyText
        sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}
      >
        {heading}
      </BodyText>

      <AppTextField
        label={namePlaceholder}
        placeholder={`Enter ${namePlaceholder.toLowerCase()}`}
        value={draft.productName}
        onChange={(e) => onChange({ productName: e.target.value })}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.productName)}
        helperText={errors.productName}
      />

      <Stack direction="row" spacing={1} alignItems="flex-start">
        <AppSelect
          label="Price type"
          value={priceType}
          onChange={(e) =>
            setPriceType(String(e.target.value) as "fixed" | "starting_from")
          }
          options={priceTypeOptions}
          fullWidth
          disabled={disabled}
          sx={{ flex: 1 }}
        />
        <AppTextField
          label="Price"
          placeholder="0"
          value={draft.price}
          onChange={(e) => onChange({ price: sanitizeDecimalInput(e.target.value) })}
          fullWidth
          disabled={disabled}
          error={Boolean(errors.price)}
          helperText={errors.price}
          inputProps={{ inputMode: "decimal" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">€</InputAdornment>
            ),
            endAdornment: <InputAdornment position="end">EUR</InputAdornment>,
          }}
          sx={{ flex: 1 }}
        />
      </Stack>

      <Box
        sx={{
          borderRadius: "12px",
          bgcolor: alpha(m.navy, 0.025),
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          p: 1.5,
        }}
      >
        <BodyText
          sx={{
            fontSize: 12.5,
            fontWeight: 900,
            color: alpha(m.navy, 0.76),
            mb: 1.25,
          }}
        >
          Discount (Optional)
        </BodyText>
        <Stack direction="row" spacing={1}>
          <AppSelect
            label="Discount type"
            value={draft.discountType}
            onChange={(e) =>
              onChange({
                discountType: String(
                  e.target.value,
                ) as BookingUniqueItemDraft["discountType"],
              })
            }
            options={discountTypeOptions}
            fullWidth
            disabled={disabled}
            sx={{ flex: 1 }}
          />
          <AppTextField
            label="Discount Amount"
            placeholder="0"
            value={draft.discountAmount === "0" ? "" : draft.discountAmount}
            onChange={(e) =>
              onChange({ discountAmount: sanitizeDecimalInput(e.target.value) })
            }
            fullWidth
            disabled={disabled}
            inputProps={{ inputMode: "decimal" }}
            InputProps={
              draft.discountType === "percentage"
                ? {
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }
                : {
                    startAdornment: (
                      <InputAdornment position="start">€</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">EUR</InputAdornment>
                    ),
                  }
            }
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
