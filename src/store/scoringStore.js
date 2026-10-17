// src/store/scoringStore.js
import { create } from 'zustand';
import { api } from '../services/api';

const STORAGE_KEY = 'meritdemerit_scoring_settings';

// Default initial state
const defaultState = {
  isOpen: true,
  deadline: null, // ISO string or null
  closedReason: null, // 'manual' | 'timer_expired' | null
  updatedAt: null,
};

const getLocalFallback = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local scoring settings', e);
  }
  return defaultState;
};

const saveLocalFallback = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save local scoring settings', e);
  }
};

export const useScoringStore = create((set, get) => ({
  isOpen: true,
  deadline: null,
  closedReason: null,
  updatedAt: null,
  loading: false,
  error: null,

  // Fetch status: attempts API first, falls back gracefully to localStorage
  fetchStatus: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get('/school/scoring-status', { skipErrorToast: true });
      if (data && typeof data.isOpen !== 'undefined') {
        set({
          isOpen: Boolean(data.isOpen),
          deadline: data.deadline || null,
          closedReason: data.closedReason || null,
          updatedAt: data.updatedAt || new Date().toISOString(),
          loading: false,
        });
        saveLocalFallback(data);
        return data;
      }
    } catch {
      // Backend route might not exist yet; use fallback smoothly
    }

    const fallback = getLocalFallback();
    // Auto-expire check if deadline passed
    if (fallback.isOpen && fallback.deadline) {
      const isPast = new Date(fallback.deadline).getTime() <= Date.now();
      if (isPast) {
        fallback.isOpen = false;
        fallback.closedReason = 'timer_expired';
        saveLocalFallback(fallback);
      }
    }

    set({
      isOpen: fallback.isOpen,
      deadline: fallback.deadline,
      closedReason: fallback.closedReason,
      updatedAt: fallback.updatedAt,
      loading: false,
    });
    return fallback;
  },

  // Update status (Admin action)
  updateStatus: async ({ isOpen, deadline = null, closedReason = null }) => {
    set({ loading: true, error: null });
    const payload = {
      isOpen: Boolean(isOpen),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      closedReason: closedReason || (!isOpen ? 'manual' : null),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await api.post('/school/scoring-status', payload);
      if (res) {
        saveLocalFallback(res);
        set({
          isOpen: Boolean(res.isOpen),
          deadline: res.deadline || null,
          closedReason: res.closedReason || null,
          updatedAt: res.updatedAt || payload.updatedAt,
          loading: false,
        });
        return res;
      }
    } catch (err) {
      console.warn('Backend update failed, using local fallback:', err);
    }

    saveLocalFallback(payload);
    set({
      isOpen: payload.isOpen,
      deadline: payload.deadline,
      closedReason: payload.closedReason,
      updatedAt: payload.updatedAt,
      loading: false,
    });
    return payload;
  },

  // Close scoring immediately
  closeImmediately: async (reason = 'manual') => {
    return await get().updateStatus({
      isOpen: false,
      deadline: null,
      closedReason: reason,
    });
  },

  // Open indefinitely
  openIndefinitely: async () => {
    return await get().updateStatus({
      isOpen: true,
      deadline: null,
      closedReason: null,
    });
  },

  // Set timer / deadline
  setTimerDeadline: async (deadlineDate) => {
    return await get().updateStatus({
      isOpen: true,
      deadline: deadlineDate,
      closedReason: null,
    });
  },
}));
