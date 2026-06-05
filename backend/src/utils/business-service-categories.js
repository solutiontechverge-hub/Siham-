import { entityIdKey, normalizeEntityId, parseJsonArray } from "./business-setup-parsers.js";

/**
 * Service pricing and duration live on business_setups.service_categories (JSONB).
 * Each entry: { category_id, service_id, amount, duration_label }
 */

export const buildDurationByServiceId = (serviceCategories) => {
  const durationByServiceId = new Map();

  parseJsonArray(serviceCategories).forEach((item) => {
    const serviceIdKey = entityIdKey(item?.service_id);
    const durationLabel = String(item?.duration_label ?? "").trim();

    if (serviceIdKey && durationLabel) {
      durationByServiceId.set(serviceIdKey, durationLabel);
    }
  });

  return durationByServiceId;
};

const resolveStoredEntityId = (value) => {
  const normalized = normalizeEntityId(value);
  if (normalized !== null) {
    return normalized;
  }

  const raw = String(value ?? "").trim();
  return raw || null;
};

const mapCategoryItemToServiceDetail = (item, metaByServiceId, businessSetupId) => {
  const rawServiceId = String(item?.service_id ?? "").trim();
  const rawCategoryId = String(item?.category_id ?? "").trim();
  const serviceId = resolveStoredEntityId(item?.service_id);
  const categoryId = resolveStoredEntityId(item?.category_id);
  const serviceIdKey = entityIdKey(serviceId) ?? (rawServiceId || null);
  const meta = serviceIdKey ? metaByServiceId.get(String(serviceIdKey)) : undefined;

  if (!serviceId && !rawServiceId) {
    return null;
  }

  const amount = Number(item?.amount);
  const price = Number.isFinite(amount) ? amount : 0;
  const durationLabel = String(item?.duration_label ?? "").trim() || null;
  const storedServiceTitle = String(item?.service_title ?? item?.serviceTitle ?? "").trim();
  const storedCategoryTitle = String(item?.category_title ?? item?.categoryTitle ?? "").trim();
  const resolvedServiceId = serviceId ?? rawServiceId;
  const resolvedCategoryId = categoryId ?? (rawCategoryId || null);

  if (meta) {
    return {
      id: resolvedServiceId,
      business_setup_id: businessSetupId,
      service_id: resolvedServiceId,
      category_id: resolvedCategoryId ?? meta.category_id,
      price,
      duration_label: durationLabel,
      service_title: storedServiceTitle || meta.service_title,
      category_title: storedCategoryTitle || meta.category_title,
      created_at: null,
    };
  }

  return {
    id: resolvedServiceId,
    business_setup_id: businessSetupId,
    service_id: resolvedServiceId,
    category_id: resolvedCategoryId,
    price,
    duration_label: durationLabel,
    service_title: storedServiceTitle || "Service",
    category_title: storedCategoryTitle || null,
    created_at: null,
  };
};

export const fetchServiceMetaByIds = async (serviceIds, queryFn) => {
  const uniqueIds = [
    ...new Set(
      serviceIds
        .map((id) => {
          const normalized = normalizeEntityId(id);
          if (normalized !== null) {
            return String(normalized);
          }
          const raw = String(id ?? "").trim();
          return raw || null;
        })
        .filter(Boolean),
    ),
  ];

  if (!uniqueIds.length) {
    return new Map();
  }

  const result = await queryFn(
    `SELECT
       s.id::text AS service_id,
       s.title AS service_title,
       s.category_id::text AS category_id,
       c.title AS category_title
     FROM subcategories s
     INNER JOIN categories c ON c.id = s.category_id
     WHERE s.id::text = ANY($1::text[])`,
    [uniqueIds],
  );

  return new Map(result.rows.map((row) => [String(row.service_id), row]));
};

export const collectAssignedServiceIdsFromTeamMembers = (teamMembers) => {
  const ids = new Set();

  parseJsonArray(teamMembers).forEach((member) => {
    parseJsonArray(member?.assigned_services).forEach((service) => {
      const serviceId = resolveStoredEntityId(service?.service_id ?? service?.serviceId);
      if (serviceId) {
        ids.add(String(serviceId));
      }
    });
  });

  return [...ids];
};

export const buildServiceDetailsFromAssignedServices = async (
  assignedServiceIds,
  businessSetupId,
  queryFn,
) => {
  const uniqueIds = [...new Set(assignedServiceIds.map((id) => String(id).trim()).filter(Boolean))];

  if (!uniqueIds.length) {
    return [];
  }

  const metaByServiceId = await fetchServiceMetaByIds(uniqueIds, queryFn);

  return uniqueIds
    .map((serviceId) => {
      const meta = metaByServiceId.get(String(serviceId));
      if (!meta) {
        return null;
      }

      return {
        id: serviceId,
        business_setup_id: businessSetupId,
        service_id: serviceId,
        category_id: meta.category_id,
        price: 0,
        duration_label: null,
        service_title: meta.service_title,
        category_title: meta.category_title,
        created_at: null,
      };
    })
    .filter(Boolean);
};

export const buildServiceDetailsFromCategories = async (
  serviceCategories,
  businessSetupId,
  queryFn,
  { teamMembers = [], useTeamAssignmentsFallback = false } = {},
) => {
  const categories = parseJsonArray(serviceCategories);

  if (!categories.length) {
    if (!useTeamAssignmentsFallback) {
      return [];
    }

    const assignedServiceIds = collectAssignedServiceIdsFromTeamMembers(teamMembers);
    if (!assignedServiceIds.length) {
      return [];
    }

    return buildServiceDetailsFromAssignedServices(assignedServiceIds, businessSetupId, queryFn);
  }

  const serviceIds = categories.map((item) => item?.service_id);
  const metaByServiceId = await fetchServiceMetaByIds(serviceIds, queryFn);

  return categories
    .map((item) => mapCategoryItemToServiceDetail(item, metaByServiceId, businessSetupId))
    .filter(Boolean);
};

export const buildServiceDetailsMapForSetups = async (
  setupRows,
  queryFn,
  { teamMembersBySetupId = {}, useTeamAssignmentsFallback = true } = {},
) => {
  const categoriesBySetupId = new Map();
  const allServiceIds = new Set();

  for (const row of setupRows) {
    const categories = parseJsonArray(row.service_categories);
    categoriesBySetupId.set(row.id, categories);
    categories.forEach((item) => {
      const serviceId = resolveStoredEntityId(item?.service_id);
      if (serviceId) {
        allServiceIds.add(serviceId);
      }
    });
  }

  const metaByServiceId = await fetchServiceMetaByIds([...allServiceIds], queryFn);
  const detailsBySetupId = {};

  for (const [setupId, categories] of categoriesBySetupId) {
    let details = categories
      .map((item) => mapCategoryItemToServiceDetail(item, metaByServiceId, setupId))
      .filter(Boolean);

    if (!details.length && useTeamAssignmentsFallback) {
      const assignedServiceIds = collectAssignedServiceIdsFromTeamMembers(teamMembersBySetupId[setupId] ?? []);
      if (assignedServiceIds.length) {
        details = await buildServiceDetailsFromAssignedServices(assignedServiceIds, setupId, queryFn);
      }
    }

    detailsBySetupId[setupId] = details;
  }

  return detailsBySetupId;
};
