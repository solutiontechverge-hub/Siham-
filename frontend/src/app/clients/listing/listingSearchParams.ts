import type { ListingFilterValues } from "../../../components/common";

export const CLIENT_HOME_FILTER_LABELS = {
  category: "Select Category",
  location: "Location",
  municipality: "Select Municipality",
} as const;

function splitParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);
}

function mapHomeLocationToMode(label: string): "fixed" | "desired" | null {
  const normalized = label.trim().toLowerCase();
  if (normalized === "fixed" || normalized === "fixed location") return "fixed";
  if (normalized === "desired location" || normalized === "desired") return "desired";
  return null;
}

export function buildListingSearchHref(filterValues: Record<string, string[]>): string {
  const params = new URLSearchParams();

  const categories = filterValues[CLIENT_HOME_FILTER_LABELS.category] ?? [];
  const locations = filterValues[CLIENT_HOME_FILTER_LABELS.location] ?? [];
  const municipalities = filterValues[CLIENT_HOME_FILTER_LABELS.municipality] ?? [];

  if (categories.length) params.set("categories", categories.join(","));
  if (municipalities.length) params.set("municipalities", municipalities.join(","));

  const locationModes = locations
    .map(mapHomeLocationToMode)
    .filter((mode): mode is "fixed" | "desired" => mode != null);
  if (locationModes.length) params.set("locations", locationModes.join(","));

  const qs = params.toString();
  return qs ? `/clients/listing?${qs}` : "/clients/listing";
}

export function parseListingSearchParams(searchParams: URLSearchParams): Partial<ListingFilterValues> {
  const categories = splitParam(searchParams.get("categories"));
  const municipalities = splitParam(searchParams.get("municipalities"));
  const locationModes = splitParam(searchParams.get("locations")).filter(
    (value): value is "fixed" | "desired" => value === "fixed" || value === "desired",
  );

  const patch: Partial<ListingFilterValues> = {};
  if (categories.length) {
    patch.categories = categories;
    patch.category = categories[0];
  }
  if (municipalities.length) {
    patch.municipalities = municipalities;
    patch.municipality = municipalities[0];
  }
  if (locationModes.length) patch.locationModes = locationModes;
  return patch;
}

export function hasListingSearchParams(patch: Partial<ListingFilterValues>): boolean {
  return Boolean(
    patch.categories?.length ||
      patch.municipalities?.length ||
      patch.locationModes?.length ||
      patch.category ||
      patch.municipality,
  );
}
