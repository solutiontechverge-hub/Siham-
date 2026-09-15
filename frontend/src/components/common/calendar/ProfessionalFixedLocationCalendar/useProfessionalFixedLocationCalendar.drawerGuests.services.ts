import * as React from "react";
import { sortCalendarGuestsByCanonicalOrder } from "../../../../data/bookingChronologicalBlocks";
import { stampProductsToEarliestBlock } from "../../../../data/bookingProductPlacement";
import {
  addMinutesToTime,
  lineItemToOverride,
  parseDurationMinsLabel,
  reorderById,
  reorderServicesInContainer,
  resequencePlanningWindows,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import type { UseProfessionalFixedLocationCalendarDrawerGuestsArgs } from "./useProfessionalFixedLocationCalendar.drawerGuests";

/** Service reorder/remove + slot bump handlers (ponytail: subdomain of drawerGuests). */
export function useProfessionalFixedLocationCalendarDrawerGuestsServices(
  args: UseProfessionalFixedLocationCalendarDrawerGuestsArgs,
) {
  const {
    bookingGuests,
    setBookingGuests,
    selectedServices,
    setSelectedServices,
    setSelectedProducts,
    setBookingUniqueItems,
    setServiceSelectionDraft,
    setServiceOverridesDraft,
    selectedSlot,
    setSelectedSlot,
    setSlotCalendarTouched,
    isDrawerPlanningGuest,
  } = args;

  const patchServiceTimeOverrides = React.useCallback(
    (services: readonly BookingServiceLineItem[]) => {
      const overridePatch: Record<string, Partial<BookingServiceLineItem>> = {};
      for (const service of services) {
        overridePatch[service.id] = lineItemToOverride(service);
      }
      setServiceOverridesDraft((prev) => ({ ...prev, ...overridePatch }));
    },
    [],
  );

  const bumpSlotFromServices = React.useCallback(
    (services: readonly BookingServiceLineItem[]) => {
      const timed = services.filter((service) => service.startTime?.trim());
      if (!timed.length) return;
      const first = timed[0];
      const last = timed[timed.length - 1];
      const start = first.startTime!;
      const end =
        last.endTime ||
        addMinutesToTime(last.startTime ?? start, last.durationMins);
      setSelectedSlot((prev) => (prev ? { ...prev, start, end } : prev));
      setSlotCalendarTouched(true);
    },
    [],
  );

  const reorderClientServices = React.useCallback(
    (fromId: string, toId: string) => {
      const next = reorderServicesInContainer(
        selectedServices,
        fromId,
        toId,
      );
      setSelectedServices(next);
      patchServiceTimeOverrides(next);
      bumpSlotFromServices(next);
      setSelectedProducts((prev) =>
        stampProductsToEarliestBlock(prev, next, null),
      );
      setBookingUniqueItems((prev) =>
        stampProductsToEarliestBlock(prev, next, null),
      );
    },
    [
      bumpSlotFromServices,
      patchServiceTimeOverrides,
      selectedServices,
    ],
  );

  const reorderGuestServices = React.useCallback(
    (guestId: string, fromId: string, toId: string) => {
      const guest = bookingGuests.find((item) => item.id === guestId);
      if (!guest) return;
      const nextServices = reorderServicesInContainer(
        guest.services,
        fromId,
        toId,
      );
      patchServiceTimeOverrides(nextServices);
      setBookingGuests((prev) =>
        prev.map((item) =>
          item.id === guestId
            ? {
                ...item,
                services: nextServices,
                products: stampProductsToEarliestBlock(
                  item.products,
                  nextServices,
                  item.id,
                ),
              }
            : item,
        ),
      );
    },
    [bookingGuests, patchServiceTimeOverrides],
  );

  const removeClientService = React.useCallback((serviceId: string) => {
    setSelectedServices((prev) => {
      const next = prev.filter((item) => item.id !== serviceId);
      setSelectedProducts((products) =>
        stampProductsToEarliestBlock(products, next, null),
      );
      setBookingUniqueItems((items) =>
        stampProductsToEarliestBlock(items, next, null),
      );
      return next;
    });
    setServiceSelectionDraft((prev) => prev.filter((id) => id !== serviceId));
  }, []);

  const removeGuestService = React.useCallback(
    (guestId: string, serviceId: string) => {
      setBookingGuests((prev) =>
        prev.map((item) => {
          if (item.id !== guestId) return item;
          const nextServices = item.services.filter(
            (svc) => svc.id !== serviceId,
          );
          return {
            ...item,
            services: nextServices,
            products: stampProductsToEarliestBlock(
              item.products,
              nextServices,
              item.id,
            ),
          };
        }),
      );
    },
    [],
  );

  const reorderDrawerPlanning = React.useCallback(
    (fromId: string, toId: string) => {
      setBookingGuests((prev) => {
        const subset = prev.filter(isDrawerPlanningGuest);
        const reordered = reorderById(subset, fromId, toId);
        const hasWindows = subset.some(
          (item) =>
            Boolean(item.planningStartTime?.trim()) ||
            Boolean(parseDurationMinsLabel(item.planningDuration)),
        );
        const timed = hasWindows
          ? resequencePlanningWindows(
              reordered,
              subset[0]?.planningStartTime || selectedSlot?.start,
            )
          : reordered;
        let index = 0;
        const next = prev.map((guest) =>
          isDrawerPlanningGuest(guest) ? timed[index++]! : guest,
        );
        return hasWindows ? sortCalendarGuestsByCanonicalOrder(next) : next;
      });
    },
    [isDrawerPlanningGuest, selectedSlot?.start],
  );

  return {
    bumpSlotFromServices,
    patchServiceTimeOverrides,
    removeClientService,
    removeGuestService,
    reorderClientServices,
    reorderDrawerPlanning,
    reorderGuestServices,
  };
}
