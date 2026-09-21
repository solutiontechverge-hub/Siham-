"use client";

import { mollureLabelSx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import { Box, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BookingPriceBreakdown from "../booking-finance/BookingPriceBreakdown";
import {
  lineDiscountAmountFromItems,
  partitionBookingProducts,
  summarizeClientBookingPrice,
} from "../calendar/bookingTotal";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";
import type { BookingEditTagVariant } from "../calendar/bookingRequestNegotiation";
import { buildBookingSummarySections } from "./buildBookingSummarySections";
import ProjectUploadThumb from "./ProjectUploadThumb";
import type { BookingEditSuggestedProduct } from "./bookingEditRequest";
import type { ClientBookingDraft, ClientBookingSummarySection } from "./types";
import BookingSummaryNote from "./BookingSummaryNote";
import { BodyText } from "../../ui/typography";
import OutcomeChangesNoteBlock, {
  type OutcomeChangesNote,
} from "./OutcomeChangesNoteBlock";
import ClientBookingPaymentChronology from "./ClientBookingPaymentChronology";

export type ClientBookingPrepaymentState = "none" | "required" | "paid";

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
  /** First-visit silent Updated chips — never mixed with ER Edited/Added/Cancelled. */
  updatedGuestIds?: readonly string[];
  updatedServiceIds?: readonly string[];
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
  updatedGuestIds = [],
  updatedServiceIds = [],
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

  const nestedCardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: m.white,
    px: 1.5,
    py: 1.25,
  } as const;
  /** Soft grey panel — same token as BookingStartEndTimeRow. */
  const softPanelSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: alpha(m.navy, 0.04),
    px: 1.5,
    py: 1.25,
  } as const;

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
        <BodyText
          sx={{
            m: 0,
            fontWeight: 900,
            fontSize: 13,
            color: alpha(m.navy, 0.82),
            mb: 1.35,
          }}
        >
          Booking & Payment Details
        </BodyText>

        {hasProject ? (
          <Box
            sx={{
              mb: 2.25,
              ...nestedCardSx,
            }}
          >
            <BodyText
              sx={{
                m: 0,
                fontWeight: 900,
                fontSize: 13,
                color: m.headingText,
                mb: 1,
              }}
            >
              Project Details and Media
            </BodyText>
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
                <BodyText
                  sx={{
                    m: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.62),
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {project.description}
                </BodyText>
              </Box>
            ) : null}
            {(project?.uploads?.length ?? 0) > 0 ? (
              <Box>
                <BodyText
                  sx={{
                    m: 0,
                    fontWeight: 900,
                    fontSize: 12,
                    color: m.headingText,
                    mb: 1,
                  }}
                >
                  Media
                </BodyText>
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

        <ClientBookingPaymentChronology
          chronologicalSections={chronologicalSections}
          draft={draft}
          catalogProducts={catalogProducts}
          catalogUniqueItems={catalogUniqueItems}
          requesterName={requesterName}
          requesterEmail={requesterEmail}
          requesterAvatarUrl={requesterAvatarUrl}
          editedServiceIds={editedServiceIds}
          addedServiceIds={addedServiceIds}
          cancelledServiceIds={cancelledServiceIds}
          updatedGuestIds={updatedGuestIds}
          updatedServiceIds={updatedServiceIds}
          editedProductIds={editedProductIds}
          addedProductIds={addedProductIds}
          cancelledProductIds={cancelledProductIds}
          changesAwaitingApproval={changesAwaitingApproval}
          scheduleChangeTags={scheduleChangeTags}
          editTagSignpostTitle={editTagSignpostTitle}
          onEditTagSignpostClick={onEditTagSignpostClick}
        />

        <Box
          sx={{
            mt: 2,
            ...softPanelSx,
            // plain variant adds a separator for non-panel layouts — drop it inside the grey panel
            "& > .MuiBox-root": { borderTop: "none", pt: 0, mt: 0 },
          }}
        >
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
            prepaymentPaid={prepaymentPaid}
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
                <BodyText
                  component="button"
                  type="button"
                  onClick={onPayNow}
                  sx={mollureLabelSx(m.navy, { border: 0, bgcolor: "transparent", p: 0, cursor: "pointer", color: m.teal, fontFamily: "inherit", "&:hover": { color: m.tealDark } })}
                >
                  {payNowLabel}
                </BodyText>
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
