"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { Box, IconButton, InputAdornment, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import {
  BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS,
  BOOKING_CATALOG_PRICE_TYPE_OPTIONS,
  DEFAULT_UNIQUE_ITEM_VAT,
  type BookingUniqueItemDraft,
} from "../../../data/bookingUniqueItem.data";
import { sanitizeDecimalInput } from "../../../lib/field-input";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";

type BookingCatalogItemFieldsProps = {
  draft: BookingUniqueItemDraft;
  errors?: Partial<Record<"price", string>>;
  onChange: (patch: Partial<BookingUniqueItemDraft>) => void;
  disabled?: boolean;
  /** Add Unique Item / Product includes a unit stepper; Edit Product does not. */
  showUnit?: boolean;
};

/** Shared VAT + price + optional unit + discount block for catalog item screens. */
export default function BookingCatalogItemFields({
  draft,
  errors = {},
  onChange,
  disabled = false,
  showUnit = false,
}: BookingCatalogItemFieldsProps) {
  const m = useTheme().palette.mollure;
  const [priceType, setPriceType] = React.useState<"fixed" | "starting_from">(
    "fixed",
  );

  React.useEffect(() => {
    if (disabled || draft.vat.trim()) return;
    onChange({ vat: DEFAULT_UNIQUE_ITEM_VAT });
    // Parent passes an inline onChange; only fill when VAT is still empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill once per empty VAT
  }, [disabled, draft.vat]);

  return (
    <>
      <AppTextField
        label="VAT"
        placeholder="21"
        value={draft.vat}
        onChange={(e) =>
          onChange({ vat: sanitizeDecimalInput(e.target.value) })
        }
        fullWidth
        disabled={disabled}
        inputProps={{ inputMode: "decimal" }}
      />

      <Stack direction="row" spacing={1} alignItems="flex-start">
        <AppSelect
          label="Price type"
          value={priceType}
          onChange={(e) =>
            setPriceType(String(e.target.value) as "fixed" | "starting_from")
          }
          options={BOOKING_CATALOG_PRICE_TYPE_OPTIONS}
          fullWidth
          disabled={disabled}
          sx={{ flex: 1 }}
        />
        <AppTextField
          label="Price"
          placeholder="0"
          value={draft.price}
          onChange={(e) =>
            onChange({ price: sanitizeDecimalInput(e.target.value) })
          }
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

      {showUnit ? (
        <AppTextField
          label="Unit"
          placeholder="1"
          type="number"
          value={String(draft.unit)}
          onChange={(e) =>
            onChange({
              unit: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
            })
          }
          fullWidth
          disabled={disabled}
          inputProps={{ min: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    border: `1px solid ${alpha(m.navy, 0.12)}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <IconButton
                    size="small"
                    disabled={disabled || draft.unit <= 1}
                    onClick={() =>
                      onChange({ unit: Math.max(1, draft.unit - 1) })
                    }
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 0,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    onClick={() => onChange({ unit: draft.unit + 1 })}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 0,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    <AddRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </InputAdornment>
            ),
          }}
        />
      ) : null}

      <Box
        sx={{
          borderRadius: "12px",
          bgcolor: alpha(m.navy, 0.025),
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          p: 1.5,
        }}
      >
        <BodyText sx={mollureLabelSx(m.navy, { mb: 1.25 })}>
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
            options={BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS}
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
    </>
  );
}
