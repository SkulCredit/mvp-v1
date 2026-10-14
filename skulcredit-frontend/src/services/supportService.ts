import apiClient from './apiClient';
import type {
  SupportTicketItem,
  SupportTicketMessageItem,
  SupportTicketTagItem,
  TicketListResult,
  CsManager,
  CsDashboardStats,
} from '../components/types/supports';

export const supportService = {
  async createTicket(body: {
    subject: string;
    message: string;
    category?: string;
    priority?: string;
  }): Promise<SupportTicketItem> {
    const response = await apiClient.post('/support/tickets', body);
    return response.data.data;
  },

  async listMyTickets(query?: Record<string, string>): Promise<TicketListResult> {
    const params = query ? new URLSearchParams(query).toString() : '';
    const response = await apiClient.get(`/support/tickets${params ? `?${params}` : ''}`);
    return response.data.data;
  },

  async getMyTicket(id: string): Promise<SupportTicketItem & { messages: SupportTicketMessageItem[] }> {
    const response = await apiClient.get(`/support/tickets/${id}`);
    return response.data.data;
  },

  async replyTicket(id: string, message: string): Promise<SupportTicketMessageItem> {
    const response = await apiClient.post(`/support/tickets/${id}/messages`, { message });
    return response.data.data;
  },

  async hideTicket(id: string): Promise<void> {
    const response = await apiClient.delete(`/support/tickets/${id}`);
    return response.data.data;
  },

  async csDashboard(): Promise<CsDashboardStats> {
    const response = await apiClient.get('/cs/dashboard');
    return response.data.data;
  },

  async csListManagers(): Promise<CsManager[]> {
    const response = await apiClient.get('/cs/managers');
    return response.data.data;
  },

  async csListTickets(query?: Record<string, string>): Promise<TicketListResult> {
    const params = query ? new URLSearchParams(query).toString() : '';
    const response = await apiClient.get(`/cs/tickets${params ? `?${params}` : ''}`);
    return response.data.data;
  },

  async csGetTicket(id: string): Promise<SupportTicketItem & { messages: SupportTicketMessageItem[]; tags: SupportTicketTagItem[] }> {
    const response = await apiClient.get(`/cs/tickets/${id}`);
    return response.data.data;
  },

  async csUpdateTicket(id: string, body: { status: string }): Promise<SupportTicketItem> {
    const response = await apiClient.patch(`/cs/tickets/${id}`, body);
    return response.data.data;
  },

  async csAddMessage(id: string, body: { body: string; visibility?: string }): Promise<SupportTicketMessageItem> {
    const response = await apiClient.post(`/cs/tickets/${id}/messages`, body);
    return response.data.data;
  },

  async csEscalate(id: string, body: { managerId: string; note?: string }): Promise<unknown> {
    const response = await apiClient.post(`/cs/tickets/${id}/escalate`, body);
    return response.data.data;
  },

  async csTicketAudit(id: string, query?: Record<string, string>): Promise<unknown> {
    const params = query ? new URLSearchParams(query).toString() : '';
    const response = await apiClient.get(`/cs/tickets/${id}/audit${params ? `?${params}` : ''}`);
    return response.data.data;
  },
};
