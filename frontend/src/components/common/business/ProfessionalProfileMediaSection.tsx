"use client";

import * as React from "react";
import Image from "next/image";
import {
  Box,
  Chip,
  CircularProgress,
  Fade,
  Grid,
  IconButton,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AppButton from "../AppButton";
import MollureFormField from "../MollureFormField";
import { PROFILE_IMAGE_FILE_ACCEPT, isPersistedMediaUrl } from "../../../lib/profileImageUpload";
import { Typography } from "../../ui/typography";
import { MAX_BUSINESS_KEYWORDS } from "./professionalFixedLocationSetup.data";
import { SectionShell } from "./professionalFixedLocationSetupShell";

type ProfileCopy = {
  title: string;
  uploadMediaLabel: string;
  nameLabel: string;
  aboutLabel: string;
  keywordsLabel: string;
  keywordPlaceholder: string;
};

type ProfileBizSlice = {
  profileName: string;
  about: string;
  keywordDraft: string;
  keywords: string[];
};

export type ProfessionalProfileMediaSectionProps = {
  m: Theme["palette"]["mollure"];
  data: { profile: ProfileCopy };
  action: React.ReactNode;
  /** When false, name field is in Fixed Location address (freelancer Salon Name). */
  showSalonName?: boolean;
  mediaSlides: string[];
  mediaIdx: number;
  setMediaIdx: React.Dispatch<React.SetStateAction<number>>;
  goPrevMedia: () => void;
  goNextMedia: () => void;
  setMediaDeleteConfirmOpen: (open: boolean) => void;
  profileDisabled: boolean;
  isBusinessMediaUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadMedia: () => void;
  biz: ProfileBizSlice;
  setBizField: <K extends keyof ProfileBizSlice>(
    key: K,
    value: ProfileBizSlice[K],
  ) => void;
  addBizKeyword: () => void;
  removeBizKeyword: (k: string) => void;
  keywordsAtMax: boolean;
};

export function ProfessionalProfileMediaSection({
  m,
  data,
  action,
  showSalonName = true,
  mediaSlides,
  mediaIdx,
  setMediaIdx,
  goPrevMedia,
  goNextMedia,
  setMediaDeleteConfirmOpen,
  profileDisabled,
  isBusinessMediaUploading,
  fileInputRef,
  onFilesSelected,
  onUploadMedia,
  biz,
  setBizField,
  addBizKeyword,
  removeBizKeyword,
  keywordsAtMax,
}: ProfessionalProfileMediaSectionProps) {
  return (
    <SectionShell
      title={
        <Typography
          sx={{
            fontWeight: 700,
            color: alpha(m.navy, 0.9),
            fontSize: 20,
            lineHeight: 1.2,
            minWidth: 0,
            pr: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {data.profile.title}
        </Typography>
      }
      action={action}
    >
      <Grid
        container
        spacing={{ xs: 2, sm: 2.25 }}
        alignItems="stretch"
        sx={{ width: "100%", m: 0 }}
      >
        <Grid item xs={12} md={6} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 220, sm: 260, md: 310 },
                flexShrink: 0,
                bgcolor: alpha(m.navy, 0.02),
                overflow: "hidden",
                isolation: "isolate",
              }}
            >
              <Fade in key={mediaIdx} timeout={180}>
                <Box sx={{ position: "absolute", inset: 0 }}>
                  {mediaSlides[mediaIdx] ? (
                    <Image
                      src={mediaSlides[mediaIdx]}
                      alt=""
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 900px) 100vw, 520px"
                      unoptimized={
                        mediaSlides[mediaIdx]?.startsWith("blob:") ||
                        isPersistedMediaUrl(mediaSlides[mediaIdx] ?? "")
                      }
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                </Box>
              </Fade>

              {mediaSlides.length > 0 ? (
                <IconButton
                  aria-label="Delete image"
                  onClick={() => setMediaDeleteConfirmOpen(true)}
                  disabled={profileDisabled || isBusinessMediaUploading}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: { xs: 8, sm: 10 },
                    right: { xs: 8, sm: 10 },
                    zIndex: 3,
                    width: { xs: 32, sm: 34 },
                    height: { xs: 32, sm: 34 },
                    bgcolor: alpha("#fff", 0.92),
                    border: `1px solid ${alpha(m.navy, 0.1)}`,
                    boxShadow: `0 2px 8px ${alpha("#000", 0.12)}`,
                    "&:hover": { bgcolor: "#fff" },
                    "&.Mui-disabled": {
                      bgcolor: alpha("#fff", 0.7),
                    },
                  }}
                >
                  <DeleteOutlineRoundedIcon
                    sx={{ fontSize: { xs: 16, sm: 18 }, color: alpha(m.navy, 0.55) }}
                  />
                </IconButton>
              ) : null}

              {mediaSlides.length > 1 ? (
                <>
                  <IconButton
                    aria-label="Previous image"
                    onClick={goPrevMedia}
                    size="small"
                    sx={{
                      position: "absolute",
                      left: { xs: 6, sm: 10 },
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: { xs: 30, sm: 34 },
                      height: { xs: 30, sm: 34 },
                      bgcolor: alpha("#fff", 0.85),
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      "&:hover": { bgcolor: "#fff" },
                    }}
                  >
                    <ChevronLeftRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Next image"
                    onClick={goNextMedia}
                    size="small"
                    sx={{
                      position: "absolute",
                      right: { xs: 6, sm: 10 },
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: { xs: 30, sm: 34 },
                      height: { xs: 30, sm: 34 },
                      bgcolor: alpha("#fff", 0.85),
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      "&:hover": { bgcolor: "#fff" },
                    }}
                  >
                    <ChevronRightRoundedIcon fontSize="small" />
                  </IconButton>

                  <Stack
                    direction="row"
                    spacing={0.6}
                    useFlexGap
                    flexWrap="wrap"
                    justifyContent="center"
                    sx={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      bottom: { xs: 8, sm: 10 },
                      zIndex: 2,
                      maxWidth: "calc(100% - 72px)",
                      px: 1.2,
                      py: 0.55,
                      borderRadius: 999,
                      bgcolor: alpha("#000", 0.3),
                      backdropFilter: "blur(6px)",
                      rowGap: 0.5,
                    }}
                  >
                    {mediaSlides.map((_, i) => (
                      <Box
                        key={i}
                        onClick={() => setMediaIdx(i)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            setMediaIdx(i);
                        }}
                        sx={{
                          width: 7,
                          height: 7,
                          flexShrink: 0,
                          borderRadius: "50%",
                          cursor: "pointer",
                          bgcolor:
                            i === mediaIdx ? "#fff" : alpha("#fff", 0.45),
                          boxShadow:
                            i === mediaIdx
                              ? "0 0 0 2px rgba(255,255,255,0.22)"
                              : "none",
                        }}
                      />
                    ))}
                  </Stack>
                </>
              ) : null}
            </Box>
            <Box sx={{ p: 1.25, flexShrink: 0, minWidth: 0 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept={PROFILE_IMAGE_FILE_ACCEPT}
                multiple
                onChange={onFilesSelected}
                style={{ display: "none" }}
              />
              <AppButton
                tone="secondary"
                fullWidth
                startIcon={
                  isBusinessMediaUploading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <IosShareRoundedIcon />
                  )
                }
                onClick={onUploadMedia}
                disabled={isBusinessMediaUploading || profileDisabled}
                sx={{
                  bgcolor: alpha(m.navy, 0.02),
                }}
              >
                {data.profile.uploadMediaLabel}
              </AppButton>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Stack
            spacing={1.6}
            sx={{
              height: "100%",
              minWidth: 0,
              width: "100%",
            }}
          >
            {showSalonName ? (
              <MollureFormField
                label="Business Name"
                value={biz.profileName}
                onChange={(e) => setBizField("profileName", e.target.value)}
                disabled={profileDisabled}
              />
            ) : null}
            <MollureFormField
              label={data.profile.aboutLabel}
              value={biz.about}
              onChange={(e) => setBizField("about", e.target.value)}
              multiline
              minRows={3}
              disabled={profileDisabled}
            />
            <MollureFormField
              label={data.profile.keywordsLabel}
              placeholder={
                keywordsAtMax
                  ? `Maximum ${MAX_BUSINESS_KEYWORDS} keywords added`
                  : data.profile.keywordPlaceholder
              }
              value={biz.keywordDraft}
              onChange={(e) => setBizField("keywordDraft", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBizKeyword();
                }
              }}
              disabled={profileDisabled || keywordsAtMax}
            />
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ minWidth: 0, width: "100%" }}
            >
              {biz.keywords.map((k) => (
                <Chip
                  key={k}
                  label={k}
                  onDelete={
                    profileDisabled ? undefined : () => removeBizKeyword(k)
                  }
                  sx={{
                    maxWidth: "100%",
                    borderRadius: "8px",
                    bgcolor: alpha(m.navy, 0.06),
                    fontWeight: 700,
                    fontSize: 11.5,
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </SectionShell>
  );
}
