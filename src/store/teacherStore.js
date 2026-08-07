import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './authStore';

export const useTeacherStore = create((set, get) => ({
  // === STATE ===
  profile: null,
  history: [],

  // === HELPERS ===
  _resolveTeacherId: (teacherId) => {
    return teacherId || useAuthStore.getState()?.user?.id;
  },

  // === PROFILE ===
  fetchProfile: async (force = false) => {
    if (get().profile && !force) return get().profile;

    try {
      const data = await api.get('/teacher/me');
      set({ profile: data || null });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('teacher.fetchProfile failed', err);
      return null;
    }
  },

  // === HISTORY ===
  fetchHistory: async ({ page = 1, size = 5 } = {}) => {
    try {
      const data = await api.get(`/teacher/me/history?page=${page}&size=${size}`);
      set({ history: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('teacher.fetchHistory failed', err);
      return null;
    }
  },

  fetchHistoryById: async (assignmentId) => {
    if (!assignmentId) return null;
    try {
      const data = await api.get(`/teacher/me/history/${assignmentId}`);
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('teacher.fetchHistoryById failed', err);
      return null;
    }
  },

  deleteHistoryRecord: async (historyId) => {
    if (!historyId) return null;
    return await api.del(`/teacher/me/history/${historyId}`);
  },

  // === WORKFLOW ===
  assignPoints: async (assignmentData) => {
    return await api.post('/teacher/workflow/assign', assignmentData);
  },
}));
