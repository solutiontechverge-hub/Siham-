"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { useRouter } from "next/navigation";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import type { ListingCardData } from "../../../app/clients/listing/listing.data";
import { resolveBusinessOfferingFlags } from "../../../data/businessPublicProfile.data";
import { clientReviewsHref } from "../../../data/clientProfessionalReviews";
import AppCard from "../AppCard";

function toImageSrc(img: ListingCardData["image"]) {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object") {
    if (typeof img.src === "string") return img.src;
    if (typeof img.default === "string") return img.default;
    if (typeof img.default === "object") return toImageSrc(img.default);
  }
  return String(img);
}

function ListingCardImage({
  image,
  alt,
}: {
  image: ListingCardData["image"];
  alt: string;
}) {
  const src = toImageSrc(image);
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  if (isRemote) {
    return (
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <Image
      src={image}
      alt={alt}
      fill
      priority={false}
      style={{ objectFit: "cover" }}
    />
  );
}

export type ClientListingCardProps = {
  item: ListingCardData;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** When set, only matching location tabs are shown on the card */
  visibleLocationModes?: Array<"fixed" | "desired">;
};

export default function ClientListingCard({
  item,
  isFavorite,
  onToggleFavorite,
  visibleLocationModes,
}: ClientListingCardProps) {
  const tokens = useTheme().palette.mollure;
  const router = useRouter();
  const offering = resolveBusinessOfferingFlags(item.businessOffering);
  const initialMode = !offering.supportsFixedLocation
    ? "desired"
    : !offering.supportsDesiredLocation
      ? "fixed"
      : item.locationModeDefault;
  const [mode, setMode] = React.useState<"fixed" | "desired">(initialMode);
  const filterAllowsAll = !visibleLocationModes?.length;
  const canPickFixed =
    offering.supportsFixedLocation &&
    (filterAllowsAll || visibleLocationModes.includes("fixed"));
  const canPickDesired =
    offering.supportsDesiredLocation &&
    (filterAllowsAll || visibleLocationModes.includes("desired"));

  React.useEffect(() => {
    if (canPickFixed && !canPickDesired && mode !== "fixed") setMode("fixed");
    if (canPickDesired && !canPickFixed && mode !== "desired")
      setMode("desired");
  }, [canPickFixed, canPickDesired, mode]);
  const slides = React.useMemo(() => {
    const list = item.media.length > 0 ? item.media : [item.image];
    return list.slice(0, 4);
  }, [item.image, item.media]);

  const [activeSlide, setActiveSlide] = React.useState(0);

  React.useEffect(() => {
    setActiveSlide(0);
  }, [item.id, slides.length]);

  const safeSlideIndex = Math.min(activeSlide, Math.max(0, slides.length - 1));
  const currentImage = slides[safeSlideIndex] ?? item.image;

  const onOpenProfile = () => {
    try {
      const payload = {
        shopId: item.id,
        shopName: `${item.title} ${item.subtitle}`.trim(),
        municipalityLabel: item.municipalityLabel,
        addressLabel: item.addressLabel,
        locationMode: mode,
      };
      window.sessionStorage.setItem(
        "mollure:selected_shop",
        JSON.stringify(payload),
      );
    } catch {
      // ignore
    }
    router.push(`/clients/listing/${item.id}`);
  };

  const serviceRows = React.useMemo(() => {
    const rows = item.services.slice(0, 2);
    while (rows.length < 2) {
      rows.push({ name: "\u00a0", priceLabel: "\u00a0" });
    }
    return rows;
  }, [item.services]);

  const keywordsLine = React.useMemo(
    () => item.businessKeywords.filter(Boolean).join(" | "),
    [item.businessKeywords],
  );

  return (
    <AppCard
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 2.5,
        backgroundColor: "#fff",
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "0 10px 22px rgba(16, 24, 40, 0.08)",
        cursor: "pointer",
        transition:
          "transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease, border-color 0.22s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          backgroundColor: tokens.pageBg,
          borderColor: alpha(tokens.teal, 0.35),
          boxShadow: `0 18px 36px ${alpha(tokens.teal, 0.18)}, 0 8px 16px rgba(16, 24, 40, 0.08)`,
        },
      }}
      onClick={onOpenProfile}
    >
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Box
          sx={{ position: "relative", height: { xs: 160, sm: 170, md: 180 } }}
        >
          <ListingCardImage image={currentImage} alt={item.title} />
        </Box>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
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
          {isFavorite ? (
            <FavoriteRoundedIcon sx={{ color: tokens.teal, fontSize: 18 }} />
          ) : (
            <FavoriteBorderRoundedIcon
              sx={{ color: alpha(tokens.navy, 0.55), fontSize: 18 }}
            />
          )}
        </IconButton>

        {slides.length > 1 ? (
          <>
            <IconButton
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide((i) => (i - 1 + slides.length) % slides.length);
              }}
              size="small"
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                width: 30,
                height: 30,
                bgcolor: "rgba(255,255,255,0.9)",
                border: `1px solid ${tokens.border}`,
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "#fff" },
              }}
            >
              <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide((i) => (i + 1) % slides.length);
              }}
              size="small"
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                width: 30,
                height: 30,
                bgcolor: "rgba(255,255,255,0.9)",
                border: `1px solid ${tokens.border}`,
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "#fff" },
              }}
            >
              <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 10,
                display: "flex",
                justifyContent: "center",
                gap: 0.75,
              }}
            >
              {slides.map((_, i) => (
                <Box
                  key={i}
                  component="button"
                  type="button"
                  aria-label={`Show image ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(i);
                  }}
                  sx={{
                    width: 8,
                    height: 8,
                    p: 0,
                    border:
                      i === safeSlideIndex
                        ? "1px solid rgba(0,0,0,0.12)"
                        : "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 999,
                    cursor: "pointer",
                    bgcolor:
                      i === safeSlideIndex ? "#fff" : "rgba(255,255,255,0.55)",
                  }}
                />
              ))}
            </Box>
          </>
        ) : null}
      </Box>

      <CardContent
        sx={{
          p: 1.75,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          "&:last-child": { pb: 1.75 },
        }}
      >
        <Stack spacing={0.85} sx={{ textAlign: "center", flex: 1, minHeight: 0 }}>
          <Typography
            sx={{
              color: alpha(tokens.navy, 0.5),
              fontSize: 12,
              lineHeight: 1.2,
              minHeight: "1.2em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {keywordsLine || "\u00a0"}
          </Typography>

          <Typography
            sx={{
              fontWeight: 700,
              color: alpha(tokens.navy, 0.78),
              fontSize: 16,
              lineHeight: 1.3,
              minHeight: "1.3em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.title}
          </Typography>

          <Typography
            sx={{
              fontSize: 12.5,
              color: alpha(tokens.navy, 0.55),
              lineHeight: 1.3,
              minHeight: "1.3em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.subtitle || "\u00a0"}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={0.5}
            sx={{ minHeight: 20 }}
          >
            <LocationOnOutlinedIcon
              sx={{ fontSize: 15, color: alpha(tokens.navy, 0.78) }}
            />
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(tokens.navy, 0.78),
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.municipalityLabel}
            </Typography>
          </Stack>

          <Box
            component="button"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                clientReviewsHref(String(item.id), undefined, {
                  returnTo: "/clients/listing",
                }),
              );
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.25,
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer",
              p: 0.25,
              borderRadius: "8px",
              font: "inherit",
              flexShrink: 0,
              "&:hover": { bgcolor: alpha(tokens.teal, 0.06) },
            }}
            aria-label={`View reviews for ${item.title}`}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarRoundedIcon
                  key={i}
                  sx={{
                    fontSize: 18,
                    color:
                      i < Math.round(Math.min(5, Math.max(0, item.rating)))
                        ? tokens.star
                        : alpha(tokens.navy, 0.15),
                  }}
                />
              ))}
            </Box>
            <Typography sx={{ fontSize: 11, color: alpha(tokens.navy, 0.55) }}>
              {item.reviewsCount} Reviews · {item.rating.toFixed(1)}
            </Typography>
          </Box>

          <Box
            sx={{
              mt: "auto",
              minHeight: 38,
              display: "flex",
              alignItems: "stretch",
            }}
          >
            {canPickFixed && canPickDesired ? (
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  border: `1px solid ${alpha(tokens.navy, 0.12)}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  bgcolor: "#fff",
                }}
              >
                <AppButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode("fixed");
                  }}
                  sx={{
                    flex: 1,
                    py: 0.75,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 0,
                    color: mode === "fixed" ? "#fff" : tokens.slate,
                    bgcolor: mode === "fixed" ? tokens.teal : "transparent",
                    "&:hover": {
                      bgcolor:
                        mode === "fixed"
                          ? tokens.tealDark
                          : "rgba(33, 184, 191, 0.08)",
                    },
                  }}
                >
                  Fixed Location
                </AppButton>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderColor: alpha(tokens.navy, 0.12) }}
                />
                <AppButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode("desired");
                  }}
                  sx={{
                    flex: 1,
                    py: 0.75,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 0,
                    color: mode === "desired" ? "#fff" : tokens.slate,
                    bgcolor: mode === "desired" ? tokens.teal : "transparent",
                    "&:hover": {
                      bgcolor:
                        mode === "desired"
                          ? tokens.tealDark
                          : "rgba(33, 184, 191, 0.08)",
                    },
                  }}
                >
                  Desired Location
                </AppButton>
              </Box>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 0.75,
                  px: 1.25,
                  borderRadius: "8px",
                  bgcolor: alpha(tokens.teal, 0.1),
                  border: `1px solid ${alpha(tokens.teal, 0.25)}`,
                }}
              >
                <Typography
                  sx={{ fontSize: 13, fontWeight: 800, color: tokens.teal }}
                >
                  {canPickDesired ? "Desired Location" : "Fixed Location"}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ pt: 0.35, textAlign: "left", minHeight: 52 }}>
            <Stack spacing={0.65}>
              {serviceRows.map((svc, idx) => {
                const isPlaceholder = !item.services[idx];
                return (
                  <Stack
                    key={`${svc.name}-${idx}`}
                    direction="row"
                    alignItems="baseline"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{
                      minHeight: 22,
                      visibility: isPlaceholder ? "hidden" : "visible",
                    }}
                    aria-hidden={isPlaceholder || undefined}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: alpha(tokens.navy, 0.9),
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {svc.name}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        color: alpha(tokens.navy, 0.65),
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {svc.priceLabel}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </AppCard>
  );
}
