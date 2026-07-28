// src/store/authStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { setCookie, deleteCookie } from '../utils/cookies';
import { 
  isDevMode, 
  saveUsername, 
  clearSavedUsername,
  generateMockInitData,
  extractTelegramIdFromInitData,
} from '../utils/devHelpers';
import toast from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,

  isAuthenticated: false,

  // === login ===
  login: async (username, password) => {
    try {
      set({ loading: true });

      // базовый payload
      let payload = { username, password };

      // initData / telegram_id: реальный Telegram или фолбэк
      let initData = null;

      if (window.Telegram?.WebApp?.initData) {
        // реальный Telegram WebApp
        initData = window.Telegram.WebApp.initData;
        setCookie('initData', initData);
      } else if (username) {
        // фолбэк для dev и прод-предпросмотра вне Telegram
        if (isDevMode()) {
          saveUsername(username);
        }
        initData = generateMockInitData(username);
        setCookie('initData', initData);
      }

      if (initData) {
        const telegramId = extractTelegramIdFromInitData(initData);
        payload = {
          ...payload,
          initData,
          ...(telegramId ? { telegram_id: telegramId } : {}),
        };
      }

      const data = await api.post('/auth/login', payload);

      localStorage.setItem('access_token', data.access_token);

      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });

      toast.success('Вход выполнен');
      return true;
    } catch {
      set({ loading: false });
      return false;
    }
  },

  // === profile check ===
  fetchProfile: async () => {
    try {
      set({ loading: true });

      const user = await api.get('/auth/me');

      set({
        user,
        isAuthenticated: true,
        loading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  // === init on app start ===
  initialize: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    await useAuthStore.getState().fetchProfile();
  },

  // === logout ===
  logout: () => {
    localStorage.removeItem('access_token');
    deleteCookie('initData');
    clearSavedUsername();

    set({
      user: null,
      isAuthenticated: false,
    });

    toast.success('Вы вышли');
  },
}));
