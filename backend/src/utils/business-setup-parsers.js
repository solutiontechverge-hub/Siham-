export const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const parseTextArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const parsed = parseJsonValue(value, null);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const parseJsonArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const normalizeEntityId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  const parsed = Number(trimmed);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return null;
};

export const entityIdKey = (value) => {
  const normalized = normalizeEntityId(value);
  return normalized === null ? null : String(normalized);
};

export const parseEntityIdArray = (value) => {
  const items = parseTextArray(value);
  return items.map((item) => normalizeEntityId(item)).filter(Boolean);
};

export const parseBigIntArray = (value) => {
  const items = parseTextArray(value);
  return items
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
};
