import { apiClient } from './client';

export interface DashboardMetricsResponse {
  stats: {
    total: number;
    inProgress: number;
    ready: number;
    delivered: number;
  };
  financials: {
    totalRevenue: number;
    totalCollected: number;
    totalReceivable: number;
  };
  urgentOrders: any[];
  recentOrders: any[];
}

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetricsResponse> => {
    const response = await apiClient.get<DashboardMetricsResponse>('/dashboard/metrics');
    return response.data;
  },
};
