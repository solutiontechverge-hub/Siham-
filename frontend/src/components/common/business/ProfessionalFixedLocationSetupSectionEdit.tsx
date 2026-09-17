"use client";

import * as React from "react";
import { IconButton, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AppButton from "../AppButton";
import type { BusinessSetupSectionId } from "./useProfessionalFixedLocationSetup.types";

export function ProfessionalFixedLocationSetupSectionEdit({
  m,
  sectionId,
  extra,
  isBusinessSectionEditing,
  saveBusinessSection,
  startBusinessSectionEdit,
  isBusinessSetupSaving,
}: {
  m: { navy: string };
  sectionId: BusinessSetupSectionId;
  extra?: React.ReactNode;
  isBusinessSectionEditing: (id: BusinessSetupSectionId) => boolean;
  saveBusinessSection: (id: BusinessSetupSectionId) => void | Promise<void>;
  startBusinessSectionEdit: (id: BusinessSetupSectionId) => void;
  isBusinessSetupSaving: boolean;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {extra}
      {isBusinessSectionEditing(sectionId) ? (
        <AppButton
          variant="contained"
          disableElevation
          onClick={() => void saveBusinessSection(sectionId)}
          disabled={isBusinessSetupSaving}
          sx={{
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 12,
            minHeight: 30,
            px: 2,
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "mollure.tealDark" },
          }}
        >
          {isBusinessSetupSaving ? "Saving..." : "Save"}
        </AppButton>
      ) : (
        <IconButton
          size="small"
          onClick={() => startBusinessSectionEdit(sectionId)}
          disabled={isBusinessSetupSaving}
          aria-label="Edit section"
          sx={{
            width: 28,
            height: 28,
            borderRadius: "999px",
            bgcolor: alpha(m.navy, 0.06),
            "&:hover": { bgcolor: alpha(m.navy, 0.09) },
          }}
        >
          <EditRoundedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.55) }} />
        </IconButton>
      )}
    </Stack>
  );
}
