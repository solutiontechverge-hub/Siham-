/**
 * Shared list pagination helpers for GET list APIs.
 *
 * Query params:
 * - page (1-based) and/or limit — when either is present, SQL LIMIT/OFFSET is applied
 * - offset — optional alternative to page (used by older callers)
 *
 * Response shape (top-level):
 *   pagination: { page, limit, total, totalPages }
 */

const DEFAULT_LIMIT = 10;
const DEFAULT_MAX_LIMIT = 100;

/**
 * Parse page/limit/offset from an Express request query.
 * Pagination is opt-in unless `force` is true: when page/limit/offset are omitted,
 * callers should return the full list (backward compatible).
 *
 * @param {Record<string, unknown>} [query]
 * @param {{ defaultLimit?: number, maxLimit?: number, force?: boolean }} [options]
 */
export function parseListPagination(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? DEFAULT_MAX_LIMIT;
  const force = Boolean(options.force);

  const rawPage = query.page;
  const rawLimit = query.limit;
  const rawOffset = query.offset;

  const hasPage = rawPage !== undefined && rawPage !== null && String(rawPage).trim() !== "";
  const hasLimit = rawLimit !== undefined && rawLimit !== null && String(rawLimit).trim() !== "";
  const hasOffset = rawOffset !== undefined && rawOffset !== null && String(rawOffset).trim() !== "";

  const paginate = force || hasPage || hasLimit || hasOffset;

  const limit = Math.min(
    Math.max(Number.parseInt(String(hasLimit ? rawLimit : defaultLimit), 10) || defaultLimit, 1),
    maxLimit,
  );

  let page = Math.max(1, Number.parseInt(String(hasPage ? rawPage : "1"), 10) || 1);
  let offset = (page - 1) * limit;

  if (hasOffset && !hasPage) {
    offset = Math.max(0, Number.parseInt(String(rawOffset), 10) || 0);
    page = Math.floor(offset / limit) + 1;
  }

  return { paginate, page, limit, offset };
}

/**
 * Build pagination meta for API responses.
 *
 * @param {{ page: number, limit: number, total: number, paginate?: boolean }} input
 */
export function buildPaginationMeta({ page, limit, total, paginate = true }) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeLimit = Math.max(1, Number(limit) || DEFAULT_LIMIT);
  const safePage = Math.max(1, Number(page) || 1);

  if (!paginate) {
    return {
      page: 1,
      limit: safeTotal || safeLimit,
      total: safeTotal,
      totalPages: safeTotal > 0 ? 1 : 0,
    };
  }

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages: safeLimit > 0 ? Math.ceil(safeTotal / safeLimit) : 0,
  };
}

/**
 * SQL fragment: LIMIT $n OFFSET $n+1
 *
 * @param {number} startIndex 1-based parameter index for LIMIT
 */
export function sqlLimitOffset(startIndex) {
  const limitIndex = Number(startIndex);
  const offsetIndex = limitIndex + 1;
  return {
    clause: `LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    limitIndex,
    offsetIndex,
  };
}

/**
 * Append limit/offset to a query params array when paginating.
 *
 * @param {unknown[]} params
 * @param {{ paginate: boolean, limit: number, offset: number }} pagination
 */
export function withPaginationParams(params, { paginate, limit, offset }) {
  if (!paginate) return params;
  return [...params, limit, offset];
}

/**
 * Slice an in-memory array using parseListPagination result.
 *
 * @template T
 * @param {T[]} items
 * @param {{ paginate: boolean, page: number, limit: number, offset: number }} pagination
 */
export function paginateItems(items, pagination) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const sliced = pagination.paginate
    ? list.slice(pagination.offset, pagination.offset + pagination.limit)
    : list;

  return {
    items: sliced,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.paginate ? pagination.limit : Math.max(total, pagination.limit),
      total,
      paginate: pagination.paginate,
    }),
  };
}

/**
 * Standard success payload for list endpoints.
 *
 * @template T
 * @param {{
 *   message?: string,
 *   data: T,
 *   page: number,
 *   limit: number,
 *   total: number,
 *   paginate?: boolean,
 * }} input
 */
export function listResponse({
  message = "Fetched successfully.",
  data,
  page,
  limit,
  total,
  paginate = true,
}) {
  return {
    success: true,
    message,
    data,
    pagination: buildPaginationMeta({ page, limit, total, paginate }),
  };
}
