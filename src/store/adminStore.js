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
    const data = await api.get(`/teachers/search?q=${encodeURIComponent(query)}`);
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
    const url = filterId ? `/admin/history/${filterId}` : '/admin/history';
    try {
      const data = await api.get(url);
      set({ history: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchHistory failed', err);
      return null;
    }
  },

  deleteHistoryRecord: async (id) => {
    if (!id) return;
    await api.del(`/admin/history/${id}`);
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
      const data = await api.get('/admin/ranking');
      set({ rankings: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchAdminRanking failed', err);
      return null;
    }
  },

  // === WORKFLOW ===
  assignPoints: async (payload) => {
    await api.post('/admin/workflow/assign', payload);
  },
}));
