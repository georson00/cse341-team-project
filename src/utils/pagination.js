// Shared helpers for paginated list endpoints (W05 team convention).
// Query params: ?page=1&limit=10  ->  metadata: { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage }

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

const WHOLE_NUMBER = /^\d+$/;

// Reads one integer query param. Returns { value } or { error }.
// Missing or empty -> the default. Anything else must be a whole number in [min, max].
function readInteger(query, name, { defaultValue, min, max }) {
  const raw = query[name];

  if (raw === undefined || raw === '') {
    return { value: defaultValue };
  }

  // ?page=1&page=2 arrives as an array; reject it instead of guessing which one to use.
  if (typeof raw !== 'string' || !WHOLE_NUMBER.test(raw.trim())) {
    return { error: describeRange(name, min, max) };
  }

  const value = Number(raw.trim());
  if (value < min || value > max) {
    return { error: describeRange(name, min, max) };
  }

  return { value };
}

function describeRange(name, min, max) {
  return max === Number.MAX_SAFE_INTEGER
    ? `${name} must be an integer of at least ${min}`
    : `${name} must be an integer between ${min} and ${max}`;
}

// Validates ?page and ?limit. Returns { page, limit, errors } where errors is an array of messages.
export function parsePagination(query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const errors = [];

  const page = readInteger(query, 'page', {
    defaultValue: DEFAULT_PAGE,
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
  });
  const limit = readInteger(query, 'limit', {
    defaultValue: defaultLimit,
    min: 1,
    max: maxLimit,
  });

  if (page.error) errors.push(page.error);
  if (limit.error) errors.push(limit.error);

  return { page: page.value, limit: limit.value, errors };
}

// Number of documents to skip for a given page.
export function pageOffset(page, limit) {
  return (page - 1) * limit;
}

// Builds the metadata object returned next to the results.
export function buildPagination({ page, limit, totalItems }) {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
