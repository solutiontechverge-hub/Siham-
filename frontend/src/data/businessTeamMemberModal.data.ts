import {
  BUSINESS_SERVICE_CATEGORY_CATALOG,
  findBusinessCategoryForCatalogEntry,
  serviceMatchesCategoryTab,
  type BusinessCategoryLike,
  type ServiceCategoryTab,
} from "./businessServiceCategorySlider.data";

export const TEAM_MEMBER_DRAFT_PREVIEW_ID = "__team_member_draft__";

export type TeamServiceSlots = {
  slot1: string;
  slot2: string;
  slot3: string;
  slot4: string;
  slot5: string;
  slot6: string;
  slot7: string;
};

export const TEAM_SERVICE_SLOT_KEYS: (keyof TeamServiceSlots)[] = [
  "slot1",
  "slot2",
  "slot3",
  "slot4",
  "slot5",
  "slot6",
  "slot7",
];

export const TEAM_MEMBER_ALL_SERVICES_VALUE = "__all__";

export type TeamMemberServiceGroupSelection = {
  categoryId: string;
  categoryTitle: string;
  subServiceIds: string[];
};

export type TeamMemberFormDraft = {
  name: string;
  photoSrc: string;
  pendingPhotoFile?: File | null;
  selectedGroups: TeamMemberServiceGroupSelection[];
  categoryId: string;
  serviceId: string;
};

export const businessTeamMemberModalCopy = {
  addTitle: "Add Team Member",
  editTitle: "Edit Team Member",
  cancelLabel: "Cancel",
  addLabel: "Add",
  updateLabel: "Update",
  profilePictureLabel: "Profile Picture",
  nameLabel: "Name",
  selectCategoryLabel: "Select category",
  selectServicesLabel: "Select services",
  selectedHeading: "Selected Category & Services",
  allServicesOption: "All services",
  selectCategoryPlaceholder: "Select category",
  selectServicePlaceholder: "Select service",
  noSelections: "No services selected yet.",
} as const;

export const createEmptyTeamMemberFormDraft = (): TeamMemberFormDraft => ({
  name: "",
  photoSrc: "/professionals/hero.png",
  selectedGroups: [],
  categoryId: "",
  serviceId: "",
});

export type TeamBusinessServiceRef = {
  serviceId: string;
  categoryId: string;
  label: string;
};

export type TeamMemberModalServiceContext = {
  businessServices?: readonly TeamBusinessServiceRef[];
  categoryTabs?: readonly ServiceCategoryTab[];
};

type BusinessCategoryWithSubs = BusinessCategoryLike & {
  subcategories?: Array<{ id: string | number; title: string }>;
};

export function buildTeamBusinessServiceRefs(
  subservices: readonly { serviceId: string; categoryId: string; name: string }[],
): TeamBusinessServiceRef[] {
  const seen = new Set<string>();
  const refs: TeamBusinessServiceRef[] = [];

  for (const item of subservices) {
    const serviceId = String(item.serviceId ?? "").trim();
    if (!serviceId || seen.has(serviceId)) continue;
    seen.add(serviceId);
    refs.push({
      serviceId,
      categoryId: String(item.categoryId ?? ""),
      label: String(item.name ?? "").trim() || serviceId,
    });
  }

  return refs;
}

function getTeamServicesForCategory(
  categoryId: string,
  businessCategories: readonly BusinessCategoryLike[],
  businessServices: readonly TeamBusinessServiceRef[],
  categoryTabs: readonly ServiceCategoryTab[],
): TeamBusinessServiceRef[] {
  return businessServices.filter((service) =>
    serviceMatchesCategoryTab(
      { categoryId: service.categoryId },
      categoryId,
      categoryTabs,
      businessCategories,
    ),
  );
}

export function buildTeamCategoryOptions(
  businessCategories: readonly BusinessCategoryLike[],
  context: TeamMemberModalServiceContext = {},
): Array<{ value: string; label: string }> {
  const { businessServices = [], categoryTabs = [] } = context;
  const options: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();

  const pushOption = (value: string, label: string) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    options.push({ value, label });
  };

  if (businessServices.length > 0) {
    for (const service of businessServices) {
      const record = resolveTeamCategoryRecord(service.categoryId, businessCategories, context);
      if (record) {
        pushOption(record.id, record.title);
      }
    }
  } else if (businessCategories.length > 0) {
    for (const category of businessCategories) {
      pushOption(String(category.id), category.title);
    }
  } else {
    for (const entry of BUSINESS_SERVICE_CATEGORY_CATALOG) {
      pushOption(entry.key, entry.label);
    }
  }

  if (options.length === 0 && categoryTabs.length > 0) {
    for (const tab of categoryTabs) {
      if (tab.id === "all") continue;
      pushOption(tab.id, tab.label);
    }
  }

  return options;
}

