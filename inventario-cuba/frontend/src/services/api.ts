/**
 * Cliente HTTP para comunicarse con el backend Express.
 * Maneja tokens JWT automáticamente.
 * En modo offline, lanza error que el store captura.
 */

import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.157.10:3000'; // Cambiar por tu IP local

// Para encontrar tu IP en Windows ejecuta: ipconfig
// Busca "Dirección IPv4" en tu adaptador WiFi

/**
 * Obtiene la IP correcta según el entorno.
 * En emulador Android usar 10.0.2.2
 * En dispositivo físico usar la IP de tu PC en la red WiFi
 */
function getApiUrl(): string {
  return API_URL;
}

/**
 * Petición HTTP base con manejo de tokens y errores.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync('access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }

  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
  }) => request<any>('/api/auth/register', {
    method: 'POST',
    body:   JSON.stringify(body),
  }),

  login: (body: { email: string; password: string }) =>
    request<any>('/api/auth/login', {
      method: 'POST',
      body:   JSON.stringify(body),
    }),

  logout: () =>
    request<any>('/api/auth/logout', { method: 'POST' }),

  me: () => request<any>('/api/auth/me'),

  updateProfile: (body: { name: string; businessName?: string }) =>
  request<any>('/api/auth/profile', {
    method: 'PATCH',
    body:   JSON.stringify(body),
  }),

changePassword: (body: { currentPassword: string; newPassword: string }) =>
  request<any>('/api/auth/change-password', {
    method: 'PATCH',
    body:   JSON.stringify(body),
  }),

forgotPassword: (email: string) =>
  request<any>('/api/auth/forgot-password', {
    method: 'POST',
    body:   JSON.stringify({ email }),
  }),

resetPassword: (body: { email: string; code: string; newPassword: string }) =>
  request<any>('/api/auth/reset-password', {
    method: 'POST',
    body:   JSON.stringify(body),
  }),
  
  registerCashier: (body: {
    name:     string;
    email:    string;
    password: string;
  }) => request<any>('/api/auth/register-cashier', {
    method: 'POST',
    body:   JSON.stringify({ ...body, role: 'cashier' }),
  }),
};

// ─── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search)   query.append('search',   params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.page)     query.append('page',     String(params.page));
    if (params?.limit)    query.append('limit',    String(params.limit));
    return request<any>(`/api/products?${query.toString()}`);
  },

  getById:    (id: string) => request<any>(`/api/products/${id}`),
  getCategories: ()        => request<any>('/api/products/categories'),

  create: (body: any) => request<any>('/api/products', {
    method: 'POST',
    body:   JSON.stringify(body),
  }),

  update: (id: string, body: any) => request<any>(`/api/products/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(body),
  }),

  delete: (id: string) => request<any>(`/api/products/${id}`, {
    method: 'DELETE',
  }),
};

// ─── Sales ─────────────────────────────────────────────────────────────────────
export const salesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page)     query.append('page',     String(params.page));
    if (params?.limit)    query.append('limit',    String(params.limit));
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo)   query.append('dateTo',   params.dateTo);
    return request<any>(`/api/sales?${query.toString()}`);
  },

  getById:      (id: string) => request<any>(`/api/sales/${id}`),
  getTodaySummary: ()        => request<any>('/api/sales/summary/today'),

  create: (body: any) => request<any>('/api/sales', {
    method: 'POST',
    body:   JSON.stringify(body),
  }),
};