"use client";

import * as React from "react";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Avatar, Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import {
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "../../../app/clients/booking/booking-time";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import BookingEditedTag, { BookingChangeTags } from "../calendar/BookingEditedTag";
import type { BookingEditTagVariant } from "../calendar/bookingRequestNegotiation";
import { resolveLineChangeTags } from "../calendar/bookingRequestNegotiation";
import {
  bookingParticipantDisplayHeading,
  participantHeadingOrdinal,
  participantOrdinals,
  planningScheduleMeta,
  resolveTeamMemberFirstName,
} from "./buildBookingSummarySections";
import {
  extraBookingParticipantIds,
  resolveBookingLineOwnerId,
} from "../../../data/bookingChronologicalBlocks";
import BookingLineAmount from "../calendar/BookingLineAmount";
import { clientLineDiscountLabel } from "../../../data/bookingLinePricing";
import { BodyText } from "../../ui/typography";
import type { ClientBookingDraft, ClientBookingSummarySection } from "./types";

type CatalogItem = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  originalPrice?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
  discountPct?: number;
  guestId?: string | null;
};

type Props = {
  chronologicalSections: ClientBookingSummarySection[];
  draft: ClientBookingDraft | null;
  catalogProducts: CatalogItem[];
  catalogUniqueItems: CatalogItem[];
  editedServiceIds: readonly string[];
  addedServiceIds: readonly string[];
  cancelledServiceIds: readonly string[];
  updatedGuestIds: readonly string[];
  updatedServiceIds: readonly string[];
  editedProductIds: readonly string[];
  addedProductIds: readonly string[];
  cancelledProductIds: readonly string[];
  changesAwaitingApproval: boolean;
  scheduleChangeTags: readonly BookingEditTagVariant[];
  editTagSignpostTitle?: string;
  onEditTagSignpostClick?: () => void;
};

