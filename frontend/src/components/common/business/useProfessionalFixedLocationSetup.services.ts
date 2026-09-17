"use client";

import * as React from "react";
import type {
  BusinessCategory,
  UpsertBusinessSetupPayload,
  UpsertBusinessSetupRequest,
} from "../../../store/services/businessApi";
import { getApiErrorMessage } from "../../../lib/api-error";
import type { ServiceOrderSettings } from "../calendar/calendar-settings.types";
import {
  isCategoryVisibleInServiceOrder,
  sortCategoriesByServiceOrder,
  sortServicesByServiceOrder,
  serviceOrderLabelsMatch,
} from "../calendar/serviceOrder.utils";
import {
  normalizeTemplateSyncSettings,
  pickSectionFields,
  type TemplateSyncSettings,
} from "../businessSetupTemplateSync";
import {
  BUSINESS_SERVICE_CATEGORY_CATALOG,
  buildDynamicServiceCategoryTabs,
  findBusinessCategoryForCatalogEntry,
  resolveServiceCategoryStorageId,
  resolveServiceCategorySliderIconId,
  serviceMatchesCategoryTab,
} from "../../../data/businessServiceCategorySlider.data";
import {
  businessServiceModalCopy,
  isHydratedMainServiceId,
  type BusinessMainServiceUi,
} from "../../../data/businessServiceModal.data";
import { useBusinessServiceModal } from "../../../app/professionals/fixed-location/businessServiceModal.use";
import {
  useBusinessTeamMemberModal,
  type TeamMemberUi,
} from "../../../app/professionals/fixed-location/businessTeamMemberModal.use";
import { buildTeamBusinessServiceRefs } from "../../../data/businessTeamMemberModal.data";
import type { ServiceDetailUiItem } from "./useProfessionalFixedLocationSetup.helpers";
import type {
  BusinessTemplateState,
  OfferingOption,
  TeamService,
} from "./useProfessionalFixedLocationSetup.types";
import type { TeamMemberServiceGroup } from "./useProfessionalFixedLocationSetup.teamState";

