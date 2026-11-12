import { apiClient } from './client';
import { transformBackendToClientMeasurement } from './transformers';
import { ClientMeasurement } from '@/types/measurement';

export interface ClientLedgerResponse {
  client: {
    id: string;
    serial_number: string;
    name: string;
    phone: string;
    address?: string;
  };
  summary: {
    total_suits: number;
    total_billed: number;
    total_paid: number;
    total_balance: number;
  };
  items: ClientMeasurement[];
}

export interface WhatsAppStatementResponse {
  client_name: string;
  client_phone: string;
  message_text: string;
  whatsapp_url: string;
}

export const ledgerApi = {
  getClientLedger: async (clientId: string): Promise<ClientLedgerResponse> => {
    const response = await apiClient.get(`/ledger/client/${clientId}`);
    const data = response.data;
    return {
      client: data.client,
      summary: data.summary,
      items: Array.isArray(data.items)
        ? data.items.map(transformBackendToClientMeasurement)
        : [],
    };
  },

  getWhatsAppSummary: async (clientId: string): Promise<WhatsAppStatementResponse> => {
    const response = await apiClient.get(`/ledger/client/${clientId}/whatsapp-summary`);
    return response.data;
  },

  getWhatsAppSlip: async (
    measurementId: string
  ): Promise<{
    receipt_number: string;
    client_name: string;
    client_phone: string;
    message_text: string;
    whatsapp_url: string;
  }> => {
    const response = await apiClient.get(`/ledger/slip/${measurementId}/whatsapp-slip`);
    return response.data;
  },

  markClientAllPaid: async (
    clientId: string
  ): Promise<{ message: string; cleared_balance_amount: number }> => {
    const response = await apiClient.post(`/ledger/client/${clientId}/mark-paid`);
    return response.data;
  },
};
