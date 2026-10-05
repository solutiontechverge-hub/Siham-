"use client";

import * as React from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Checkbox, IconButton, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollureSectionTitleSx,
} from "../../../../../theme/mollureHierarchy";
import { mollureDensePaperSx } from "../../../../../components/common/mollureFormSx";
import {
  BodyText,
  CardTitle,
  SubHeading,
} from "../../../../../components/ui/typography";
import { TRANSACTION_OPTION_ITEMS } from "./setting.data";
import { useTransactionOptionsSettingsSection } from "./useFinanceSettingPage";

export default function FinanceSettingTransactionOptions() {
  const { m, editing, draft, setDraft, handleEditToggle } =
    useTransactionOptionsSettingsSection();

  const cardSx = mollureDensePaperSx(m.navy, { borderAlpha: 0.1 });

  return (
    <Paper elevation={0} sx={cardSx}>
      <Box
        sx={{
          px: 2,
          py: 1.6,
          bgcolor: alpha(m.navy, 0.02),
          borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box sx={{ flex: 1 }}>
            <SubHeading sx={mollureSectionTitleSx(m.navy)}>
              Post-booking payment methods
            </SubHeading>
            <BodyText sx={mollureBodyMutedSx(m.navy, { mt: 0.35 })}>
              Select transaction options featured at checkout for post-booking.
            </BodyText>
          </Box>

          <IconButton
            size="small"
            onClick={handleEditToggle}
            sx={{
              mt: 0.25,
              width: 28,
              height: 28,
              borderRadius: "8px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: alpha(m.navy, 0.02),
              color: alpha(m.navy, 0.55),
              "&:hover": { bgcolor: alpha(m.navy, 0.04) },
            }}
          >
            {editing ? (
              <CheckRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <EditRoundedIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ px: 2, py: 1.6 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <CardTitle sx={mollureSectionTitleSx(m.navy)}>
            Post-Booking
          </CardTitle>
        </Stack>
        <BodyText sx={{ mt: 0.4, color: alpha(m.navy, 0.55), fontSize: 12 }}>
          Options available at checkout after a booking is made.
        </BodyText>

        <Stack spacing={0.25} sx={{ mt: 1 }}>
          {TRANSACTION_OPTION_ITEMS.map((item) => (
            <Stack
              key={item.key}
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Checkbox
                checked={item.key === "onlineImmediate" ? true : draft[item.key]}
                disabled={!editing || item.key === "onlineImmediate"}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, [item.key]: e.target.checked }))
                }
                size="small"
                sx={{ p: 0.5 }}
              />
              <BodyText
                sx={mollureBodySx(m.navy, {
                  color: alpha(m.navy, editing ? 0.75 : 0.45),
                })}
              >
                {item.label}
              </BodyText>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}