export type UseProfessionalFixedLocationSetupServicesArgs = {
  activeBusinessTemplate: OfferingOption;
  isBothOffering: boolean;
  templateSyncSettings: TemplateSyncSettings;
  businessCategories: BusinessCategory[];
  calendarServiceOrder: ServiceOrderSettings;
  servicesFixedRef: React.MutableRefObject<ServiceDetailUiItem[]>;
  servicesDesiredRef: React.MutableRefObject<ServiceDetailUiItem[]>;
  setIsBusinessPublishEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  getCurrentBusinessState: () => BusinessTemplateState;
  setDesiredBusiness: React.Dispatch<React.SetStateAction<BusinessTemplateState>>;
  setTemplateSyncSettings: React.Dispatch<React.SetStateAction<TemplateSyncSettings>>;
  setTemplateSyncDraft: React.Dispatch<React.SetStateAction<TemplateSyncSettings>>;
  teamMembersFixed: TeamMemberUi[];
  setTeamMembersDesired: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  portfolioItemsFixed: Array<{ id: string; src: string }>;
  setPortfolioItemsDesired: React.Dispatch<
    React.SetStateAction<Array<{ id: string; src: string }>>
  >;
  teamMembers: TeamMemberUi[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  setTeamServiceMenu: React.Dispatch<
    React.SetStateAction<{
      anchorEl: HTMLElement;
      menuKey: string;
      groups?: Array<{
        categoryTitle: string;
        items: Array<{ id: string; label: string }>;
      }>;
      items?: Array<{ id: string; label: string }>;
    } | null>
  >;
  removeServiceIdFromTeamMembers: (serviceId: string) => void;
  allSubcategoryOptions: Array<{ value: string; label: string }>;
  getMemberAssignedServiceIds: (services: TeamService) => string[];
  resolveCategoryDisplayTitle: (title: string) => string;
  onSaveBusinessSetup?: (payload: UpsertBusinessSetupPayload) => Promise<void>;
  buildBusinessSetupSaveBody: (
    members: TeamMemberUi[],
    options?: {
      publish?: boolean;
      section?: UpsertBusinessSetupRequest["section"];
    },
  ) => UpsertBusinessSetupPayload;
  saveBusinessSetupData: (options?: {
    publish?: boolean;
    section?: UpsertBusinessSetupRequest["section"];
  }) => Promise<void>;
  notifyBusinessSetupPersisted: (savedMessage?: string) => void;
  showSnackbar: (opts: {
    severity: "error" | "warning" | "success" | "info";
    message: string;
  }) => void;
};

/** Services state + category tabs + modals/handlers (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupServices(
  args: UseProfessionalFixedLocationSetupServicesArgs,
) {
  const {
    activeBusinessTemplate,
    isBothOffering,
    templateSyncSettings,
    businessCategories,
    calendarServiceOrder,
    servicesFixedRef,
    servicesDesiredRef,
    setIsBusinessPublishEnabled,
    getCurrentBusinessState,
    setDesiredBusiness,
    setTemplateSyncSettings,
    setTemplateSyncDraft,
    teamMembersFixed,
    setTeamMembersDesired,
    portfolioItemsFixed,
    setPortfolioItemsDesired,
    teamMembers,
    setTeamMembers,
    setTeamServiceMenu,
    removeServiceIdFromTeamMembers,
    allSubcategoryOptions,
    getMemberAssignedServiceIds,
    resolveCategoryDisplayTitle,
    onSaveBusinessSetup,
    buildBusinessSetupSaveBody,
    saveBusinessSetupData,
    notifyBusinessSetupPersisted,
    showSnackbar,
  } = args;

  const [activeServiceCategory, setActiveServiceCategory] =
    React.useState<string>("all");

  // ── Services (template-aware) + drawer ────────────────────────────────────
  const initialServiceItems = React.useMemo(
    () => [] as ServiceDetailUiItem[],
    [],
  );
  const [servicesFixed, setServicesFixed] = React.useState<
    ServiceDetailUiItem[]
  >(() => initialServiceItems);
  const [servicesDesired, setServicesDesired] = React.useState<
    ServiceDetailUiItem[]
  >(() => initialServiceItems);
  const [mainServicesFixed, setMainServicesFixed] = React.useState<
    BusinessMainServiceUi[]
  >([]);
  const [mainServicesDesired, setMainServicesDesired] = React.useState<
    BusinessMainServiceUi[]
  >([]);
  servicesFixedRef.current = servicesFixed;
  servicesDesiredRef.current = servicesDesired;

  const activeServices =
    activeBusinessTemplate === "Fixed Location" ||
    (isBothOffering && templateSyncSettings.servicesDetails === "sync")
      ? servicesFixed
      : servicesDesired;
  const activeMainServices =
    activeBusinessTemplate === "Fixed Location" ||
    (isBothOffering && templateSyncSettings.servicesDetails === "sync")
      ? mainServicesFixed
      : mainServicesDesired;

  /**
   * Services Details category cards come from Calendar → Service Order Rules
   * (order + hide/unhide). New accounts get the 8 platform defaults until saved.
   */
  const serviceCategoryTabs = React.useMemo(() => {
    const orderedCategories: Array<{ id: string; title: string }> = [];
    const seenIds = new Set<string>();
    const hasTitle = (title: string) =>
      orderedCategories.some((entry) =>
        serviceOrderLabelsMatch(entry.title, title),
      );

    const pushCategory = (id: string, title: string) => {
      const trimmedId = String(id ?? "").trim();
      const trimmedTitle = String(title ?? "").trim();
      if (!trimmedId || !trimmedTitle) return;
      if (seenIds.has(trimmedId) || hasTitle(trimmedTitle)) return;
      if (!isCategoryVisibleInServiceOrder(calendarServiceOrder, trimmedTitle))
        return;
      seenIds.add(trimmedId);
      orderedCategories.push({ id: trimmedId, title: trimmedTitle });
    };

    for (const title of calendarServiceOrder.categories) {
      const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
        (entry) =>
          serviceOrderLabelsMatch(entry.label, title) ||
          serviceOrderLabelsMatch(entry.key, title) ||
          resolveServiceCategorySliderIconId(title) === entry.iconId,
      );
      const apiCategory = catalogEntry
        ? findBusinessCategoryForCatalogEntry(businessCategories, catalogEntry)
        : businessCategories.find((category) =>
            serviceOrderLabelsMatch(category.title, title),
          );
      const id = apiCategory
        ? String(apiCategory.id)
        : (catalogEntry?.key ?? title);
      const displayTitle = catalogEntry?.label ?? apiCategory?.title ?? title;
      pushCategory(id, displayTitle);
    }

    // Keep custom categories that already have services (even if not yet in saved order).
    for (const service of activeServices) {
      const categoryId = String(service.categoryId ?? "").trim();
      if (!categoryId) continue;
      const titleFromApi = businessCategories.find(
        (category) => String(category.id) === categoryId,
      )?.title;
      const rawTitle =
        service.categoryTitle?.trim() ||
        titleFromApi ||
        `Category ${categoryId}`;
      const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
        (entry) =>
          resolveServiceCategorySliderIconId(rawTitle) === entry.iconId,
      );
      pushCategory(categoryId, catalogEntry?.label ?? rawTitle);
    }

    if (!orderedCategories.length) {
      return [{ id: "all", label: "All", iconId: "all" as const }];
    }

    return buildDynamicServiceCategoryTabs(
      sortCategoriesByServiceOrder(orderedCategories, calendarServiceOrder),
    );
  }, [activeServices, businessCategories, calendarServiceOrder]);

  const setActiveServices = React.useCallback(
    (value: React.SetStateAction<ServiceDetailUiItem[]>) => {
      setIsBusinessPublishEnabled(true);
      const liveSync =
        isBothOffering && templateSyncSettings.servicesDetails === "sync";
      if (activeBusinessTemplate === "Fixed Location") {
        const prev = servicesFixedRef.current;
        const next = typeof value === "function" ? value(prev) : value;
        servicesFixedRef.current = next;
        if (liveSync) {
          servicesDesiredRef.current = next;
          setServicesDesired(next);
        }
        setServicesFixed(next);
      } else {
        const prev = servicesDesiredRef.current;
        const next = typeof value === "function" ? value(prev) : value;
        servicesDesiredRef.current = next;
        if (liveSync) {
          servicesFixedRef.current = next;
          setServicesFixed(next);
        }
        setServicesDesired(next);
      }
    },
    [
      activeBusinessTemplate,
      isBothOffering,
      templateSyncSettings.servicesDetails,
    ],
  );
  const setActiveMainServices = React.useCallback(
    (value: React.SetStateAction<BusinessMainServiceUi[]>) => {
      setIsBusinessPublishEnabled(true);
      const liveSync =
        isBothOffering && templateSyncSettings.servicesDetails === "sync";
      if (activeBusinessTemplate === "Fixed Location") {
        setMainServicesFixed((prev) => {
          const next = typeof value === "function" ? value(prev) : value;
          if (liveSync) setMainServicesDesired(next);
          return next;
        });
      } else {
        setMainServicesDesired((prev) => {
          const next = typeof value === "function" ? value(prev) : value;
          if (liveSync) setMainServicesFixed(next);
          return next;
        });
      }
    },
    [
      activeBusinessTemplate,
      isBothOffering,
      templateSyncSettings.servicesDetails,
    ],
  );

  const applyTemplateSyncSettings = React.useCallback(
    (settings: TemplateSyncSettings) => {
      const normalized = normalizeTemplateSyncSettings(settings);
      const source = getCurrentBusinessState();

      setDesiredBusiness((prev) => {
        let next: BusinessTemplateState = {
          ...prev,
          // Profile is always synced from Fixed.
          ...pickSectionFields(source as Record<string, unknown>, "profile"),
        };

        const applySection = (sectionId: "serviceFor" | "infoAndPolicy") => {
          // Independent keeps current content in both templates as-is.
          if (normalized[sectionId] !== "sync") return;
          next = {
            ...next,
            ...pickSectionFields(
              source as Record<string, unknown>,
              sectionId,
            ),
          };
        };

        applySection("serviceFor");
        applySection("infoAndPolicy");
        return next;
      });

      if (normalized.servicesDetails === "sync") {
        setServicesDesired(servicesFixed.map((item) => ({ ...item })));
        setMainServicesDesired(mainServicesFixed.map((item) => ({ ...item })));
      }

      if (normalized.manageTeam === "sync") {
        setTeamMembersDesired(
          teamMembersFixed.map((member) => ({
            ...member,
            pendingPhotoFile: null,
          })),
        );
      }

      if (normalized.portfolio === "sync") {
        setPortfolioItemsDesired(
          portfolioItemsFixed.map((item) => ({ ...item })),
        );
      }

      setTemplateSyncSettings(normalized);
      setTemplateSyncDraft(normalized);
      setIsBusinessPublishEnabled(true);
    },
    [
      getCurrentBusinessState,
      mainServicesFixed,
      portfolioItemsFixed,
      servicesFixed,
      teamMembersFixed,
    ],
  );

  const teamBusinessServices = React.useMemo(
    () => buildTeamBusinessServiceRefs(activeServices),
    [activeServices],
  );

  const buildTeamMemberServiceGroups = React.useCallback(
    (services: TeamService): TeamMemberServiceGroup[] => {
      const groups = new Map<string, TeamMemberServiceGroup>();

      const appendToGroup = (
        categoryId: string,
        categoryTitle: string,
        serviceId: string,
        label: string,
      ) => {
        const existing = groups.get(categoryId);
        if (existing) {
          if (!existing.subServices.some((item) => item.id === serviceId)) {
            existing.subServices.push({ id: serviceId, label });
          }
          return;
        }
        groups.set(categoryId, {
          categoryId,
          categoryTitle: resolveCategoryDisplayTitle(categoryTitle),
          subServices: [{ id: serviceId, label }],
        });
      };

      for (const serviceId of getMemberAssignedServiceIds(services)) {
        let matched = false;

        for (const category of businessCategories) {
          const subcategory = category.subcategories.find(
            (sub) => String(sub.id) === serviceId,
          );
          if (!subcategory) continue;
          appendToGroup(
            String(category.id),
            category.title,
            serviceId,
            subcategory.title,
          );
          matched = true;
          break;
        }

        if (!matched) {
          const setupService = activeServices.find(
            (item) => String(item.serviceId) === serviceId,
          );
          if (setupService) {
            const categoryTitle =
              businessCategories.find(
                (c) => String(c.id) === String(setupService.categoryId),
              )?.title ??
              setupService.categoryTitle ??
              String(setupService.categoryId);
            appendToGroup(
              String(setupService.categoryId),
              categoryTitle,
              serviceId,
              setupService.name,
            );
            matched = true;
          }
        }

        if (!matched) {
          const option = allSubcategoryOptions.find(
            (item) => item.value === serviceId,
          );
          if (option) {
            for (const category of businessCategories) {
              const subcategory = category.subcategories.find(
                (sub) => String(sub.id) === serviceId,
              );
              if (!subcategory) continue;
              appendToGroup(
                String(category.id),
                category.title,
                serviceId,
                option.label,
              );
              matched = true;
              break;
            }
          }
        }
      }

      return Array.from(groups.values());
    },
    [
      activeServices,
      allSubcategoryOptions,
      businessCategories,
      getMemberAssignedServiceIds,
      resolveCategoryDisplayTitle,
    ],
  );

  const teamMemberModal = useBusinessTeamMemberModal({
    businessCategories,
    businessServices: teamBusinessServices,
    categoryTabs: serviceCategoryTabs,
    teamMembers,
    setTeamMembers,
    onAfterLocalSave: () => setTeamServiceMenu(null),
    onMarkUnpublished: () => setIsBusinessPublishEnabled(true),
    onSaveBusinessSetup: onSaveBusinessSetup
      ? async (members) => {
          await onSaveBusinessSetup(
            buildBusinessSetupSaveBody(members, { section: "team" }),
          );
          setTeamMembers((prev) =>
            prev.map((member) => ({
              ...member,
              pendingPhotoFile: null,
            })),
          );
          setIsBusinessPublishEnabled(true);
        }
      : undefined,
  });

  const [expandedServiceDetailIds, setExpandedServiceDetailIds] =
    React.useState<Record<string, boolean>>({});
  const [expandedMainServiceIds, setExpandedMainServiceIds] = React.useState<
    Record<string, boolean>
  >({});

  const serviceModal = useBusinessServiceModal({
    businessCategories,
    mainServices: activeMainServices,
    subservices: activeServices,
    setMainServices: setActiveMainServices,
    setSubservices: setActiveServices,
    onPersistChange: () => setIsBusinessPublishEnabled(true),
    onMainServiceCreated: (mainId) => {
      setExpandedMainServiceIds((prev) => ({ ...prev, [mainId]: true }));
    },
    onSaveBusinessSetup: onSaveBusinessSetup
      ? async () => {
          await saveBusinessSetupData({ section: "services" });
        }
      : undefined,
  });

  const handleEditSubservice = React.useCallback(
    (service: ServiceDetailUiItem) => {
      serviceModal.openEditSubservice(service);
    },
    [serviceModal],
  );

  const handleDeleteSubservice = React.useCallback(
    (service: ServiceDetailUiItem) => {
      serviceModal.deleteSubservice(service.id);
      removeServiceIdFromTeamMembers(String(service.serviceId ?? service.id));
      showSnackbar({
        severity: "info",
        message: "Service removed. Click Save to apply changes.",
      });
    },
    [removeServiceIdFromTeamMembers, serviceModal, showSnackbar],
  );

  const handleEditMainService = React.useCallback(
    (main: BusinessMainServiceUi) => {
      serviceModal.openEditService(main);
    },
    [serviceModal],
  );

  const handleDeleteMainService = React.useCallback(
    (mainId: string) => {
      const childServiceIds = (
        serviceModal.subservicesByParent.get(mainId) ?? []
      ).map((item) => String(item.serviceId ?? item.id));
      serviceModal.deleteMainService(mainId);
      for (const serviceId of childServiceIds) {
        removeServiceIdFromTeamMembers(serviceId);
      }
    },
    [removeServiceIdFromTeamMembers, serviceModal],
  );

  const ensureCategoryParentMain = React.useCallback(
    (storageId: string) => {
      const explicitMain = activeMainServices.find(
        (main) =>
          !isHydratedMainServiceId(main.id) &&
          String(main.categoryId) === storageId,
      );
      if (explicitMain) return explicitMain.id;

      const hydratedMain = activeMainServices.find(
        (main) =>
          isHydratedMainServiceId(main.id) &&
          String(main.categoryId) === storageId,
      );
      if (hydratedMain) return hydratedMain.id;

      const categoryTitle =
        businessCategories.find((category) => String(category.id) === storageId)
          ?.title ?? "Services";
      const mainId = `main-${storageId}-hydrated`;
      const nextMain: BusinessMainServiceUi = {
        id: mainId,
        categoryId: storageId,
        name: categoryTitle,
        serviceInfo: "",
        durationFrom: "",
        durationTo: "",
        priceType: "fixed",
        priceAmount: "",
        currency: businessServiceModalCopy.currencyCode,
        discountType: "fixed",
        discountAmount: "",
        discountStartDate: "",
        discountEndDate: "",
        discountDescription: "",
      };

      setActiveMainServices((prev) =>
        prev.some((main) => main.id === mainId) ? prev : [...prev, nextMain],
      );
      return mainId;
    },
    [activeMainServices, businessCategories, setActiveMainServices],
  );

  const openAddServiceForCategory = React.useCallback(
    (categoryId: string) => {
      const storageId = resolveServiceCategoryStorageId(
        categoryId,
        serviceCategoryTabs,
        businessCategories,
      );
      if (!storageId) return;

      const parentMainId = ensureCategoryParentMain(storageId);
      serviceModal.openAddSubservice(storageId, parentMainId);
    },
    [
      businessCategories,
      ensureCategoryParentMain,
      serviceCategoryTabs,
      serviceModal,
    ],
  );

  const openAddService = React.useCallback(() => {
    if (!activeServiceCategory || activeServiceCategory === "all") return;
    openAddServiceForCategory(activeServiceCategory);
  }, [activeServiceCategory, openAddServiceForCategory]);

  const openAddSubserviceForItem = React.useCallback(
    (item: ServiceDetailUiItem) => {
      const storageId = resolveServiceCategoryStorageId(
        item.categoryId,
        serviceCategoryTabs,
        businessCategories,
      );
      if (!storageId) return;
      // Nest the new service under the clicked service itself.
      serviceModal.openAddSubservice(storageId, item.id);
      setExpandedServiceDetailIds((prev) => ({ ...prev, [item.id]: true }));
    },
    [businessCategories, serviceCategoryTabs, serviceModal],
  );

  const toggleServiceDetailExpand = React.useCallback((id: string) => {
    setExpandedServiceDetailIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleMainServiceExpand = React.useCallback((id: string) => {
    setExpandedMainServiceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resolveServiceCategoryTitle = React.useCallback(
    (categoryId: string) =>
      businessCategories.find((c) => String(c.id) === categoryId)?.title ??
      serviceCategoryTabs.find((t) => t.id === categoryId)?.label ??
      `Category ${categoryId}`,
    [businessCategories, serviceCategoryTabs],
  );

  const getExplicitMainsForCategory = React.useCallback(
    (categoryId: string) =>
      activeMainServices.filter(
        (main) =>
          !isHydratedMainServiceId(main.id) &&
          serviceMatchesCategoryTab(
            {
              categoryId: main.categoryId,
              categoryTitle: resolveServiceCategoryTitle(
                String(main.categoryId),
              ),
            },
            categoryId,
            serviceCategoryTabs,
            businessCategories,
          ),
      ),
    [
      activeMainServices,
      businessCategories,
      resolveServiceCategoryTitle,
      serviceCategoryTabs,
    ],
  );

  const getSubservicesForCategory = React.useCallback(
    (categoryId: string) => {
      const matched = activeServices.filter((service) =>
        serviceMatchesCategoryTab(
          {
            categoryId: service.categoryId,
            categoryTitle:
              service.categoryTitle ??
              resolveServiceCategoryTitle(String(service.categoryId)),
          },
          categoryId,
          serviceCategoryTabs,
          businessCategories,
        ),
      );
      const categoryTitle = resolveServiceCategoryTitle(categoryId);
      const orderedNames = sortServicesByServiceOrder(
        matched.map((service) => service.name),
        categoryTitle,
        calendarServiceOrder,
      );
      return orderedNames
        .map((name) =>
          matched.find((service) =>
            serviceOrderLabelsMatch(service.name, name),
          ),
        )
        .filter((service): service is (typeof matched)[number] =>
          Boolean(service),
        );
    },
    [
      activeServices,
      businessCategories,
      calendarServiceOrder,
      resolveServiceCategoryTitle,
      serviceCategoryTabs,
    ],
  );

  const getFlatSubservicesForCategory = React.useCallback(
    (categoryId: string) => {
      const explicitMains = getExplicitMainsForCategory(categoryId);
      const explicitMainIds = new Set(explicitMains.map((main) => main.id));
      const allSubserviceIds = new Set(
        activeServices.map((service) => service.id),
      );

      return getSubservicesForCategory(categoryId).filter((service) => {
        const parentId = String(service.parentServiceId ?? "").trim();
        if (!parentId || isHydratedMainServiceId(parentId)) return true;
        // Nested under another service: rendered inside its parent row instead.
        if (allSubserviceIds.has(parentId)) return false;
        return !explicitMainIds.has(parentId);
      });
    },
    [activeServices, getExplicitMainsForCategory, getSubservicesForCategory],
  );

  const groupedServiceSections = React.useMemo(() => {
    const sections: Array<{
      categoryId: string;
      title: string;
      explicitMains: BusinessMainServiceUi[];
      subs: ServiceDetailUiItem[];
    }> = [];
    const seen = new Set<string>();

    const appendSection = (categoryId: string) => {
      if (!categoryId || seen.has(categoryId)) return;
      const explicitMains = getExplicitMainsForCategory(categoryId);
      const subs = getFlatSubservicesForCategory(categoryId);
      if (explicitMains.length === 0 && subs.length === 0) return;
      sections.push({
        categoryId,
        title: resolveServiceCategoryTitle(categoryId),
        explicitMains,
        subs,
      });
      seen.add(categoryId);
    };

    for (const tab of serviceCategoryTabs) {
      if (tab.id === "all") continue;
      appendSection(tab.id);
    }

    for (const service of activeServices) {
      appendSection(String(service.categoryId ?? "").trim());
    }

    for (const main of activeMainServices) {
      if (isHydratedMainServiceId(main.id)) continue;
      appendSection(String(main.categoryId ?? "").trim());
    }

    return sections;
  }, [
    activeMainServices,
    activeServices,
    getExplicitMainsForCategory,
    getFlatSubservicesForCategory,
    resolveServiceCategoryTitle,
    serviceCategoryTabs,
  ]);

  const activeCategoryExplicitMains = React.useMemo(
    () => getExplicitMainsForCategory(activeServiceCategory),
    [activeServiceCategory, getExplicitMainsForCategory],
  );

  const activeCategoryFlatSubservices = React.useMemo(
    () => getFlatSubservicesForCategory(activeServiceCategory),
    [activeServiceCategory, getFlatSubservicesForCategory],
  );

  const saveServicesDetails = React.useCallback(async () => {
    if (!onSaveBusinessSetup) return;

    try {
      await saveBusinessSetupData({ section: "services" });
      notifyBusinessSetupPersisted(
        "Services saved. Publish to make them live.",
      );
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to save services."),
      });
    }
  }, [
    notifyBusinessSetupPersisted,
    onSaveBusinessSetup,
    saveBusinessSetupData,
    showSnackbar,
  ]);

  return {
    activeServiceCategory,
    setActiveServiceCategory,
    initialServiceItems,
    servicesFixed,
    setServicesFixed,
    servicesDesired,
    setServicesDesired,
    mainServicesFixed,
    setMainServicesFixed,
    mainServicesDesired,
    setMainServicesDesired,
    activeServices,
    activeMainServices,
    serviceCategoryTabs,
    setActiveServices,
    setActiveMainServices,
    applyTemplateSyncSettings,
    teamBusinessServices,
    buildTeamMemberServiceGroups,
    teamMemberModal,
    expandedServiceDetailIds,
    setExpandedServiceDetailIds,
    expandedMainServiceIds,
    setExpandedMainServiceIds,
    serviceModal,
    handleEditSubservice,
    handleDeleteSubservice,
    handleEditMainService,
    handleDeleteMainService,
    ensureCategoryParentMain,
    openAddServiceForCategory,
    openAddService,
    openAddSubserviceForItem,
    toggleServiceDetailExpand,
    toggleMainServiceExpand,
    resolveServiceCategoryTitle,
    getExplicitMainsForCategory,
    getSubservicesForCategory,
    getFlatSubservicesForCategory,
    groupedServiceSections,
    activeCategoryExplicitMains,
    activeCategoryFlatSubservices,
    saveServicesDetails,
  };
}
