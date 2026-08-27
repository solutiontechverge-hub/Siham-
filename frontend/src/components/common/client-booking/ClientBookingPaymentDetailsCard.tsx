"use client";

import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Avatar, Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  fmtMinutesToTimeLabel,
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "../../../app/clients/booking/booking-time";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import BookingEditedTag from "../calendar/BookingEditedTag";
import BookingTotalPriceCard from "../calendar/BookingTotalPriceCard";
import { summarizeClientBookingPrice } from "../calendar/bookingTotal";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";
import type { BookingEditTagVariant } from "../calendar/bookingRequestNegotiation";
import {
  buildBookingSummarySections,
  resolveTeamMemberFirstName,
} from "./buildBookingSummarySections";
import { locationModeChipSx } from "./locationModeChipSx";
import ProjectUploadThumb from "./ProjectUploadThumb";
import type { BookingEditSuggestedProduct } from "./bookingEditRequest";
import type { ClientBookingDraft, ClientBookingSummarySection } from "./types";
import BookingSummaryNote from "./BookingSummaryNote";
import BookingLineAmount from "../calendar/BookingLineAmount";
import { clientLineDiscountLabel } from "../../../data/bookingLinePricing";

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
  discount?: ManualEntryDiscount | null;
  showLateCancellation?: boolean;
  lateCancellationFeePercent?: number | string;
  showLateRescheduling?: boolean;
  lateRescheduleFeePercent?: number | string;
  editedServiceIds?: readonly string[];
  addedServiceIds?: readonly string[];
  cancelledServiceIds?: readonly string[];
  cancelledServices?: ReadonlyArray<ClientBookingDraft["services"][number]>;
  products?: readonly BookingEditSuggestedProduct[];
  editedProductIds?: readonly string[];
  onPayNow?: () => void;
  shopName?: string;
  locationMode?: "fixed" | "desired";
  addressLabel?: string;
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
  discount = null,
  showLateCancellation = false,
  lateCancellationFeePercent,
  showLateRescheduling = false,
  lateRescheduleFeePercent,
  editedServiceIds = [],
  addedServiceIds = [],
  cancelledServiceIds = [],
  cancelledServices = [],
  products = [],
  editedProductIds = [],
  onPayNow,
  shopName,
  locationMode = "fixed",
  addressLabel,
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
  const bookingEndMinutes =
    bookingStartMinutes +
    (draft?.services ?? []).reduce((sum, s) => sum + s.durationMins, 0);
  const dateLabel = React.useMemo(() => {
    if (!draft?.selectedDateISO) return "";
    const dt = new Date(`${draft.selectedDateISO}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return draft.selectedDateISO;
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [draft?.selectedDateISO]);
  const editedServiceIdSet = React.useMemo(
    () => new Set(editedServiceIds),
    [editedServiceIds],
  );
  const addedServiceIdSet = React.useMemo(
    () => new Set(addedServiceIds),
    [addedServiceIds],
  );
  const cancelledServiceIdSet = React.useMemo(
    () => new Set(cancelledServiceIds),
    [cancelledServiceIds],
  );
  const editedProductIdSet = React.useMemo(
    () => new Set(editedProductIds),
    [editedProductIds],
  );

  const serviceChangeTag = React.useCallback(
    (serviceId: string): BookingEditTagVariant | null => {
      if (cancelledServiceIdSet.has(serviceId)) return "cancelled";
      if (addedServiceIdSet.has(serviceId)) return "added";
      if (editedServiceIdSet.has(serviceId)) return "edited";
      return null;
    },
    [addedServiceIdSet, cancelledServiceIdSet, editedServiceIdSet],
  );

  const listedProducts = products.length
    ? products
    : (draft?.products ?? []);
  const extrasAmount =
    showKilometerAllowance && kilometerAllowanceAmount > 0
      ? kilometerAllowanceAmount
      : 0;
  const showPrepayment =
    prepaymentState !== "none" && prepaymentPercent > 0;
  const prepaymentPaid = prepaymentState === "paid";
  const priceSummary = summarizeClientBookingPrice({
    services: draft?.services,
    people: draft?.people,
    products: listedProducts,
    extrasAmount,
    discount,
    showLateCancellation,
    lateCancellationFeePercent,
    showLateRescheduling,
    lateRescheduleFeePercent,
    showPrepayment,
    prepaymentPercent,
    prepaymentPaid,
  });
  const prepaidAmount = priceSummary.breakdown.prepaymentAmount;
  const remaining = priceSummary.breakdown.remainingAfterPrepayment;
  const priceSummaryLines = priceSummary.lines;

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

  const attachCancelled = (
    section: ClientBookingSummarySection,
  ): ClientBookingSummarySection => {
    const extra = cancelledServices.filter((s) => {
      if (section.isRequester || section.participantType === "requester") {
        return !s.guestId || s.guestId === section.key;
      }
      return s.guestId === section.key;
    });
    if (!extra.length) return section;
    const existing = new Set(section.items.map((item) => item.id));
    return {
      ...section,
      items: [
        ...section.items,
        ...extra.filter((item) => !existing.has(item.id)),
      ],
    };
  };

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
    const changeTag = serviceChangeTag(service.id);

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
          alignItems="center"
          spacing={1.5}
        >
          <Box sx={{ minWidth: 0 }}>
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
            {changeTag ? (
              <Box sx={{ mt: 0.7 }}>
                <BookingEditedTag variant={changeTag} />
              </Box>
            ) : null}
          </Box>
          <BookingLineAmount
            amount={service.price}
            originalAmount={service.originalPrice}
            discountLabel={clientLineDiscountLabel(service)}
          />
        </Stack>
      </Box>
    );
  };

  const renderPersonHeader = (name: string) => (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{ mb: 1.15 }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: alpha(m.teal, 0.12),
          color: m.teal,
          fontWeight: 900,
          fontSize: 15,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Typography
        sx={{ fontWeight: 900, fontSize: 14, color: m.headingText }}
      >
        {name}
      </Typography>
    </Stack>
  );

  const nestedCardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: m.white,
    px: 1.5,
    py: 1.25,
  } as const;

  const renderSectionBlock = (
    section: ClientBookingSummarySection,
    heading?: string,
    asPersonCard?: boolean,
  ) => (
    <Box key={section.key} sx={asPersonCard ? nestedCardSx : undefined}>
      {asPersonCard
        ? renderPersonHeader(heading || section.title)
        : heading ? (
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
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.18)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2, pb: 1.25 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "30px",
            color: alpha(m.navy, 0.72),
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          Service Summary
        </Typography>
      </Box>
      <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />

      {shopName || addressLabel ? (
        <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 1.35, pb: 1.5 }}>
          {shopName ? (
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 18,
                color: alpha(m.navy, 0.88),
                lineHeight: 1.2,
              }}
            >
              {shopName}
            </Typography>
          ) : null}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mt: 0.85 }}
          >
            {dateLabel ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.6}
                sx={{ minWidth: 0, flexShrink: 0 }}
              >
                <AccessTimeRoundedIcon
                  sx={{ fontSize: 16, color: m.teal, flexShrink: 0 }}
                />
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: alpha(m.teal, 0.95),
                    fontSize: 12.5,
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                  }}
                >
                  {dateLabel} ({fmtMinutesToTimeLabel(bookingStartMinutes)}-
                  {fmtMinutesToTimeLabel(bookingEndMinutes)})
                </Typography>
              </Stack>
            ) : null}
            {addressLabel ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: "auto",
                  maxWidth: { xs: "46%", sm: "50%" },
                  flex: "0 1 auto",
                  minWidth: 0,
                }}
              >
                <LocationOnOutlinedIcon
                  sx={{
                    fontSize: 16,
                    width: 16,
                    height: 16,
                    color: alpha(m.navy, 0.45),
                    flexShrink: 0,
                    display: "block",
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                    fontSize: 12,
                    lineHeight: 1.2,
                    minWidth: 0,
                  }}
                >
                  {addressLabel}
                </Typography>
              </Box>
            ) : null}
          </Stack>
          <Chip
            label={locationMode === "desired" ? "Desired Location" : "Fixed Location"}
            size="small"
            sx={{ ...locationModeChipSx, mt: 0.75 }}
          />
        </Box>
      ) : null}
      <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />

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
          <Box
            sx={{
              mb: 2.25,
              ...nestedCardSx,
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 14,
                color: m.headingText,
                mb: 1,
              }}
            >
              Project Details and Media
            </Typography>
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
                    color: m.headingText,
                    mb: 1,
                  }}
                >
                  Media
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {project!.uploads.map((upload) => (
                    <ProjectUploadThumb
                      key={upload.id}
                      upload={upload}
                      width={72}
                      height={72}
                    />
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Box>
        ) : null}

        <Stack spacing={2}>
          {clientServiceSections.map((section) =>
            renderSectionBlock(attachCancelled(section)),
          )}

          {modelSections.map((section) =>
            renderSectionBlock(
              attachCancelled(section),
              section.title,
              true,
            ),
          )}

          {guestSections.map((section) =>
            renderSectionBlock(attachCancelled(section), section.title, true),
          )}

          {planningSections.map((section) =>
            renderSectionBlock(
              attachCancelled(section),
              "Planning Details",
              true,
            ),
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
                      alignItems="center"
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
                      <BookingLineAmount
                        amount={product.price}
                        originalAmount={product.originalPrice}
                        discountLabel={clientLineDiscountLabel(product)}
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>

        <Box sx={{ mt: 2 }}>
          <BookingTotalPriceCard
            totalPrice={priceSummary.displayTotal}
            originalPrice={priceSummary.originalPrice}
            discountAmount={priceSummary.breakdown.discountAmount}
            lines={priceSummaryLines}
            prepaidPercent={
              prepaymentState === "none" ? undefined : prepaymentPercent
            }
            prepaidAmount={prepaymentState === "none" ? 0 : prepaidAmount}
            remainingAmount={
              prepaymentState === "none" ? undefined : remaining
            }
            prepaidAction={
              prepaymentState === "required" && onPayNow ? (
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
              ) : undefined
            }
          />
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

        {draft?.clientNote?.trim() ? (
          <Box sx={{ mt: 1.5 }}>
            <BookingSummaryNote note={draft.clientNote} />
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
