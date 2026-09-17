"use client";

import {
  mollureLabelSx,
  mollureBodySx,
} from "../../../../theme/mollureHierarchy";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import EditRoundedIcon from "@mui/icons-material/EditRounded";

import AddRoundedIcon from "@mui/icons-material/AddRounded";

import {
  Avatar,
  Box,
  ButtonBase,
  IconButton,
  Stack,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import BookingEditedTag from "../BookingEditedTag";

import {
  participantHeadingOrdinal,
  participantRoleHeading,
} from "../../client-booking/buildBookingSummarySections";

import {
  partitionBookingProducts,
} from "../bookingTotal";

import BookingDrawerSelectedItemsSection from "../BookingDrawerSelectedItemsSection";

import BookingDrawerPlanningGroup from "../BookingDrawerPlanningGroup";

import BookingDrawerClientSnapshotSection from "../BookingDrawerClientSnapshotSection";

import {
  ACTIVITY_COMPARISON_SIGNPOST,
} from "../buildActivityComparison";

import {
  addMinutesToTime,
  parseDurationMinsLabel,
  formatTimeWindowDurationLabel,
} from "../../../../data/bookingServiceEdit.data";

import {
  sortCalendarGuestsByCanonicalOrder,
} from "../../../../data/bookingChronologicalBlocks";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";
import ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksMainClient from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksMainClient";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksBag = Pick<
  Vm,
  | "addMenuTarget"
  | "beginEditBuffer"
  | "beginEditInlineGuest"
  | "beginExistingBookingEdit"
  | "bookingGuests"
  | "canEditBookingLineItems"
  | "canMutateDrawerContents"
  | "cancelledServicesForDrawer"
  | "changeBookingServiceStaff"
  | "drawerOrderedBlocks"
  | "drawerParticipantOrdinals"
  | "drawerPlanningGuests"
  | "editingInlineGuestId"
  | "emptyInlineGuestDraft"
  | "firstDrawerPlanningId"
  | "getServiceStaffOptions"
  | "incomingRequestEditMode"
  | "isViewingExisting"
  | "m"
  | "openBookingStaffProfile"
  | "openDrawerLineTagComparison"
  | "openEditBookingProductLine"
  | "openEditBookingUniqueLine"
  | "openEditServiceFromLineItem"
  | "removeClientService"
  | "removeGuestService"
  | "renderInlineGuestFields"
  | "reorderClientServices"
  | "reorderDrawerPlanning"
  | "reorderGuestServices"
  | "resolveBookingStaff"
  | "resolveProductEditTag"
  | "resolveServiceEditTag"
  | "resourceNameById"
  | "selectedClient"
  | "selectedSlot"
  | "setAddMenuTarget"
  | "setBookingGuests"
  | "setEditingInlineGuestId"
  | "setInlineGuestDraft"
  | "setShowInlineGuestField"
  | "setSlotAddMenuAnchor"
  | "showClientRemoveButton"
  | "showInlineGuestField"
  | "showLineItemRemoveButton"
  | "silentFieldUpdates"
  | "slotAddMenuAnchor"
  | "theme"
  | "viewingBookingEvent"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocks({ bag }: Props) {
  const {
    addMenuTarget,
    beginEditBuffer,
    beginEditInlineGuest,
    beginExistingBookingEdit,
    bookingGuests,
    canEditBookingLineItems,
    canMutateDrawerContents,
    cancelledServicesForDrawer,
    changeBookingServiceStaff,
    drawerOrderedBlocks,
    drawerParticipantOrdinals,
    drawerPlanningGuests,
    editingInlineGuestId,
    emptyInlineGuestDraft,
    firstDrawerPlanningId,
    getServiceStaffOptions,
    incomingRequestEditMode,
    isViewingExisting,
    m,
    openBookingStaffProfile,
    openDrawerLineTagComparison,
    openEditBookingProductLine,
    openEditBookingUniqueLine,
    openEditServiceFromLineItem,
    removeClientService,
    removeGuestService,
    renderInlineGuestFields,
    reorderClientServices,
    reorderDrawerPlanning,
    reorderGuestServices,
    resolveBookingStaff,
    resolveProductEditTag,
    resolveServiceEditTag,
    resourceNameById,
    selectedClient,
    selectedSlot,
    setAddMenuTarget,
    setBookingGuests,
    setEditingInlineGuestId,
    setInlineGuestDraft,
    setShowInlineGuestField,
    setSlotAddMenuAnchor,
    showClientRemoveButton,
    showInlineGuestField,
    showLineItemRemoveButton,
    silentFieldUpdates,
    slotAddMenuAnchor,
    theme,
    viewingBookingEvent,
  } = bag;

  return (
    <>
            <BookingDrawerClientSnapshotSection
              snapshot={
                viewingBookingEvent?.details?.clientSnapshot ?? null
              }
              hiddenPersonIds={bookingGuests.map((guest) => guest.id)}
            />

            {drawerOrderedBlocks.map((block) => {
              if (block.isMainClient) {
                return (
                  <ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocksMainClient
                    key={block.key}
                    bag={bag}
                    block={block}
                  />
                );
              }

              const guest = bookingGuests.find(
                (item) => item.id === block.guestId,
              );
              if (!guest) return null;
              const isFirstGuestBlock =
                drawerOrderedBlocks.find(
                  (row) => row.guestId === guest.id,
                )?.key === block.key;
              const isLastGuestBlock =
                [...drawerOrderedBlocks]
                  .reverse()
                  .find((row) => row.guestId === guest.id)?.key ===
                block.key;
              const participantKind =
                guest.participantType ?? "guest";
              if (
                participantKind === "planning" ||
                guest.name === "Planning"
              ) {
                if (guest.id !== firstDrawerPlanningId) return null;
                return (
                  <Box data-booking-section={guest.id}>
                  <BookingDrawerPlanningGroup
                    key="planning-group"
                    items={drawerPlanningGuests}
                    disabled={isViewingExisting}
                    showRemove={showLineItemRemoveButton}
                    onDurationChange={(id, value) => {
                      setBookingGuests((prev) =>
                        sortCalendarGuestsByCanonicalOrder(
                          prev.map((item) => {
                            if (item.id !== id) return item;
                            const durationMins =
                              parseDurationMinsLabel(value);
                            const startTime =
                              item.planningStartTime?.trim() ||
                              selectedSlot?.start?.slice(0, 5) ||
                              "";
                            return {
                              ...item,
                              name: "Planning",
                              planningDuration: value,
                              planningStartTime:
                                startTime || item.planningStartTime,
                              planningEndTime:
                                startTime && durationMins
                                  ? addMinutesToTime(
                                      startTime,
                                      durationMins,
                                    )
                                  : undefined,
                            };
                          }),
                        ),
                      );
                    }}
                    onRemove={(id) => {
                      setBookingGuests((prev) =>
                        prev.filter((item) => item.id !== id),
                      );
                      if (addMenuTarget === id)
                        setSlotAddMenuAnchor(null);
                    }}
                    onReorder={
                      showLineItemRemoveButton
                        ? reorderDrawerPlanning
                        : undefined
                    }
                  />
                  </Box>
                );
              }
              const headingKind =
                participantKind === "notes"
                  ? undefined
                  : participantKind;
              const sectionLabel = participantRoleHeading(
                headingKind,
                participantHeadingOrdinal(
                  {
                    participantType: headingKind,
                    participantId: guest.id,
                    key: block.key,
                  },
                  drawerParticipantOrdinals,
                ),
              );
              const guestCatalog = partitionBookingProducts(
                guest.products,
              );
              const guestDurationLabel =
                formatTimeWindowDurationLabel(
                  guest.planningStartTime || guest.bufferStartTime,
                  guest.planningEndTime || guest.bufferEndTime,
                  guest.planningDuration,
                );
              return (
              <Box key={block.key} data-booking-section={guest.id}>
                <BodyText
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: alpha(m.navy, 0.65),
                    mb: 0.75,
                  }}
                >
                  {sectionLabel}
                </BodyText>
                <Box
                  sx={{
                    borderRadius: "12px",
                    bgcolor: theme.palette.secondary.main,
                    border: `1px solid ${alpha(m.teal, 0.22)}`,
                    p: 1.5,
                    ...(participantKind === "buffer"
                      ? {
                          "& .booking-buffer-edit-btn": {
                            opacity: 0,
                            pointerEvents: "none",
                            transition:
                              "opacity 0.15s, color 0.15s, background-color 0.15s",
                          },
                          "&:hover .booking-buffer-edit-btn, &:focus-within .booking-buffer-edit-btn": {
                            opacity: 1,
                            pointerEvents: "auto",
                          },
                        }
                      : {}),
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      {participantKind === "buffer" ? (
                        <BodyText
                          sx={mollureBodySx(m.navy, { lineHeight: 1.25 })}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              color: alpha(m.navy, 0.52),
                            }}
                          >
                            Buffer:{" "}
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 900,
                              color: alpha(m.navy, 0.82),
                            }}
                          >
                            {guest.name}
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              ml: 0.75,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.45),
                              fontSize: 11.5,
                            }}
                          >
                            (Internal only)
                          </Box>
                        </BodyText>
                      ) : (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.15}
                          sx={{ minWidth: 0, flex: 1 }}
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
                            {(guest.name || sectionLabel)
                              .slice(0, 1)
                              .toUpperCase()}
                          </Avatar>
                          <BodyText
                            sx={{
                              ...mollureLabelSx(m.navy),
                              lineHeight: 1.2,
                            }}
                          >
                            {guest.name || sectionLabel}
                          </BodyText>
                          {isFirstGuestBlock &&
                          (participantKind === "guest" ||
                            participantKind === "model") &&
                          silentFieldUpdates.guestIds.includes(
                            guest.id,
                          ) ? (
                            <BookingEditedTag variant="updated" />
                          ) : null}
                        </Stack>
                      )}
                      {isFirstGuestBlock &&
                      (participantKind === "guest" ||
                        participantKind === "model") &&
                      (showClientRemoveButton ||
                        canEditBookingLineItems) ? (
                        <Stack direction="row" spacing={0.25}>
                          {canEditBookingLineItems ||
                          showClientRemoveButton ? (
                          <IconButton
                            size="small"
                            onClick={() => {
                              beginExistingBookingEdit();
                              beginEditInlineGuest(guest);
                            }}
                            sx={{ color: alpha(m.navy, 0.45) }}
                            aria-label={`Edit ${guest.name}`}
                          >
                            <EditRoundedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                          ) : null}
                          {showClientRemoveButton ? (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setBookingGuests((prev) =>
                                prev.filter(
                                  (item) => item.id !== guest.id,
                                ),
                              );
                              if (
                                editingInlineGuestId === guest.id
                              ) {
                                setEditingInlineGuestId(null);
                                setInlineGuestDraft(
                                  emptyInlineGuestDraft,
                                );
                                setShowInlineGuestField(false);
                              }
                              if (addMenuTarget === guest.id)
                                setSlotAddMenuAnchor(null);
                            }}
                            sx={{ color: alpha(m.navy, 0.35) }}
                            aria-label={`Remove ${guest.name}`}
                          >
                            <CloseRoundedIcon
                              sx={{ fontSize: 17 }}
                            />
                          </IconButton>
                          ) : null}
                        </Stack>
                      ) : participantKind === "buffer" &&
                        (canEditBookingLineItems ||
                          showClientRemoveButton) ? (
                        <Stack direction="row" spacing={0.25}>
                          {canEditBookingLineItems ? (
                            <IconButton
                              className="booking-buffer-edit-btn"
                              size="small"
                              onClick={() => {
                                beginExistingBookingEdit();
                                beginEditBuffer(guest);
                              }}
                              sx={{
                                color: alpha(m.navy, 0.42),
                                "&:hover": {
                                  color: m.teal,
                                  bgcolor: alpha(m.teal, 0.08),
                                },
                              }}
                              aria-label={`Edit ${guest.name || "buffer"}`}
                            >
                              <EditRoundedIcon
                                sx={{ fontSize: 17 }}
                              />
                            </IconButton>
                          ) : null}
                          {showClientRemoveButton ? (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setBookingGuests((prev) =>
                                  prev.filter(
                                    (item) => item.id !== guest.id,
                                  ),
                                );
                                if (addMenuTarget === guest.id)
                                  setSlotAddMenuAnchor(null);
                              }}
                              sx={{ color: alpha(m.navy, 0.35) }}
                              aria-label={`Remove ${guest.name}`}
                            >
                              <CloseRoundedIcon
                                sx={{ fontSize: 17 }}
                              />
                            </IconButton>
                          ) : null}
                        </Stack>
                      ) : null}
                    </Stack>

                    {editingInlineGuestId === guest.id &&
                    isFirstGuestBlock &&
                    (participantKind === "guest" ||
                      participantKind === "model")
                      ? renderInlineGuestFields("card")
                      : null}

                    {participantKind === "buffer" ? (
                      <Stack spacing={0.75}>
                        {guest.bufferStartTime ? (
                          <BodyText
                            sx={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.62),
                            }}
                          >
                            Start Time: {guest.bufferStartTime}
                          </BodyText>
                        ) : null}
                        {guest.bufferEndTime ? (
                          <BodyText
                            sx={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.62),
                            }}
                          >
                            End Time: {guest.bufferEndTime}
                          </BodyText>
                        ) : null}
                        {guestDurationLabel ? (
                          <BodyText
                            sx={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.62),
                            }}
                          >
                            Duration: {guestDurationLabel}
                          </BodyText>
                        ) : null}
                        {guest.bufferTeamMemberId ? (
                          <BodyText
                            sx={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.62),
                            }}
                          >
                            {resourceNameById.get(
                              guest.bufferTeamMemberId,
                            ) ?? "Unassigned"}
                          </BodyText>
                        ) : null}
                      </Stack>
                    ) : (
                      <>
                    <BookingDrawerSelectedItemsSection
                      nested
                      services={block.services}
                      products={
                        isFirstGuestBlock
                          ? guestCatalog.products
                          : []
                      }
                      uniqueItems={
                        isFirstGuestBlock
                          ? guestCatalog.uniqueItems
                          : []
                      }
                      cancelledServices={
                        isFirstGuestBlock
                          ? cancelledServicesForDrawer.filter(
                              (service) =>
                                service.guestId === guest.id,
                            )
                          : []
                      }
                      showRemoveButtons={showLineItemRemoveButton}
                      onReorderServices={
                        showLineItemRemoveButton
                          ? (fromId, toId) =>
                              reorderGuestServices(
                                guest.id,
                                fromId,
                                toId,
                              )
                          : undefined
                      }
                      resolveStaffName={(staffResourceId) =>
                        staffResourceId
                          ? resourceNameById.get(staffResourceId)
                          : undefined
                      }
                      resolveStaff={resolveBookingStaff}
                      onStaffClick={openBookingStaffProfile}
                      staffOptionsForService={
                        canEditBookingLineItems
                          ? getServiceStaffOptions
                          : undefined
                      }
                      onStaffChange={
                        canEditBookingLineItems
                          ? changeBookingServiceStaff
                          : undefined
                      }
                      resolveServiceEditTag={resolveServiceEditTag}
                      resolveProductEditTag={resolveProductEditTag}
                      editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
                      onEditTagSignpostClick={openDrawerLineTagComparison}
                      onRemoveService={(serviceId) =>
                        removeGuestService(guest.id, serviceId)
                      }
                      onRemoveProduct={(productId) => {
                        setBookingGuests((prev) =>
                          prev.map((item) =>
                            item.id === guest.id
                              ? {
                                  ...item,
                                  products: item.products.filter(
                                    (prd) => prd.id !== productId,
                                  ),
                                }
                              : item,
                          ),
                        );
                      }}
                      onRemoveUniqueItem={(itemId) => {
                        setBookingGuests((prev) =>
                          prev.map((item) =>
                            item.id === guest.id
                              ? {
                                  ...item,
                                  products: item.products.filter(
                                    (prd) => prd.id !== itemId,
                                  ),
                                }
                              : item,
                          ),
                        );
                      }}
                      onEditService={
                        canEditBookingLineItems
                          ? (service) => {
                              beginExistingBookingEdit();
                              openEditServiceFromLineItem(
                                service,
                                guest.id,
                              );
                            }
                          : undefined
                      }
                      onEditProduct={
                        canEditBookingLineItems
                          ? (product) => {
                              beginExistingBookingEdit();
                              openEditBookingProductLine(
                                product,
                                guest.id,
                              );
                            }
                          : undefined
                      }
                      onEditUniqueItem={
                        canEditBookingLineItems
                          ? (item) => {
                              beginExistingBookingEdit();
                              openEditBookingUniqueLine(
                                item,
                                guest.id,
                              );
                            }
                          : undefined
                      }
                    />

                    {isLastGuestBlock && canMutateDrawerContents ? (
                    <ButtonBase
                      onClick={(e) => {
                        const el = e.currentTarget;
                        if (
                          slotAddMenuAnchor &&
                          addMenuTarget === guest.id
                        ) {
                          setSlotAddMenuAnchor(null);
                          return;
                        }
                        setAddMenuTarget(guest.id);
                        setSlotAddMenuAnchor(el);
                      }}
                      aria-label={`Add items for ${guest.name}`}
                      sx={{
                        width: "100%",
                        maxWidth: 220,
                        border: `1px solid ${alpha(m.navy, 0.14)}`,
                        borderRadius: "10px",
                        height: 44,
                        px: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.25,
                        bgcolor: "#fff",
                        textAlign: "left",
                        transition:
                          "border-color 0.15s, background-color 0.15s",
                        "&:hover": {
                          bgcolor: alpha(m.navy, 0.02),
                          borderColor: m.teal,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.1,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: "999px",
                            bgcolor: m.addSoftBg,
                            color: m.addSoftFg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            border: `1px solid ${alpha(m.teal, 0.22)}`,
                          }}
                        >
                          <AddRoundedIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <BodyText
                          component="span"
                          sx={{
                            ...mollureLabelSx(m.navy),
                            lineHeight: 1,
                          }}
                        >
                          Add
                        </BodyText>
                      </Box>
                      <KeyboardArrowDownRoundedIcon
                        sx={{
                          fontSize: 18,
                          color:
                            slotAddMenuAnchor &&
                            addMenuTarget === guest.id
                              ? m.teal
                              : alpha(m.navy, 0.45),
                          flexShrink: 0,
                          transform:
                            slotAddMenuAnchor &&
                            addMenuTarget === guest.id
                              ? "rotate(180deg)"
                              : "none",
                          transition:
                            "transform 0.15s, color 0.15s",
                        }}
                      />
                    </ButtonBase>
                    ) : null}
                      </>
                    )}
                  </Stack>
                </Box>
              </Box>
              );
            })}

            {showInlineGuestField && !editingInlineGuestId
              ? renderInlineGuestFields("panel")
              : null}
    </>
  );
}
