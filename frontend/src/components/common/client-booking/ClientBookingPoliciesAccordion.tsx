"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BusinessPublicProfilePolicySection } from "../../../data/businessPublicProfile.data";

type Props = {
  sections: BusinessPublicProfilePolicySection[];
  onCancelBooking?: () => void;
  showCancelAction?: boolean;
};

export default function ClientBookingPoliciesAccordion({
  sections,
  onCancelBooking,
  showCancelAction = true,
}: Props) {
  const m = useTheme().palette.mollure;
  const [expanded, setExpanded] = React.useState(true);

  if (!sections.length) return null;

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
      elevation={0}
      disableGutters
      defaultExpanded
      sx={{
        borderRadius: "10px !important",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        borderLeft: `3px solid ${alpha(m.teal, 0.55)}`,
        bgcolor: "#fff",
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreRoundedIcon
            sx={{
              color: alpha(m.navy, 0.45),
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        }
        sx={{
          px: 2,
          minHeight: 52,
          "& .MuiAccordionSummary-content": { my: 1 },
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.78) }}>
          Professional&apos;s Policies
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
        <Stack spacing={1.5}>
          {sections.map((section) => (
            <Typography key={section.title} sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.55), lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 900, color: alpha(m.navy, 0.72) }}>
                {section.title}:
              </Box>{" "}
              {section.description}
            </Typography>
          ))}
        </Stack>

        {showCancelAction ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CloseRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={onCancelBooking}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12.5,
                height: 40,
                borderColor: alpha(m.navy, 0.12),
                color: alpha(m.navy, 0.55),
                bgcolor: alpha(m.navy, 0.03),
                "&:hover": { bgcolor: alpha(m.navy, 0.06), borderColor: alpha(m.navy, 0.18) },
              }}
            >
              Cancel Booking
            </Button>
          </>
        ) : null}
      </AccordionDetails>
    </Accordion>
  );
}
