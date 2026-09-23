export type BookingCatalogService = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
  /** Business setup category title — used to group/order Select Services. */
  category?: string;
};

export type BookingServiceCategory = {
  category: string;
  services: readonly BookingCatalogService[];
};

/** Empty — professionals load their own services from business setup. */
export const bookingServiceCatalog: readonly BookingServiceCategory[] = [];

export const allBookingCatalogServices = bookingServiceCatalog.flatMap(
  (group) => group.services,
);

export function formatBookingServiceMeta(service: BookingCatalogService) {
  return `${service.durationMins} Mins • €${service.price}`;
}

type ServiceOrderLike = {
  categories?: readonly string[];
  servicesByCategory?: Record<string, readonly string[]>;
  hiddenCategories?: readonly string[];
  hiddenServicesByCategory?: Record<string, readonly string[]>;
};

function normalizeCategoryToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categoriesMatch(a: string, b: string): boolean {
  const left = normalizeCategoryToken(a);
  const right = normalizeCategoryToken(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

function findOrderedCategoryKey(
  category: string,
  orderedCategories: readonly string[],
): string | undefined {
  return orderedCategories.find((entry) => categoriesMatch(entry, category));
}

/** Group flat catalog services and apply calendar Service Order Rules. */
export function buildOrderedBookingServiceCategories(
  services: readonly BookingCatalogService[],
  serviceOrder?: ServiceOrderLike | null,
): BookingServiceCategory[] {
  const groups = new Map<string, BookingCatalogService[]>();

  for (const service of services) {
    const category = service.category?.trim() || "Services";
    const existing = groups.get(category);
    if (existing) existing.push(service);
    else groups.set(category, [service]);
  }

  if (!groups.size) return [];

  const orderedCategoryNames = serviceOrder?.categories?.length
    ? [
        ...serviceOrder.categories.filter((category) =>
          [...groups.keys()].some((key) => categoriesMatch(key, category)),
        ),
        ...[...groups.keys()].filter(
          (key) =>
            !serviceOrder.categories?.some((category) =>
              categoriesMatch(key, category),
            ),
        ),
      ]
    : [...groups.keys()];

  // Deduplicate while preserving order (matched aliases can collide).
  const seen = new Set<string>();
  const uniqueOrderedCategories: string[] = [];
  for (const category of orderedCategoryNames) {
    const actualKey =
      [...groups.keys()].find((key) => categoriesMatch(key, category)) ??
      category;
    if (seen.has(actualKey)) continue;
    seen.add(actualKey);
    uniqueOrderedCategories.push(actualKey);
  }

  return uniqueOrderedCategories
    .filter((category) => {
      const hidden = serviceOrder?.hiddenCategories ?? [];
      return !hidden.some((entry) => categoriesMatch(entry, category));
    })
    .map((category) => {
      const servicesInCategory = groups.get(category) ?? [];
      const orderKey =
        findOrderedCategoryKey(category, serviceOrder?.categories ?? []) ??
        category;
      const preferredOrder =
        serviceOrder?.servicesByCategory?.[orderKey] ??
        serviceOrder?.servicesByCategory?.[category] ??
        [];
      const hiddenServices =
        serviceOrder?.hiddenServicesByCategory?.[orderKey] ??
        serviceOrder?.hiddenServicesByCategory?.[category] ??
        [];

      const orderedServices = [
        ...preferredOrder
          .map((name) =>
            servicesInCategory.find((service) => service.name === name),
          )
          .filter(
            (service): service is BookingCatalogService => Boolean(service),
          ),
        ...servicesInCategory.filter(
          (service) => !preferredOrder.includes(service.name),
        ),
      ].filter(
        (service) =>
          !hiddenServices.some((entry) =>
            categoriesMatch(entry, service.name),
          ),
      );

      // Same catalog id twice in one category → React duplicate-key warning.
      const seenIds = new Set<string>();
      const uniqueServices = orderedServices.filter((service) => {
        const id = String(service.id);
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      });

      return { category, services: uniqueServices };
    })
    .filter((group) => group.services.length > 0);
}
