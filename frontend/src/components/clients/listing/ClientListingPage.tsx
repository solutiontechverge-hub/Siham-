"use client";

import * as React from "react";
import { Box, Container, Grid } from "@mui/material";
import { AppPagination } from "../../common";
import { listingPageData } from "../../../app/clients/listing/listing.data";
import { useClientListingState } from "../../../app/clients/listing/listing.use";
import { ClientListingHeader } from "./ClientListingHeader";
import { ClientListingHero } from "./ClientListingHero";
import { ClientListingToolbar } from "./ClientListingToolbar";
import { ListingCard } from "./ListingCard";

export default function ClientListingPage() {
  const { header, filters, toolbar, cards } = listingPageData;
  const state = useClientListingState(cards);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <ClientListingHeader data={header} />

      <ClientListingHero
        values={state.filters}
        onChange={state.setFilters}
        onApply={state.applyFilters}
        categoryOptions={[...filters.categoryOptions]}
        municipalityOptions={[...filters.municipalityOptions]}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <ClientListingToolbar data={toolbar} sort={state.sort} onSortChange={state.setSort} />

        <Grid container spacing={2.5}>
          {state.items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <ListingCard
                item={item}
                isFavorite={Boolean(state.favorites[item.id])}
                onToggleFavorite={() => state.toggleFavorite(item.id)}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3.5 }}>
          <AppPagination
            count={state.totalPages}
            page={state.page}
            onChange={(_e, next) => state.setPage(next)}
            summary={`${state.totalCount} results`}
          />
        </Box>
      </Container>
    </Box>
  );
}

