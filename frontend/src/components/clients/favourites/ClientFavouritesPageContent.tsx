"use client";

import * as React from "react";
import { Box, Button, Container, Grid, PaginationItem, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { AppCard, AppPagination } from "../../common";
import { favouritesPageData } from "../../../app/clients/favourites/data-favourites";
import { useClientFavouritesPage } from "../../../app/clients/favourites/use-favourites";
import { ClientFavouritesHeader } from "./ClientFavouritesHeader";
import { ClientFavouritesTabs } from "./ClientFavouritesTabs";
import { FavouritesCard } from "./FavouritesCard";

export default function ClientFavouritesPageContent() {
  const { tokens, items, favorites, toggleFavorite, page, setPage, totalPages, totalCount, rangeLabel } =
    useClientFavouritesPage();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: favouritesPageData.header ? "#E6F7F8" : "#E6F7F8" }}>
      <ClientFavouritesHeader
        data={favouritesPageData.header}
        borderColor={tokens.border}
        navy={tokens.navy}
        teal={tokens.teal}
        tealDark={tokens.tealDark}
        headerHint={tokens.headerHint}
      />

      <ClientFavouritesTabs
        tabs={favouritesPageData.tabs}
        activeId="favourites"
        borderColor={tokens.border}
        teal={tokens.teal}
        slate={tokens.slate}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {totalCount === 0 ? (
          <AppCard sx={{ p: 4, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 900, color: tokens.navy, fontSize: 20 }}>
              {favouritesPageData.emptyState.title}
            </Typography>
            <Typography sx={{ mt: 1, color: tokens.slate }}>{favouritesPageData.emptyState.subtitle}</Typography>
            <Button
              component={Link}
              href={favouritesPageData.emptyState.ctaHref}
              variant="contained"
              sx={{
                mt: 3,
                bgcolor: tokens.teal,
                "&:hover": { bgcolor: tokens.tealDark },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
              }}
            >
              {favouritesPageData.emptyState.ctaLabel}
            </Button>
          </AppCard>
        ) : (
          <>
            <Grid container spacing={2.5}>
              {items.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <FavouritesCard
                    item={item}
                    isFavorite={Boolean(favorites[item.id])}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    borderColor={tokens.border}
                    cardBorder={tokens.cardBorder}
                    navy={tokens.navy}
                    teal={tokens.teal}
                    tealDark={tokens.tealDark}
                    slate={tokens.slate}
                    star={tokens.star}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <AppPagination
                count={totalPages}
                page={page}
                onChange={(_e, next) => setPage(next)}
                summary={`${rangeLabel} of ${totalCount}`}
                renderItem={(item) => (
                  <PaginationItem
                    {...item}
                    sx={{
                      "&.Mui-selected": { bgcolor: tokens.teal, color: "#fff" },
                      "&:hover": { bgcolor: "rgba(33, 184, 191, 0.10)" },
                    }}
                  />
                )}
              />
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}

