// @types/api.ts

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface QueryParams extends Record<string, any> {
  q?: string; // searching query
  filters?: string; // json stringified filters
  includes?: string; // csv style includes
}
