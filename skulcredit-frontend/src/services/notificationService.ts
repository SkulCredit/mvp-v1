import apiClient from "./apiClient";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const notificationService = {
  getNotifications: async (
    page = 1,
    limit = 20,
  ): Promise<NotificationsResponse> => {
    const res = await apiClient.get<{ data: NotificationsResponse }>(
      `/notifications?page=${page}&limit=${limit}`,
    );
    return res.data.data;
  },

  markRead: async (id: string): Promise<AppNotification> => {
    const res = await apiClient.put<{ data: AppNotification }>(
      `/notifications/${id}/read`,
    );
    return res.data.data;
  },

  markAllRead: async (): Promise<{ updated: number }> => {
    const res = await apiClient.put<{ data: { updated: number } }>(
      `/notifications/read-all`,
    );
    return res.data.data;
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

export default notificationService;
