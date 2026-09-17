"use client";

import * as React from "react";
import {
  Box,
  Chip,
  Divider,
  Fade,
  IconButton,
  Paper,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Typography } from "../../ui/typography";

type MollurePalette = { navy: string };

export type ProfessionalFixedLocationSetupChromeProps = {
  m: MollurePalette;
  data: { subTabs: readonly string[]; title: string };
  activeSubTab: string;
  setActiveSubTab: React.Dispatch<React.SetStateAction<string>>;
  isBusinessPublishEnabled: boolean;
  setIsProfessionalEditing: React.Dispatch<React.SetStateAction<boolean>>;
  businessSetupContent: React.ReactNode;
  userInfoContent: React.ReactNode;
};

/** Sub-tabs + content paper shell (ponytail: move-only). */
export function ProfessionalFixedLocationSetupChrome({
  m,
  data,
  activeSubTab,
  setActiveSubTab,
  isBusinessPublishEnabled,
  setIsProfessionalEditing,
  businessSetupContent,
  userInfoContent,
}: ProfessionalFixedLocationSetupChromeProps) {
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "8px",
          bgcolor: "#fff",
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          boxShadow: "0 6px 14px rgba(16, 35, 63, 0.06)",
          p: 0.45,
          width: "100%",
        }}
      >
        <Stack direction="row" spacing={0} sx={{ height: 44 }}>
          {data.subTabs.map((t) => {
            const active = t === activeSubTab;
            return (
              <Box
                key={t}
                role="button"
                tabIndex={0}
                onClick={() => setActiveSubTab(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveSubTab(t);
                }}
                sx={{
                  cursor: "pointer",
                  flex: 1,
                  borderRadius: "6px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: active ? "primary.main" : "transparent",
                  color: active ? "#fff" : alpha(m.navy, 0.55),
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  userSelect: "none",
                  transition: "background-color 160ms ease, color 160ms ease",
                }}
              >
                {t}
              </Box>
            );
          })}
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            px: { xs: 1.75, sm: 2.25 },
            py: { xs: 1.4, sm: 1.7 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 1.25, sm: 2 },
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              color: alpha(m.navy, 0.9),
              fontSize: { xs: 24, sm: 28, md: 30 },
              lineHeight: 1.25,
              minWidth: 0,
              flex: "1 1 auto",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              pr: 1,
            }}
          >
            {activeSubTab === "Business Setup" ? data.title : "Professional"}
          </Typography>

          {activeSubTab === "Business Setup" ? (
            isBusinessPublishEnabled ? (
              <Chip
                label="Unpublished changes"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 600, flexShrink: 0 }}
              />
            ) : null
          ) : (
            <IconButton
              size="small"
              onClick={() => setIsProfessionalEditing(true)}
              sx={{
                width: 28,
                height: 28,
                flexShrink: 0,
                borderRadius: "999px",
                bgcolor: alpha(m.navy, 0.06),
                "&:hover": { bgcolor: alpha(m.navy, 0.09) },
              }}
              aria-label="Edit professional profile"
            >
              <EditRoundedIcon
                sx={{ fontSize: 15, color: alpha(m.navy, 0.55) }}
              />
            </IconButton>
          )}
        </Box>
        <Divider />
        <Box sx={{ px: 2.25, py: 2.1 }}>
          <Fade in timeout={180} key={activeSubTab}>
            <Box>
              {activeSubTab === "Business Setup"
                ? businessSetupContent
                : userInfoContent}
            </Box>
          </Fade>
        </Box>
      </Paper>
    </>
  );
}
