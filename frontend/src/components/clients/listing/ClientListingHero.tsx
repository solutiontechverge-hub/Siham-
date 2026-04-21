"use client";

import * as React from "react";
import { Box, Container } from "@mui/material";
import { ListingFilterBox } from "../../common";
import type { ListingFilterValues, ListingFilterOption } from "../../common";
import { ListingBG } from "../../../../images";
import { toSrc } from "./listing.utils";

export function ClientListingHero({
  values,
  onChange,
  onApply,
  categoryOptions,
  municipalityOptions,
}: {
  values: ListingFilterValues;
  onChange: (next: ListingFilterValues) => void;
  onApply: () => void;
  categoryOptions: ListingFilterOption[];
  municipalityOptions: ListingFilterOption[];
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        pb: { xs: 4, md: 5 },
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.30)), url("${toSrc(
          ListingBG,
        )}")`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, background: "transparent" }} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.35))`,
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", pt: { xs: 5, md: 7 } }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: "100%", maxWidth: 820 }}>
            <ListingFilterBox
              values={values}
              onChange={onChange}
              categoryOptions={categoryOptions}
              municipalityOptions={municipalityOptions}
              onApply={onApply}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

