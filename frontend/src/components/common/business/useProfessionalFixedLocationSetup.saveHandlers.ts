"use client";

import * as React from "react";
import type {
  BusinessCategory,
  BusinessSetup,
  UpsertBusinessSetupPayload,
  UpsertBusinessSetupRequest,
} from "../../../store/services/businessApi";
import { buildUpsertBusinessSetupBody } from "../../../store/services/businessApi";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  BUSINESS_MEDIA_MAX_COUNT,
  isPersistedMediaUrl,
} from "../../../lib/profileImageUpload";
import type { TeamMemberUi } from "../../../app/professionals/fixed-location/businessTeamMemberModal.use";
import type { FixedLocationFormState } from "../../../app/professionals/fixed-location/fixedLocation.use";
import type { TemplateSyncSettings } from "../businessSetupTemplateSync";
import {
  formatFixedLocationMunicipalities,
  mapServiceItemsToCategories,
  type ServiceDetailUiItem,
} from "./useProfessionalFixedLocationSetup.helpers";
import type {
  BusinessSetupSectionId,
  BusinessTemplateState,
  DesiredAreaRow,
  OfferingOption,
  OfferingSelectOption,
  TeamService,
} from "./useProfessionalFixedLocationSetup.types";

export type UseProfessionalFixedLocationSetupSaveHandlersArgs = {
  onSaveBusinessSetup?: (
    payload: UpsertBusinessSetupPayload,
  ) => Promise<void>;
  showSnackbar: (opts: {
    severity: "error" | "warning" | "success" | "info";
    message: string;
  }) => void;
  updateBusinessSetupActive: (args: {
    is_active: boolean;
  }) => { unwrap: () => Promise<{ message?: string }> };
  isBusinessProfileActive: boolean;
  businessOfferingSelect: OfferingSelectOption;
  desiredBusiness: BusinessTemplateState;
  fixedBiz: BusinessTemplateState;
  desiredAreaMode: "Specific areas only" | "All Netherlands";
  desiredAreas: DesiredAreaRow[];
  mediaSlides: string[];
  templateSyncSettings: TemplateSyncSettings;
  businessCategories: BusinessCategory[];
  businessSetupData: BusinessSetup | null;
  values: FixedLocationFormState;
  toTeamServicePayload: (
    services: TeamService,
  ) => Array<{ service_id: string; title: string | null }>;
  teamMembersFixed: TeamMemberUi[];
  teamMembersDesired: TeamMemberUi[];
  setTeamMembersFixed: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  setTeamMembersDesired: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  setIsBusinessPublishEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingBusinessSections: React.Dispatch<
    React.SetStateAction<Set<BusinessSetupSectionId>>
  >;
  setActiveBusinessTemplate: React.Dispatch<
    React.SetStateAction<OfferingOption>
  >;
};

