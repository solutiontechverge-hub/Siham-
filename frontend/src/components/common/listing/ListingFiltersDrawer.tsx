"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import { FinanceDrawerFiltersFooter } from "../FinanceDrawerFooter";
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

  const footer = (
    <FinanceDrawerFiltersFooter
      onCancel={() => {
        setDraft(filters);
        onCancel();
      }}
      onReset={() => setDraft(defaultListingDrawerFilters())}
      onApply={() => {
        onChange(draft);
        onApply(draft);
      }}
      stackSx={{ py: 2 }}
      buttonSx={{
        height: 44,
        borderRadius: "10px",
        textTransform: "none",
        fontWeight: 700,
        borderColor: alpha(m.navy, 0.18),
      }}
    />
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
