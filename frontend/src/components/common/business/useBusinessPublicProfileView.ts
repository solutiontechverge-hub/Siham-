"use client";

import * as React from "react";
import {
  businessPublicProfileUiCopy,
  getServicesForLocationMode,
  getTeamForLocationMode,
  type BusinessPublicProfileData,
} from "../../../data/businessPublicProfile.data";
import {
  buildPublicProfileBookingSelection,
  type PublicProfileBookingSelection,
} from "../../../data/publicProfileBookingSelection";
import { serviceMatchesCategoryTab } from "../../../data/businessServiceCategorySlider.data";
import { useAppSelector } from "../../../store/hooks";

export function toImageSrc(img: unknown) {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null) {
    const o = img as { src?: string; default?: unknown };
    if (typeof o.src === "string") return o.src;
    if (o.default) return toImageSrc(o.default);
  }
  return String(img);
}

export type UseBusinessPublicProfileViewArgs = {
  data: BusinessPublicProfileData;
  locationMode: "fixed" | "desired";
  onBookNow: (selection: PublicProfileBookingSelection) => void;
};

export function useBusinessPublicProfileView({
  data,
  locationMode,
  onBookNow,
}: UseBusinessPublicProfileViewArgs) {
  const isCompanyClient =
    useAppSelector((s) => s.auth.user?.user_type) === "company";

  const heroSlides = React.useMemo(() => {
    if (data.heroImages.length > 0) {
      return data.heroImages.map((img) => toImageSrc(img)).filter(Boolean);
    }
    const fallback = toImageSrc(data.heroImage);
    return fallback ? [fallback] : [];
  }, [data.heroImage, data.heroImages]);

  const effectiveLocationMode = React.useMemo<"fixed" | "desired">(() => {
    if (!data.supportsFixedLocation) return "desired";
    if (!data.supportsDesiredLocation) return "fixed";
    return locationMode;
  }, [data.supportsDesiredLocation, data.supportsFixedLocation, locationMode]);

  const isDesiredLocation = effectiveLocationMode === "desired";
  // Professional setup: project + km apply when offering is Desired or Both (not Fixed-only).
  const showDesiredOfferingContent =
    data.supportsDesiredLocation &&
    (!data.supportsFixedLocation || isDesiredLocation);
  const showKilometerAllowance = showDesiredOfferingContent;
  const showProjectHeader = showDesiredOfferingContent && isCompanyClient;

  const [projectEnabled, setProjectEnabled] = React.useState(
    Boolean(data.projectEnabled && isCompanyClient),
  );
  const showProjectSection =
    showDesiredOfferingContent && isCompanyClient && projectEnabled;

  const [portfolioLightboxIndex, setPortfolioLightboxIndex] = React.useState<
    number | null
  >(null);
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const scheduleAnchorRef = React.useRef<HTMLButtonElement>(null);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState(
    data.defaultScheduleOptionId,
  );
  const [serviceQty, setServiceQty] = React.useState<Record<string, number>>(
    {},
  );
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<
    Record<string, boolean>
  >({});
  const [memberSlotSelections, setMemberSlotSelections] = React.useState<
    Record<string, string>
  >({});

  // Public listing: full location team/services from setups API (no leave/load filter).
  const visibleTeamMembers = React.useMemo(
    () => getTeamForLocationMode(data, effectiveLocationMode),
    [data, effectiveLocationMode],
  );
  const activeServices = React.useMemo(
    () => getServicesForLocationMode(data, effectiveLocationMode),
    [data, effectiveLocationMode],
  );

  React.useEffect(() => {
    setProjectEnabled(Boolean(data.projectEnabled && isCompanyClient));
  }, [data.projectEnabled, data.shopId, isCompanyClient]);

  React.useEffect(() => {
    if (!showDesiredOfferingContent || !isCompanyClient) {
      setProjectEnabled(false);
    }
  }, [showDesiredOfferingContent, isCompanyClient]);

  React.useEffect(() => {
    setActiveCategory("all");
    setSelectedServiceIds({});
    setServiceQty({});
  }, [locationMode]);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    for (const member of visibleTeamMembers) {
      for (const slot of member.serviceSlots) {
        next[`${member.id}:${slot.id}`] = slot.defaultValue;
      }
    }
    setMemberSlotSelections((prev) => {
      const keys = Object.keys(next);
      if (
        keys.length === Object.keys(prev).length &&
        keys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }
      return next;
    });
  }, [visibleTeamMembers]);

  React.useEffect(() => {
    setSelectedScheduleId(data.defaultScheduleOptionId);
    setScheduleOpen(false);
  }, [data.defaultScheduleOptionId, data.shopId]);

  const selectedScheduleLabel =
    data.scheduleOptions.find((opt) => opt.id === selectedScheduleId)?.label ??
    data.scheduleOptions[0]?.label ??
    businessPublicProfileUiCopy.scheduleFallbackLabel;

  const scheduleLabel = isDesiredLocation
    ? businessPublicProfileUiCopy.desiredScheduleLabel
    : businessPublicProfileUiCopy.fixedScheduleLabel;

  const categoryRecords = React.useMemo(
    () => data.categories.map((c) => ({ id: c.id, title: c.label })),
    [data.categories],
  );

  const filteredServices = React.useMemo(() => {
    return activeServices.filter((s) =>
      serviceMatchesCategoryTab(
        s,
        activeCategory,
        data.categories,
        categoryRecords,
      ),
    );
  }, [activeCategory, activeServices, categoryRecords, data.categories]);

  const selectedServices = React.useMemo(
    () => activeServices.filter((s) => selectedServiceIds[s.id]),
    [activeServices, selectedServiceIds],
  );

  const selectionSummary = React.useMemo(() => {
    const count = selectedServices.reduce(
      (sum, s) => sum + (serviceQty[s.id] ?? 1),
      0,
    );
    const totalMins = selectedServices.reduce(
      (sum, s) => sum + s.durationMins * (serviceQty[s.id] ?? 1),
      0,
    );
    const totalPrice = selectedServices.reduce(
      (sum, s) => sum + s.priceValue * (serviceQty[s.id] ?? 1),
      0,
    );
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const durationLabel =
      hours > 0 && mins > 0
        ? `${hours} hour${hours > 1 ? "s" : ""}, ${mins} mins`
        : hours > 0
          ? `${hours} hour${hours > 1 ? "s" : ""}`
          : `${mins} mins`;
    return { count, durationLabel, totalPrice };
  }, [selectedServices, serviceQty]);

  const toggleService = (id: string, checked: boolean) => {
    setSelectedServiceIds((prev) => ({ ...prev, [id]: checked }));
    if (checked) {
      setServiceQty((prev) => ({ ...prev, [id]: prev[id] ?? 1 }));
    }
  };

  const adjustQty = (id: string, delta: number) => {
    setServiceQty((prev) => {
      const next = Math.max(1, (prev[id] ?? 1) + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleBookNow = () => {
    onBookNow(
      buildPublicProfileBookingSelection({
        data,
        locationMode: effectiveLocationMode,
        selectedServiceIds,
        serviceQty,
        selectedComboIds: {},
        teamAssignments: {},
        projectEnabled,
      }),
    );
  };

  return {
    heroSlides,
    effectiveLocationMode,
    isDesiredLocation,
    showDesiredOfferingContent,
    showKilometerAllowance,
    showProjectHeader,
    projectEnabled,
    setProjectEnabled,
    showProjectSection,
    portfolioLightboxIndex,
    setPortfolioLightboxIndex,
    activeCategory,
    setActiveCategory,
    scheduleOpen,
    setScheduleOpen,
    scheduleAnchorRef,
    selectedScheduleId,
    setSelectedScheduleId,
    serviceQty,
    selectedServiceIds,
    memberSlotSelections,
    setMemberSlotSelections,
    activeServices,
    visibleTeamMembers,
    selectedScheduleLabel,
    scheduleLabel,
    filteredServices,
    selectionSummary,
    toggleService,
    adjustQty,
    handleBookNow,
  };
}
