"use client";

import * as React from "react";
import { Box, IconButton, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import ModeEditOutlineRoundedIcon from "@mui/icons-material/ModeEditOutlineRounded";
import AppButton from "../../../components/common/AppButton";

export type ClientBookingPlanningFormProps = {
  planningActivity: string;
  setPlanningActivity: (value: string) => void;
  planningDuration: string;
  setPlanningDuration: (value: string) => void;
  planningFormIsLocked: boolean;
  startPlanningEdit: () => void;
  savePlanning: () => void;
};

export default function ClientBookingPlanningForm({
  planningActivity,
  setPlanningActivity,
  planningDuration,
  setPlanningDuration,
  planningFormIsLocked,
  startPlanningEdit,
  savePlanning,
}: ClientBookingPlanningFormProps) {
  const m = useTheme().palette.mollure;

  const planningFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: alpha(m.navy, 0.015),
      fontSize: 12,
      fontWeight: 700,
      "& fieldset": { borderColor: alpha(m.navy, 0.08) },
    },
    "& .MuiOutlinedInput-input": {
      color: alpha(m.navy, 0.55),
    },
  };

  const planningLockedFieldSx = {
    ...planningFieldSx,
    "& .MuiOutlinedInput-root": {
      ...planningFieldSx["& .MuiOutlinedInput-root"],
      pointerEvents: "none",
    },
  };

  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        p: 1.5,
        borderRadius: "10px",
        bgcolor: "#fff",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5, minHeight: 32 }}
      >
        <Typography sx={mollureLabelSx(m.navy)}>
          Activity
        </Typography>
        {planningFormIsLocked ? (
          <IconButton
            size="small"
            onClick={startPlanningEdit}
            aria-label="Edit planning"
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "999px",
              border: `1px solid ${alpha(m.navy, 0.12)}`,
              bgcolor: alpha(m.navy, 0.03),
              color: alpha(m.navy, 0.55),
              "&:hover": {
                bgcolor: alpha(m.navy, 0.06),
                color: alpha(m.navy, 0.72),
              },
            }}
          >
            <ModeEditOutlineRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Stack>
      <TextField
        value={planningActivity}
        onChange={(e) => setPlanningActivity(e.target.value)}
        placeholder={planningFormIsLocked ? undefined : "Photoshoot"}
        fullWidth
        size="small"
        InputProps={{ readOnly: planningFormIsLocked }}
        sx={{
          mb: 2,
          ...(planningFormIsLocked ? planningLockedFieldSx : planningFieldSx),
        }}
      />

      <Typography sx={mollureLabelSx(m.navy, { mb: 0.5 })}>
        Duration
      </Typography>
      <TextField
        value={planningDuration}
        onChange={(e) => setPlanningDuration(e.target.value)}
        placeholder={planningFormIsLocked ? undefined : "30 min"}
        fullWidth
        size="small"
        InputProps={{ readOnly: planningFormIsLocked }}
        sx={{
          mb: planningFormIsLocked ? 0 : 2,
          ...(planningFormIsLocked ? planningLockedFieldSx : planningFieldSx),
        }}
      />

      {!planningFormIsLocked ? (
        <AppButton
          tone="primary"
          fullWidth
          onClick={savePlanning}
          sx={{
            height: 42,
          }}
        >
          Save
        </AppButton>
      ) : null}
    </Box>
  );
}
