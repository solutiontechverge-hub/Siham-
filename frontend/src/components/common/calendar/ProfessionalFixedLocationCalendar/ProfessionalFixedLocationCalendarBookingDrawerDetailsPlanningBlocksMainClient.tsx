"use client";

import { Avatar, Box, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BodyText } from "../../../ui/typography";
import { mollureLabelSx } from "../../../../theme/mollureHierarchy";
import { participantRoleHeading } from "../../client-booking/buildBookingSummarySections";
import BookingDrawerSelectedItemsSection from "../BookingDrawerSelectedItemsSection";
import BookingNoShowTag, { isParticipantMarkedNoShow } from "../BookingNoShowTag";
import { ACTIVITY_COMPARISON_SIGNPOST } from "../buildActivityComparison";
import type { ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksBag } from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocks";

type Props = {
  bag: Pick<
    ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksBag,
    | "beginExistingBookingEdit"
    | "canEditBookingLineItems"
    | "changeBookingServiceStaff"
    | "getServiceStaffOptions"
    | "incomingRequestEditMode"
    | "m"
    | "openBookingStaffProfile"
    | "openDrawerLineTagComparison"
    | "openEditServiceFromLineItem"
    | "removeClientService"
    | "reorderClientServices"
    | "resolveBookingStaff"
    | "resolveProductEditTag"
    | "resolveServiceEditTag"
    | "resourceNameById"
    | "selectedClient"
    | "showLineItemRemoveButton"
    | "theme"
    | "viewingBookingEvent"
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  block: { services: any[] };
};

/** Main-client services card inside PlanningBlocks (ponytail: clean map branch). */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksMainClient({
  bag,
  block,
}: Props) {
  const {
    beginExistingBookingEdit,
    canEditBookingLineItems,
    changeBookingServiceStaff,
    getServiceStaffOptions,
    incomingRequestEditMode,
    m,
    openBookingStaffProfile,
    openDrawerLineTagComparison,
    openEditServiceFromLineItem,
    removeClientService,
    reorderClientServices,
    resolveBookingStaff,
    resolveProductEditTag,
    resolveServiceEditTag,
    resourceNameById,
    selectedClient,
    showLineItemRemoveButton,
    theme,
    viewingBookingEvent,
  } = bag;

  if (!block.services.length) return null;
  const clientMarkedNoShow = isParticipantMarkedNoShow(
    "client",
    viewingBookingEvent?.details?.noShowParticipantIds,
  );

  return (
    <Box>
      <BodyText
        sx={{
          fontSize: 12,
          fontWeight: 900,
          color: alpha(m.navy, 0.65),
          mb: 0.75,
        }}
      >
        {participantRoleHeading("requester")}
      </BodyText>
      <Box
        sx={{
          borderRadius: "12px",
          bgcolor: theme.palette.secondary.main,
          border: `1px solid ${alpha(m.teal, 0.22)}`,
          p: 1.5,
        }}
      >
        <Stack spacing={1.25}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.15}
            sx={{ minWidth: 0 }}
          >
            <Avatar
              src="/images/testimonial.webp"
              sx={{ width: 34, height: 34 }}
            >
              {(selectedClient?.name ?? "Client").slice(0, 1).toUpperCase()}
            </Avatar>
            <BodyText
              sx={{
                ...mollureLabelSx(m.navy),
                lineHeight: 1.2,
              }}
            >
              {selectedClient?.name ?? "Client"}
            </BodyText>
            {clientMarkedNoShow ? <BookingNoShowTag /> : null}
          </Stack>
          <BookingDrawerSelectedItemsSection
            nested
            services={block.services}
            products={[]}
            uniqueItems={[]}
            showRemoveButtons={showLineItemRemoveButton}
            onReorderServices={
              showLineItemRemoveButton ? reorderClientServices : undefined
            }
            resolveStaffName={(staffResourceId) =>
              staffResourceId
                ? resourceNameById.get(staffResourceId)
                : undefined
            }
            resolveStaff={resolveBookingStaff}
            onStaffClick={openBookingStaffProfile}
            staffOptionsForService={
              canEditBookingLineItems ? getServiceStaffOptions : undefined
            }
            onStaffChange={
              canEditBookingLineItems ? changeBookingServiceStaff : undefined
            }
            resolveServiceEditTag={resolveServiceEditTag}
            resolveProductEditTag={resolveProductEditTag}
            editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
            onEditTagSignpostClick={openDrawerLineTagComparison}
            onRemoveService={removeClientService}
            onEditService={
              canEditBookingLineItems
                ? (service) => {
                    beginExistingBookingEdit();
                    openEditServiceFromLineItem(service, "client");
                  }
                : undefined
            }
            onServiceClick={
              incomingRequestEditMode
                ? (service) => {
                    openEditServiceFromLineItem(service, "client");
                  }
                : undefined
            }
          />
        </Stack>
      </Box>
    </Box>
  );
}
