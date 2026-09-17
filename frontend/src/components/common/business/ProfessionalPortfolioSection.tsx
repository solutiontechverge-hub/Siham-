"use client";

import * as React from "react";
import Image from "next/image";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import { PROFILE_IMAGE_FILE_ACCEPT } from "../../../lib/profileImageUpload";
import { SectionShell } from "./professionalFixedLocationSetupShell";

type PortfolioItem = { id: string; src: string };

export type ProfessionalPortfolioSectionProps = {
  m: Theme["palette"]["mollure"];
  theme: Theme;
  portfolioItems: PortfolioItem[];
  selectedPortfolioIds: Record<string, boolean>;
  portfolioDisabled: boolean;
  portfolioInputRef: React.RefObject<HTMLInputElement | null>;
  deleteSelectedPortfolio: () => void;
  onUploadPortfolio: () => void;
  onPortfolioFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  togglePortfolio: (id: string) => void;
};

export function ProfessionalPortfolioSection({
  m,
  theme,
  portfolioItems,
  selectedPortfolioIds,
  portfolioDisabled,
  portfolioInputRef,
  deleteSelectedPortfolio,
  onUploadPortfolio,
  onPortfolioFilesSelected,
  togglePortfolio,
}: ProfessionalPortfolioSectionProps) {
  return (
    <SectionShell
      title="Portfolio"
      action={
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={deleteSelectedPortfolio}
            disabled={
              portfolioDisabled ||
              !Object.values(selectedPortfolioIds).some(Boolean)
            }
            sx={{
              width: 30,
              height: 30,
              borderRadius: "999px",
              bgcolor: m.fxGrayF2F4F7,
              color: alpha(m.navy, 0.55),
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              "&:hover": { bgcolor: "#EEF2F6" },
              "&.Mui-disabled": {
                bgcolor: m.fxGrayF2F4F7,
                color: alpha(m.navy, 0.35),
                opacity: 1,
              },
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={onUploadPortfolio}
            disabled={portfolioDisabled}
            sx={{
              width: 30,
              height: 30,
              borderRadius: "999px",
              bgcolor: m.fxGrayF2F4F7,
              color: alpha(m.navy, 0.55),
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              "&:hover": { bgcolor: "#EEF2F6" },
              "&.Mui-disabled": {
                bgcolor: m.fxGrayF2F4F7,
                color: alpha(m.navy, 0.35),
                opacity: 1,
              },
            }}
          >
            <IosShareRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <input
            ref={portfolioInputRef}
            type="file"
            accept={PROFILE_IMAGE_FILE_ACCEPT}
            multiple
            hidden
            onChange={onPortfolioFilesSelected}
          />
        </Stack>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {portfolioItems.map((it) => {
          const checked = Boolean(selectedPortfolioIds[it.id]);
          return (
            <Box
              key={it.id}
              role="checkbox"
              aria-checked={checked}
              tabIndex={0}
              onClick={() => {
                if (!portfolioDisabled) togglePortfolio(it.id);
              }}
              onKeyDown={(e) => {
                if (portfolioDisabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  togglePortfolio(it.id);
                }
              }}
              sx={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: "10px",
                overflow: "hidden",
                cursor: portfolioDisabled ? "default" : "pointer",
                opacity: portfolioDisabled ? 0.72 : 1,
                border: checked
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${alpha(m.navy, 0.1)}`,
                outline: "none",
                "&:focus-visible": {
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
              }}
            >
              <Image
                src={it.src}
                alt="Portfolio image"
                width={520}
                height={520}
                unoptimized
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 2,
                  width: 20,
                  height: 20,
                  borderRadius: "4px",
                  border: `1.5px solid ${checked ? theme.palette.primary.dark : alpha(m.navy, 0.22)}`,
                  bgcolor: checked
                    ? theme.palette.primary.dark
                    : alpha("#fff", 0.92),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  boxShadow: checked
                    ? "none"
                    : `inset 0 0 0 1px ${alpha(m.navy, 0.06)}`,
                }}
              >
                {checked ? (
                  <CheckRoundedIcon sx={{ fontSize: 14, color: "#fff" }} />
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>
    </SectionShell>
  );
}
