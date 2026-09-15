import * as React from "react";
import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import {
  addMinutesToTime,
  buildBookingServiceLineItem,
  buildServiceEditDraftFromCatalog,
  emptyBookingServiceEditDraft,
  getLatestTimedEnd,
  lineItemToOverride,
  placeServicesSequentially,
  sortServicesByStartTime,
  type BookingServiceLineItem,
} from "../../../../data/bookingServiceEdit.data";
import { stampProductsToEarliestBlock } from "../../../../data/bookingProductPlacement";
import { assignStaffToPickedServices } from "./useProfessionalFixedLocationCalendar.helpers";
import { minutesSinceMidnight } from "../calendar.utils";
import type { UseProfessionalFixedLocationCalendarServiceProductScreensArgs } from "./useProfessionalFixedLocationCalendar.serviceProductScreens";

export function useProfessionalFixedLocationCalendarServiceProductScreensServices(
  args: UseProfessionalFixedLocationCalendarServiceProductScreensArgs,
) {
  const {
    addMenuTarget,
    selectionTarget,
    setSelectionTarget,
    serviceOverridesDraft,
    setServiceOverridesDraft,
    selectedServices,
    setSelectedServices,
    bookingGuests,
    setBookingGuests,
    selectedSlot,
    setSelectedSlot,
    selectableServiceCatalog,
    serviceEditDraft,
    setServiceEditDraft,
    serviceEditOrigin,
    setServiceEditOrigin,
    setServiceEditAttempted,
    isViewingExisting,
    serviceSelectionDraft,
    setServiceSelectionDraft,
    setServiceCatalogPatches,
    originalServicesSnapshot,
    pickMostAvailableTeamMemberId,
    resourceCount,
    slotLocation,
    dispatchBookingEventIfApi,
    editingEventId,
    setSelectedProducts,
    setBookingUniqueItems,
    setSlotAddMenuAnchor,
    setSlotBookingScreen,
    setSlotCalendarTouched,
    setSlotSaveAttempted,
  } = args;

  const openSelectServices = React.useCallback(() => {
    setSelectionTarget(addMenuTarget);
    // Add flow: start with no preselection - only what the user picks is added.
    setServiceOverridesDraft({});
    setServiceSelectionDraft([]);
    setServiceEditDraft(emptyBookingServiceEditDraft());
    setServiceEditAttempted(false);
    setSlotAddMenuAnchor(null);
    setSlotBookingScreen("select-services");
  }, [addMenuTarget]);

  const openEditService = React.useCallback(
    (
      service: BookingCatalogService,
      lineItemOverride?: Partial<BookingServiceLineItem>,
      target: string = selectionTarget,
      origin: "select-services" | "new-booking" = "select-services",
    ) => {
      if (target !== selectionTarget) {
        setSelectionTarget(target);
      }
      const override = {
        ...serviceOverridesDraft[service.id],
        ...lineItemOverride,
      };
      const existingOnBooking =
        target === "client"
          ? selectedServices.find((item) => item.id === service.id)
          : bookingGuests
              .find((guest) => guest.id === target)
              ?.services.find((item) => item.id === service.id);
      const assignedStaff =
        override?.staffResourceId?.trim() ||
        existingOnBooking?.staffResourceId?.trim() ||
        "";
      const timedEnds: Array<{ endTime?: string }> = [
        ...selectedServices.map((service) => ({ endTime: service.endTime })),
        ...bookingGuests.flatMap((guest) => [
          ...guest.services.map((service) => ({ endTime: service.endTime })),
          { endTime: guest.planningEndTime || guest.bufferEndTime },
        ]),
      ];
      const defaultStartAfterPrevious =
        getLatestTimedEnd(timedEnds, selectedSlot?.start) ||
        selectedSlot?.start;
      setServiceEditDraft(
        buildServiceEditDraftFromCatalog(service, {
          override: {
            ...override,
            staffResourceId: assignedStaff || undefined,
          },
          defaultStartTime:
            override?.startTime ??
            existingOnBooking?.startTime ??
            defaultStartAfterPrevious,
          defaultStaffResourceId: assignedStaff,
        }),
      );
      setServiceEditAttempted(false);
      setServiceEditOrigin(origin);
      setSlotBookingScreen("edit-service");
    },
    [
      bookingGuests,
      selectedServices,
      selectedSlot?.start,
      selectionTarget,
      serviceOverridesDraft,
    ],
  );

  const openEditServiceFromLineItem = React.useCallback(
    (service: BookingServiceLineItem, target: string = selectionTarget) => {
      const catalogService =
        selectableServiceCatalog.find((item) => item.id === service.id) ??
        selectableServiceCatalog.find((item) => item.name === service.name) ?? {
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
          price: service.price,
        };
      openEditService(
        catalogService,
        {
          staffResourceId: service.staffResourceId,
          startTime: service.startTime,
          endTime: service.endTime,
          durationMins: service.durationMins,
          name: service.name,
          price: service.price,
          priceType: service.priceType,
          discount: service.discount,
        },
        target,
        "new-booking",
      );
    },
    [openEditService, selectableServiceCatalog, selectionTarget],
  );

  const applyServiceEdit = React.useCallback(() => {
    const catalogService = selectableServiceCatalog.find(
      (service) => service.id === serviceEditDraft.serviceId,
    );
    if (!catalogService) return false;

    const lineItem = buildBookingServiceLineItem(
      catalogService,
      serviceEditDraft,
    );
    setServiceOverridesDraft((prev) => ({
      ...prev,
      [lineItem.id]: lineItemToOverride(lineItem),
    }));
    setServiceCatalogPatches((prev) => ({
      ...prev,
      [lineItem.id]: {
        name: lineItem.name,
        price: lineItem.price,
        durationMins: lineItem.durationMins,
      },
    }));
    setServiceSelectionDraft((prev) =>
      prev.includes(lineItem.id) ? prev : [...prev, lineItem.id],
    );

    const syncServices = (services: BookingServiceLineItem[]) => {
      const exists = services.some((service) => service.id === lineItem.id);
      if (!exists) return services;
      return sortServicesByStartTime(
        services.map((service) =>
          service.id === lineItem.id ? { ...service, ...lineItem } : service,
        ),
      );
    };

    if (selectionTarget === "client") {
      const nextClientServices = syncServices(selectedServices);
      setSelectedServices(nextClientServices);
      setSelectedProducts((prev) =>
        stampProductsToEarliestBlock(prev, nextClientServices, null),
      );
      setBookingUniqueItems((prev) =>
        stampProductsToEarliestBlock(prev, nextClientServices, null),
      );
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) => {
          if (guest.id !== selectionTarget) return guest;
          const nextServices = syncServices(guest.services);
          return {
            ...guest,
            services: nextServices,
            products: stampProductsToEarliestBlock(
              guest.products,
              nextServices,
              guest.id,
            ),
          };
        }),
      );
    }

    // Service start time takes priority for the calendar booking slot.
    if (lineItem.startTime) {
      const endTime =
        lineItem.endTime ||
        addMinutesToTime(lineItem.startTime, lineItem.durationMins);
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              start: lineItem.startTime!,
              end: endTime,
              ...(lineItem.staffResourceId
                ? { resourceId: lineItem.staffResourceId }
                : {}),
            }
          : prev,
      );
      setSlotCalendarTouched(true);
    } else if (lineItem.staffResourceId) {
      setSelectedSlot((prev) =>
        prev ? { ...prev, resourceId: lineItem.staffResourceId! } : prev,
      );
    }

    setServiceEditAttempted(false);
    setSlotBookingScreen(serviceEditOrigin);
    void dispatchBookingEventIfApi(editingEventId, "service_edited", {
      initiated_by: "professional",
    });
    return true;
  }, [
    dispatchBookingEventIfApi,
    editingEventId,
    selectableServiceCatalog,
    selectionTarget,
    serviceEditDraft,
    serviceEditOrigin,
    selectedServices,
  ]);

  const toggleServiceSelectionDraft = React.useCallback(
    (serviceId: string) => {
      if (isViewingExisting) return;
      setServiceSelectionDraft((prev) =>
        prev.includes(serviceId)
          ? prev.filter((id) => id !== serviceId)
          : [...prev, serviceId],
      );
    },
    [isViewingExisting],
  );

  const applyServiceSelection = React.useCallback(() => {
    const byId = new Map(
      selectableServiceCatalog.map((service) => [service.id, service]),
    );
    const currentServices =
      selectionTarget === "client"
        ? selectedServices
        : (bookingGuests.find((item) => item.id === selectionTarget)
            ?.services ?? []);
    const currentById = new Map(
      currentServices.map((service) => [service.id, service]),
    );

    const pickedServicesRaw = serviceSelectionDraft
      .map((id) => {
        const catalogService = byId.get(id);
        if (catalogService) {
          const override = serviceOverridesDraft[id];
          if (override) {
            return buildBookingServiceLineItem(
              catalogService,
              buildServiceEditDraftFromCatalog(catalogService, { override }),
            );
          }
          const existing = currentById.get(id);
          // Sequential placement below; preserve staff only unless edited via override.
          return {
            id: catalogService.id,
            name: catalogService.name,
            price: catalogService.price,
            durationMins: catalogService.durationMins,
            staffResourceId: existing?.staffResourceId,
          } satisfies BookingServiceLineItem;
        }
        return currentById.get(id) ?? null;
      })
      .filter((service): service is BookingServiceLineItem => Boolean(service));

    const sequentialStart =
      getLatestTimedEnd(
        [
          ...selectedServices,
          ...bookingGuests.flatMap((guest) => [
            ...guest.services,
            { endTime: guest.planningEndTime || guest.bufferEndTime },
          ]),
        ],
        selectedSlot?.start,
      ) || selectedSlot?.start;

    const alreadyTimed = pickedServicesRaw.filter(
      (service) => service.startTime?.trim() && service.endTime?.trim(),
    );
    const untimed = pickedServicesRaw.filter(
      (service) => !service.startTime?.trim() || !service.endTime?.trim(),
    );
    const pickedServices = [
      ...alreadyTimed,
      ...placeServicesSequentially(untimed, sequentialStart),
    ];

    const draftSiblingServices =
      selectionTarget === "client"
        ? bookingGuests.flatMap((guest) => guest.services)
        : [
            ...selectedServices,
            ...bookingGuests
              .filter((guest) => guest.id !== selectionTarget)
              .flatMap((guest) => guest.services),
          ];

    assignStaffToPickedServices({
      pickedServices,
      currentServices,
      draftSiblingServices,
      dateIso: selectedSlot?.date ?? "",
      slotStart: selectedSlot?.start,
      slotLocation,
      resourceCount,
      pickMostAvailableTeamMemberId,
    });

    // Always keep already-added services; only append newly selected ones.
    const mergedById = new Map<string, BookingServiceLineItem>();
    for (const service of currentServices) mergedById.set(service.id, service);
    // Also keep original booking services so nothing disappears while editing.
    if (selectionTarget === "client") {
      for (const service of originalServicesSnapshot) {
        if (service.guestId) continue;
        if (!mergedById.has(service.id)) mergedById.set(service.id, service);
      }
    }
    for (const service of pickedServices) mergedById.set(service.id, service);
    const nextServices = sortServicesByStartTime(Array.from(mergedById.values()));

    // Service start times take priority for the calendar booking slot.
    const timedServices = nextServices
      .filter((service) => Boolean(service.startTime))
      .sort(
        (a, b) =>
          minutesSinceMidnight(a.startTime!) -
          minutesSinceMidnight(b.startTime!),
      );
    if (timedServices.length > 0) {
      const first = timedServices[0];
      const last = timedServices[timedServices.length - 1];
      const start = first.startTime!;
      const end =
        last.endTime ||
        addMinutesToTime(
          last.startTime ?? start,
          last.durationMins,
        );
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              start,
              end,
              ...(first.staffResourceId
                ? { resourceId: first.staffResourceId }
                : {}),
            }
          : prev,
      );
      setSlotCalendarTouched(true);
    }

    if (selectionTarget === "client") {
      setSelectedServices(nextServices);
      setSelectedProducts((prev) =>
        stampProductsToEarliestBlock(prev, nextServices, null),
      );
      setBookingUniqueItems((prev) =>
        stampProductsToEarliestBlock(prev, nextServices, null),
      );
    } else {
      setBookingGuests((prev) =>
        prev.map((guest) =>
          guest.id === selectionTarget
            ? {
                ...guest,
                services: nextServices,
                products: stampProductsToEarliestBlock(
                  guest.products,
                  nextServices,
                  guest.id,
                ),
              }
            : guest,
        ),
      );
    }
    setSlotBookingScreen("new-booking");
    setSlotSaveAttempted(false);
  }, [
    bookingGuests,
    resourceCount,
    originalServicesSnapshot,
    pickMostAvailableTeamMemberId,
    selectedServices,
    selectedSlot?.date,
    selectedSlot?.end,
    selectedSlot?.start,
    selectionTarget,
    selectableServiceCatalog,
    serviceOverridesDraft,
    serviceSelectionDraft,
    slotLocation,
  ]);

  return {
    applyServiceEdit,
    applyServiceSelection,
    openEditService,
    openEditServiceFromLineItem,
    openSelectServices,
    toggleServiceSelectionDraft,
  };
}
