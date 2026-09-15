"use client";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import type { BookingUniqueItemDraft } from "../../../data/bookingUniqueItem.data";
import { bookingScreenTitleSx } from "./calendar.utils";
import BookingCatalogItemFields from "./BookingCatalogItemFields";

type BookingAddUniqueItemScreenProps = {
  draft: BookingUniqueItemDraft;
  errors?: Partial<Record<"productName" | "price", string>>;
  onChange: (patch: Partial<BookingUniqueItemDraft>) => void;
  disabled?: boolean;
  /** Drawer/section heading — depends on Add Product / Service / Unique Item entry. */
  heading?: string;
  namePlaceholder?: string;
};

export default function BookingAddUniqueItemScreen({
  draft,
  errors = {},
  onChange,
  disabled = false,
  heading = "Add Unique Item",
  namePlaceholder,
}: BookingAddUniqueItemScreenProps) {
  const m = useTheme().palette.mollure;
  const nameLabel =
    namePlaceholder ??
    (heading.toLowerCase().includes("unique") ? "Unique Name" : "Product Name");

  return (
    <Stack spacing={1.6}>
      <BodyText sx={bookingScreenTitleSx(m.navy)}>{heading}</BodyText>

      <AppTextField
        label={nameLabel}
        placeholder={`Enter ${nameLabel.toLowerCase()}`}
        value={draft.productName}
        onChange={(e) => onChange({ productName: e.target.value })}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.productName)}
        helperText={errors.productName}
      />

      <BookingCatalogItemFields
        draft={draft}
        errors={errors}
        onChange={onChange}
        disabled={disabled}
        showUnit
      />
    </Stack>
  );
}
