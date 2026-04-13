"use client";

import * as React from "react";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Box,
  Button,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  PaginationItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { AppCard, AppPagination } from "../../../components/common";
import { favouritesPageData } from "./data-favourites";
import { useClientFavouritesPage } from "./use-favourites";
import { DesiredLocationIcon, FixedLocationIcon, Logo } from "../../../../images";

export default function ClientFavouritesPage() {
  const { tokens, items, favorites, toggleFavorite, page, setPage, totalPages, totalCount, rangeLabel } =
    useClientFavouritesPage();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: favouritesPageData.header ? "#E6F7F8" : "#E6F7F8" }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          bgcolor: "#fff",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box component={Link} href="/client" sx={{ display: "inline-flex" }}>
              <Image src={Logo} alt="Mollure" width={150} height={36} priority />
            </Box>

            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button
                startIcon={<LanguageRoundedIcon sx={{ fontSize: 16 }} />}
                endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  minWidth: 0,
                  px: 1.25,
                  py: 0.6,
                  borderRadius: 999,
                  color: tokens.navy,
                  border: `1px solid ${tokens.border}`,
                  textTransform: "none",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {favouritesPageData.header.localeLabel}
              </Button>
              <Button
                variant="contained"
                disableElevation
                sx={{
                  px: 2.25,
                  py: 0.85,
                  borderRadius: 999,
                  textTransform: "none",
                  color: "#fff",
                  bgcolor: tokens.teal,
                  "&:hover": { bgcolor: tokens.tealDark },
                }}
              >
                {favouritesPageData.header.loginLabel}
              </Button>
              <Typography sx={{ fontSize: 13, color: tokens.headerHint }}>
                {favouritesPageData.header.professionalLinkLabel}
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Tabs */}
      <Box sx={{ bgcolor: "#fff", borderBottom: `1px solid ${tokens.border}` }}>
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" spacing={{ xs: 4, sm: 8 }}>
            {favouritesPageData.tabs.map((tab) => {
              const active = tab.id === "favourites";
              return (
                <Box
                  key={tab.id}
                  component={Link}
                  href={tab.href}
                  sx={{
                    py: 1.75,
                    textDecoration: "none",
                    color: active ? "#000" : tokens.slate,
                    fontWeight: active ? 700 : 600,
                    fontSize: 15,
                    borderBottom: active ? `3px solid ${tokens.teal}` : "3px solid transparent",
                    mb: "-1px",
                  }}
                >
                  {tab.label}
                </Box>
              );
            })}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {totalCount === 0 ? (
          <AppCard sx={{ p: 4, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 900, color: tokens.navy, fontSize: 20 }}>
              {favouritesPageData.emptyState.title}
            </Typography>
            <Typography sx={{ mt: 1, color: tokens.slate }}>
              {favouritesPageData.emptyState.subtitle}
            </Typography>
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
                  <AppCard
                    sx={{
                      overflow: "hidden",
                      borderRadius: 2.5,
                      backgroundColor: "#fff",
                      border: `1px solid ${tokens.cardBorder}`,
                      boxShadow: "0 10px 22px rgba(16, 24, 40, 0.08)",
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <Box sx={{ position: "relative", height: 170 }}>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </Box>

                      <IconButton
                        onClick={() => toggleFavorite(item.id)}
                        sx={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 34,
                          height: 34,
                          bgcolor: "rgba(255,255,255,0.9)",
                          border: `1px solid ${tokens.border}`,
                          boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
                          "&:hover": { bgcolor: "#fff" },
                        }}
                        aria-label="Toggle favorite"
                      >
                        {Boolean(favorites[item.id]) ? (
                          <FavoriteRoundedIcon sx={{ color: tokens.teal, fontSize: 18 }} />
                        ) : (
                          <FavoriteBorderRoundedIcon
                            sx={{ color: alpha(tokens.navy, 0.55), fontSize: 18 }}
                          />
                        )}
                      </IconButton>
                    </Box>

                    <CardContent sx={{ p: 2.25 }}>
                      <Stack spacing={1.25}>
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: tokens.navy,
                              fontSize: 13,
                              lineHeight: 1.25,
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Typography sx={{ fontWeight: 800, color: tokens.navy, fontSize: 12, opacity: 0.9 }}>
                            {item.subtitle}
                          </Typography>
                        </Box>

                        <Stack direction="row" alignItems="center" spacing={1} sx={{ color: tokens.slate }}>
                          <Typography sx={{ fontSize: 12 }}>{item.municipalityLabel}</Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto" }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarRoundedIcon key={i} sx={{ fontSize: 14, color: tokens.star }} />
                            ))}
                            <Typography sx={{ fontSize: 11, color: tokens.slate, ml: 0.5 }}>
                              {item.reviewsCount} Reviews
                            </Typography>
                          </Box>
                        </Stack>

                        <Box
                          sx={{
                            display: "flex",
                            border: `1px solid ${tokens.border}`,
                            borderRadius: 999,
                            overflow: "hidden",
                            bgcolor: "#fff",
                          }}
                        >
                          <Button
                            sx={{
                              flex: 1,
                              py: 0.6,
                              textTransform: "none",
                              fontWeight: 900,
                              fontSize: 12,
                              borderRadius: 0,
                              color: item.locationModeDefault === "fixed" ? "#fff" : tokens.teal,
                              bgcolor: item.locationModeDefault === "fixed" ? tokens.teal : "transparent",
                              "&:hover": { bgcolor: item.locationModeDefault === "fixed" ? tokens.tealDark : "rgba(33, 184, 191, 0.08)" },
                            }}
                            startIcon={
                              <Image
                                src={FixedLocationIcon}
                                alt="Fixed location"
                                width={14}
                                height={14}
                                style={{ filter: item.locationModeDefault === "fixed" ? "brightness(0) invert(1)" : "none" }}
                              />
                            }
                          >
                            Fixed Location
                          </Button>
                          <Divider orientation="vertical" flexItem sx={{ borderColor: tokens.border }} />
                          <Button
                            sx={{
                              flex: 1,
                              py: 0.6,
                              textTransform: "none",
                              fontWeight: 900,
                              fontSize: 12,
                              borderRadius: 0,
                              color: item.locationModeDefault === "desired" ? "#fff" : tokens.teal,
                              bgcolor: item.locationModeDefault === "desired" ? tokens.teal : "transparent",
                              "&:hover": { bgcolor: item.locationModeDefault === "desired" ? tokens.tealDark : "rgba(33, 184, 191, 0.08)" },
                            }}
                            startIcon={
                              <Image
                                src={DesiredLocationIcon}
                                alt="Desired location"
                                width={14}
                                height={14}
                                style={{ filter: item.locationModeDefault === "desired" ? "brightness(0) invert(1)" : "none" }}
                              />
                            }
                          >
                            Desired Location
                          </Button>
                        </Box>

                        <Box sx={{ pt: 0.5 }}>
                          <Stack spacing={0.85}>
                            {item.services.map((svc, idx) => (
                              <Stack
                                key={`${svc.name}-${idx}`}
                                direction="row"
                                alignItems="baseline"
                                justifyContent="space-between"
                                spacing={1}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 12, fontWeight: 900, color: tokens.navy }}>
                                    {svc.name}
                                  </Typography>
                                  {svc.durationLabel ? (
                                    <Typography sx={{ fontSize: 11, color: tokens.slate }}>
                                      {svc.durationLabel}
                                    </Typography>
                                  ) : null}
                                </Box>
                                <Typography sx={{ fontSize: 11, color: tokens.slate, whiteSpace: "nowrap" }}>
                                  {svc.priceLabel}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </AppCard>
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