export function resolveTeamCategoryRecord(
  categoryId: string,
  businessCategories: readonly BusinessCategoryLike[],
  context: TeamMemberModalServiceContext = {},
): { id: string; title: string; subServiceIds: string[] } | null {
  const raw = String(categoryId ?? "").trim();
  if (!raw) return null;

  const { businessServices = [], categoryTabs = [] } = context;
  let base: { id: string; title: string; subServiceIds: string[] } | null = null;

  const direct = businessCategories.find((item) => String(item.id) === raw) as BusinessCategoryWithSubs | undefined;
  if (direct) {
    base = {
      id: String(direct.id),
      title: direct.title,
      subServiceIds: (direct.subcategories ?? []).map((sub) => String(sub.id)),
    };
  }

  if (!base) {
    const catalogEntry = BUSINESS_SERVICE_CATEGORY_CATALOG.find((entry) => entry.key === raw);
    if (catalogEntry) {
      const matched = findBusinessCategoryForCatalogEntry(businessCategories, catalogEntry);
      if (matched) {
        const withSubs = matched as BusinessCategoryWithSubs;
        base = {
          id: String(matched.id),
          title: matched.title,
          subServiceIds: (withSubs.subcategories ?? []).map((sub) => String(sub.id)),
        };
      } else {
        base = {
          id: catalogEntry.key,
          title: catalogEntry.label,
          subServiceIds: [],
        };
      }
    }
  }

  if (!base) return null;

  const setupServiceIds = getTeamServicesForCategory(
    base.id,
    businessCategories,
    businessServices,
    categoryTabs,
  ).map((service) => service.serviceId);

  return {
    ...base,
    subServiceIds: Array.from(new Set([...base.subServiceIds, ...setupServiceIds])),
  };
}

export function buildTeamServiceOptionsForCategory(
  categoryId: string,
  businessCategories: readonly BusinessCategoryLike[],
  context: TeamMemberModalServiceContext = {},
): Array<{ value: string; label: string }> {
  const category = resolveTeamCategoryRecord(categoryId, businessCategories, context);
  if (!category) return [];

  const { businessServices = [], categoryTabs = [] } = context;
  const options: Array<{ value: string; label: string }> = [
    { value: TEAM_MEMBER_ALL_SERVICES_VALUE, label: businessTeamMemberModalCopy.allServicesOption },
  ];
  const seen = new Set<string>([TEAM_MEMBER_ALL_SERVICES_VALUE]);

  const pushOption = (value: string, label: string) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    options.push({ value, label });
  };

  const apiCategory = businessCategories.find((item) => String(item.id) === category.id) as
    | BusinessCategoryWithSubs
    | undefined;
  if (apiCategory?.subcategories) {
    for (const sub of apiCategory.subcategories) {
      pushOption(String(sub.id), sub.title);
    }
  }

  for (const service of getTeamServicesForCategory(
    categoryId,
    businessCategories,
    businessServices,
    categoryTabs,
  )) {
    pushOption(service.serviceId, service.label);
  }

  return options;
}

export function formatTeamMemberGroupLabel(
  group: TeamMemberServiceGroupSelection,
  businessCategories: readonly BusinessCategoryLike[],
  context: TeamMemberModalServiceContext = {},
): string {
  const category = resolveTeamCategoryRecord(group.categoryId, businessCategories, context);
  const totalInCategory = category?.subServiceIds.length ?? 0;
  const count = group.subServiceIds.length;

  if (totalInCategory > 0 && count >= totalInCategory) {
    return `${group.categoryTitle} (All)`;
  }

  return `${group.categoryTitle} (${count})`;
}

