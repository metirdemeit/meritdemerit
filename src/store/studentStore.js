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
  fetchHistory: async ({ _page, _size } = {}) => {
    try {
      // Load first page at max backend size
      const firstData = await api.get('/students/me/history?page=1&size=100');
      if (!firstData) return null;

      const firstItems = Array.isArray(firstData) ? firstData : (firstData?.items || []);
      const totalPages = Number(firstData?.total_pages) || 1;

      // Immediately show first batch
      set({ history: firstItems });

      if (totalPages <= 1) return firstData;

      // Load remaining pages in parallel
      const pageRequests = [];
      for (let p = 2; p <= totalPages; p++) {
        pageRequests.push(
          api.get(`/students/me/history?page=${p}&size=100`, { skipErrorToast: true }).catch(() => null)
        );
      }
      const responses = await Promise.all(pageRequests);
      const allItems = [...firstItems];
      responses.forEach((res) => {
        if (res) {
          const more = Array.isArray(res) ? res : (res?.items || []);
          allItems.push(...more);
        }
      });

      set({ history: allItems });
      return { ...firstData, items: allItems, total_count: allItems.length };
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
