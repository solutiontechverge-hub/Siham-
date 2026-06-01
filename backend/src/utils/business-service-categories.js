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

const mapCategoryItemToServiceDetail = (item, metaByServiceId, businessSetupId) => {
  const serviceId = normalizeEntityId(item?.service_id);
  const categoryId = normalizeEntityId(item?.category_id);
  const serviceIdKey = entityIdKey(serviceId);
  const meta = serviceIdKey ? metaByServiceId.get(serviceIdKey) : undefined;

  if (!serviceId || !meta) {
    return null;
  }

  const amount = Number(item?.amount);
  const price = Number.isFinite(amount) ? amount : 0;
  const durationLabel = String(item?.duration_label ?? "").trim() || null;

  return {
    id: serviceId,
    business_setup_id: businessSetupId,
    service_id: serviceId,
    category_id: categoryId ?? meta.category_id,
    price,
    duration_label: durationLabel,
    service_title: meta.service_title,
    category_title: meta.category_title,
    created_at: null,
  };
};

export const fetchServiceMetaByIds = async (serviceIds, queryFn) => {
  const uniqueIds = [
    ...new Set(
      serviceIds.map(normalizeEntityId).filter((id) => id !== null).map(String),
    ),
  ];

  if (!uniqueIds.length) {
    return new Map();
  }

  const result = await queryFn(
    `SELECT
       s.id AS service_id,
       s.title AS service_title,
       s.category_id,
       c.title AS category_title
     FROM subcategories s
     INNER JOIN categories c ON c.id = s.category_id
     WHERE s.id = ANY($1::uuid[])`,
    [uniqueIds],
  );

  return new Map(result.rows.map((row) => [String(row.service_id), row]));
};

export const buildServiceDetailsFromCategories = async (
  serviceCategories,
  businessSetupId,
  queryFn,
) => {
  const categories = parseJsonArray(serviceCategories);

  if (!categories.length) {
    return [];
  }

  const serviceIds = categories.map((item) => item?.service_id);
  const metaByServiceId = await fetchServiceMetaByIds(serviceIds, queryFn);

  return categories
    .map((item) => mapCategoryItemToServiceDetail(item, metaByServiceId, businessSetupId))
    .filter(Boolean);
};

export const buildServiceDetailsMapForSetups = async (setupRows, queryFn) => {
  const categoriesBySetupId = new Map();
  const allServiceIds = new Set();

  for (const row of setupRows) {
    const categories = parseJsonArray(row.service_categories);
    categoriesBySetupId.set(row.id, categories);
    categories.forEach((item) => {
      const serviceId = normalizeEntityId(item?.service_id);
      if (serviceId) {
        allServiceIds.add(serviceId);
      }
    });
  }

  const metaByServiceId = await fetchServiceMetaByIds([...allServiceIds], queryFn);
  const detailsBySetupId = {};

  for (const [setupId, categories] of categoriesBySetupId) {
    detailsBySetupId[setupId] = categories
      .map((item) => mapCategoryItemToServiceDetail(item, metaByServiceId, setupId))
      .filter(Boolean);
  }

  return detailsBySetupId;
};
