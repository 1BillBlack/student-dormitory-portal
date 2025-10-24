const API_URL = 'https://functions.poehali.dev/a9ae7227-6241-401d-b0ae-c0e7a89092dd';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  resource: string,
  method: string = 'GET',
  body?: any,
  params?: Record<string, string>
): Promise<T> {
  const queryParams = new URLSearchParams({ resource, ...params });
  const url = `${API_URL}?${queryParams}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error('API Error:', {
      url,
      status: response.status,
      statusText: response.statusText,
      data,
      requestBody: body
    });
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  users: {
    getAll: () => apiRequest<{ users: any[] }>('users', 'GET'),
    login: (email: string, password: string) =>
      apiRequest<{ user: any }>('users', 'POST', { action: 'login', email, password }),
    register: (email: string, password: string, name: string, room?: string, group?: string) =>
      apiRequest<{ user: any }>('users', 'POST', { action: 'register', email, password, name, room, group }),
    update: (userId: string, updates: any) =>
      apiRequest<{ success: boolean }>('users', 'PUT', { userId, ...updates }),
    delete: (userId: string) =>
      apiRequest<{ success: boolean }>('users', 'DELETE', undefined, { userId }),
  },

  workShifts: {
    getAll: (userId?: string) =>
      apiRequest<{ workShifts: any[] }>('work-shifts', 'GET', undefined, userId ? { userId } : undefined),
    getArchived: () =>
      apiRequest<{ archivedShifts: any[] }>('work-shifts', 'GET', undefined, { archived: 'true' }),
    create: (data: any) =>
      apiRequest<{ workShift: any }>('work-shifts', 'POST', data),
    complete: (shiftId: number, daysToComplete: number, completedBy: string, completedByName: string) =>
      apiRequest<{ workShift: any }>('work-shifts', 'PUT', {
        shiftId,
        action: 'complete',
        daysToComplete,
        completedBy,
        completedByName,
      }),
    archive: (shiftId: number) =>
      apiRequest<{ success: boolean }>('work-shifts', 'PUT', { shiftId, action: 'archive' }),
  },

  notifications: {
    getAll: (userId: string) =>
      apiRequest<{ notifications: any[] }>('notifications', 'GET', undefined, { userId }),
    create: (userId: string, type: string, title: string, message: string) =>
      apiRequest<{ notification: any }>('notifications', 'POST', { userId, type, title, message }),
    markAsRead: (notificationId: number) =>
      apiRequest<{ notification: any }>('notifications', 'PUT', { notificationId, isRead: true }),
  },

  logs: {
    getAll: (limit?: number) =>
      apiRequest<{ logs: any[] }>('logs', 'GET', undefined, limit ? { limit: limit.toString() } : undefined),
    create: (data: any) =>
      apiRequest<{ log: any }>('logs', 'POST', data),
  },
};