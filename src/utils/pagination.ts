import { PaginationOptions, PaginatedResponse } from '../types/common';

export const getPaginationOptions = (options?: PaginationOptions) => {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 10));
  const offset = (page - 1) * limit;

  return {
    limit,
    offset,
    page,
  };
};

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    total,
    currentPage: page,
    totalPages,
    hasMore: page < totalPages,
  };
}; 