export default function ClientBookingPaymentChronology({
  chronologicalSections,
  draft,
  catalogProducts,
  catalogUniqueItems,
  editedServiceIds,
  addedServiceIds,
  cancelledServiceIds,
  updatedGuestIds,
  updatedServiceIds,
  editedProductIds,
  addedProductIds,
  cancelledProductIds,
  changesAwaitingApproval,
  scheduleChangeTags,
  editTagSignpostTitle,
  onEditTagSignpostClick,
}: Props) {
  const m = useTheme().palette.mollure;
  const bookingStartMinutes = React.useMemo(
    () =>
      draft?.selectedTime ? parseTimeLabelToMinutes(draft.selectedTime) : 0,
    [draft?.selectedTime],
  );
  const catalogHeadingSx = {
    ...mollureLabelSx(m.navy),
    mb: 1,
  } as const;
  const nestedCardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: m.white,
    px: 1.5,
    py: 1.25,
  } as const;

  const serviceChangeTags = React.useCallback(
    (serviceId: string) => {
      const erTags = resolveLineChangeTags(serviceId, {
        editedIds: editedServiceIds,
        addedIds: addedServiceIds,
        cancelledIds: cancelledServiceIds,
        awaitingApproval: changesAwaitingApproval,
      });
      if (erTags.length) return erTags;
      return updatedServiceIds.includes(serviceId) ? ["updated" as const] : [];
    },
    [
      addedServiceIds,
      cancelledServiceIds,
      changesAwaitingApproval,
      editedServiceIds,
      updatedServiceIds,
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

  const requesterSectionKey =
    chronologicalSections.find(
      (section) => section.isRequester || section.participantType === "requester",
    )?.key ?? "";
  const requesterParticipantId =
    chronologicalSections.find(
      (section) => section.isRequester || section.participantType === "requester",
    )?.participantId ||
    String(requesterSectionKey).split("::")[0] ||
    "requester";
  const extraParticipantIds = React.useMemo(
    () => extraBookingParticipantIds(draft?.people),
    [draft?.people],
  );

  const catalogItemsForSection = (
    items: CatalogItem[],
    section: ClientBookingSummarySection,
  ) => {
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
      const ownerId = resolveBookingLineOwnerId(
        item.guestId,
        requesterParticipantId,
        extraParticipantIds,
      );
      return ownerId === participantId || ownerId === section.key;
    });
  };

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
            <BodyText
              sx={{
                m: 0,
                fontSize: 13,
                fontWeight: 900,
                color: alpha(m.navy, 0.86),
                lineHeight: 1.25,
              }}
            >
              {service.name}
            </BodyText>
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
                <BodyText
                  sx={{
                    m: 0,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.48),
                  }}
                >
                  By {teamFirst}
                </BodyText>
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

  const renderCatalogItem = (item: CatalogItem) => (
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
          <BodyText
            sx={{
              m: 0,
              fontSize: 13,
              fontWeight: 900,
              color: alpha(m.navy, 0.86),
              lineHeight: 1.25,
            }}
          >
            {item.quantity && item.quantity > 1
              ? `${item.name} ×${item.quantity}`
              : item.name}
          </BodyText>
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

  const renderPersonHeader = (name: string, showUpdated?: boolean) => (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{ mb: 1.15 }}
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          bgcolor: alpha(m.teal, 0.12),
          color: m.teal,
          fontWeight: 900,
          fontSize: 14,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <BodyText
        sx={{
          m: 0,
          fontWeight: 900,
          fontSize: 13,
          color: m.headingText,
        }}
      >
        {name}
      </BodyText>
      {showUpdated ? <BookingEditedTag variant="updated" /> : null}
    </Stack>
  );

  const renderCatalogGroup = (heading: string, items: CatalogItem[]) => {
    if (!items.length) return null;
    return (
      <Box>
        <BodyText sx={catalogHeadingSx}>{heading}</BodyText>
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
    hideRoleHeading?: boolean,
  ) => {
    const services = section.items;
    const products = catalogItemsForSection(catalogProducts, section);
    const uniqueItems = catalogItemsForSection(catalogUniqueItems, section);
    const personName = section.title?.trim() || "";
    const roleHeading = heading?.trim() || "";
    const showInnerName = asPersonCard && Boolean(personName || roleHeading);
    const participantId =
      section.participantId ||
      String(section.key).split("::")[0] ||
      section.key;
    const isFirstPersonBlock =
      chronologicalSections.find((row) => {
        const rowId =
          row.participantId || String(row.key).split("::")[0] || row.key;
        return rowId === participantId;
      })?.key === section.key;
    const isIdentityPerson =
      section.participantType === "guest" ||
      section.participantType === "model";
    const showGuestUpdated =
      isFirstPersonBlock &&
      isIdentityPerson &&
      updatedGuestIds.includes(String(participantId));
    return (
      <Box key={section.key}>
        {asPersonCard && roleHeading && !hideRoleHeading ? (
          <BodyText
            sx={{
              m: 0,
              fontSize: 12,
              fontWeight: 900,
              color: alpha(m.navy, 0.65),
              mb: 0.75,
            }}
          >
            {roleHeading}
          </BodyText>
        ) : !asPersonCard && roleHeading && !hideRoleHeading ? (
          <BodyText
            sx={{
              m: 0,
              fontSize: 12,
              fontWeight: 900,
              color: alpha(m.navy, 0.65),
              mb: 1,
            }}
          >
            {roleHeading}
          </BodyText>
        ) : null}
        <Box sx={asPersonCard ? nestedCardSx : undefined}>
          {showInnerName
            ? renderPersonHeader(personName || roleHeading, showGuestUpdated)
            : null}
          <Stack spacing={1.5}>
            {(() => {
              const meta = planningScheduleMeta(section);
              const rawActivity = section.planningItem?.activity?.trim() || "";
              const activity =
                rawActivity &&
                rawActivity.toLowerCase() !== "buffer" &&
                rawActivity !== roleHeading &&
                rawActivity !== personName
                  ? rawActivity
                  : "";
              const isTimedParticipant =
                section.participantType === "buffer" ||
                section.participantType === "planning";
              const showSchedule =
                isTimedParticipant ||
                Boolean(activity) ||
                (services.length > 0 &&
                  (Boolean(meta.timeRange) || Boolean(meta.durationLabel)));
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
                    <BodyText
                      sx={{
                        m: 0,
                        ...mollureLabelSx(m.navy),
                        mb: 0.35,
                      }}
                    >
                      {activity}
                    </BodyText>
                  ) : null}
                  {meta.timeRange ||
                  meta.durationLabel ||
                  section.teamMemberLabel ? (
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
                <BodyText sx={catalogHeadingSx}>Service</BodyText>
                <Stack spacing={1}>
                  {services.map((service) => renderService(service, section))}
                </Stack>
              </Box>
            ) : null}
            {renderCatalogGroup("Product", products)}
            {renderCatalogGroup("Unique item", uniqueItems)}
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
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
          const hideRoleHeading =
            isRequester && requesterAppearanceIndex === 0;
          return renderSectionBlock(
            section,
            heading,
            asPersonCard,
            hideRoleHeading,
          );
        });
      })()}

      {chronologicalSections.length === 0 ? (
        <>
          {renderCatalogGroup("Product", catalogProducts)}
          {renderCatalogGroup("Unique item", catalogUniqueItems)}
        </>
      ) : null}
    </Stack>
  );
}
