/**
 * Pagination utility for MongoDB queries
 */

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  maxLimit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Calculate pagination parameters
 * @param options - Pagination options from query params
 * @returns Calculated pagination values
 */
export const getPaginationParams = (
  options: PaginationOptions = {}
): PaginationResult => {
  const page = Math.max(1, parseInt(String(options.page || 1), 10));
  const maxLimit = options.maxLimit || 1000;
  const limit = Math.min(
    Math.max(1, parseInt(String(options.limit || 50), 10)),
    maxLimit
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Apply pagination to a Mongoose query
 * @param query - Mongoose query
 * @param options - Pagination options
 * @returns Query with pagination applied
 */
export const paginate = <T>(
  query: any,
  options: PaginationOptions = {}
): any => {
  const { skip, limit } = getPaginationParams(options);
  return query.skip(skip).limit(limit);
};

/**
 * Build pagination metadata for response
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const buildPaginationMeta = (
  total: number,
  options: PaginationOptions = {}
): PaginationMeta => {
  const { page, limit } = getPaginationParams(options);
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};
