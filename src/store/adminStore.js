import { create } from 'zustand';
import { api } from '../services/api';

export const useAdminStore = create((set, get) => ({
  // Справочники (кэшируем)
  teachers: [],
  students: [],
  rules: [],

  // Данные, которые не кэшируем
  dashboard: null,
  history: [],
  totalHistoryCount: 0,
  loadingHistoryFull: false,
  rankings: [],
  teacherStats: [],

  // === TEACHERS ===
  fetchTeachers: async (force = false) => {
    if (get().teachers.length && !force) return get().teachers;

    try {
      const data = await api.get('/admin/teachers');
      set({ teachers: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchTeachers failed', err);
      return null;
    }
  },

  createTeacher: async (payload) => {
    await api.post('/admin/teachers', payload);
    set({ teachers: [] }); // invalidate cache
  },

  updateTeacher: async (id, payload) => {
    if (!id) return;
    await api.put(`/admin/teachers/${id}`, payload);
    set({ teachers: [] }); // invalidate cache
  },

  deleteTeacher: async (id) => {
    if (!id) return;
    await api.del(`/admin/teachers/${id}`);
    set({ teachers: [] }); // invalidate cache
  },

  searchTeachers: async (query) => {
    if (!query?.trim()) return [];
    const data = await api.get(`/admin/search?q=${encodeURIComponent(query)}`);
    set({ teachers: data || [] });
    return data;
  },

  // === STUDENTS ===
  fetchStudents: async (force = false) => {
    if (get().students.length && !force) return get().students;

    try {
      const data = await api.get('/admin/students');
      set({ students: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchStudents (admin) failed', err);
      return null;
    }
  },

  createStudent: async (payload) => {
    await api.post('/admin/students', payload);
    set({ students: [] });
  },

  updateStudent: async (id, payload) => {
    if (!id) return;
    await api.put(`/admin/students/${id}`, payload);
    set({ students: [] });
  },

  deleteStudent: async (id) => {
    if (!id) return;
    await api.del(`/admin/students/${id}`);
    set({ students: [] });
  },

  // === RULES ===
  fetchRules: async (force = false) => {
    if (get().rules.length && !force) return get().rules;

    try {
      const data = await api.get('/admin/rules');
      set({ rules: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchRules (admin) failed', err);
      return null;
    }
  },

  createRule: async (payload) => {
    await api.post('/admin/rules', payload);
    set({ rules: [] });
  },

  updateRule: async (id, payload) => {
    if (!id) return;
    await api.put(`/admin/rules/${id}`, payload);
    set({ rules: [] });
  },

  deleteRule: async (id) => {
    if (!id) return;
    await api.del(`/admin/rules/${id}`);
    set({ rules: [] });
  },

  // === HISTORY ===
  fetchHistory: async (filterId) => {
    if (filterId) {
      try {
        const data = await api.get(`/admin/history/${filterId}`);
        const items = Array.isArray(data) ? data : (data?.items || []);
        set({ history: items, totalHistoryCount: items.length });
        return data;
      } catch (err) {
        if (import.meta.env.DEV) console.error('fetchHistory by id failed', err);
        return null;
      }
    }

    try {
      // 1. Первая страница с максимальным разрешённым бэкендом размером size=100
      const firstPageData = await api.get('/admin/history?page=1&size=100');
      if (!firstPageData) return null;

      const firstItems = Array.isArray(firstPageData) ? firstPageData : (firstPageData?.items || []);
      const totalPages = Number(firstPageData?.total_pages) || 1;
      const totalCount = Number(firstPageData?.total_count) || firstItems.length;

      // Мгновенно обновляем стейт первой порцией
      set({ history: firstItems, totalHistoryCount: totalCount });

      if (totalPages <= 1) {
        return firstPageData;
      }

      // 2. Если страниц несколько, подгружаем всю историю школы пачками по 5 страниц
      set({ loadingHistoryFull: true });
      const remainingPages = [];
      for (let p = 2; p <= totalPages; p++) {
        remainingPages.push(p);
      }

      const allRemainingItems = [];
      const batchSize = 5;
      for (let i = 0; i < remainingPages.length; i += batchSize) {
        const batch = remainingPages.slice(i, i + batchSize);
        const responses = await Promise.all(
          batch.map((p) =>
            api.get(`/admin/history?page=${p}&size=100`, { skipErrorToast: true }).catch(() => null)
          )
        );
        responses.forEach((res) => {
          if (res) {
            const items = Array.isArray(res) ? res : (res?.items || []);
            allRemainingItems.push(...items);
          }
        });
      }

      const completeHistory = [...firstItems, ...allRemainingItems];
      set({
        history: completeHistory,
        totalHistoryCount: completeHistory.length,
        loadingHistoryFull: false,
      });

      return {
        ...firstPageData,
        items: completeHistory,
        total_count: completeHistory.length,
      };
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchHistory failed', err);
      try {
        const fallback = await api.get('/admin/history');
        const items = Array.isArray(fallback) ? fallback : (fallback?.items || []);
        set({ history: items, totalHistoryCount: items.length, loadingHistoryFull: false });
        return fallback;
      } catch {
        set({ loadingHistoryFull: false });
        return null;
      }
    }
  },

  deleteHistoryRecord: async (id) => {
    if (!id) return;
    await api.del(`/admin/history/${id}`);
  },

  downloadHistoryHtml: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('start_date', filters.startDate);
    if (filters.endDate) params.set('end_date', filters.endDate);
    if (filters.student?.trim()) params.set('student', filters.student.trim());
    if (filters.schoolClass?.trim()) params.set('school_class', filters.schoolClass.trim());
    if (filters.teacher?.trim()) params.set('teacher', filters.teacher.trim());
    if (filters.rule?.trim()) params.set('rule', filters.rule.trim());
    if (filters.type && filters.type !== 'all') params.set('point_type', filters.type);

    const query = params.toString();
    return await api.get(
      `/admin/history/export/html${query ? `?${query}` : ''}`,
      { responseType: 'blob' }
    );
  },

  downloadHistoryCsv: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('start_date', filters.startDate);
    if (filters.endDate) params.set('end_date', filters.endDate);
    if (filters.student?.trim()) params.set('student', filters.student.trim());
    if (filters.schoolClass?.trim()) params.set('school_class', filters.schoolClass.trim());
    if (filters.teacher?.trim()) params.set('teacher', filters.teacher.trim());
    if (filters.rule?.trim()) params.set('rule', filters.rule.trim());
    if (filters.type && filters.type !== 'all') params.set('point_type', filters.type);

    const query = params.toString();
    try {
      return await api.get(
        `/admin/history/export/csv${query ? `?${query}` : ''}`,
        { responseType: 'blob', skipErrorToast: true }
      );
    } catch (err) {
      if (import.meta.env.DEV) console.error('downloadHistoryCsv failed', err);
      return null;
    }
  },

  // === DASHBOARD ===
  fetchDashboard: async () => {
    try {
      const data = await api.get('/admin/dashboard');
      set({ dashboard: data });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchDashboard failed', err);
      return null;
    }
  },

  // === STATS ===
  fetchTeacherStats: async () => {
    try {
      const data = await api.get('/admin/stats/teachers');
      set({ teacherStats: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchTeacherStats failed', err);
      return null;
    }
  },

  fetchAdminRanking: async () => {
    try {
      const data = await api.get('/ranking');
      set({ rankings: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchAdminRanking failed', err);
      return null;
    }
  },

  // === WORKFLOW ===
  assignPoints: async (payload) => {
    return await api.post('/admin/workflow/assign', payload);
  },
}));
