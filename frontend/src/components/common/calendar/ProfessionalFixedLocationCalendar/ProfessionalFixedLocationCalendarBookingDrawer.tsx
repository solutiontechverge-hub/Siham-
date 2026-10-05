"use client";

import { mollureBodyMutedSx } from "../../../../theme/mollureHierarchy";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BodyText } from "../../../ui/typography";
import AppDrawer from "../../AppDrawer";
import BookingCheckoutFlow from "../BookingCheckoutFlow";
import ProfessionalFixedLocationCalendarBookingDrawerFooter from "./ProfessionalFixedLocationCalendarBookingDrawerFooter";
import ProfessionalFixedLocationCalendarBookingDrawerBookingTab from "./ProfessionalFixedLocationCalendarBookingDrawerBookingTab";
import ProfessionalFixedLocationCalendarBookingDrawerSalesActivity from "./ProfessionalFixedLocationCalendarBookingDrawerSalesActivity";
import type { ProfessionalFixedLocationCalendarBookingDrawerProps } from "./ProfessionalFixedLocationCalendarBookingDrawer.types";

export type {
  ProfessionalFixedLocationCalendarBookingDrawerBag,
  ProfessionalFixedLocationCalendarBookingDrawerProps,
} from "./ProfessionalFixedLocationCalendarBookingDrawer.types";

export default function ProfessionalFixedLocationCalendarBookingDrawer({
  bag,
}: ProfessionalFixedLocationCalendarBookingDrawerProps) {
  const {
    activityDetailItem,
    bookingCheckoutOpen,
    bookingDrawerBodyRef,
    bookingPhoneDraft,
    closeBookingDrawer,
    editingBufferId,
    editingEventId,
    handleBookingCheckoutSave,
    isBookingDetailsSubScreen,
    isCancelledOrInvalidBooking,
    isDrawerPrepaymentPaid,
    isViewingExisting,
    leaveUniqueItemScreen,
    m,
    prepaymentAmount,
    selectedClient,
    selectedSlot,
    serviceEditOrigin,
    setActivityDetailItem,
    setBookingCheckoutOpen,
    setEditingBufferId,
    setSlotBookingScreen,
    setSlotDrawerTab,
    slotBookingScreen,
    slotDrawerOpen,
    slotDrawerTab,
    slotTabs,
    uniqueItemFlowTitle,
    viewingBookingEvent,
  } = bag;

  return (
    <>
      <AppDrawer
        anchor="right"
        open={slotDrawerOpen}
        onClose={closeBookingDrawer}
        contentRef={bookingDrawerBodyRef}
        bodyBgcolor={
          isCancelledOrInvalidBooking ? m.cancelledSurface : undefined
        }
        title={
          bookingCheckoutOpen
            ? "Checkout"
            : activityDetailItem
            ? activityDetailItem.detailType === "cancellation"
              ? "Activity Details"
              : activityDetailItem.detailType === "comparison" ||
                  activityDetailItem.comparison
                ? "Comparison"
                : "Edit request details"
            : slotBookingScreen === "select-services"
              ? "Select Service"
              : slotBookingScreen === "edit-service"
                ? "Edit service"
                : slotBookingScreen === "select-products"
                  ? "Select Product"
                  : slotBookingScreen === "select-unique-items"
                    ? "Select Unique Item"
                    : slotBookingScreen === "add-unique-item"
                      ? uniqueItemFlowTitle
                    : slotBookingScreen === "add-buffer"
                      ? editingBufferId
                        ? "Edit Buffer"
                        : "Add Buffer"
                      : slotBookingScreen === "add-client-choice"
                        ? "Add Client"
                        : slotBookingScreen === "guest"
                          ? "Add Guest"
                          : slotBookingScreen === "non-mollure-individual" ||
                              slotBookingScreen === "non-mollure-company"
                            ? "Add Non-Mollure Client"
                            : slotDrawerTab === "sales"
                              ? "Sales"
                              : slotDrawerTab === "activity"
                                ? "Activity"
                                : editingEventId || isViewingExisting
                                  ? "Booking Details"
                                  : "New Booking"
        }
        onBack={
          bookingCheckoutOpen
            ? () => setBookingCheckoutOpen(false)
            : activityDetailItem
            ? () => setActivityDetailItem(null)
            : isBookingDetailsSubScreen
              ? () => {
                  if (slotBookingScreen === "add-unique-item") {
                    leaveUniqueItemScreen();
                    return;
                  }
                  if (slotBookingScreen === "add-buffer") {
                    setEditingBufferId(null);
                    setSlotBookingScreen("new-booking");
                    return;
                  }
                  setSlotBookingScreen(
                    slotBookingScreen === "edit-service"
                      ? serviceEditOrigin
                      : "new-booking",
                  );
                }
              : undefined
        }
        footer={<ProfessionalFixedLocationCalendarBookingDrawerFooter bag={bag} />}
      >
        <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5 }}>
          {selectedSlot && bookingCheckoutOpen && viewingBookingEvent ? (
            <BookingCheckoutFlow
              event={viewingBookingEvent}
              clientName={
                selectedClient?.name ||
                viewingBookingEvent.showClientName ||
                "Client"
              }
              clientEmail={
                selectedClient?.email || viewingBookingEvent.details?.clientEmail
              }
              clientPhone={
                [
                  bookingPhoneDraft.phoneCode,
                  bookingPhoneDraft.phoneNumber,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || undefined
              }
              // Show the configured prepayment amount during testing as well.
              // `isDrawerPrepaymentPaid` controls payment status only; it must
              // not hide the amount from the checkout/details breakdown.
              prepaidAmount={prepaymentAmount}
              onCancel={() => setBookingCheckoutOpen(false)}
              onSave={handleBookingCheckoutSave}
            />
          ) : selectedSlot ? (
            <>
              {/* Top tabs (underline style) */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  borderBottom: `1px solid ${alpha(m.navy, 0.1)}`,
                  mb: 1.75,
                }}
              >
                {slotTabs.map((t) => {
                  const active = t.id === slotDrawerTab;
                  const disabled = false;
                  return (
                    <Box
                      key={t.id}
                      role={disabled ? undefined : "button"}
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => {
                        if (disabled) return;
                        setSlotDrawerTab(t.id);
                        setActivityDetailItem(null);
                      }}
                      onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === "Enter" || e.key === " ") {
                          setSlotDrawerTab(t.id);
                          setActivityDetailItem(null);
                        }
                      }}
                      sx={{
                        textAlign: "center",
                        py: 1.25,
                        cursor: disabled ? "default" : "pointer",
                        position: "relative",
                        userSelect: "none",
                        color: active
                          ? m.teal
                          : disabled
                            ? alpha(m.navy, 0.32)
                            : alpha(m.navy, 0.55),
                        fontWeight: 900,
                        fontSize: 13.5,
                        pointerEvents: disabled ? "none" : "auto",
                        "&:after": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -1,
                          height: 2,
                          bgcolor: active ? m.teal : "transparent",
                        },
                      }}
                    >
                      {t.label}
                    </Box>
                  );
                })}
              </Box>

              {slotDrawerTab === "booking" ? (
                <ProfessionalFixedLocationCalendarBookingDrawerBookingTab bag={bag} />
              ) : (
                <ProfessionalFixedLocationCalendarBookingDrawerSalesActivity bag={bag} />
              )}
            </>
          ) : (
            <BodyText sx={mollureBodyMutedSx(m.navy, { mt: 1, color: alpha(m.navy, 0.6) })}>
              Click an empty space in the schedule to view free time.
            </BodyText>
          )}
        </Box>
      </AppDrawer>
    </>
  );
}
