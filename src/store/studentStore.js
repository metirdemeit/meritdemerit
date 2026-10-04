import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './authStore';

export const useStudentStore = create((set, get) => ({
  // === STATE ===
  profile: null,
  history: [],

  // === HELPERS ===
  _resolveStudentId: (studentId) => {
    return studentId || useAuthStore.getState()?.user?.id;
  },

  // === PROFILE ===
  fetchProfile: async (studentId, force = false) => {
    if (get().profile && !force) return get().profile;

    try {
      const endpoint = studentId ? `/students/${studentId}` : '/students/me';
      const data = await api.get(endpoint);
      set({ profile: data || null });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('student.fetchProfile failed', err);
      set({ profile: null });
      return null;
    }
  },

  // === HISTORY ===
  fetchHistory: async ({ page = 1, size = 100 } = {}) => {
    try {
      const data = await api.get(`/students/me/history?page=${page}&size=${size}`);
      const items = Array.isArray(data) ? data : (data?.items || []);
      set({ history: items });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('student.fetchHistory failed', err);
      return null;
    }
  },

  fetchHistoryById: async (assignmentId) => {
    if (!assignmentId) return null;
    try {
      const data = await api.get(`/students/me/history/${assignmentId}`);
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('student.fetchHistoryById failed', err);
      return null;
    }
  },
}));
