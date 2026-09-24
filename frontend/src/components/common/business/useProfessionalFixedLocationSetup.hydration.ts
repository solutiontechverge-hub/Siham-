"use client";

import * as React from "react";
import type {
  BusinessCategory,
  BusinessSetup,
  BusinessTeamMember,
} from "../../../store/services/businessApi";
import type { FixedLocationFormState } from "../../../app/professionals/fixed-location/fixedLocation.use";
import { teamMemberRatingFromApi } from "../../../lib/teamMemberReviews";
import {
  DEFAULT_RESPONSE_WINDOW_MINUTES,
  isResponseTimeConfigured,
} from "../calendar/bookingResponseDeadline";
import {
  normalizeTemplateSyncSettings,
  type TemplateSyncSettings,
} from "../businessSetupTemplateSync";
import {
  hydrateMainAndSubservicesFromDetails,
  readBusinessServiceDiscountFields,
  type BusinessMainServiceUi,
  type BusinessSubserviceUi,
} from "../../../data/businessServiceModal.data";
import type { TeamMemberUi } from "../../../app/professionals/fixed-location/businessTeamMemberModal.use";
import {
  parseFixedLocationMunicipalities,
  type ServiceDetailUiItem,
} from "./useProfessionalFixedLocationSetup.helpers";
import type {
  BusinessTemplateState,
  OfferingOption,
  OfferingSelectOption,
  TeamService,
} from "./useProfessionalFixedLocationSetup.types";

