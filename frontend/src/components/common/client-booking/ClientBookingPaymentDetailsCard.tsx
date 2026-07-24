"use client";

import * as React from "react";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Avatar, Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "../../../app/clients/booking/booking-time";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import BookingEditedTag from "../calendar/BookingEditedTag";
import {
  buildBookingSummarySections,
  resolveTeamMemberFirstName,
} from "./buildBookingSummarySections";
import type { BookingEditSuggestedProduct } from "./bookingEditRequest";
import type { ClientBookingDraft, ClientBookingSummarySection } from "./types";

export type ClientBookingPrepaymentState = "none" | "required" | "paid";

type OutcomeChangesNote = {
  scheduleLabel?: string;
  services?: Array<{ name: string; price: number }>;
  products?: Array<{ name: string; price: number }>;
};

function OutcomeChangesNoteBlock({
  note,
  variant,
}: {
  note: OutcomeChangesNote;
  variant: "accepted" | "rejected";
}) {
  const m = useTheme().palette.mollure;
  const isAccepted = variant === "accepted";
  const accent = isAccepted ? m.success : "#C67A00";
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.25,
        borderRadius: "10px",
        border: `1px solid ${alpha(accent, 0.28)}`,
        bgcolor: alpha(accent, 0.06),
        px: 1.75,
        py: 1.35,
      }}
    >
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: 12.5,
          color: alpha(m.navy, 0.82),
          mb: 0.85,
        }}
      >
        {isAccepted
          ? "Professional has accepted your new changes"
          : "Professional has rejected your new changes"}
      </Typography>
      {note.scheduleLabel ? (
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: alpha(m.navy, 0.68),
            mb: 0.5,
          }}
        >
          {isAccepted ? "Updated time" : "Requested time"}: {note.scheduleLabel}
        </Typography>
      ) : null}
      {note.services?.length ? (
        <Box sx={{ mt: 0.35 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              color: alpha(m.navy, 0.55),
              mb: 0.35,
            }}
          >
            {isAccepted ? "Updated services" : "Requested services"}
          </Typography>
          <Stack spacing={0.35}>
            {note.services.map((service, index) => (
              <Stack
                key={`${service.name}-${index}`}
                direction="row"
                justifyContent="space-between"
                spacing={1}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  {service.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  €{service.price}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}
      {note.products?.length ? (
        <Box sx={{ mt: 0.75 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              color: alpha(m.navy, 0.55),
              mb: 0.35,
            }}
          >
            {isAccepted ? "Updated products" : "Requested products"}
          </Typography>
          <Stack spacing={0.35}>
            {note.products.map((product, index) => (
              <Stack
                key={`${product.name}-${index}`}
                direction="row"
                justifyContent="space-between"
                spacing={1}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  {product.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  €{product.price}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Paper>
  );
}

type Props = {
  draft: ClientBookingDraft | null;
  requesterName: string;
  requesterEmail?: string;
  requesterAvatarUrl?: string;
  prepaymentState?: ClientBookingPrepaymentState;
  prepaymentPercent?: number;
  payNowLabel?: string;
  /** Desired-location bookings only — amount from professional kilometer allowance. */
  showKilometerAllowance?: boolean;
  kilometerAllowanceAmount?: number;
  editedServiceIds?: readonly string[];
  products?: readonly BookingEditSuggestedProduct[];
  editedProductIds?: readonly string[];
  onPayNow?: () => void;
  /** Shown under Total Price when professional accepted the client's post-confirm EBR. */
  acceptedChangesNote?: OutcomeChangesNote | null;
  /** Shown under Total Price when professional rejected the client's post-confirm EBR. */
  rejectedChangesNote?: OutcomeChangesNote | null;
};

export default function ClientBookingPaymentDetailsCard({
  draft,
  requesterName,
  requesterEmail,
  requesterAvatarUrl,
  prepaymentState = "none",
  prepaymentPercent = 0,
  payNowLabel = "Pay Now",
  showKilometerAllowance = false,
  kilometerAllowanceAmount = 0,
  editedServiceIds = [],
  products = [],
  editedProductIds = [],
  onPayNow,
  acceptedChangesNote = null,
  rejectedChangesNote = null,
}: Props) {
  const m = useTheme().palette.mollure;
  const sections = React.useMemo(
    () => buildBookingSummarySections(draft),
    [draft],
  );
  const bookingStartMinutes = React.useMemo(
    () =>
      draft?.selectedTime ? parseTimeLabelToMinutes(draft.selectedTime) : 0,
    [draft?.selectedTime],
  );
  const editedServiceIdSet = React.useMemo(
    () => new Set(editedServiceIds),
    [editedServiceIds],
  );
  const editedProductIdSet = React.useMemo(
    () => new Set(editedProductIds),
    [editedProductIds],
  );

  const total = draft?.total ?? 0;
  const prepaidAmount =
    Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) /
    100;
  const remaining =
    Math.round((total - prepaidAmount + Number.EPSILON) * 100) / 100;

  const requesterSections = sections.filter(
    (s) => s.isRequester || s.participantType === "requester",
  );
  const modelSections = sections.filter((s) => s.participantType === "model");
  const guestSections = sections.filter((s) => s.participantType === "guest");
  const planningSections = sections.filter(
    (s) => s.participantType === "planning",
  );

  const fallbackRequesterSection: ClientBookingSummarySection[] =
    requesterSections.length === 0 &&
    (draft?.services?.length ?? 0) > 0 &&
    modelSections.length === 0 &&
    guestSections.length === 0
      ? [
          {
            key: "requester-services",
            title: requesterName,
            items: draft!.services,
            isRequester: true,
            participantType: "requester",
          },
        ]
      : [];
  const clientServiceSections = requesterSections.length
    ? requesterSections
    : fallbackRequesterSection;

  const project = draft?.projectDetails;
  const hasProject =
    Boolean(project?.description?.trim()) ||
    (project?.uploads?.length ?? 0) > 0;

  let scheduleOffset = bookingStartMinutes;

  const renderService = (service: ClientBookingDraft["services"][number]) => {
    const teamFirst = resolveTeamMemberFirstName(
      service.teamMemberId,
      draft?.teamMembers,
    );
    const timeRange = draft?.selectedTime
      ? serviceTimeRangeLabel(scheduleOffset, service.durationMins)
      : undefined;
    scheduleOffset += service.durationMins;
    const isEdited = editedServiceIdSet.has(service.id);

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
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1.5}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ flexWrap: "wrap" }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: alpha(m.navy, 0.82),
                  lineHeight: 1.2,
                }}
              >
                {service.name}
              </Typography>
              {isEdited ? <BookingEditedTag variant="edited" /> : null}
            </Stack>
            <ServiceSummaryMetaLine
              timeRange={timeRange}
              durationLabel={`${service.durationMins} Mins`}
            />
            {teamFirst ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.45}
                sx={{ mt: 0.45 }}
              >
                <PersonOutlineRoundedIcon
                  sx={{ fontSize: 14, color: alpha(m.navy, 0.4) }}
                />
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.48),
                  }}
                >
                  By {teamFirst}
                </Typography>
              </Stack>
            ) : null}
          </Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 900,
              color: alpha(m.navy, 0.82),
              flexShrink: 0,
            }}
          >
            €{service.price}
          </Typography>
        </Stack>
      </Box>
    );
  };

  const renderSectionBlock = (
    section: ClientBookingSummarySection,
    heading?: string,
  ) => (
    <Box key={section.key}>
      {heading ? (
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 12.5,
            color: alpha(m.navy, 0.72),
            mb: 1,
          }}
        >
          {heading}
        </Typography>
      ) : null}
      {section.planningItem ? (
        <Box
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            px: 1.5,
            py: 1.15,
            bgcolor: "#fff",
            mb: section.items.length ? 1 : 0,
          }}
        >
          {section.planningItem.activity ? (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 900,
                color: alpha(m.navy, 0.82),
                mb: 0.35,
              }}
            >
              {section.planningItem.activity}
            </Typography>
          ) : null}
          {section.planningItem.duration ? (
            <Typography
              sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.48) }}
            >
              {section.planningItem.duration}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      {section.items.length ? (
        <Stack spacing={1}>
          {section.items.map((service) => renderService(service))}
        </Stack>
      ) : null}
    </Box>
  );

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
        <Typography
          sx={{ fontWeight: 900, color: alpha(m.navy, 0.78), fontSize: 12.5 }}
        >
          Booking &amp; Payment Details
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ p: 2, bgcolor: "#fff" }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            mb: 2,
            px: 1.25,
            py: 1.1,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: alpha(m.navy, 0.015),
          }}
        >
          <Avatar
            src={requesterAvatarUrl}
            sx={{
              width: 44,
              height: 44,
              bgcolor: alpha(m.teal, 0.12),
              color: m.teal,
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            {requesterName.charAt(0).toUpperCase()}
          </Avatar>
          <Stack spacing={0.25}>
            <Typography
              sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88) }}
            >
              {requesterName}
            </Typography>
            {requesterEmail ? (
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.55),
                }}
              >
                {requesterEmail}
              </Typography>
            ) : null}
          </Stack>
        </Stack>

        {hasProject ? (
          <Box sx={{ mb: 2.25 }}>
            <Stack
              direction="row"
              alignItems="baseline"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: alpha(m.navy, 0.82),
                }}
              >
                Project
              </Typography>
              <Typography
                sx={{ fontWeight: 800, fontSize: 11.5, color: m.teal }}
              >
                Detail
              </Typography>
            </Stack>
            {project?.description?.trim() ? (
              <Box
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: alpha(m.navy, 0.02),
                  px: 1.5,
                  py: 1.15,
                  mb: (project.uploads?.length ?? 0) > 0 ? 1.25 : 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.62),
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {project.description}
                </Typography>
              </Box>
            ) : null}
            {(project?.uploads?.length ?? 0) > 0 ? (
              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 12,
                    color: alpha(m.navy, 0.72),
                    mb: 1,
                  }}
                >
                  Uploaded
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {project!.uploads.map((upload) => (
                    <Box
                      key={upload.id}
                      sx={{
                        width: 72,
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: `1px solid ${alpha(m.navy, 0.1)}`,
                        bgcolor: alpha(m.navy, 0.03),
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          height: 72,
                          bgcolor: alpha(m.navy, 0.06),
                          backgroundImage: upload.previewUrl
                            ? `url(${upload.previewUrl})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!upload.previewUrl ? (
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.45),
                              px: 0.5,
                              textAlign: "center",
                            }}
                          >
                            IMG
                          </Typography>
                        ) : null}
                      </Box>
                      <Typography
                        sx={{
                          px: 0.5,
                          py: 0.35,
                          fontSize: 9.5,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.5),
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {upload.name}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Box>
        ) : null}

        <Stack spacing={2}>
          {clientServiceSections.map((section) => renderSectionBlock(section))}

          {modelSections.map((section) =>
            renderSectionBlock(section, section.title),
          )}

          {guestSections.map((section) =>
            renderSectionBlock(
              section,
              section.title.toLowerCase().startsWith("guest")
                ? section.title
                : `Guest: ${section.title}`,
            ),
          )}

          {planningSections.map((section) =>
            renderSectionBlock(section, "Planning Details"),
          )}

          {products.length > 0 ? (
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 12,
                  color: alpha(m.navy, 0.55),
                  mb: 1,
                }}
              >
                Product
              </Typography>
              <Stack spacing={1}>
                {products.map((product) => (
                  <Box
                    key={product.id}
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                      px: 1.5,
                      py: 1.15,
                      bgcolor: "#fff",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1.5}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        sx={{ minWidth: 0, flexWrap: "wrap" }}
                      >
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.82),
                            lineHeight: 1.2,
                          }}
                        >
                          {product.quantity > 1
                            ? `${product.name} ×${product.quantity}`
                            : product.name}
                        </Typography>
                        {editedProductIdSet.has(product.id) ? (
                          <BookingEditedTag variant="edited" />
                        ) : null}
                      </Stack>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.82),
                          flexShrink: 0,
                        }}
                      >
                        €{product.price}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>

        {showKilometerAllowance && kilometerAllowanceAmount > 0 ? (
          <Box sx={{ mt: 2.25 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 10.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: alpha(m.navy, 0.48),
                mb: 0.85,
              }}
            >
              Kilometer Allowance
            </Typography>
            <Box
              sx={{
                px: 1.75,
                py: 1.15,
                borderRadius: "10px",
                bgcolor: "#fff",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 13,
                  color: alpha(m.navy, 0.72),
                }}
              >
                Kilometer Allowance
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 14,
                  color: alpha(m.navy, 0.88),
                }}
              >
                €{kilometerAllowanceAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        ) : null}

        {prepaymentState === "none" ? (
          <Box
            sx={{
              mt:
                showKilometerAllowance && kilometerAllowanceAmount > 0
                  ? 1.5
                  : 2,
            }}
          >
            <Box
              sx={{
                px: 1.75,
                py: 1.25,
                borderRadius: "10px",
                bgcolor: "#fff",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: alpha(m.navy, 0.78),
                }}
              >
                Total Price
              </Typography>
              <Typography
                sx={{
                  fontWeight: 1000,
                  fontSize: 15,
                  color: alpha(m.navy, 0.9),
                }}
              >
                {total.toFixed(0)}€
              </Typography>
            </Box>
            {acceptedChangesNote ? (
              <OutcomeChangesNoteBlock
                note={acceptedChangesNote}
                variant="accepted"
              />
            ) : null}
            {rejectedChangesNote ? (
              <OutcomeChangesNoteBlock
                note={rejectedChangesNote}
                variant="rejected"
              />
            ) : null}
          </Box>
        ) : null}

        {prepaymentState === "required" ? (
          <Box
            sx={{
              mt:
                showKilometerAllowance && kilometerAllowanceAmount > 0
                  ? 1.5
                  : 2,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.1, px: 0.25 }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: alpha(m.navy, 0.78),
                }}
              >
                Total Price
              </Typography>
              <Typography
                sx={{
                  fontWeight: 1000,
                  fontSize: 15,
                  color: alpha(m.navy, 0.9),
                }}
              >
                {total.toFixed(0)}€
              </Typography>
            </Stack>
            {acceptedChangesNote ? (
              <OutcomeChangesNoteBlock
                note={acceptedChangesNote}
                variant="accepted"
              />
            ) : null}
            {rejectedChangesNote ? (
              <OutcomeChangesNoteBlock
                note={rejectedChangesNote}
                variant="rejected"
              />
            ) : null}
            <Paper
              elevation={0}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: alpha(m.navy, 0.03),
                px: 1.75,
                py: 1.35,
                mt: acceptedChangesNote || rejectedChangesNote ? 1.25 : 0,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 1.1 }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: alpha(m.navy, 0.72),
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  Prepayment Required ({prepaymentPercent}%)
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ flexShrink: 0 }}
                >
                  {onPayNow ? (
                    <Typography
                      component="button"
                      type="button"
                      onClick={onPayNow}
                      sx={{
                        border: 0,
                        bgcolor: "transparent",
                        p: 0,
                        cursor: "pointer",
                        color: m.teal,
                        fontWeight: 900,
                        fontSize: 12.5,
                        fontFamily: "inherit",
                        "&:hover": { color: m.tealDark },
                      }}
                    >
                      {payNowLabel}
                    </Typography>
                  ) : null}
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: 13,
                      color: alpha(m.navy, 0.88),
                      minWidth: 72,
                      textAlign: "right",
                    }}
                  >
                    €{prepaidAmount.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: alpha(m.navy, 0.62),
                  }}
                >
                  Remaining After Prepayment
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13,
                    color: alpha(m.navy, 0.88),
                  }}
                >
                  €{remaining.toFixed(2)}
                </Typography>
              </Stack>
            </Paper>
          </Box>
        ) : null}

        {prepaymentState === "paid" ? (
          <Box
            sx={{
              mt:
                showKilometerAllowance && kilometerAllowanceAmount > 0
                  ? 1.5
                  : 2,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.1, px: 0.25 }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: alpha(m.navy, 0.78),
                }}
              >
                Total Price
              </Typography>
              <Typography
                sx={{
                  fontWeight: 1000,
                  fontSize: 15,
                  color: alpha(m.navy, 0.9),
                }}
              >
                {total.toFixed(0)}€
              </Typography>
            </Stack>
            {acceptedChangesNote ? (
              <OutcomeChangesNoteBlock
                note={acceptedChangesNote}
                variant="accepted"
              />
            ) : null}
            {rejectedChangesNote ? (
              <OutcomeChangesNoteBlock
                note={rejectedChangesNote}
                variant="rejected"
              />
            ) : null}
            <Paper
              elevation={0}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: alpha(m.navy, 0.03),
                px: 1.75,
                py: 1.35,
                mt: acceptedChangesNote || rejectedChangesNote ? 1.25 : 0,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.1 }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  Prepaid ({prepaymentPercent}%)
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13,
                    color: alpha(m.navy, 0.88),
                  }}
                >
                  -{prepaidAmount.toFixed(2)}€
                </Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: alpha(m.navy, 0.62),
                  }}
                >
                  Remaining
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13,
                    color: alpha(m.navy, 0.88),
                  }}
                >
                  €{remaining.toFixed(2)}
                </Typography>
              </Stack>
            </Paper>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
