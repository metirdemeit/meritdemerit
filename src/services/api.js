// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';
import { EXAMPLE_URL } from '../utils/url';
import {
  isDevMode,
  generateMockInitData,
  getSavedUsername,
} from '../utils/devHelpers';
import { getTelegramInitData } from '../utils/telegramCheck';

const apiClient = axios.create({
  baseURL: EXAMPLE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// === request interceptor ===
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const initData = getTelegramInitData();
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }

  return config;
});

// FastAPI validation errors (422) send `detail` as a list of objects. Rendering
// that in a toast or <Alert> crashes React, so turn it into one readable string.
const normalizeDetail = (detail) => {
  if (detail == null || typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc.filter((x) => x !== 'body' && x !== 'query').join('.') : '';
        return field ? `${field}: ${d?.msg ?? 'invalid'}` : (d?.msg ?? String(d));
      })
      .join('; ');
  }
  return typeof detail === 'object' ? (detail.msg || JSON.stringify(detail)) : String(detail);
};

// === response interceptor ===
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data.detail = normalizeDetail(error.response.data.detail);
      if (error.response.data.message != null && typeof error.response.data.message !== 'string') {
        error.response.data.message = normalizeDetail(error.response.data.message);
      }
    }
    const config = error.config;
    const isServerErrorOrNetwork = !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (config && isServerErrorOrNetwork && !config._retryCount && !config.skipRetry) {
      config._retryCount = 1;
      toast.loading('Connection problem. Retrying in 3 seconds...', { id: 'retry-toast', duration: 3000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      return apiClient(config);
    }

    if (error.response?.status === 401) {
      if (!error.config?.skipUnauthorizedSignal) {
        window.dispatchEvent(new Event('unauthorized'));
      }
    } else if (!error.config?.skipErrorToast) {
      toast.error(
        error.response?.data?.detail || error.response?.data?.message || 'Network error'
      );
    }

    return Promise.reject(error);
  }
);

// === простой API ===
export const api = {
  get: (url, config) => apiClient.get(url, config).then(res => res.data),
  post: (url, data, config) => apiClient.post(url, data, config).then(res => res.data),
  put: (url, data, config) => apiClient.put(url, data, config).then(res => res.data),
  patch: (url, data, config) => apiClient.patch(url, data, config).then(res => res.data),
  del: (url, config) => apiClient.delete(url, config).then(res => res.data),
  delete: (url, config) => apiClient.delete(url, config).then(res => res.data),
};

export default api;
