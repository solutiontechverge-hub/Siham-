"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { Box, IconButton, InputAdornment, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import type { BookingUniqueItemDraft } from "../../../data/bookingUniqueItem.data";

type BookingAddUniqueItemScreenProps = {
  draft: BookingUniqueItemDraft;
  errors?: Partial<Record<"productName" | "price", string>>;
  onChange: (patch: Partial<BookingUniqueItemDraft>) => void;
  disabled?: boolean;
};

export default function BookingAddUniqueItemScreen({
  draft,
  errors = {},
  onChange,
  disabled = false,
}: BookingAddUniqueItemScreenProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Stack spacing={1.6}>
      <BodyText
        sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}
      >
        Add Unique Item
      </BodyText>

      <AppTextField
        placeholder="Product Name"
        value={draft.productName}
        onChange={(e) => onChange({ productName: e.target.value })}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.productName)}
        helperText={errors.productName}
      />

      <AppTextField
        placeholder="VAT"
        value={draft.vat}
        onChange={(e) => onChange({ vat: e.target.value })}
        fullWidth
        disabled={disabled}
      />

      <AppTextField
        placeholder="Price"
        value={draft.price}
        onChange={(e) => onChange({ price: e.target.value })}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.price)}
        helperText={errors.price}
      />

      <AppTextField
        placeholder="Unit"
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
          Add Discount (Optional)
        </BodyText>

        <Stack spacing={1.25}>
          <AppSelect
            label="Discount type"
            value={draft.discountType}
            onChange={(e) =>
              onChange({
                discountType: e.target
                  .value as BookingUniqueItemDraft["discountType"],
              })
            }
            options={[
              { label: "Fixed discount", value: "fixed" },
              { label: "Percentage discount", value: "percentage" },
            ]}
            fullWidth
            disabled={disabled}
          />

          <AppTextField
            placeholder="Discount Amount"
            value={draft.discountAmount}
            onChange={(e) => onChange({ discountAmount: e.target.value })}
            fullWidth
            disabled={disabled}
            InputProps={
              draft.discountType === "fixed"
                ? {
                    startAdornment: (
                      <InputAdornment position="start">€</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">EUR</InputAdornment>
                    ),
                    inputMode: "decimal",
                  }
                : {
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                    inputMode: "decimal",
                  }
            }
          />
        </Stack>
      </Box>
    </Stack>
  );
}
