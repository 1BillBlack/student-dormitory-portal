const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  const url = `${API_URL}/${resource}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
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
  } catch (error) {
    console.error('Fetch error:', error, 'for', url);
    throw error;
  }
}

export const api = {
  users: {
    getAll: () => apiRequest<{ users: any[] }>('users', 'GET'),
    login: (email: string, password: string) =>
      apiRequest<{ user: any }>('users', 'POST', { action: 'login', email, password }),
    register: (email: string, password: string, name: string, room?: string, group?: string) =>
      apiRequest<{ user: any }>('users', 'POST', { action: 'register', email, password, name, room, group }),
    update: (userId: string, updates: any) =>
      apiRequest<{ user: any }>('users', 'PUT', { userId, ...updates }),
  },

  announcements: {
    getAll: () => apiRequest<{ announcements: any[] }>('announcements', 'GET'),
    create: (title: string, content: string, authorId: string) =>
      apiRequest<{ announcement: any }>('announcements', 'POST', { title, content, authorId }),
  },

  tasks: {
    getAll: () => apiRequest<{ tasks: any[] }>('tasks', 'GET'),
    create: (data: any) =>
      apiRequest<{ task: any }>('tasks', 'POST', data),
    update: (taskId: string, updates: any) =>
      apiRequest<{ task: any }>('tasks', 'PUT', { taskId, ...updates }),
  },

  dutySchedule: {
    getAll: () => apiRequest<{ duties: any[] }>('duty-schedule', 'GET'),
    create: (userId: string, date: string, zone: string) =>
      apiRequest<{ duty: any }>('duty-schedule', 'POST', { userId, date, zone }),
    update: (dutyId: string, status: string) =>
      apiRequest<{ duty: any }>('duty-schedule', 'PUT', { dutyId, status }),
  },
};