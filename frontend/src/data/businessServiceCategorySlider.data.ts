/**
 * Maps API / CMS category titles to slider icon variants for business setup (services).
 * Supports Dutch and common English keywords; unknown categories fall back to `generic`.
 */
export type ServiceCategorySliderIconId =
  | "all"
  | "hair"
  | "makeup"
  | "lashes"
  | "brows"
  | "facial"
  | "nails"
  | "body"
  | "waxing"
  | "generic";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function resolveServiceCategorySliderIconId(title: string): ServiceCategorySliderIconId {
  const t = normalizeTitle(title);

  if (t === "all") return "all";

  if (t.includes("onthar") || t.includes("wax") || t.includes("epil") || t.includes("ipl")) return "waxing";
  if (t.includes("wenk") || t.includes("eyebrow") || t.includes("brow")) return "brows";
  if (t.includes("wimper") || t.includes("lash")) return "lashes";
  if (t.includes("make-up") || t.includes("makeup") || t.includes("make up") || t.includes("schmink")) return "makeup";
  if (t.includes("haar") || t.includes("hair") || t.includes("kapper") || t.includes("kapsel")) return "hair";
  if (t.includes("nagel") || t.includes("nail") || t.includes("manicure") || t.includes("pedicure")) return "nails";
  if (t.includes("gezicht") || t.includes("facial") || t.includes("huid")) return "facial";
  if (t.includes("lichaam") || t.includes("body") || t.includes("massage")) return "body";

  return "generic";
}