/** Build/save business setup payloads (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupSaveHandlers(
  args: UseProfessionalFixedLocationSetupSaveHandlersArgs,
) {
  const {
    onSaveBusinessSetup,
    showSnackbar,
    updateBusinessSetupActive,
    isBusinessProfileActive,
    businessOfferingSelect,
    desiredBusiness,
    fixedBiz,
    desiredAreaMode,
    desiredAreas,
    mediaSlides,
    templateSyncSettings,
    businessCategories,
    businessSetupData,
    values,
    toTeamServicePayload,
    teamMembersFixed,
    teamMembersDesired,
    setTeamMembersFixed,
    setTeamMembersDesired,
    setIsBusinessPublishEnabled,
    setEditingBusinessSections,
    setActiveBusinessTemplate,
  } = args;

  const onSaveBusinessProfile = React.useCallback(() => {
    setIsBusinessPublishEnabled(true);
  }, []);

  const servicesFixedRef = React.useRef<ServiceDetailUiItem[]>([]);
  const servicesDesiredRef = React.useRef<ServiceDetailUiItem[]>([]);
  const businessSetupSaveChainRef = React.useRef<Promise<void>>(Promise.resolve());

  const setBusinessProfileActive = React.useCallback(
    async (nextActive: boolean, successMessage?: string) => {
      try {
        const result = await updateBusinessSetupActive({
          is_active: nextActive,
        }).unwrap();
        showSnackbar({
          severity: "success",
          message:
            successMessage ||
            result.message ||
            (nextActive
              ? "Business profile activated successfully."
              : "Business profile deactivated successfully."),
        });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to update business profile status.",
          ),
        });
      }
    },
    [showSnackbar, updateBusinessSetupActive],
  );

  const onToggleBusinessProfileActive = React.useCallback(async () => {
    await setBusinessProfileActive(!isBusinessProfileActive);
  }, [isBusinessProfileActive, setBusinessProfileActive]);

  const toPersistedTeamMemberId = React.useCallback((id: string) => {
    const normalized = String(id ?? "").trim();
    if (!normalized || normalized.startsWith("tm-")) {
      return undefined;
    }

    return normalized;
  }, []);

  const buildBusinessSetupPayload = React.useCallback(
    (members: TeamMemberUi[]): UpsertBusinessSetupRequest => {
      const locationModeMap: Record<
        OfferingSelectOption,
        UpsertBusinessSetupRequest["location_mode"]
      > = {
        "Fixed Location": "fixed",
        "Desired Location": "desired",
        Both: "both",
      };
      const sourceBiz =
        businessOfferingSelect === "Desired Location"
          ? desiredBusiness
          : fixedBiz;
      const serviceItems = (() => {
        if (businessOfferingSelect === "Desired Location") {
          return servicesDesiredRef.current;
        }
        if (businessOfferingSelect === "Both") {
          const seen = new Set<string>();
          return [
            ...servicesFixedRef.current,
            ...servicesDesiredRef.current,
          ].filter((item) => {
            const key = String(item.serviceId ?? "");
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        return servicesFixedRef.current;
      })();
      const desiredAreaText =
        desiredAreaMode === "All Netherlands"
          ? "All Netherlands"
          : desiredAreas
              .map((area) => area.municipality)
              .filter(Boolean)
              .join(", ");
      const desiredProvinceText =
        desiredAreaMode === "All Netherlands"
          ? "All Netherlands"
          : Array.from(
              new Set(
                desiredAreas.map((area) => area.province).filter(Boolean),
              ),
            ).join(", ");

      const addressSource =
        businessOfferingSelect === "Desired Location"
          ? desiredBusiness
          : fixedBiz;

      return {
        location_mode: locationModeMap[businessOfferingSelect] ?? "fixed",
        business_name: sourceBiz.profileName,
        business_about: sourceBiz.about,
        business_keywords: sourceBiz.keywords,
        business_media: mediaSlides
          .filter(isPersistedMediaUrl)
          .slice(0, BUSINESS_MEDIA_MAX_COUNT),
        salon_name: sourceBiz.profileName,
        fixed_location_address: addressSource.streetAddress,
        fixed_location_street_number: addressSource.streetNumber,
        fixed_location_postal_code: addressSource.postalCode,
        fixed_location_province:
          businessOfferingSelect === "Desired Location"
            ? desiredProvinceText
            : fixedBiz.province,
        fixed_location_municipality:
          businessOfferingSelect === "Desired Location"
            ? desiredAreaText
            : formatFixedLocationMunicipalities(fixedBiz.municipalities),
        service_for: Object.entries(sourceBiz.serviceFor)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key),
        service_categories: (() => {
          const mapped = mapServiceItemsToCategories(
            serviceItems,
            (businessSetupData?.service_categories ?? []) as Array<
              Record<string, unknown>
            >,
          );
          return mapped.length
            ? mapped
            : businessSetupData?.service_categories ?? [];
        })(),
        project: (() => {
          const projectSource =
            businessOfferingSelect === "Fixed Location"
              ? fixedBiz
              : desiredBusiness;
          return projectSource.projectEnabled
            ? projectSource.projectInstructions
            : "";
        })(),
        book_service_notes: sourceBiz.bookComboInstructions,
        book_service_combinations: sourceBiz.bookCombos
          .map((combo) => {
            const allSubs = businessCategories.flatMap((category) =>
              category.subcategories.map((subcategory) => ({
                id: String(subcategory.id),
                title: subcategory.title,
              })),
            );
            const firstServiceId = String(combo.categoryId ?? "").trim();
            const secondServiceId = String(combo.serviceId ?? "").trim();
            const first = allSubs.find((item) => item.id === firstServiceId);
            const second = allSubs.find((item) => item.id === secondServiceId);

            if (!firstServiceId || !secondServiceId) {
              return null;
            }

            return {
              category_id: firstServiceId,
              category_title: first?.title ?? null,
              service_id: secondServiceId,
              service_title: second?.title ?? null,
            };
          })
          .filter(
            (combo): combo is NonNullable<typeof combo> => combo !== null,
          ),
        additional_notes: sourceBiz.notes,
        price_range: [sourceBiz.priceRangeFrom, sourceBiz.priceRangeTo]
          .filter(Boolean)
          .join(" - "),
        prepayment_percentage: Number(sourceBiz.prepaymentPercent) || null,
        prepayment_instruction: sourceBiz.prepaymentInstructions,
        kilometer_allowance: Number(sourceBiz.kilometerAllowance) || null,
        kilometer_allowance_instruction:
          sourceBiz.kilometerAllowanceInstructions,
        response_time_hours: Number(values.policyResponseHours) || null,
        response_time_minutes: Number(values.policyResponseMinutes) || null,
        policy_custom_instruction: values.policyInstructions,
        appointment_before_hours: Number(values.rescheduleMinimumHours) || null,
        appointment_before_minutes:
          Number(values.rescheduleMinimumMinutes) || null,
        late_reschedule_fee_percentage:
          Number(values.rescheduleLateFeePercent) || null,
        late_reschedule_policy_instruction: values.rescheduleInstructions,
        cancellation_before_hours: Number(values.cancelMinimumHours) || null,
        cancellation_before_minutes:
          Number(values.cancelMinimumMinutes) || null,
        late_cancellation_fee_percentage:
          Number(values.cancelLateFeePercent) || null,
        cancellation_policy_instruction: values.cancelInstructions,
        no_show_fee_percentage: Number(values.noShowFeePercent) || null,
        no_show_fee_instruction: values.noShowInstructions,
        desired_location_area: desiredAreaText,
        desired_location_province: desiredProvinceText,
        desired_location_services: serviceItems.map((item) => item.name),
        section_sync_settings: templateSyncSettings,
        team_members: members.map((member, index) => ({
          id: toPersistedTeamMemberId(member.id),
          photo_upload_key: member.pendingPhotoFile ? member.id : undefined,
          full_name: member.name,
          role: member.role,
          profile_photo: member.pendingPhotoFile
            ? null
            : isPersistedMediaUrl(member.photoSrc)
              ? member.photoSrc
              : null,
          assigned_services: toTeamServicePayload(member.services),
          display_order: index + 1,
        })),
      };
    },
    [
      businessOfferingSelect,
      businessCategories,
      businessSetupData?.service_categories,
      desiredAreaMode,
      desiredAreas,
      desiredBusiness,
      fixedBiz,
      mediaSlides,
      templateSyncSettings,
      toPersistedTeamMemberId,
      toTeamServicePayload,
      values,
    ],
  );

  const buildBusinessSetupSaveBody = React.useCallback(
    (
      members: TeamMemberUi[],
      options?: { publish?: boolean; section?: UpsertBusinessSetupRequest["section"] },
    ): UpsertBusinessSetupPayload => {
      const payload: UpsertBusinessSetupRequest = {
        ...buildBusinessSetupPayload(members),
        publish: options?.publish === true,
        ...(options?.section ? { section: options.section } : {}),
      };
      const teamPhotoFiles = members
        .filter((member): member is TeamMemberUi & { pendingPhotoFile: File } =>
          Boolean(member.pendingPhotoFile),
        )
        .map((member) => ({
          memberKey: member.id,
          file: member.pendingPhotoFile,
        }));

      return buildUpsertBusinessSetupBody(payload, teamPhotoFiles);
    },
    [buildBusinessSetupPayload],
  );

  const clearPendingTeamMemberPhotos = React.useCallback(() => {
    setTeamMembersFixed((prev) =>
      prev.map((member) => ({ ...member, pendingPhotoFile: null })),
    );
    setTeamMembersDesired((prev) =>
      prev.map((member) => ({ ...member, pendingPhotoFile: null })),
    );
  }, []);

  const saveBusinessSetupData = React.useCallback(
    async (options?: {
      publish?: boolean;
      section?: UpsertBusinessSetupRequest["section"];
    }) => {
    if (!onSaveBusinessSetup) return;

    const runSave = async () => {
      const teamForSave =
        businessOfferingSelect === "Desired Location"
          ? teamMembersDesired
          : teamMembersFixed;
      await onSaveBusinessSetup(buildBusinessSetupSaveBody(teamForSave, options));
      clearPendingTeamMemberPhotos();
    };

    businessSetupSaveChainRef.current = businessSetupSaveChainRef.current
      .catch(() => undefined)
      .then(runSave);
    await businessSetupSaveChainRef.current;
  }, [
    buildBusinessSetupSaveBody,
    businessOfferingSelect,
    clearPendingTeamMemberPhotos,
    onSaveBusinessSetup,
    teamMembersDesired,
    teamMembersFixed,
  ]);

  const notifyBusinessSetupPersisted = React.useCallback(
    (savedMessage = "Saved. Publish to show these changes to clients.") => {
      setIsBusinessPublishEnabled(true);
      showSnackbar({
        severity: "success",
        message: savedMessage,
      });
    },
    [showSnackbar],
  );

  const saveBusinessSection = React.useCallback(
    async (sectionId: BusinessSetupSectionId) => {
      if (!onSaveBusinessSetup) {
        setEditingBusinessSections((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
        return;
      }

      try {
        await saveBusinessSetupData({ section: sectionId });
        setEditingBusinessSections((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
        notifyBusinessSetupPersisted();
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to save changes."),
        });
      }
    },
    [notifyBusinessSetupPersisted, onSaveBusinessSetup, saveBusinessSetupData, showSnackbar],
  );

  const onSwitchActiveBusinessTemplate = React.useCallback(
    (opt: OfferingOption) => {
      if (!isBusinessProfileActive) {
        void onToggleBusinessProfileActive();
      }
      setActiveBusinessTemplate(opt);
    },
    [isBusinessProfileActive, onToggleBusinessProfileActive],
  );

  return {
    onSaveBusinessProfile,
    servicesFixedRef,
    servicesDesiredRef,
    businessSetupSaveChainRef,
    setBusinessProfileActive,
    onToggleBusinessProfileActive,
    toPersistedTeamMemberId,
    buildBusinessSetupPayload,
    buildBusinessSetupSaveBody,
    clearPendingTeamMemberPhotos,
    saveBusinessSetupData,
    notifyBusinessSetupPersisted,
    saveBusinessSection,
    onSwitchActiveBusinessTemplate,
  };
}
