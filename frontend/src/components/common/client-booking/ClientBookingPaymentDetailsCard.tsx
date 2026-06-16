"use client";

import * as React from "react";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Avatar, Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { parseTimeLabelToMinutes, serviceTimeRangeLabel } from "../../../app/clients/booking/booking-time";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import { buildBookingSummarySections, resolveTeamMemberFirstName } from "./buildBookingSummarySections";
import type { ClientBookingDraft } from "./types";

export type ClientBookingPrepaymentState = "none" | "required" | "paid";

type Props = {
  draft: ClientBookingDraft | null;
  requesterName: string;
  requesterAvatarUrl?: string;
  prepaymentState?: ClientBookingPrepaymentState;
  prepaymentPercent?: number;
  payNowLabel?: string;
  onPayNow?: () => void;
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
};

export default function ClientBookingPaymentDetailsCard({
  draft,
  requesterName,
  requesterAvatarUrl,
  prepaymentState = "none",
  prepaymentPercent = 0,
  payNowLabel = "Pay Now",
  onPayNow,
  onViewInvoice,
  onViewReceipt,
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
  const fallbackRequesterSection =
    requesterSections.length === 0 && (draft?.services?.length ?? 0) > 0
      ? [{ key: "requester-services", items: draft!.services, isRequester: true as const }]
      : [];
  const clientServiceSections = requesterSections.length ? requesterSections : fallbackRequesterSection;

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

        {draft?.projectDetails?.description ? (
          <Box
            sx={{
              mb: 2,
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              bgcolor: alpha(m.navy, 0.02),
              px: 1.5,
              py: 1.15,
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 12, color: alpha(m.navy, 0.72), mb: 0.5 }}>
              Project description
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.58), whiteSpace: "pre-wrap" }}>
              {draft.projectDetails.description}
            </Typography>
            {(draft.projectDetails.uploads?.length ?? 0) > 0 ? (
              <Typography sx={{ mt: 0.75, fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.48) }}>
                {draft.projectDetails.uploads.length} file{draft.projectDetails.uploads.length === 1 ? "" : "s"} attached
              </Typography>
            ) : null}
          </Box>
        ) : null}

        <Stack spacing={1.25}>
          {clientServiceSections.map((section) => (
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

        {prepaymentState !== "none" ? (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                px: 1.75,
                py: 1.15,
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.04),
                border: `1px solid ${alpha(m.navy, 0.06)}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.25,
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.78) }}>Total Price</Typography>
              <Typography sx={{ fontWeight: 1000, fontSize: 15, color: alpha(m.navy, 0.9) }}>€{total.toFixed(2)}</Typography>
            </Box>

            {prepaymentState === "required" ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: "#fff",
                  px: 1.75,
                  py: 1.35,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 1.1 }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 12.5, color: alpha(m.navy, 0.72), flex: 1, minWidth: 0 }}>
                    Prepayment Required ({prepaymentPercent}%)
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                    <Typography
                      component="button"
                      type="button"
                      onClick={onPayNow}
                      disabled={!onPayNow}
                      sx={{
                        border: 0,
                        bgcolor: "transparent",
                        p: 0,
                        cursor: onPayNow ? "pointer" : "default",
                        color: m.teal,
                        fontWeight: 900,
                        fontSize: 12.5,
                        fontFamily: "inherit",
                        opacity: onPayNow ? 1 : 0.5,
                        "&:hover": onPayNow ? { color: m.tealDark } : undefined,
                      }}
                    >
                      {payNowLabel}
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.88), minWidth: 72, textAlign: "right" }}>
                      €{prepaidAmount.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 800, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                    Remaining After Prepayment
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.88) }}>€{remaining.toFixed(2)}</Typography>
                </Stack>
              </Paper>
            ) : (
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
                    <Typography
                      component="button"
                      type="button"
                      onClick={onViewInvoice}
                      disabled={!onViewInvoice}
                      sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: m.teal,
                        cursor: onViewInvoice ? "pointer" : "default",
                        border: 0,
                        bgcolor: "transparent",
                        p: 0,
                        font: "inherit",
                        opacity: onViewInvoice ? 1 : 0.5,
                      }}
                    >
                      View Invoice
                    </Typography>
                    <Typography
                      component="button"
                      type="button"
                      onClick={onViewReceipt}
                      disabled={!onViewReceipt}
                      sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: m.teal,
                        cursor: onViewReceipt ? "pointer" : "default",
                        border: 0,
                        bgcolor: "transparent",
                        p: 0,
                        font: "inherit",
                        opacity: onViewReceipt ? 1 : 0.5,
                      }}
                    >
                      View Receipt
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            )}
          </Box>
        ) : null}
      </Box>

      {prepaymentState === "none" ? (
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
      ) : null}
    </Paper>
  );
}