export function addTeamMemberServiceSelection(
  draft: TeamMemberFormDraft,
  businessCategories: readonly BusinessCategoryLike[],
  context: TeamMemberModalServiceContext = {},
): TeamMemberFormDraft {
  const category = resolveTeamCategoryRecord(draft.categoryId, businessCategories, context);
  if (!category) return draft;

  const serviceId = String(draft.serviceId ?? "").trim();
  if (!serviceId) return draft;

  const nextSubIds =
    serviceId === TEAM_MEMBER_ALL_SERVICES_VALUE
      ? [...category.subServiceIds]
      : [serviceId];

  if (nextSubIds.length === 0) return draft;

  const existing = draft.selectedGroups.find((group) => group.categoryId === category.id);
  let selectedGroups: TeamMemberServiceGroupSelection[];

  if (existing) {
    const merged = new Set([...existing.subServiceIds, ...nextSubIds]);
    selectedGroups = draft.selectedGroups.map((group) =>
      group.categoryId === category.id
        ? { ...group, subServiceIds: Array.from(merged) }
        : group,
    );
  } else {
    selectedGroups = [
      ...draft.selectedGroups,
      {
        categoryId: category.id,
        categoryTitle: category.title,
        subServiceIds: Array.from(new Set(nextSubIds)),
      },
    ];
  }

  return {
    ...draft,
    selectedGroups,
    serviceId: "",
  };
}

export function removeTeamMemberServiceGroup(
  draft: TeamMemberFormDraft,
  categoryId: string,
): TeamMemberFormDraft {
  return {
    ...draft,
    selectedGroups: draft.selectedGroups.filter((group) => group.categoryId !== categoryId),
  };
}

export function groupsToTeamService(groups: TeamMemberServiceGroupSelection[]): TeamServiceSlots {
  const ids = groups.flatMap((group) => group.subServiceIds).filter(Boolean);
  const unique = Array.from(new Set(ids)).slice(0, TEAM_SERVICE_SLOT_KEYS.length);
  const slots = createEmptyTeamServiceSlots();

  TEAM_SERVICE_SLOT_KEYS.forEach((key, index) => {
    slots[key] = unique[index] ?? "";
  });

  return slots;
}

export function createEmptyTeamServiceSlots(): TeamServiceSlots {
  return {
    slot1: "",
    slot2: "",
    slot3: "",
    slot4: "",
    slot5: "",
    slot6: "",
    slot7: "",
  };
}

function appendTeamServiceGroup(
  groups: Map<string, TeamMemberServiceGroupSelection>,
  categoryId: string,
  categoryTitle: string,
  serviceId: string,
) {
  const existing = groups.get(categoryId);
  if (existing) {
    if (!existing.subServiceIds.includes(serviceId)) {
      existing.subServiceIds.push(serviceId);
    }
    return;
  }

  groups.set(categoryId, {
    categoryId,
    categoryTitle,
    subServiceIds: [serviceId],
  });
}

export function groupsFromTeamService(
  services: TeamServiceSlots,
  businessCategories: readonly BusinessCategoryLike[],
  context: TeamMemberModalServiceContext = {},
): TeamMemberServiceGroupSelection[] {
  const { businessServices = [] } = context;
  const ids = TEAM_SERVICE_SLOT_KEYS.map((key) => String(services[key] ?? "").trim()).filter(Boolean);
  const groups = new Map<string, TeamMemberServiceGroupSelection>();

  for (const serviceId of ids) {
    let matched = false;

    for (const category of businessCategories as BusinessCategoryWithSubs[]) {
      const sub = category.subcategories?.find((item) => String(item.id) === serviceId);
      if (!sub) continue;
      appendTeamServiceGroup(groups, String(category.id), category.title, serviceId);
      matched = true;
      break;
    }

    if (!matched) {
      const setupService = businessServices.find((item) => item.serviceId === serviceId);
      if (setupService) {
        const record = resolveTeamCategoryRecord(setupService.categoryId, businessCategories, context);
        if (record) {
          appendTeamServiceGroup(groups, record.id, record.title, serviceId);
          matched = true;
        }
      }
    }

    if (!matched) {
      for (const entry of BUSINESS_SERVICE_CATEGORY_CATALOG) {
        const apiCategory = findBusinessCategoryForCatalogEntry(businessCategories, entry) as
          | BusinessCategoryWithSubs
          | undefined;
        if (!apiCategory?.subcategories?.some((item) => String(item.id) === serviceId)) continue;
        appendTeamServiceGroup(groups, String(apiCategory.id), apiCategory.title, serviceId);
        break;
      }
    }
  }

  return Array.from(groups.values());
}
