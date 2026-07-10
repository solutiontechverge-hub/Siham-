export type TemplateSyncMode = "sync" | "syncAndEdit" | "independent";

/** Sections that appear in the sync settings UI. */
export type TemplateSyncSectionId =
  | "profile"
  | "location"
  | "serviceFor"
  | "servicesDetails"
  | "manageTeam"
  | "infoAndPolicy"
  | "portfolio";

export type TemplateSyncSettings = Record<TemplateSyncSectionId, TemplateSyncMode>;

export const TEMPLATE_SYNC_MODE_OPTIONS: ReadonlyArray<{
  value: TemplateSyncMode;
  label: string;
  description: string;
}> = [
  {
    value: "sync",
    label: "Sync",
    description: "Always match — edit in either template updates both in real-time",
  },
  {
    value: "syncAndEdit",
    label: "Sync and edit",
    description: "Copy once from Fixed (fields filled), then edit Desired independently (default)",
  },
  {
    value: "independent",
    label: "Independent",
    description: "Start blank — Desired fields are empty and completely separate from Fixed Location",
  },
] as const;

export const CONFIGURABLE_SYNC_SECTION_IDS = [
  "serviceFor",
  "servicesDetails",
  "manageTeam",
  "infoAndPolicy",
  "portfolio",
] as const satisfies ReadonlyArray<TemplateSyncSectionId>;

export type ConfigurableSyncSectionId = (typeof CONFIGURABLE_SYNC_SECTION_IDS)[number];

export const SYNC_SECTION_LABELS: Record<TemplateSyncSectionId, string> = {
  profile: "Profile",
  location: "Location",
  serviceFor: "Service For",
  servicesDetails: "Categories and Services",
  manageTeam: "Manage Team",
  infoAndPolicy: "Info and Policy",
  portfolio: "Portfolios",
};

/** Field keys mirrored when a section is in live `sync` (or copied for syncAndEdit). */
export const SECTION_SYNC_FIELDS = {
  profile: ["profileName", "about", "keywordDraft", "keywords"] as const,
  serviceFor: ["serviceFor", "amenities"] as const,
  /** Project booking is Desired-only and never included. */
  servicesDetails: [] as const,
  manageTeam: [] as const,
  infoAndPolicy: [
    "notes",
    "priceRangeFrom",
    "priceRangeTo",
    "prepaymentPercent",
    "prepaymentInstructions",
  ] as const,
  portfolio: [] as const,
  location: [] as const,
} as const;

export function createDefaultTemplateSyncSettings(): TemplateSyncSettings {
  return {
    profile: "sync",
    location: "independent",
    serviceFor: "syncAndEdit",
    servicesDetails: "syncAndEdit",
    manageTeam: "syncAndEdit",
    infoAndPolicy: "syncAndEdit",
    portfolio: "syncAndEdit",
  };
}

export function isTemplateSyncMode(value: unknown): value is TemplateSyncMode {
  return value === "sync" || value === "syncAndEdit" || value === "independent";
}

export function normalizeTemplateSyncSettings(raw: unknown): TemplateSyncSettings {
  const defaults = createDefaultTemplateSyncSettings();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const source = raw as Record<string, unknown>;
  const next = { ...defaults };

  // Profile is always sync; location is always separate.
  next.profile = "sync";
  next.location = "independent";

  for (const sectionId of CONFIGURABLE_SYNC_SECTION_IDS) {
    const value = source[sectionId];
    if (isTemplateSyncMode(value)) {
      next[sectionId] = value;
    }
  }

  return next;
}

export function pickSectionFields<T extends Record<string, unknown>>(
  state: T,
  sectionId: keyof typeof SECTION_SYNC_FIELDS,
): Partial<T> {
  const fields = SECTION_SYNC_FIELDS[sectionId];
  if (!fields.length) return {};
  return Object.fromEntries(fields.map((key) => [key, state[key as keyof T]])) as Partial<T>;
}

export function blankSectionFields<T extends Record<string, unknown>>(
  state: T,
  sectionId: keyof typeof SECTION_SYNC_FIELDS,
): Partial<T> {
  const fields = SECTION_SYNC_FIELDS[sectionId];
  const blank: Record<string, unknown> = {};
  for (const key of fields) {
    const current = state[key as keyof T];
    if (typeof current === "string") blank[key] = "";
    else if (Array.isArray(current)) blank[key] = [];
    else if (current && typeof current === "object" && "men" in (current as object)) {
      blank[key] = { men: false, women: false, kids: false };
    } else if (typeof current === "boolean") blank[key] = false;
    else blank[key] = current;
  }
  return blank as Partial<T>;
}

export function getSectionIdForField(key: string): TemplateSyncSectionId | null {
  for (const sectionId of Object.keys(SECTION_SYNC_FIELDS) as Array<keyof typeof SECTION_SYNC_FIELDS>) {
    if ((SECTION_SYNC_FIELDS[sectionId] as readonly string[]).includes(key)) {
      return sectionId;
    }
  }
  return null;
}

export function shouldLiveSyncField(settings: TemplateSyncSettings, key: string): boolean {
  const sectionId = getSectionIdForField(key);
  if (!sectionId) return false;
  if (sectionId === "profile") return true;
  if (sectionId === "location") return false;
  return settings[sectionId] === "sync";
}