export type UseProfessionalFixedLocationSetupHydrationArgs = {
  businessSetupData: BusinessSetup | null;
  businessCategories: BusinessCategory[];
  setBusinessOfferingSelect: React.Dispatch<
    React.SetStateAction<OfferingSelectOption>
  >;
  setActiveBusinessTemplate: React.Dispatch<React.SetStateAction<OfferingOption>>;
  setField: <K extends keyof FixedLocationFormState>(
    key: K,
    value: FixedLocationFormState[K],
  ) => void;
  values: Pick<
    FixedLocationFormState,
    | "amenities"
    | "discountEnabled"
    | "discountValue"
    | "depositEnabled"
    | "depositValue"
  >;
  setDesiredBusiness: React.Dispatch<React.SetStateAction<BusinessTemplateState>>;
  setTemplateSyncSettings: React.Dispatch<React.SetStateAction<TemplateSyncSettings>>;
  setTemplateSyncDraft: React.Dispatch<React.SetStateAction<TemplateSyncSettings>>;
  toDisplayNumber: (value: string | number | null | undefined) => string;
  setMediaSlides: React.Dispatch<React.SetStateAction<string[]>>;
  setMediaIdx: React.Dispatch<React.SetStateAction<number>>;
  setMainServicesFixed: React.Dispatch<React.SetStateAction<BusinessMainServiceUi[]>>;
  setMainServicesDesired: React.Dispatch<React.SetStateAction<BusinessMainServiceUi[]>>;
  setServicesFixed: React.Dispatch<React.SetStateAction<ServiceDetailUiItem[]>>;
  setServicesDesired: React.Dispatch<React.SetStateAction<ServiceDetailUiItem[]>>;
  servicesFixedRef: React.MutableRefObject<ServiceDetailUiItem[]>;
  servicesDesiredRef: React.MutableRefObject<ServiceDetailUiItem[]>;
  defaultServices: (
    assignedServices?: BusinessTeamMember["assigned_services"],
  ) => TeamService;
  setTeamMembersFixed: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  setTeamMembersDesired: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  setIsBusinessPublishEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

/** Hydrate form/services/team from businessSetupData (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupHydration(
  args: UseProfessionalFixedLocationSetupHydrationArgs,
) {
  const {
    businessSetupData,
    businessCategories,
    setBusinessOfferingSelect,
    setActiveBusinessTemplate,
    setField,
    values,
    setDesiredBusiness,
    setTemplateSyncSettings,
    setTemplateSyncDraft,
    toDisplayNumber,
    setMediaSlides,
    setMediaIdx,
    setMainServicesFixed,
    setMainServicesDesired,
    setServicesFixed,
    setServicesDesired,
    servicesFixedRef,
    servicesDesiredRef,
    defaultServices,
    setTeamMembersFixed,
    setTeamMembersDesired,
    setIsBusinessPublishEnabled,
  } = args;

  const hydratedBusinessRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!businessSetupData) {
      return;
    }

    const hydrationKey = [
      businessSetupData.id,
      businessSetupData.updated_at,
      businessSetupData.has_unpublished_changes ? "draft" : "live",
      businessSetupData.additional_notes ?? "",
      businessSetupData.price_range ?? "",
      businessSetupData.cancellation_policy_instruction ?? "",
    ].join(":");
    if (hydratedBusinessRef.current === hydrationKey) {
      return;
    }

    const modeMap: Record<
      BusinessSetup["location_mode"],
      OfferingSelectOption
    > = {
      fixed: "Fixed Location",
      desired: "Desired Location",
      both: "Both",
    };

    const nextOffering = modeMap[businessSetupData.location_mode];
    setBusinessOfferingSelect(nextOffering);
    setActiveBusinessTemplate(
      nextOffering === "Both" ? "Fixed Location" : nextOffering,
    );
    const savedBookCombos = (
      businessSetupData.book_service_combinations || []
    ).map((combo, index) => ({
      id: `combo-${combo.category_id}-${combo.service_id}-${index}`,
      categoryId: String(combo.category_id),
      serviceId: String(combo.service_id),
    }));
    const savedPriceRange = businessSetupData.price_range
      ? businessSetupData.price_range.split("-")
      : [];
    const hydratedTemplateState: BusinessTemplateState = {
      profileName: businessSetupData.business_name || "",
      about: businessSetupData.business_about || "",
      keywordDraft: "",
      keywords: businessSetupData.business_keywords || [],
      salonName: businessSetupData.salon_name || "",
      streetAddress: businessSetupData.fixed_location_address || "",
      streetNumber: businessSetupData.fixed_location_street_number || "",
      postalCode: businessSetupData.fixed_location_postal_code || "",
      province: businessSetupData.fixed_location_province || "",
      municipalities: parseFixedLocationMunicipalities(
        businessSetupData.fixed_location_municipality,
      ),
      serviceFor: {
        men: (businessSetupData.service_for || []).includes("men"),
        women: (businessSetupData.service_for || []).includes("women"),
        kids: (businessSetupData.service_for || []).includes("kids"),
      },
      amenities: values.amenities,
      projectEnabled: Boolean(businessSetupData.project),
      projectInstructions: businessSetupData.project || "",
      bookCategory: savedBookCombos[0]?.categoryId || "",
      bookService: savedBookCombos[0]?.serviceId || "",
      bookCombos: savedBookCombos,
      bookComboInstructions: businessSetupData.book_service_notes || "",
      discountEnabled: values.discountEnabled,
      discountValue: values.discountValue,
      depositEnabled: values.depositEnabled,
      depositValue: values.depositValue,
      notes: businessSetupData.additional_notes || "",
      priceRangeFrom: savedPriceRange[0]?.trim() || "Low",
      priceRangeTo: savedPriceRange[1]?.trim() || "Low",
      prepaymentPercent: toDisplayNumber(
        businessSetupData.prepayment_percentage,
      ),
      prepaymentInstructions: businessSetupData.prepayment_instruction || "",
      kilometerAllowance: toDisplayNumber(
        businessSetupData.kilometer_allowance,
      ),
      kilometerAllowanceInstructions:
        businessSetupData.kilometer_allowance_instruction || "",
    };

    Object.entries(hydratedTemplateState).forEach(([key, value]) => {
      setField(key as keyof FixedLocationFormState, value as never);
    });
    setDesiredBusiness(hydratedTemplateState);
    const nextSyncSettings = normalizeTemplateSyncSettings(
      businessSetupData.section_sync_settings,
    );
    setTemplateSyncSettings(nextSyncSettings);
    setTemplateSyncDraft(nextSyncSettings);
    const responseHours = toDisplayNumber(businessSetupData.response_time_hours);
    const responseMinutes = toDisplayNumber(
      businessSetupData.response_time_minutes,
    );
    const hasResponseTime = isResponseTimeConfigured({
      hours: businessSetupData.response_time_hours,
      minutes: businessSetupData.response_time_minutes,
    });
    setField("policyResponseHours", hasResponseTime ? responseHours : "");
    setField(
      "policyResponseMinutes",
      hasResponseTime
        ? responseMinutes
        : String(DEFAULT_RESPONSE_WINDOW_MINUTES),
    );
    setField(
      "policyInstructions",
      businessSetupData.policy_custom_instruction || "",
    );
    setField(
      "rescheduleMinimumHours",
      toDisplayNumber(businessSetupData.appointment_before_hours),
    );
    setField(
      "rescheduleMinimumMinutes",
      toDisplayNumber(businessSetupData.appointment_before_minutes),
    );
    setField(
      "rescheduleLateFeePercent",
      toDisplayNumber(businessSetupData.late_reschedule_fee_percentage),
    );
    setField(
      "rescheduleInstructions",
      businessSetupData.late_reschedule_policy_instruction || "",
    );
    setField(
      "cancelMinimumHours",
      toDisplayNumber(businessSetupData.cancellation_before_hours),
    );
    setField(
      "cancelMinimumMinutes",
      toDisplayNumber(businessSetupData.cancellation_before_minutes),
    );
    setField(
      "cancelLateFeePercent",
      toDisplayNumber(businessSetupData.late_cancellation_fee_percentage),
    );
    setField(
      "cancelInstructions",
      businessSetupData.cancellation_policy_instruction || "",
    );
    setField(
      "noShowFeePercent",
      toDisplayNumber(businessSetupData.no_show_fee_percentage),
    );
    setField(
      "noShowInstructions",
      businessSetupData.no_show_fee_instruction || "",
    );

    const nextMediaSlides =
      businessSetupData.business_media &&
      businessSetupData.business_media.length > 0
        ? businessSetupData.business_media
        : [];
    setMediaSlides(nextMediaSlides);
    setMediaIdx(0);

    const categoryDurationByServiceId = new Map(
      (businessSetupData.service_categories ?? []).map((entry) => [
        entry.service_id,
        typeof entry.duration_label === "string"
          ? entry.duration_label.trim()
          : "",
      ]),
    );

    const categoryTitleById = new Map(
      businessCategories.map((category) => [
        String(category.id),
        category.title,
      ]),
    );
    const mapDetailToSubservice = (
      item: (typeof businessSetupData.service_details)[number],
    ): BusinessSubserviceUi => {
      const rawPrice = item.price;
      const priceStr =
        rawPrice !== null &&
        rawPrice !== undefined &&
        String(rawPrice).trim() !== ""
          ? (() => {
              const n = String(rawPrice)
                .trim()
                .replace(/\s*€\s*$/i, "")
                .trim();
              return n.includes("€") ? n : `${n} €`;
            })()
          : "";
      const durationLabel =
        categoryDurationByServiceId.get(item.service_id) || "";
      const discount = readBusinessServiceDiscountFields(item);
      return {
        id: String(item.service_id),
        parentServiceId: item.parent_service_id
          ? String(item.parent_service_id)
          : "",
        categoryId: String(item.category_id),
        serviceId: item.service_id,
        name: item.service_title || "",
        discountInfo: "",
        durationFrom: "",
        durationTo: "",
        categoryTitle: item.category_title || undefined,
        priceLabel: priceStr,
        durationLabel: durationLabel || undefined,
        priceAmount:
          rawPrice !== null &&
          rawPrice !== undefined &&
          String(rawPrice).trim() !== ""
            ? String(rawPrice).trim().replace(/\s*€\s*$/i, "").trim()
            : "",
        discountType: discount.discountType,
        discountAmount: discount.discountAmount,
        discountStartDate: discount.discountStartDate,
        discountEndDate: discount.discountEndDate,
        discountDescription: discount.discountDescription,
      };
    };

    const detailsForHydration =
      businessSetupData.service_details?.length
        ? businessSetupData.service_details
        : (businessSetupData.service_categories ?? []).map((entry) => ({
            id: String(entry.service_id),
            business_setup_id: businessSetupData.id,
            service_id: String(entry.service_id),
            price: entry.amount,
            duration_label: entry.duration_label ?? null,
            parent_service_id: entry.parent_service_id ?? null,
            created_at: "",
            service_title: entry.service_title || "",
            category_id: String(entry.category_id),
            category_title: entry.category_title || "",
            is_visible: entry.is_visible !== false,
            discount_type: entry.discount_type ?? null,
            discount_amount: entry.discount_amount ?? null,
            discount_start_date: entry.discount_start_date ?? null,
            discount_end_date: entry.discount_end_date ?? null,
            discount_description: entry.discount_description ?? null,
          }));

    const savedServices: BusinessSubserviceUi[] = detailsForHydration
      .filter((item) => item.is_visible !== false)
      .map(mapDetailToSubservice);
    const hydratedServices = hydrateMainAndSubservicesFromDetails(
      savedServices,
      categoryTitleById,
    );
    setMainServicesFixed(hydratedServices.mains);
    setMainServicesDesired(hydratedServices.mains);
    setServicesFixed(hydratedServices.subs);
    setServicesDesired(hydratedServices.subs);
    servicesFixedRef.current = hydratedServices.subs;
    servicesDesiredRef.current = hydratedServices.subs;

    if (businessSetupData.team_members.length > 0) {
      const hydratedTeam = businessSetupData.team_members.map((member) => {
        const reviewStats = teamMemberRatingFromApi(
          member.rating,
          member.total_reviews,
        );
        return {
          id: String(member.id ?? `tm-${member.display_order}`),
          personKey: String(member.id ?? `tm-${member.display_order}`),
          name: member.full_name,
          role: member.role,
          photoSrc: member.profile_photo || "",
          rating: reviewStats.rating,
          reviewsLabel: reviewStats.reviewsLabel,
          services: defaultServices(member.assigned_services),
        };
      });
      setTeamMembersFixed(hydratedTeam);
      setTeamMembersDesired(
        hydratedTeam.map((member) => ({ ...member, pendingPhotoFile: null })),
      );
    } else {
      setTeamMembersFixed([]);
      setTeamMembersDesired([]);
    }

    hydratedBusinessRef.current = hydrationKey;
  }, [
    businessCategories,
    businessSetupData,
    defaultServices,
    setField,
    toDisplayNumber,
    values.amenities,
    values.depositEnabled,
    values.depositValue,
    values.discountEnabled,
    values.discountValue,
  ]);

  React.useEffect(() => {
    if (businessSetupData?.has_unpublished_changes) {
      setIsBusinessPublishEnabled(true);
    }
  }, [businessSetupData?.has_unpublished_changes, businessSetupData?.id]);

  return { hydratedBusinessRef };
}
