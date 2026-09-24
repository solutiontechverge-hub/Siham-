export type TemplateSyncMode = "sync" | "independent";

/** Which template wins when re-enabling Sync after Independent divergence. */
export type TemplateSyncSource = "fixed" | "desired";

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
    description:
      "Always match — editing in either FL or DL updates both in real-time. DEFAULT option.",
  },
  {
    value: "independent",
    label: "Independent",
    description:
      "Breaks the sync. Current content in both templates is kept as-is. From that moment, each template's version of the section is edited separately and no longer affects the other.",
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

export type TemplateSyncSources = Partial<
  Record<ConfigurableSyncSectionId, TemplateSyncSource>
>;

export const SYNC_SECTION_LABELS: Record<TemplateSyncSectionId, string> = {
  profile: "Profile",
  location: "Location",
  serviceFor: "Service For",
  servicesDetails: "Categories and Services",
  manageTeam: "Manage Team",
  infoAndPolicy: "Info and Policy",
  portfolio: "Portfolios",
};

/** Field keys mirrored when a section is in live `sync`. */
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
    serviceFor: "sync",
    servicesDetails: "sync",
    manageTeam: "sync",
    infoAndPolicy: "sync",
    portfolio: "sync",
  };
}

export function isTemplateSyncMode(value: unknown): value is TemplateSyncMode {
  return value === "sync" || value === "independent";
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
    if (value === "sync") {
      next[sectionId] = "sync";
    } else if (value === "independent" || value === "syncAndEdit") {
      // Independent keeps current content in each template.
      // Legacy "syncAndEdit" was one-time copy then independent editing.
      next[sectionId] = "independent";
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

function isEffectivelyBlank(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  if (typeof value === "boolean") return !value;
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isEffectivelyBlank);
  }
  return false;
}

function stableStringify(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/**
 * Independent → Sync needs a source-choice popup only when FL/DL content differs.
 * Both blank (or identical) → silent Sync, no popup.
 */
export function sectionNeedsSyncSourceChoice(
  fixedSnapshot: unknown,
  desiredSnapshot: unknown,
): boolean {
  if (isEffectivelyBlank(fixedSnapshot) && isEffectivelyBlank(desiredSnapshot)) {
    return false;
  }
  return stableStringify(fixedSnapshot) !== stableStringify(desiredSnapshot);
}

/** First Independent → Sync section that needs an FL/DL source pick, if any. */
export function findIndependentToSyncNeedingSource(
  prev: TemplateSyncSettings,
  next: TemplateSyncSettings,
  needsChoice: (sectionId: ConfigurableSyncSectionId) => boolean,
): ConfigurableSyncSectionId | null {
  for (const sectionId of CONFIGURABLE_SYNC_SECTION_IDS) {
    if (
      prev[sectionId] === "independent" &&
      next[sectionId] === "sync" &&
      needsChoice(sectionId)
    ) {
      return sectionId;
    }
  }
  return null;
}
