"use client";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import type { BookingUniqueItemDraft } from "../../../data/bookingUniqueItem.data";
import { bookingScreenTitleSx } from "./calendar.utils";
import BookingCatalogItemFields from "./BookingCatalogItemFields";

type BookingEditCatalogItemScreenProps = {
  draft: BookingUniqueItemDraft;
  errors?: Partial<Record<"productName" | "price", string>>;
  onChange: (patch: Partial<BookingUniqueItemDraft>) => void;
  disabled?: boolean;
  heading?: string;
  namePlaceholder?: string;
};

/** Edit Product / Item screen — inline price & discount fields (same as Add Product drawer). */
export default function BookingEditCatalogItemScreen({
  draft,
  errors = {},
  onChange,
  disabled = false,
  heading = "Edit Product",
  namePlaceholder = "Product Name",
}: BookingEditCatalogItemScreenProps) {
  const m = useTheme().palette.mollure;

  return (
    <Stack spacing={1.6}>
      <BodyText sx={bookingScreenTitleSx(m.navy)}>{heading}</BodyText>

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
