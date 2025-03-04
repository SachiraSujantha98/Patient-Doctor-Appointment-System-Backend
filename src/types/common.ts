export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends ApiResponse<{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'patient' | 'doctor';
  };
}> {
  token: string;
  refreshToken: string;
  expiresIn: number;
} 