import { Query } from 'mongoose';

/**
 * Pagination options interface
 */
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sort?: string;
}

/**
 * Pagination result interface
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Parse pagination parameters from request query
 */
export function parsePaginationParams(query: any): PaginationOptions {
    const page = query.page ? Math.max(1, parseInt(query.page as string, 10)) : 1;
    const limit = query.limit ? Math.min(100, Math.max(1, parseInt(query.limit as string, 10))) : 50;
    const sort = query.sort as string || '-createdAt';

    return { page, limit, sort };
}

/**
 * Apply pagination to a Mongoose query
 */
export async function paginate<T>(
    query: Query<T[], T>,
    options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 50, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    // Clone the query for counting
    const countQuery = query.model.find(query.getFilter());

    // Execute both queries in parallel
    const [data, total] = await Promise.all([
        query
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        countQuery.countDocuments()
    ]);

    const pages = Math.ceil(total / limit);

    return {
        data: data as T[],
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
    };
}

/**
 * Calculate skip value for pagination
 */
export function calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(page: number, limit: number): void {
    if (page < 1) {
        throw new Error('Page number must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
        throw new Error('Limit must be between 1 and 100');
    }
}
