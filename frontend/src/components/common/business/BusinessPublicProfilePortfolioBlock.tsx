"use client";

import * as React from "react";
import RemoteAwareImage from "../RemoteAwareImage";
import { alpha, useTheme } from "@mui/material/styles";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Dialog, Grid, IconButton } from "@mui/material";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";
import { toImageSrc } from "./useBusinessPublicProfileView";
import { SectionCard } from "./BusinessPublicProfileSections";

export function BusinessPublicProfilePortfolioBlock(props: {
  data: BusinessPublicProfileData;
  portfolioLightboxIndex: number | null;
  setPortfolioLightboxIndex: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const { data, portfolioLightboxIndex, setPortfolioLightboxIndex } = props;
  const m = useTheme().palette.mollure;
  return (
    <>
        <SectionCard title="Portfolio">
          <Grid container spacing={1.25}>
            {data.portfolioImages.map((img, idx) => {
              const src = toImageSrc(img);
              return (
                <Grid item xs={6} sm={3} key={`${idx}-${src}`}>
                  <Box
                    component={src ? "button" : "div"}
                    type={src ? "button" : undefined}
                    onClick={
                      src ? () => setPortfolioLightboxIndex(idx) : undefined
                    }
                    sx={{
                      position: "relative",
                      display: "block",
                      width: "100%",
                      p: 0,
                      m: 0,
                      border: "none",
                      borderRadius: "10px",
                      overflow: "hidden",
                      pt: "100%",
                      bgcolor: "transparent",
                      cursor: src ? "pointer" : "default",
                      appearance: "none",
                      WebkitAppearance: "none",
                      "&:focus-visible": {
                        outline: `2px solid ${m.teal}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    {src ? (
                      <RemoteAwareImage
                        src={src}
                        alt={`Portfolio ${idx + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor: alpha(m.navy, 0.06),
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </SectionCard>

        <Dialog
          open={portfolioLightboxIndex !== null}
          onClose={() => setPortfolioLightboxIndex(null)}
          fullScreen
          PaperProps={{
            sx: {
              bgcolor: "rgba(0,0,0,0.92)",
              boxShadow: "none",
            },
          }}
        >
          <IconButton
            aria-label="Close"
            onClick={() => setPortfolioLightboxIndex(null)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>

          {data.portfolioImages.length > 1 ? (
            <>
              <IconButton
                aria-label="Previous image"
                onClick={() =>
                  setPortfolioLightboxIndex((current) => {
                    if (current === null) return current;
                    const total = data.portfolioImages.length;
                    return (current - 1 + total) % total;
                  })
                }
                sx={{
                  position: "absolute",
                  left: { xs: 8, sm: 16 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                }}
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
              <IconButton
                aria-label="Next image"
                onClick={() =>
                  setPortfolioLightboxIndex((current) => {
                    if (current === null) return current;
                    return (current + 1) % data.portfolioImages.length;
                  })
                }
                sx={{
                  position: "absolute",
                  right: { xs: 8, sm: 16 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </>
          ) : null}

          <Box
            onClick={() => setPortfolioLightboxIndex(null)}
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 5, sm: 8 },
              py: 6,
            }}
          >
            {portfolioLightboxIndex !== null &&
            toImageSrc(data.portfolioImages[portfolioLightboxIndex]) ? (
              <Box
                onClick={(event) => event.stopPropagation()}
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  maxWidth: 1100,
                }}
              >
                <RemoteAwareImage
                  src={toImageSrc(data.portfolioImages[portfolioLightboxIndex])}
                  alt={`Portfolio ${portfolioLightboxIndex + 1}`}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </Box>
            ) : null}
          </Box>
        </Dialog>
    </>
  );
}
