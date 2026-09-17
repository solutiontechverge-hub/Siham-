"use client";

import * as React from "react";
import type {
  UpsertBusinessSetupPayload,
  UpsertBusinessSetupRequest,
} from "../../../store/services/businessApi";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  formatBusinessSetupValidationMessage,
  validateBusinessSetupForPublish,
} from "../businessSetupPublishValidation";
import type { TemplateSyncSettings } from "../businessSetupTemplateSync";
import type { TeamMemberUi } from "../../../app/professionals/fixed-location/businessTeamMemberModal.use";
import type { FixedLocationFormState } from "../../../app/professionals/fixed-location/fixedLocation.use";
import type {
  BusinessSetupSectionId,
  BusinessTemplateState,
  DesiredAreaRow,
  OfferingSelectOption,
} from "./useProfessionalFixedLocationSetup.types";

export type UseProfessionalFixedLocationSetupPublishArgs = {
  businessOfferingSelect: OfferingSelectOption;
  desiredBusiness: BusinessTemplateState;
  fixedBiz: BusinessTemplateState;
  desiredAreaMode: "Specific areas only" | "All Netherlands";
  desiredAreas: DesiredAreaRow[];
  mediaSlides: string[];
  servicesFixed: { length: number };
  servicesDesired: { length: number };
  isBothOffering: boolean;
  templateSyncSettings: TemplateSyncSettings;
  teamMembersFixed: TeamMemberUi[];
  teamMembersDesired: TeamMemberUi[];
  portfolioItemsFixed: { length: number };
  portfolioItemsDesired: { length: number };
  values: FixedLocationFormState;
  isBusinessProfileActive: boolean;
  showSnackbar: (opts: {
    severity: "error" | "warning" | "success" | "info";
    message: string;
  }) => void;
  onSaveBusinessSetup?: (
    payload: UpsertBusinessSetupPayload,
  ) => Promise<void>;
  saveBusinessSetupData: (options?: {
    publish?: boolean;
    section?: UpsertBusinessSetupRequest["section"];
  }) => Promise<void>;
  clearPendingTeamMemberPhotos: () => void;
  updateBusinessSetupActive: (args: {
    is_active: boolean;
  }) => { unwrap: () => Promise<{ message?: string }> };
  editingBusinessSections: Set<BusinessSetupSectionId>;
  setEditingBusinessSections: React.Dispatch<
    React.SetStateAction<Set<BusinessSetupSectionId>>
  >;
  setIsBusinessPublishEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setPublishConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

/** Publish validation + confirm handlers (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupPublish(
  args: UseProfessionalFixedLocationSetupPublishArgs,
) {
  const {
    businessOfferingSelect,
    desiredBusiness,
    fixedBiz,
    desiredAreaMode,
    desiredAreas,
    mediaSlides,
    servicesFixed,
    servicesDesired,
    isBothOffering,
    templateSyncSettings,
    teamMembersFixed,
    teamMembersDesired,
    portfolioItemsFixed,
    portfolioItemsDesired,
    values,
    isBusinessProfileActive,
    showSnackbar,
    onSaveBusinessSetup,
    saveBusinessSetupData,
    clearPendingTeamMemberPhotos,
    updateBusinessSetupActive,
    editingBusinessSections,
    setEditingBusinessSections,
    setIsBusinessPublishEnabled,
    setPublishConfirmOpen,
  } = args;

  const getBusinessSetupPublishValidation = React.useCallback(() => {
    const profileSource =
      businessOfferingSelect === "Desired Location"
        ? desiredBusiness
        : fixedBiz;

    return validateBusinessSetupForPublish({
      offering: businessOfferingSelect,
      profileName: profileSource.profileName,
      about: profileSource.about,
      keywords: profileSource.keywords,
      mediaCount: mediaSlides.length,
      fixedLocation: {
        salonName: fixedBiz.salonName,
        streetAddress: fixedBiz.streetAddress,
        streetNumber: fixedBiz.streetNumber,
        postalCode: fixedBiz.postalCode,
        province: fixedBiz.province,
        municipalities: fixedBiz.municipalities,
      },
      desiredLocation: {
        areaMode: desiredAreaMode,
        areasCount: desiredAreas.length,
      },
      serviceFor: profileSource.serviceFor,
      servicesFixedCount: servicesFixed.length,
      servicesDesiredCount: servicesDesired.length,
      servicesDetailsSync:
        isBothOffering && templateSyncSettings.servicesDetails === "sync",
      manageTeamSync:
        isBothOffering && templateSyncSettings.manageTeam === "sync",
      portfolioSync:
        isBothOffering && templateSyncSettings.portfolio === "sync",
      teamMembersFixed: teamMembersFixed.map((member) => ({
        name: member.name,
        role: member.role,
      })),
      teamMembersDesired: teamMembersDesired.map((member) => ({
        name: member.name,
        role: member.role,
      })),
      portfolioFixedCount: portfolioItemsFixed.length,
      portfolioDesiredCount: portfolioItemsDesired.length,
      notes: profileSource.notes,
      policyResponseHours: values.policyResponseHours,
      policyResponseMinutes: values.policyResponseMinutes,
      policyInstructions: values.policyInstructions,
      rescheduleMinimumHours: values.rescheduleMinimumHours,
      rescheduleMinimumMinutes: values.rescheduleMinimumMinutes,
      rescheduleLateFeePercent: values.rescheduleLateFeePercent,
      rescheduleInstructions: values.rescheduleInstructions,
      cancelMinimumHours: values.cancelMinimumHours,
      cancelMinimumMinutes: values.cancelMinimumMinutes,
      cancelLateFeePercent: values.cancelLateFeePercent,
      cancelInstructions: values.cancelInstructions,
      noShowFeePercent: values.noShowFeePercent,
      noShowInstructions: values.noShowInstructions,
    });
  }, [
    businessOfferingSelect,
    desiredAreaMode,
    desiredAreas.length,
    desiredBusiness,
    fixedBiz,
    isBothOffering,
    mediaSlides.length,
    portfolioItemsDesired.length,
    portfolioItemsFixed.length,
    servicesDesired.length,
    servicesFixed.length,
    teamMembersDesired,
    teamMembersFixed,
    templateSyncSettings.manageTeam,
    templateSyncSettings.portfolio,
    templateSyncSettings.servicesDetails,
    values,
  ]);

  const businessSetupPublishValidation = React.useMemo(
    () => getBusinessSetupPublishValidation(),
    [getBusinessSetupPublishValidation],
  );

  const publishBlockedByValidation = React.useMemo(
    () =>
      !isBusinessProfileActive && !businessSetupPublishValidation.valid,
    [businessSetupPublishValidation.valid, isBusinessProfileActive],
  );

  const onAttemptPublishBusinessSetup = React.useCallback(() => {
    if (!isBusinessProfileActive) {
      const { valid, missingFields } = getBusinessSetupPublishValidation();
      if (!valid) {
        showSnackbar({
          severity: "error",
          message: formatBusinessSetupValidationMessage(missingFields),
        });
        return;
      }
    }
    setPublishConfirmOpen(true);
  }, [
    getBusinessSetupPublishValidation,
    isBusinessProfileActive,
    showSnackbar,
  ]);

  const onPublishBusinessSetup = React.useCallback(async () => {
    if (!onSaveBusinessSetup) {
      setIsBusinessPublishEnabled(false);
      setPublishConfirmOpen(false);
      return;
    }

    if (!isBusinessProfileActive) {
      const { valid, missingFields } = getBusinessSetupPublishValidation();
      if (!valid) {
        showSnackbar({
          severity: "error",
          message: formatBusinessSetupValidationMessage(missingFields),
        });
        setPublishConfirmOpen(false);
        return;
      }
    }

    try {
      const openSections = [...editingBusinessSections];
      for (const sectionId of openSections) {
        await saveBusinessSetupData({ section: sectionId });
      }
      const locationModeMap: Record<
        OfferingSelectOption,
        UpsertBusinessSetupRequest["location_mode"]
      > = {
        "Fixed Location": "fixed",
        "Desired Location": "desired",
        Both: "both",
      };
      await onSaveBusinessSetup({
        publish: true,
        location_mode: locationModeMap[businessOfferingSelect] ?? "fixed",
      });
      clearPendingTeamMemberPhotos();
      await updateBusinessSetupActive({ is_active: true }).unwrap();
      setIsBusinessPublishEnabled(false);
      setEditingBusinessSections(new Set());
      setPublishConfirmOpen(false);
      showSnackbar({
        severity: "success",
        message: "Changes published and are now live.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to publish changes."),
      });
    }
  }, [
    businessOfferingSelect,
    clearPendingTeamMemberPhotos,
    editingBusinessSections,
    getBusinessSetupPublishValidation,
    isBusinessProfileActive,
    onSaveBusinessSetup,
    saveBusinessSetupData,
    showSnackbar,
    updateBusinessSetupActive,
  ]);

  return {
    getBusinessSetupPublishValidation,
    businessSetupPublishValidation,
    publishBlockedByValidation,
    onAttemptPublishBusinessSetup,
    onPublishBusinessSetup,
  };
}
