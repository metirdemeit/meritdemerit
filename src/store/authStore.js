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

    // Если токен уже есть — просто проверяем профиль
    if (token) {
      await useAuthStore.getState().fetchProfile();
      return;
    }

    // Нет токена → пробуем Telegram Quick Auto-Login
    // Получаем initData из реального Telegram WebApp или cookie
    const { getCookie } = await import('../utils/cookies');
    const { extractTelegramIdFromInitData, generateMockInitData, getSavedUsername, isDevMode } = await import('../utils/devHelpers');

    let initData = null;
    if (window.Telegram?.WebApp?.initData) {
      initData = window.Telegram.WebApp.initData;
    } else if (isDevMode()) {
      // В dev режиме — мок initData для тестирования
      const savedUsername = getSavedUsername();
      if (savedUsername) {
        initData = generateMockInitData(savedUsername);
      }
    }

    if (!initData) return; // Нет initData — обычный LoginPage

    const telegramId = extractTelegramIdFromInitData(initData);
    if (!telegramId) return;

    try {
      const data = await (await import('../services/api')).api.post(
        '/auth/quick',
        { init_data: initData },
        { skipErrorToast: true }  // не показывать ошибку если пользователь ещё не привязан
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
      }
    } catch {
      // 404 = пользователь ещё не привязан → показываем LoginPage, это нормально
    }
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
