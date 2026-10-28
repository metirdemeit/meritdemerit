import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './authStore';
import { useScoringStore } from './scoringStore';

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

    // Attempt 1: GET /admin/history/student/{student_id} — returns array directly (PointHistoryResponse[])
    try {
      const adminHistoryArr = await api.get(
        `/admin/history/student/${studentId}`,
        { skipErrorToast: true }
      );
      if (adminHistoryArr && Array.isArray(adminHistoryArr) && adminHistoryArr.length > 0) {
        return adminHistoryArr;
      }
      // If backend returned an empty array it means no history — still return it
      if (adminHistoryArr && Array.isArray(adminHistoryArr)) {
        return adminHistoryArr;
      }
    } catch {
      // Not accessible (teacher role), fall through
    }

    // Attempt 2: GET /admin/students/{student_id}/history — paginated (admin only)
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
      // Not accessible (teacher role), fall through
    }

    // Fallback 3: Filter teacher's own loaded history by student_name match.
    // NOTE: TeacherHistoryResponse has no student_id field — match by student name only.
    const localHistory = get().history || [];
    return localHistory;
  },

  deleteHistoryRecord: async (historyId) => {
    if (!historyId) return null;
    return await api.del(`/teacher/me/history/${historyId}`);
  },

  // === WORKFLOW ===
  assignPoints: async (assignmentData) => {
    // Check if scoring is currently allowed by school timer / admin
    const scoringState = useScoringStore.getState();
    if (!scoringState.isOpen) {
      const msg = scoringState.closedReason === 'timer_expired'
        ? 'Приём баллов закрыт: время по таймеру истекло!'
        : 'Приём баллов временно закрыт администратором!';
      toast.error(msg);
      throw new Error(msg);
    }
    if (scoringState.deadline && new Date(scoringState.deadline).getTime() <= Date.now()) {
      const msg = 'Приём баллов закрыт: время по таймеру истекло!';
      toast.error(msg);
      throw new Error(msg);
    }

    return await api.post('/teacher/workflow/assign', assignmentData);
  },
}));
