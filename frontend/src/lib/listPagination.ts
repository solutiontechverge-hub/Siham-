/** Shared list pagination types + query helpers for RTK list endpoints. */

export type ListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListPaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

export function appendListPaginationParams(
  params: URLSearchParams,
  pagination?: ListPaginationParams | null | void,
) {
  if (!pagination) return params;
  if (pagination.page != null) params.set("page", String(pagination.page));
  if (pagination.limit != null) params.set("limit", String(pagination.limit));
  if (pagination.offset != null) params.set("offset", String(pagination.offset));
  return params;
}

export function buildListQuery(
  path: string,
  pagination?: ListPaginationParams | null | void,
  extra?: Record<string, string | number | undefined | null>,
) {
  const params = new URLSearchParams();
  appendListPaginationParams(params, pagination);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function emptyListPagination(
  pagination?: ListPaginationParams | null,
  fallbackLimit = 10,
): ListPagination {
  return {
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? fallbackLimit,
    total: 0,
    totalPages: 0,
  };
}

export function normalizeListPagination(
  pagination: Partial<ListPagination> | null | undefined,
  fallback: { page?: number; limit?: number; total?: number } = {},
): ListPagination {
  const total = Number(pagination?.total ?? fallback.total ?? 0) || 0;
  const limit = Math.max(1, Number(pagination?.limit ?? fallback.limit ?? 10) || 10);
  const page = Math.max(1, Number(pagination?.page ?? fallback.page ?? 1) || 1);
  return {
    page,
    limit,
    total,
    totalPages: pagination?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 0),
  };
}
