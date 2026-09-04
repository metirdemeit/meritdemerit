// src/store/authStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { setCookie, deleteCookie } from '../utils/cookies';
import { 
  isDevMode, 
  saveUsername, 
  clearSavedUsername,
  extractTelegramIdFromInitData,
} from '../utils/devHelpers';
import { getTelegramInitData } from '../utils/telegramCheck';
import toast from 'react-hot-toast';

/** Persist initData in all storages so headers interceptor always finds it */
function storeInitData(initData) {
  if (!initData) return;
  localStorage.setItem('tg_init_data', initData);
  sessionStorage.setItem('tg_init_data', initData);
  setCookie('initData', initData, 30);
}

/** Clear all session-related data */
function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('tg_init_data');
  sessionStorage.removeItem('tg_init_data');
  deleteCookie('initData');
  clearSavedUsername();
}

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  isAuthenticated: false,

  // =========================================================
  // login — первый вход по логину/паролю
  // =========================================================
  login: async (username, password) => {
    try {
      set({ loading: true });

      if (username && isDevMode()) {
        saveUsername(username);
      }

      const initData = getTelegramInitData();
      if (initData) {
        storeInitData(initData);
      }

      const telegramId = initData ? extractTelegramIdFromInitData(initData) : null;
      const payload = {
        username: username.trim(),
        password: password.trim(),
        ...(initData ? { initData, init_data: initData } : {}),
        ...(telegramId ? { telegram_id: telegramId } : {}),
      };

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

      set({ user: userObj, isAuthenticated: true, loading: false });
      toast.success('Вход выполнен');
      return true;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // =========================================================
  // tryAutoRelogin — тихий авто-вход через Telegram ID
  // НЕ вызывать если telegram_id был намеренно обнулён в БД.
  // В этом случае /auth/quick вернёт 404 → возвращаем false.
  // =========================================================
  tryAutoRelogin: async () => {
    const initData = getTelegramInitData();

    if (!initData) {
      set({ loading: false });
      return false;
    }

    storeInitData(initData);
    const telegramId = extractTelegramIdFromInitData(initData);

    if (!telegramId) {
      set({ loading: false });
      return false;
    }

    try {
      const data = await api.post(
        '/auth/quick',
        { 
          init_data: initData,
          initData: initData,
          telegram_id: telegramId,
        },
        { skipErrorToast: true, skipUnauthorizedSignal: true, skipRetry: true }
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

        set({ user: userObj, isAuthenticated: true, loading: false });
        return true;
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[tryAutoRelogin] failed:', err?.response?.status, err?.response?.data?.detail);
      }
    }

    set({ loading: false });
    return false;
  },

  // =========================================================
  // fetchProfile — проверка валидности текущей сессии
  // Если /auth/me возвращает 401 (telegram_id обнулён — сброс
  // через терминал) → clearSession → показываем LoginPage.
  // =========================================================
  fetchProfile: async (options = {}) => {
    try {
      set({ loading: true });

      const user = await api.get('/auth/me', {
        skipErrorToast: options.silent,
        skipUnauthorizedSignal: options.silent,
      });

      set({ user, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      const status = err?.response?.status;

      // 401 — telegram_id обнулён в БД (принудительный сброс):
      // НЕ пробуем auto-relogin, т.к. /auth/quick тоже не найдёт юзера.
      // Просто чистим сессию и показываем Login.
      if (status === 401) {
        clearSession();
        set({ user: null, isAuthenticated: false, loading: false });
        return false;
      }

      // Другие ошибки (500, сеть) — пробуем тихий авто-ревход
      const relogged = await useAuthStore.getState().tryAutoRelogin();
      if (relogged) return true;

      clearSession();
      set({ user: null, isAuthenticated: false, loading: false });
      return false;
    }
  },

  // =========================================================
  // initialize — вызывается при запуске приложения
  // =========================================================
  initialize: async () => {
    // Сразу сохраняем свежий initData если есть
    const initData = getTelegramInitData();
    if (initData) {
      storeInitData(initData);
    }

    const token = localStorage.getItem('access_token');

    if (token) {
      const ok = await useAuthStore.getState().fetchProfile({ silent: true });
      if (ok) return;
    }

    // Нет токена или сессия невалидна — пробуем auto-relogin
    await useAuthStore.getState().tryAutoRelogin();
    set({ loading: false });
  },

  // =========================================================
  // logout — нет кнопки в UI, но метод нужен для внутренних
  // нужд (например программный выход)
  // =========================================================
  logout: () => {
    clearSession();
    set({ user: null, isAuthenticated: false, loading: false });
  },
}));
