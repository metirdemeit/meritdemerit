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
  fetchHistory: async ({ page = 1, size = 100 } = {}) => {
    try {
      const safePage = Number(page) > 0 ? Number(page) : 1;
      const safeSize = Math.min(Number(size) || 100, 100);
      const data = await api.get(`/teacher/me/history?page=${safePage}&size=${safeSize}`);
      const items = Array.isArray(data) ? data : (data?.items || []);
      set({ history: items });
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

  fetchStudentFullHistory: async (studentId) => {
    if (!studentId) return null;
    try {
      const firstPage = await api.get(
        `/teacher/students/${studentId}/history?page=1&size=100`,
        { skipErrorToast: true }
      );
      if (firstPage) {
        const items = Array.isArray(firstPage) ? [...firstPage] : [...(firstPage?.items || [])];
        const totalPages = Number(firstPage?.total_pages) || 1;
        if (totalPages > 1) {
          const pageRequests = [];
          for (let p = 2; p <= totalPages; p++) {
            pageRequests.push(
              api.get(`/teacher/students/${studentId}/history?page=${p}&size=100`, { skipErrorToast: true }).catch(() => null)
            );
          }
          const responses = await Promise.all(pageRequests);
          responses.forEach((res) => {
            if (res) {
              const more = Array.isArray(res) ? res : (res?.items || []);
              items.push(...more);
            }
          });
        }
        return items;
      }
    } catch {
      // Ignore
    }

    // Fallback 1: Try admin student history endpoint if accessible
    try {
      const adminData = await api.get(
        `/admin/students/${studentId}/history?page=1&size=100`,
        { skipErrorToast: true }
      );
      if (adminData) {
        const items = Array.isArray(adminData) ? [...adminData] : [...(adminData?.items || [])];
        const totalPages = Number(adminData?.total_pages) || 1;
        if (totalPages > 1) {
          const pageRequests = [];
          for (let p = 2; p <= totalPages; p++) {
            pageRequests.push(
              api.get(`/admin/students/${studentId}/history?page=${p}&size=100`, { skipErrorToast: true }).catch(() => null)
            );
          }
          const responses = await Promise.all(pageRequests);
          responses.forEach((res) => {
            if (res) {
              const more = Array.isArray(res) ? res : (res?.items || []);
              items.push(...more);
            }
          });
        }
        return items;
      }
    } catch {
      // Ignore fallback 1 error
    }

    // Fallback 2: Filter from teacher's loaded history
    const localHistory = get().history || [];
    return localHistory.filter((item) => {
      const entryId = item.student_id ?? item.user_id ?? item.studentId;
      return String(entryId) === String(studentId);
    });
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
