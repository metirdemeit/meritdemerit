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
      let initData = window.Telegram?.WebApp?.initData;
      if (!initData && username && isDevMode()) {
        saveUsername(username);
        initData = generateMockInitData(username);
      }

      if (initData) {
        sessionStorage.setItem('tg_init_data', initData);
        setCookie('initData', initData, 30);
        const telegramId = extractTelegramIdFromInitData(initData);
        payload = {
          ...payload,
          initData,
          init_data: initData,
          ...(telegramId ? { telegram_id: telegramId } : {}),
        };
      }

      const data = await api.post('/auth/login', payload);

      localStorage.setItem('access_token', data.access_token);

      const userObj = {
        id: data.user_id,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        telegram_id: data.telegram_id,
        role: data.role,
      };

      set({
        user: userObj,
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

  // === silent auto-relogin helper ===
  tryAutoRelogin: async () => {
    const { getCookie, setCookie } = await import('../utils/cookies');
    const { extractTelegramIdFromInitData, generateMockInitData, getSavedUsername, isDevMode } = await import('../utils/devHelpers');

    let initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      initData = sessionStorage.getItem('tg_init_data');
    }
    if (!initData) {
      initData = getCookie('initData');
    }
    if (!initData && isDevMode()) {
      const savedUsername = getSavedUsername();
      if (savedUsername) {
        initData = generateMockInitData(savedUsername);
      }
    }

    if (!initData) return false;

    sessionStorage.setItem('tg_init_data', initData);
    setCookie('initData', initData, 30);

    const telegramId = extractTelegramIdFromInitData(initData);

    try {
      const data = await api.post(
        '/auth/quick',
        { 
          init_data: initData,
          initData: initData,
          ...(telegramId ? { telegram_id: telegramId } : {}),
        },
        { skipErrorToast: true, skipUnauthorizedSignal: true }
      );

      if (data?.access_token) {
        localStorage.setItem('access_token', data.access_token);

        const userObj = {
          id: data.user_id,
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          telegram_id: data.telegram_id,
          role: data.role,
        };

        set({
          user: userObj,
          isAuthenticated: true,
          loading: false,
        });
        return true;
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Auto-relogin error:', err);
      }
    }
    return false;
  },

  // === profile check ===
  fetchProfile: async (options = {}) => {
    try {
      set({ loading: true });

      const user = await api.get('/auth/me', {
        skipErrorToast: options.silent,
        skipUnauthorizedSignal: options.silent,
      });

      set({
        user,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch {
      // Try silent auto-relogin before clearing session
      const relogged = await useAuthStore.getState().tryAutoRelogin();
      if (relogged) {
        return true;
      }

      localStorage.removeItem('access_token');
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      return false;
    }
  },

  // === init on app start ===
  initialize: async () => {
    const { setCookie } = await import('../utils/cookies');
    const tgInitData = window.Telegram?.WebApp?.initData;
    if (tgInitData) {
      sessionStorage.setItem('tg_init_data', tgInitData);
      setCookie('initData', tgInitData, 30);
    }

    const token = localStorage.getItem('access_token');

    // Если токен есть — пытаемся проверить профиль (в тихом режиме)
    if (token) {
      const ok = await useAuthStore.getState().fetchProfile({ silent: true });
      if (ok) return;
    }

    // Если нет валидного токена или запрос /auth/me вернул ошибку — пробуем silent auto relogin
    await useAuthStore.getState().tryAutoRelogin();
  },

  // === logout ===
  logout: () => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('tg_init_data');
    deleteCookie('initData');
    clearSavedUsername();

    set({
      user: null,
      isAuthenticated: false,
    });

    toast.success('Вы вышли');
  },
}));
