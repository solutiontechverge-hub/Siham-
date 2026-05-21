const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (value) => {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  return UUID_REGEX.test(String(value).trim());
};

export const parseUuid = (value) => {
  const normalized = String(value ?? "").trim();
  return isValidUuid(normalized) ? normalized.toLowerCase() : null;
};

export const parseOptionalUuid = (value) => parseUuid(value);

export const parseUuidArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  const items = Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return [...new Set(items.map((item) => parseUuid(item)).filter(Boolean))];
};
