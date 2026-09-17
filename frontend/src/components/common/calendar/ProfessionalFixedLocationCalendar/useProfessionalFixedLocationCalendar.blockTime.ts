import * as React from "react";
import type { CalendarBookingLocation } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  createEmptyBlockTimeDraft,
  type BlockTimeDraft,
} from "../calendar.utils";

export type UseProfessionalFixedLocationCalendarBlockTimeArgs = {
  resourceIds: readonly string[];
  supportedLocations: readonly CalendarBookingLocation[];
};

export function useProfessionalFixedLocationCalendarBlockTime({
  resourceIds,
  supportedLocations,
}: UseProfessionalFixedLocationCalendarBlockTimeArgs) {
  const [blockTimeOpen, setBlockTimeOpen] = React.useState(false);
  const [blockDraft, setBlockDraft] = React.useState<BlockTimeDraft>(() =>
    createEmptyBlockTimeDraft(
      [...resourceIds],
      supportedLocations,
      "2025-04-06",
    ),
  );
  const pendingOverviewBlockRef = React.useRef<BlockTimeDraft | null>(null);
  const [blockOverlapOpen, setBlockOverlapOpen] = React.useState(false);

  React.useEffect(() => {
    setBlockDraft((prev) => {
      const nextLocations = prev.locations.filter((loc) =>
        supportedLocations.includes(loc),
      );
      return {
        ...prev,
        locations: nextLocations.length
          ? nextLocations
          : [...supportedLocations],
      };
    });
  }, [supportedLocations]);

  return {
    blockDraft,
    blockOverlapOpen,
    blockTimeOpen,
    pendingOverviewBlockRef,
    setBlockDraft,
    setBlockOverlapOpen,
    setBlockTimeOpen,
  };
}
