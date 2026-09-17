"use client";

import * as React from "react";
import type {
  BusinessCategory,
  BusinessTeamMember,
} from "../../../store/services/businessApi";
import {
  BUSINESS_SERVICE_CATEGORY_CATALOG,
  resolveServiceCategorySliderIconId,
} from "../../../data/businessServiceCategorySlider.data";
import type { TeamMemberUi } from "../../../app/professionals/fixed-location/businessTeamMemberModal.use";
import { TEAM_SERVICE_SLOT_KEYS as TEAM_SERVICE_SLOT_KEYS_DATA } from "./professionalFixedLocationSetup.data";
import type { TeamService } from "./useProfessionalFixedLocationSetup.types";

export type UseProfessionalFixedLocationSetupTeamStateArgs = {
  businessCategories: BusinessCategory[];
};

export type TeamMemberServiceGroup = {
  categoryId: string;
  categoryTitle: string;
  subServices: Array<{ id: string; label: string }>;
};

/** Manage-team state + slot helpers (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupTeamState({
  businessCategories,
}: UseProfessionalFixedLocationSetupTeamStateArgs) {
  const TEAM_SERVICE_SLOT_KEYS: (keyof TeamService)[] = [
    ...TEAM_SERVICE_SLOT_KEYS_DATA,
  ];

  const allSubcategoryOptions = React.useMemo(
    () =>
      businessCategories.flatMap((category) =>
        category.subcategories.map((subcategory) => ({
          value: String(subcategory.id),
          label: subcategory.title,
        })),
      ),
    [businessCategories],
  );

  const getSubcategoryLabel = React.useCallback(
    (serviceId: string) => {
      const v = String(serviceId ?? "").trim();
      if (!v) return "";
      return allSubcategoryOptions.find((o) => o.value === v)?.label ?? v;
    },
    [allSubcategoryOptions],
  );

  const resolveCategoryDisplayTitle = React.useCallback(
    (categoryTitle: string, categoryId?: string) => {
      const fromApi = categoryId
        ? businessCategories.find(
            (category) => String(category.id) === String(categoryId),
          )?.title
        : undefined;
      if (fromApi) return fromApi;

      const byTitle = businessCategories.find(
        (category) =>
          category.title.trim().toLowerCase() ===
          categoryTitle.trim().toLowerCase(),
      )?.title;
      if (byTitle) return byTitle;

      const catalog = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
        (entry) =>
          resolveServiceCategorySliderIconId(categoryTitle) === entry.iconId,
      );
      return catalog?.label ?? categoryTitle;
    },
    [businessCategories],
  );

  const getMemberAssignedServiceIds = React.useCallback(
    (services: TeamService) => {
      return TEAM_SERVICE_SLOT_KEYS.map((key) =>
        String(services[key] ?? "").trim(),
      ).filter(Boolean);
    },
    [],
  );

  const removeServiceIdFromTeamMembers = React.useCallback(
    (serviceId: string) => {
      const normalizedId = String(serviceId ?? "").trim();
      if (!normalizedId) return;

      setTeamMembers((prev) =>
        prev.map((member) => {
          const nextServices = { ...member.services };
          let changed = false;

          for (const key of TEAM_SERVICE_SLOT_KEYS) {
            if (String(nextServices[key] ?? "") === normalizedId) {
              nextServices[key] = "";
              changed = true;
            }
          }

          return changed ? { ...member, services: nextServices } : member;
        }),
      );
    },
    [],
  );

  const memberProvidesAllServices = React.useCallback(
    (services: TeamService) => {
      const allSubcategoryIds = businessCategories.flatMap((category) =>
        category.subcategories.map((sub) => String(sub.id)),
      );
      if (allSubcategoryIds.length === 0) return false;

      const assigned = new Set(getMemberAssignedServiceIds(services));
      if (assigned.size !== allSubcategoryIds.length) return false;

      return allSubcategoryIds.every((id) => assigned.has(id));
    },
    [businessCategories, getMemberAssignedServiceIds],
  );

  const defaultServices = React.useCallback(
    (
      assignedServices: BusinessTeamMember["assigned_services"] = [],
    ): TeamService => {
      const values = assignedServices
        .map((service) => String(service.service_id))
        .filter(Boolean);

      return {
        slot1: values[0] ?? "",
        slot2: values[1] ?? "",
        slot3: values[2] ?? "",
        slot4: values[3] ?? "",
        slot5: values[4] ?? "",
        slot6: values[5] ?? "",
        slot7: values[6] ?? "",
      };
    },
    [],
  );

  const [teamMembersFixed, setTeamMembersFixed] = React.useState<
    TeamMemberUi[]
  >([]);
  const [teamMembersDesired, setTeamMembersDesired] = React.useState<
    TeamMemberUi[]
  >([]);
  const activeTeamTargetRef = React.useRef<"fixed" | "desired">("fixed");
  const teamLiveSyncRef = React.useRef(false);

  const setTeamMembers = React.useCallback(
    (value: React.SetStateAction<TeamMemberUi[]>) => {
      const resolve = (prev: TeamMemberUi[]) =>
        typeof value === "function" ? value(prev) : value;
      if (activeTeamTargetRef.current === "desired") {
        setTeamMembersDesired((prev) => {
          const next = resolve(prev);
          if (teamLiveSyncRef.current) {
            setTeamMembersFixed(
              next.map((member) => ({ ...member, pendingPhotoFile: null })),
            );
          }
          return next;
        });
        return;
      }
      setTeamMembersFixed((prev) => {
        const next = resolve(prev);
        if (teamLiveSyncRef.current) {
          setTeamMembersDesired(
            next.map((member) => ({ ...member, pendingPhotoFile: null })),
          );
        }
        return next;
      });
    },
    [],
  );

  const [teamServiceMenu, setTeamServiceMenu] = React.useState<{
    anchorEl: HTMLElement;
    menuKey: string;
    groups?: Array<{
      categoryTitle: string;
      items: Array<{ id: string; label: string }>;
    }>;
    items?: Array<{ id: string; label: string }>;
  } | null>(null);

  const [featureTeamPublic, setFeatureTeamPublic] = React.useState(false);

  const addedBlobUrlsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    return () => {
      // Revoke any blob URLs we created to avoid memory leaks.
      for (const url of addedBlobUrlsRef.current) URL.revokeObjectURL(url);
      addedBlobUrlsRef.current = [];
    };
  }, []);

  return {
    TEAM_SERVICE_SLOT_KEYS,
    allSubcategoryOptions,
    getSubcategoryLabel,
    resolveCategoryDisplayTitle,
    getMemberAssignedServiceIds,
    removeServiceIdFromTeamMembers,
    memberProvidesAllServices,
    defaultServices,
    teamMembersFixed,
    setTeamMembersFixed,
    teamMembersDesired,
    setTeamMembersDesired,
    activeTeamTargetRef,
    teamLiveSyncRef,
    setTeamMembers,
    teamServiceMenu,
    setTeamServiceMenu,
    featureTeamPublic,
    setFeatureTeamPublic,
    addedBlobUrlsRef,
  };
}
