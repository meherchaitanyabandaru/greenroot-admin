export type ApiError = {
  code: string;
  message: string;
  status?: number;
};

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type Role = {
  id: number;
  code: string;
  name: string;
};

export type User = {
  id: number;
  first_name: string;
  last_name?: string | null;
  mobile: string;
  email?: string | null;
  status: string;
  roles?: Role[];
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
};

export type DashboardSummary = {
  users: number;
  nurseries: number;
  pending_nurseries: number;
  approved_nurseries: number;
  suspended_nurseries: number;
  plants: number;
  inventory_items: number;
  plant_requests: number;
  orders: number;
  active_orders: number;
  payments: number;
  dispatches: number;
  notifications: number;
  active_drivers: number;
  revenue: number;
};

export type DashboardResponse = {
  summary: DashboardSummary;
};

export type Pagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type ListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: string | number | undefined;
};
