import { apiClient } from './client';
import {
  transformBackendToClientMeasurement,
  transformClientToBackendMeasurementDto,
} from './transformers';
import { ClientMeasurement, PaymentStatus, OrderStatus } from '@/types/measurement';

export const measurementsApi = {
  /**
   * Fetch measurements with optional category, search, and status filters
   */
  getMeasurements: async (params?: {
    category?: string;
    search?: string;
    status?: string;
    clientId?: string;
  }): Promise<ClientMeasurement[]> => {
    const response = await apiClient.get('/measurements', { params });
    if (Array.isArray(response.data)) {
      return response.data.map(transformBackendToClientMeasurement);
    }
    return [];
  },

  /**
   * Fetch single measurement by ID
   */
  getMeasurementById: async (id: string): Promise<ClientMeasurement> => {
    const response = await apiClient.get(`/measurements/${id}`);
    return transformBackendToClientMeasurement(response.data);
  },

  /**
   * Create new suit measurement & order slip
   */
  createMeasurement: async (data: Partial<ClientMeasurement>): Promise<ClientMeasurement> => {
    const payload = transformClientToBackendMeasurementDto(data);
    const response = await apiClient.post('/measurements', payload);
    return transformBackendToClientMeasurement(response.data);
  },

  /**
   * Update existing measurement
   */
  updateMeasurement: async (
    id: string,
    data: Partial<ClientMeasurement>
  ): Promise<ClientMeasurement> => {
    const payload = transformClientToBackendMeasurementDto(data);
    const response = await apiClient.put(`/measurements/${id}`, payload);
    return transformBackendToClientMeasurement(response.data);
  },

  /**
   * Update payment status (e.g. Mark as Paid)
   */
  updatePayment: async (
    id: string,
    paymentStatus: PaymentStatus
  ): Promise<ClientMeasurement> => {
    const response = await apiClient.patch(`/measurements/${id}/payment`, {
      payment_status: paymentStatus,
    });
    return transformBackendToClientMeasurement(response.data);
  },

  /**
   * Update order status (in_progress, ready, delivered)
   */
  updateStatus: async (
    id: string,
    status: OrderStatus
  ): Promise<ClientMeasurement> => {
    const response = await apiClient.patch(`/measurements/${id}/status`, {
      status,
    });
    return transformBackendToClientMeasurement(response.data);
  },

  /**
   * Delete measurement
   */
  deleteMeasurement: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/measurements/${id}`);
    return response.data?.success ?? true;
  },
};
