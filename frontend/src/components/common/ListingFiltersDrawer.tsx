"use client";

import AppButton from "./AppButton";
import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "./AppDrawer";
import MessagingFilterCheckboxList from "./messaging/MessagingFilterCheckboxList";
import {
  defaultListingDrawerFilters,
  listingDrawerFilterSections,
  type ListingDrawerFilters,
  type ListingPriceTier,
  type ListingSearchFor,
} from "./listingDrawerFilters";

export type { ListingDrawerFilters };

type Props = {
  open: boolean;
  onClose: () => void;
  filters: ListingDrawerFilters;
  onChange: (next: ListingDrawerFilters) => void;
  onApply: (next: ListingDrawerFilters) => void;
  onCancel: () => void;
};

export default function ListingFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onCancel,
}: Props) {
  const m = useTheme().palette.mollure;
  const [draft, setDraft] = React.useState<ListingDrawerFilters>(filters);

  React.useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const searchChecked = listingDrawerFilterSections.searchFor.reduce(
    (acc, opt) => {
      acc[opt.key] = draft.searchFor === opt.key;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  const outlinedActionSx = {
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "10px",
    height: 44,
    borderColor: alpha(m.navy, 0.18),
    color: alpha(m.navy, 0.75),
    bgcolor: "#fff",
  } as const;

  const resetToDefaults = () => {
    setDraft(defaultListingDrawerFilters());
  };

  const footer = (
    <Box sx={{ px: 2.5, py: 2 }}>
      <Stack direction="row" spacing={1.25}>
        <AppButton
          fullWidth
          variant="outlined"
          onClick={() => {
            setDraft(filters);
            onCancel();
          }}
          sx={outlinedActionSx}
        >
          Cancel
        </AppButton>
        <AppButton
          fullWidth
          variant="outlined"
          onClick={resetToDefaults}
          sx={outlinedActionSx}
        >
          Reset
        </AppButton>
        <AppButton
          tone="primary"
          fullWidth
          onClick={() => {
            onChange(draft);
            onApply(draft);
          }}
          sx={{
            height: 44,
          }}
        >
          Apply
        </AppButton>
      </Stack>
    </Box>
  );

  return (
    <AppDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Filter listings"
      contentSx={{ px: 2.5, py: 1 }}
      footer={footer}
    >
      <MessagingFilterCheckboxList
        title="Search for"
        options={listingDrawerFilterSections.searchFor}
        checked={searchChecked}
        onToggle={(key, value) => {
          if (!value) {
            setDraft((prev) => ({ ...prev, searchFor: null }));
            return;
          }
          setDraft((prev) => ({ ...prev, searchFor: key as ListingSearchFor }));
        }}
      />

      <Box sx={{ mt: 2.5 }}>
        <MessagingFilterCheckboxList
          title="Price category"
          options={listingDrawerFilterSections.priceTiers}
          checked={draft.priceTiers}
          onToggle={(key, value) =>
            setDraft((prev) => ({
              ...prev,
              priceTiers: {
                ...prev.priceTiers,
                [key as ListingPriceTier]: value,
              },
            }))
          }
        />
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <MessagingFilterCheckboxList
          title="Other"
          options={listingDrawerFilterSections.other}
          checked={{
            discount: draft.discount,
            allSelectedCategories: draft.allSelectedCategories,
            noPrepayment: draft.noPrepayment,
            noMinTimeslotDl: draft.noMinTimeslotDl,
            bookSameTimeFl: draft.bookSameTimeFl,
          }}
          onToggle={(key, value) =>
            setDraft((prev) => ({
              ...prev,
              [key]: value,
            }))
          }
        />
      </Box>
    </AppDrawer>
  );
}
