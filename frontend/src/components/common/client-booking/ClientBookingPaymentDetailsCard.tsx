"use client";

import * as React from "react";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "../../../app/clients/booking/booking-time";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import { BookingChangeTags } from "../calendar/BookingEditedTag";
import BookingPriceBreakdown from "../booking-finance/BookingPriceBreakdown";
import {
  lineDiscountAmountFromItems,
  partitionBookingProducts,
  summarizeClientBookingPrice,
} from "../calendar/bookingTotal";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";
import type { BookingEditTagVariant } from "../calendar/bookingRequestNegotiation";
import { resolveLineChangeTags } from "../calendar/bookingRequestNegotiation";
import {
  buildBookingSummarySections,
  bookingParticipantDisplayHeading,
  participantHeadingOrdinal,
  participantOrdinals,
  planningScheduleMeta,
  resolveTeamMemberFirstName,
} from "./buildBookingSummarySections";
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
  showNoShowFee?: boolean;
  noShowFeePercent?: number | string;
  editedServiceIds?: readonly string[];
  addedServiceIds?: readonly string[];
  cancelledServiceIds?: readonly string[];
  cancelledServices?: ReadonlyArray<ClientBookingDraft["services"][number]>;
  products?: readonly BookingEditSuggestedProduct[];
  editedProductIds?: readonly string[];
  addedProductIds?: readonly string[];
  cancelledProductIds?: readonly string[];
  /** When true, changed lines also show Pending (client approval outstanding). */
  changesAwaitingApproval?: boolean;
  /** Date/time row tag: Edited, plus Pending while awaiting approval. */
  scheduleChangeTags?: readonly BookingEditTagVariant[];
  editTagSignpostTitle?: string;
  onEditTagSignpostClick?: () => void;
  onPayNow?: () => void;
  /** Extra block under Total Price (payment summary, notes). */
  footer?: React.ReactNode;
  /** Shown under Total Price when professional accepted the client's post-confirm EBR. */
  acceptedChangesNote?: OutcomeChangesNote | null;
  /** Shown under Total Price when professional rejected the client's post-confirm EBR. */
  rejectedChangesNote?: OutcomeChangesNote | null;
  /** Offline prepayment is due at the visit — keep the total undeducted. */
  prepaymentOffline?: boolean;
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
  showNoShowFee = false,
  noShowFeePercent,
  editedServiceIds = [],
  addedServiceIds = [],
  cancelledServiceIds = [],
  cancelledServices = [],
  products = [],
  editedProductIds = [],
  addedProductIds = [],
  cancelledProductIds = [],
  changesAwaitingApproval = false,
  scheduleChangeTags = [],
  editTagSignpostTitle,
  onEditTagSignpostClick,
  onPayNow,
  footer,
  acceptedChangesNote = null,
  rejectedChangesNote = null,
  prepaymentOffline = false,
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

  const serviceChangeTags = React.useCallback(
    (serviceId: string) =>
      resolveLineChangeTags(serviceId, {
        editedIds: editedServiceIds,
        addedIds: addedServiceIds,
        cancelledIds: cancelledServiceIds,
        awaitingApproval: changesAwaitingApproval,
      }),
    [
      addedServiceIds,
      cancelledServiceIds,
      changesAwaitingApproval,
      editedServiceIds,
    ],
  );

  const productChangeTags = React.useCallback(
    (productId: string) =>
      resolveLineChangeTags(productId, {
        editedIds: editedProductIds,
        addedIds: addedProductIds,
        cancelledIds: cancelledProductIds,
        awaitingApproval: changesAwaitingApproval,
      }),
    [
      addedProductIds,
      cancelledProductIds,
      changesAwaitingApproval,
      editedProductIds,
    ],
  );

  const listedProducts = products.length
    ? products
    : (draft?.products ?? []);
  const { products: catalogProducts, uniqueItems: catalogUniqueItems } =
    partitionBookingProducts(listedProducts);
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
    extrasLabel: "Kilometer Allowance",
    discount,
    showLateCancellation,
    lateCancellationFeePercent,
    showLateRescheduling,
    lateRescheduleFeePercent,
    showNoShowFee,
    noShowFeePercent,
    showPrepayment,
    prepaymentPercent,
    prepaymentPaid,
    prepaymentOffline,
  });
  const prepaidAmount = priceSummary.breakdown.prepaymentAmount;
  const remaining = priceSummary.breakdown.remainingAfterPrepayment;
  const lineDiscountAmount = lineDiscountAmountFromItems({
    services: draft?.services,
    products: listedProducts,
  });
  const catalogHeadingSx = {
    fontWeight: 800,
    fontSize: 12,
    color: alpha(m.navy, 0.55),
    mb: 1,
  } as const;

  const fallbackRequesterSection: ClientBookingSummarySection[] =
    sections.length === 0 && (draft?.services?.length ?? 0) > 0
      ? [
          {
            key: "requester-services",
            title: requesterName,
            items: draft!.services,
            isRequester: true,
            participantType: "requester",
            participantId: "requester",
          },
        ]
      : [];

  const attachCancelled = React.useCallback(
    (section: ClientBookingSummarySection): ClientBookingSummarySection => {
      const participantId =
        section.participantId || section.key.split("::")[0] || section.key;
      const extra = cancelledServices.filter((s) => {
        if (section.isRequester || section.participantType === "requester") {
          return !s.guestId || s.guestId === participantId;
        }
        return s.guestId === participantId;
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
    },
    [cancelledServices],
  );

  const chronologicalSections = React.useMemo(
    () =>
      (sections.length ? sections : fallbackRequesterSection).map(
        attachCancelled,
      ),
    [attachCancelled, fallbackRequesterSection, sections],
  );

  const project = draft?.projectDetails;
  const hasProject =
    Boolean(project?.description?.trim()) ||
    (project?.uploads?.length ?? 0) > 0;

  const renderService = (
    service: ClientBookingDraft["services"][number],
    section: ClientBookingSummarySection,
  ) => {
    const teamFirst = resolveTeamMemberFirstName(
      service.teamMemberId,
      draft?.teamMembers,
      service.teamMemberName,
    );
    const sectionStartMinutes = section.startTime
      ? parseTimeLabelToMinutes(section.startTime)
      : bookingStartMinutes;
    const serviceOffset = section.items
      .slice(
        0,
        section.items.findIndex((item) => item.id === service.id),
      )
      .reduce((sum, item) => sum + item.durationMins, 0);
    const serviceStartMinutes = service.startTime
      ? parseTimeLabelToMinutes(service.startTime)
      : sectionStartMinutes + serviceOffset;
    const timeRange = draft?.selectedTime
      ? serviceTimeRangeLabel(serviceStartMinutes, service.durationMins)
      : undefined;
    const changeTags = serviceChangeTags(service.id);

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
            {changeTags.length ? (
              <BookingChangeTags
                variants={changeTags}
                signpostTitle={editTagSignpostTitle}
                onSignpostClick={onEditTagSignpostClick}
              />
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

  const renderCatalogItem = (
    item: {
      id: string;
      name: string;
      price: number;
      quantity?: number;
      originalPrice?: number;
      discountType?: "fixed" | "percentage";
      discountAmount?: number;
      discountPct?: number;
    },
  ) => (
    <Box
      key={item.id}
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
            {item.quantity && item.quantity > 1
              ? `${item.name} ×${item.quantity}`
              : item.name}
          </Typography>
          {(() => {
            const productTags = productChangeTags(item.id);
            return productTags.length ? (
              <BookingChangeTags
                variants={productTags}
                signpostTitle={editTagSignpostTitle}
                onSignpostClick={onEditTagSignpostClick}
              />
            ) : null;
          })()}
        </Stack>
        <BookingLineAmount
          amount={item.price}
          originalAmount={item.originalPrice}
          discountLabel={clientLineDiscountLabel(item)}
        />
      </Stack>
    </Box>
  );

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

  const requesterSectionKey =
    chronologicalSections.find(
      (section) => section.isRequester || section.participantType === "requester",
    )?.key ?? "";

  const catalogItemsForSection = (
    items: typeof catalogProducts,
    section: ClientBookingSummarySection,
  ) => {
    const isRequester = Boolean(
      section.isRequester || section.participantType === "requester",
    );
    const participantId =
      section.participantId ||
      String(section.key).split("::")[0] ||
      section.key;
    const isFirstBlockForPerson =
      chronologicalSections.find((row) => {
        const rowId =
          row.participantId || String(row.key).split("::")[0] || row.key;
        return rowId === participantId;
      })?.key === section.key;
    if (!isFirstBlockForPerson) return [];
    return items.filter((item) => {
      const assigned = String(
        (item as { guestId?: string | null }).guestId ?? "",
      ).trim();
      if (!assigned) return isRequester || section.key === requesterSectionKey;
      return assigned === participantId || assigned === section.key;
    });
  };

  const renderCatalogGroup = (
    heading: string,
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity?: number;
      originalPrice?: number;
      discountType?: "fixed" | "percentage";
      discountAmount?: number;
      discountPct?: number;
    }>,
  ) => {
    if (!items.length) return null;
    return (
      <Box>
        <Typography sx={catalogHeadingSx}>{heading}</Typography>
        <Stack spacing={1}>
          {items.map((item) => renderCatalogItem(item))}
        </Stack>
      </Box>
    );
  };

  const renderSectionBlock = (
    section: ClientBookingSummarySection,
    heading?: string,
    asPersonCard?: boolean,
  ) => {
    const services = section.items;
    const products = catalogItemsForSection(catalogProducts, section);
    const uniqueItems = catalogItemsForSection(catalogUniqueItems, section);
    return (
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
      <Stack spacing={1.5}>
      {(() => {
        const meta = planningScheduleMeta(section);
        const rawActivity = section.planningItem?.activity?.trim() || "";
        const activity =
          rawActivity &&
          rawActivity.toLowerCase() !== "buffer" &&
          rawActivity !== heading
            ? rawActivity
            : "";
        const showSchedule =
          Boolean(activity) ||
          Boolean(meta.timeRange) ||
          Boolean(meta.durationLabel) ||
          section.participantType === "buffer" ||
          section.participantType === "planning";
        if (!showSchedule) return null;
        return (
        <Box
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            px: 1.5,
            py: 1.15,
            bgcolor: "#fff",
          }}
        >
          {activity ? (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 900,
                color: alpha(m.navy, 0.82),
                mb: 0.35,
              }}
            >
              {activity}
            </Typography>
          ) : null}
          {meta.timeRange || meta.durationLabel || section.teamMemberLabel ? (
            <ServiceSummaryMetaLine
              timeRange={meta.timeRange}
              durationLabel={meta.durationLabel}
              staffName={section.teamMemberLabel}
            />
          ) : null}
          {scheduleChangeTags.length ? (
            <BookingChangeTags
              variants={scheduleChangeTags}
              signpostTitle={editTagSignpostTitle}
              onSignpostClick={onEditTagSignpostClick}
            />
          ) : null}
        </Box>
        );
      })()}
      {services.length ? (
        <Box>
          <Typography sx={catalogHeadingSx}>Service</Typography>
          <Stack spacing={1}>
            {services.map((service) => renderService(service, section))}
          </Stack>
        </Box>
      ) : null}
      {renderCatalogGroup("Product", products)}
      {renderCatalogGroup("Unique item", uniqueItems)}
      </Stack>
    </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2, bgcolor: "#fff" }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 16,
            color: alpha(m.navy, 0.82),
            letterSpacing: "-0.01em",
            mb: 1.35,
          }}
        >
          Booking & Payment Details
        </Typography>
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
            bgcolor: "#fff",
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
          {(() => {
            const ordinals = participantOrdinals(chronologicalSections);
            return chronologicalSections.map((section) => {
            const isRequester = Boolean(
              section.isRequester || section.participantType === "requester",
            );
            const requesterAppearanceIndex = chronologicalSections
              .filter(
                (row) => row.isRequester || row.participantType === "requester",
              )
              .findIndex((row) => row.key === section.key);
            const asPersonCard =
              section.participantType === "planning" ||
              section.participantType === "buffer" ||
              section.participantType === "guest" ||
              section.participantType === "model" ||
              (isRequester && requesterAppearanceIndex > 0);
            const heading = bookingParticipantDisplayHeading(
              section,
              participantHeadingOrdinal(section, ordinals),
            );
            return renderSectionBlock(section, heading, asPersonCard);
          });
          })()}

          {chronologicalSections.length === 0 ? (
            <>
              {renderCatalogGroup("Product", catalogProducts)}
              {renderCatalogGroup("Unique item", catalogUniqueItems)}
            </>
          ) : null}
        </Stack>

        <Box sx={{ mt: 2 }}>
          <BookingPriceBreakdown
            totalPrice={priceSummary.breakdown.bookingTotal}
            originalPrice={priceSummary.originalPrice}
            lineDiscountAmount={lineDiscountAmount}
            bookingDiscountAmount={priceSummary.breakdown.discountAmount}
            bookingTotalDiscount={discount}
            lateCancellationFeeAmount={
              priceSummary.breakdown.lateCancellationFeeAmount
            }
            lateRescheduleFeeAmount={
              priceSummary.breakdown.lateRescheduleFeeAmount
            }
            noShowFeeAmount={priceSummary.breakdown.noShowFeeAmount}
            prepaidPercent={
              prepaymentState === "none" ? 0 : prepaymentPercent
            }
            prepaidAmount={prepaymentState === "none" ? 0 : prepaidAmount}
            remainingAmount={
              prepaymentState === "none" ? undefined : remaining
            }
            extraRows={
              extrasAmount > 0
                ? [
                    {
                      id: "kilometer-allowance",
                      label: "Kilometer Allowance",
                      amount: extrasAmount,
                    },
                  ]
                : []
            }
            variant="plain"
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

        {footer ? <Box sx={{ mt: 1.75 }}>{footer}</Box> : null}
      </Box>
    </Paper>
  );
}
