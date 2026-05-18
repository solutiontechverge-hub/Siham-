"use client";

import * as React from "react";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Avatar, Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { parseTimeLabelToMinutes, serviceTimeRangeLabel } from "../../../app/clients/booking/booking-time";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import { buildBookingSummarySections, resolveTeamMemberFirstName } from "./buildBookingSummarySections";
import type { ClientBookingDraft } from "./types";

type Props = {
  draft: ClientBookingDraft | null;
  requesterName: string;
  requesterAvatarUrl?: string;
  showPrepaidBreakdown?: boolean;
  prepaymentPercent?: number;
};

export default function ClientBookingPaymentDetailsCard({
  draft,
  requesterName,
  requesterAvatarUrl,
  showPrepaidBreakdown = false,
  prepaymentPercent = 0,
}: Props) {
  const m = useTheme().palette.mollure;
  const sections = React.useMemo(() => buildBookingSummarySections(draft), [draft]);
  const bookingStartMinutes = React.useMemo(
    () => (draft?.selectedTime ? parseTimeLabelToMinutes(draft.selectedTime) : 0),
    [draft?.selectedTime],
  );

  const total = draft?.total ?? 0;
  const prepaidAmount = Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) / 100;
  const remaining = Math.round((total - prepaidAmount + Number.EPSILON) * 100) / 100;

  const requesterSections = sections.filter((s) => s.isRequester);
  const guestSections = sections.filter((s) => !s.isRequester && !s.key.includes("planning"));

  let scheduleOffset = bookingStartMinutes;

  const renderService = (service: ClientBookingDraft["services"][number]) => {
    const teamFirst = resolveTeamMemberFirstName(service.teamMemberId, draft?.teamMembers);
    const timeRange = draft?.selectedTime ? serviceTimeRangeLabel(scheduleOffset, service.durationMins) : undefined;
    scheduleOffset += service.durationMins;

    return (
      <Box
        key={service.id}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          px: 1.5,
          py: 1.15,
          bgcolor: "#fff",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.2 }}>
              {service.name}
            </Typography>
            <ServiceSummaryMetaLine
              timeRange={timeRange}
              durationLabel={`${service.durationMins} Mins`}
            />
            {teamFirst ? (
              <Stack direction="row" alignItems="center" spacing={0.45} sx={{ mt: 0.45 }}>
                <PersonOutlineRoundedIcon sx={{ fontSize: 14, color: alpha(m.navy, 0.4) }} />
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.48) }}>
                  By {teamFirst}
                </Typography>
              </Stack>
            ) : null}
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82), flexShrink: 0 }}>
            €{service.price}
          </Typography>
        </Stack>
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: alpha(m.navy, 0.015),
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, py: 1.35, bgcolor: "#fff" }}>
        <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.78), fontSize: 12.5 }}>
          Booking &amp; Payment Details
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ p: 2, bgcolor: "#fff" }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <Avatar
            src={requesterAvatarUrl}
            sx={{ width: 44, height: 44, bgcolor: alpha(m.teal, 0.12), color: m.teal, fontWeight: 900, fontSize: 16 }}
          >
            {requesterName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88) }}>{requesterName}</Typography>
        </Stack>

        <Stack spacing={1.25}>
          {requesterSections.map((section) => (
            <Stack key={section.key} spacing={1}>
              {section.items.map((service) => renderService(service))}
            </Stack>
          ))}
          {guestSections.map((section) => (
            <Box key={section.key}>
              <Typography sx={{ fontWeight: 800, fontSize: 12, color: alpha(m.navy, 0.55), mb: 1 }}>
                Guest:{section.title}
              </Typography>
              <Stack spacing={1}>{section.items.map((service) => renderService(service))}</Stack>
            </Box>
          ))}
        </Stack>

        {showPrepaidBreakdown ? (
          <Box sx={{ mt: 2 }}>
            <Stack spacing={0.75} sx={{ mb: 1.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 900, fontSize: 12, color: alpha(m.navy, 0.78) }}>Total Price</Typography>
                <Typography sx={{ fontWeight: 1000, fontSize: 14 }}>€{total.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 800, fontSize: 12, color: alpha(m.navy, 0.62) }}>
                  Prepaid ({prepaymentPercent}%)
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 13, color: m.teal }}>€{prepaidAmount.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 800, fontSize: 12, color: alpha(m.navy, 0.62) }}>Remaining</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 13 }}>€{remaining.toFixed(2)}</Typography>
              </Stack>
            </Stack>
            <Paper elevation={0} sx={{ borderRadius: "10px", border: `1px solid ${alpha(m.navy, 0.08)}`, p: 1.5, bgcolor: alpha(m.navy, 0.02) }}>
              <Stack spacing={0.85}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 900, fontSize: 12 }}>Prepayment</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 12, color: m.teal }}>€{prepaidAmount.toFixed(2)}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.48) }}>
                  Prepaid – {new Date().toLocaleDateString("en-US")} – Online Direct
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Typography component="span" sx={{ fontSize: 11, fontWeight: 800, color: m.teal, cursor: "pointer" }}>
                    View Invoice
                  </Typography>
                  <Typography component="span" sx={{ fontSize: 11, fontWeight: 800, color: m.teal, cursor: "pointer" }}>
                    View Receipt
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        ) : null}
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1.35,
          bgcolor: "#fff",
          borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.78) }}>Total Price</Typography>
        <Typography sx={{ fontWeight: 1000, fontSize: 17, color: alpha(m.navy, 0.9) }}>€{total.toFixed(2)}</Typography>
      </Box>
    </Paper>
  );
}
