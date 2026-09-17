"use client";

import CalendarDesignModal, {
  type CalendarDesignDraft,
} from "../CalendarDesignModal";

import CalendarPublicBusinessHoursModal, {
  createEmptyPublicBusinessHoursDraft,
  replacePublicBusinessHoursForLocations,
} from "../CalendarPublicBusinessHoursModal";

import CalendarEditAvailabilityModal from "../CalendarEditAvailabilityModal";

import ManualEntryDiscountModal from "../../../sections/finance/ManualEntryDiscountModal";

import { isConfiguredColor } from "../../../../lib/calendarDesign.utils";

import {
  makeScheduleRowId,
} from "../calendar-schedule.utils";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarOverlaysSettingsBag = Pick<
  Vm,
  | "bookingDiscountModalOpen"
  | "bookingTotalDiscount"
  | "calendarSettings"
  | "categoryOptions"
  | "data"
  | "dateOverrides"
  | "designDraft"
  | "designOpen"
  | "editAvailabilityDraft"
  | "editAvailabilityOpen"
  | "persistAvailabilitySettings"
  | "publicBusinessHoursDraft"
  | "publicBusinessHoursOpen"
  | "serviceOptions"
  | "setAppliedDesign"
  | "setBookingDiscountModalOpen"
  | "setBookingTotalDiscount"
  | "setDateOverrides"
  | "setDesignDraft"
  | "setDesignOpen"
  | "setEditAvailabilityDraft"
  | "setEditAvailabilityOpen"
  | "setPublicBusinessHoursDraft"
  | "setPublicBusinessHoursOpen"
  | "showSnackbar"
  | "templateCategoryRows"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarOverlaysSettingsBag;
};

export default function ProfessionalFixedLocationCalendarOverlaysSettings({
  bag,
}: Props) {
  const {
    bookingDiscountModalOpen,
    bookingTotalDiscount,
    calendarSettings,
    categoryOptions,
    data,
    dateOverrides,
    designDraft,
    designOpen,
    editAvailabilityDraft,
    editAvailabilityOpen,
    persistAvailabilitySettings,
    publicBusinessHoursDraft,
    publicBusinessHoursOpen,
    serviceOptions,
    setAppliedDesign,
    setBookingDiscountModalOpen,
    setBookingTotalDiscount,
    setDateOverrides,
    setDesignDraft,
    setDesignOpen,
    setEditAvailabilityDraft,
    setEditAvailabilityOpen,
    setPublicBusinessHoursDraft,
    setPublicBusinessHoursOpen,
    showSnackbar,
    templateCategoryRows,
  } = bag;

  return (
    <>
      <CalendarPublicBusinessHoursModal
        open={publicBusinessHoursOpen}
        onClose={() => setPublicBusinessHoursOpen(false)}
        availableLocations={data.supportedLocations.filter(
          (location): location is "FL" | "DL" =>
            location === "FL" || location === "DL",
        )}
        existingEntries={
          Array.isArray(calendarSettings?.availability.publicBusinessHours)
            ? calendarSettings.availability.publicBusinessHours
            : []
        }
        onApply={async () => {
          try {
            const location =
              publicBusinessHoursDraft.location ||
              publicBusinessHoursDraft.locations[0];
            if (!location || !publicBusinessHoursDraft.schedule) {
              showSnackbar({
                severity: "error",
                message: "Select location and schedule before applying.",
              });
              return;
            }
            if (
              !publicBusinessHoursDraft.days?.length ||
              publicBusinessHoursDraft.days.length !== 7
            ) {
              showSnackbar({
                severity: "error",
                message: "Configure hours for each weekday before applying.",
              });
              return;
            }
            const existing = Array.isArray(
              calendarSettings?.availability.publicBusinessHours,
            )
              ? calendarSettings.availability.publicBusinessHours
              : [];
            await persistAvailabilitySettings({
              publicBusinessHours: replacePublicBusinessHoursForLocations(
                existing,
                publicBusinessHoursDraft,
              ),
            });
            showSnackbar({
              severity: "success",
              message: "Public business hours saved.",
            });
            setPublicBusinessHoursOpen(false);
            setPublicBusinessHoursDraft(
              createEmptyPublicBusinessHoursDraft(location),
            );
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to save public business hours.",
            });
          }
        }}
        draft={publicBusinessHoursDraft}
        setDraft={setPublicBusinessHoursDraft}
      />
      <CalendarDesignModal
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        onApply={async () => {
          try {
            // Persist only colours the professional explicitly chose (no defaults / gray).
            const nextDesign: CalendarDesignDraft = {
              ...designDraft,
              colorsByCategory: Object.fromEntries(
                Object.entries(designDraft.colorsByCategory ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
                ),
              ),
              colorsByService: Object.fromEntries(
                Object.entries(designDraft.colorsByService ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
                ),
              ),
              colorsByStatus: Object.fromEntries(
                Object.entries(designDraft.colorsByStatus ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
                ),
              ) as CalendarDesignDraft["colorsByStatus"],
              colorsByTeamMember: Object.fromEntries(
                Object.entries(designDraft.colorsByTeamMember ?? {}).filter(
                  ([, color]) => isConfiguredColor(color),
                ),
              ),
            };
            setDesignDraft(nextDesign);
            setAppliedDesign(nextDesign);
            await persistAvailabilitySettings({ design: nextDesign });
            showSnackbar({ severity: "success", message: "Design saved." });
            setDesignOpen(false);
          } catch {
            showSnackbar({
              severity: "error",
              message: "Unable to save design.",
            });
          }
        }}
        draft={designDraft}
        setDraft={setDesignDraft}
        serviceOptions={serviceOptions}
        categoryOptions={categoryOptions}
        templateCategoryRows={templateCategoryRows}
      />
      <CalendarEditAvailabilityModal
        availableLocations={data.supportedLocations}
        draft={editAvailabilityDraft}
        onApply={async () => {
          const nextOverrides = [
            ...(dateOverrides ?? []).filter(
              (item) =>
                !(
                  item.resourceId === editAvailabilityDraft.resourceId &&
                  item.date === editAvailabilityDraft.date
                ),
            ),
            {
              id: makeScheduleRowId(),
              resourceId: editAvailabilityDraft.resourceId,
              date: editAvailabilityDraft.date,
              locations: editAvailabilityDraft.locations,
              shifts: editAvailabilityDraft.shifts,
            },
          ];
          setDateOverrides(nextOverrides);
          await persistAvailabilitySettings({ dateOverrides: nextOverrides });
          showSnackbar({
            severity: "success",
            message: "Availability updated.",
          });
          setEditAvailabilityOpen(false);
        }}
        onClose={() => setEditAvailabilityOpen(false)}
        open={editAvailabilityOpen}
        resource={data.resources.find(
          (resource) => resource.id === editAvailabilityDraft.resourceId,
        )}
        setDraft={setEditAvailabilityDraft}
      />
      <ManualEntryDiscountModal
        open={bookingDiscountModalOpen}
        initialValue={bookingTotalDiscount}
        onClose={() => setBookingDiscountModalOpen(false)}
        onApply={(discount) => {
          setBookingTotalDiscount(discount.amount > 0 ? discount : null);
          showSnackbar({ severity: "success", message: "Discount applied." });
        }}
      />
    </>
  );
}
