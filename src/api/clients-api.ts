import { apiClient } from './client';

export interface ClientProfile {
  _id: string;
  serial_number: string;
  name: string;
  phone: string;
  alternate_phone?: string;
  address?: string;
  notes?: string;
  total_orders: number;
  total_billed: number;
  total_paid: number;
  total_balance: number;
  latest_kameez?: any;
  latest_shalwar?: any;
}

export const clientsApi = {
  getClients: async (search?: string): Promise<ClientProfile[]> => {
    const response = await apiClient.get('/clients', {
      params: search ? { search } : undefined,
    });
    return response.data || [];
  },

  getClientById: async (id: string): Promise<ClientProfile> => {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data;
  },

  createClient: async (data: Partial<ClientProfile>): Promise<ClientProfile> => {
    const response = await apiClient.post('/clients', data);
    return response.data;
  },

  updateClient: async (id: string, data: Partial<ClientProfile>): Promise<ClientProfile> => {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response.data;
  },

  deleteClient: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data?.success ?? true;
  },
};
