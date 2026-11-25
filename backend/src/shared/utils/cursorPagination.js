import createApiError from "../errors/ApiError.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const getCursorPagination = (query = {}) => {
  const limit = Number(query.limit ?? DEFAULT_LIMIT);

  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw createApiError(
      400,
      "Limit must be a positive integer"
    );
  }

  if (limit > MAX_LIMIT) {
    throw createApiError(
      400,
      `Limit cannot exceed ${MAX_LIMIT}`
    );
  }

  return {
    limit,
    cursor: query.cursor || null,
  };
};

// Encode cursor
export const encodeCursor = (payload) => {
  return Buffer.from(
    JSON.stringify(payload)
  ).toString("base64url");
};

// Decode cursor
export const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(
      cursor,
      "base64url"
    ).toString("utf-8");

    const payload = JSON.parse(decoded);

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      throw new Error("Invalid cursor");
    }

    return payload;
  } catch {
    throw createApiError(400, "Invalid pagination cursor");
  }
};

// Generate response metadata
export const getCursorMeta = ({
  hasNextPage,
  nextCursor,
  limit,
}) => ({
  limit,
  hasNextPage,
  nextCursor,
});