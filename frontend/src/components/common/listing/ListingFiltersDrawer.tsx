"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import MessagingFilterCheckboxList from "../messaging/MessagingFilterCheckboxList";
import {
  defaultListingDrawerFilters,
  listingDrawerFilterSections,
  toggleListingSearchFor,
  type ListingDrawerFilters,
  type ListingPriceTier,
  type ListingSearchForKey,
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

  const outlinedActionSx = {
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "10px",
    height: 44,
    borderColor: alpha(m.navy, 0.18),
    color: alpha(m.navy, 0.75),
    bgcolor: "#fff",
  } as const;

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
          onClick={() => setDraft(defaultListingDrawerFilters())}
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
      title="Filters"
      contentSx={{ px: 2.5, py: 1 }}
      footer={footer}
    >
      <MessagingFilterCheckboxList
        title="Search for"
        options={listingDrawerFilterSections.searchFor}
        checked={draft.searchFor}
        onToggle={(key, value) =>
          setDraft((prev) => ({
            ...prev,
            searchFor: toggleListingSearchFor(
              prev.searchFor,
              key as ListingSearchForKey,
              value,
            ),
          }))
        }
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
            noKmAllowanceDl: draft.noKmAllowanceDl,
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
