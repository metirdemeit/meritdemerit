// src/store/detentionStore.js
// Replaces the previous localStorage/persist-based store with real API calls.
import { create } from 'zustand';
import { api } from '../services/api';

export const useDetentionStore = create((set, get) => ({
  detentions: [],
  examWeeks: [],
  loading: false,
  error: null,

  // =================== DETENTIONS ===================

  fetchDetentions: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get('/admin/detentions');
      set({ detentions: data || [], loading: false });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchDetentions failed', err);
      set({ loading: false, error: 'Failed to load detentions' });
      return null;
    }
  },

  fetchStudentDetentions: async (studentId) => {
    try {
      const data = await api.get(`/admin/detentions/student/${studentId}`);
      return data || [];
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchStudentDetentions failed', err);
      return [];
    }
  },

  // Returns the created detention record from backend
  addDetention: async (payload) => {
    // payload: { student_id, start_date (YYYY-MM-DD), end_date, notes? }
    const created = await api.post('/admin/detentions', payload);
    set({ detentions: [created, ...get().detentions] });
    return created;
  },

  updateDetentionStatus: async (id, updates) => {
    // updates: { status?, notes?, probation_end_date? }
    const updated = await api.patch(`/admin/detentions/${id}`, updates);
    set({
      detentions: get().detentions.map((d) => (d.id === id ? updated : d)),
    });
    return updated;
  },

  deleteDetention: async (id) => {
    await api.del(`/admin/detentions/${id}`);
    set({ detentions: get().detentions.filter((d) => d.id !== id) });
  },

  // =================== EXAM WEEKS ===================

  fetchExamWeeks: async () => {
    try {
      const data = await api.get('/admin/exam-weeks');
      set({ examWeeks: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchExamWeeks failed', err);
      return null;
    }
  },

  addExamWeek: async (payload) => {
    // payload: { title, start_date, end_date }
    const created = await api.post('/admin/exam-weeks', payload);
    set({ examWeeks: [...get().examWeeks, created] });
    return created;
  },

  deleteExamWeek: async (id) => {
    await api.del(`/admin/exam-weeks/${id}`);
    set({ examWeeks: get().examWeeks.filter((e) => e.id !== id) });
  },

  // =================== HELPERS (client-side) ===================

  // Count non-cancelled detentions for a student (uses local state)
  getStudentDetentionCount: (studentId) => {
    return get().detentions.filter(
      (d) => String(d.student_id) === String(studentId) && d.status !== 'cancelled'
    ).length;
  },

  // True if student has >= 3 non-cancelled detentions
  isReenrollmentRequired: (studentId) => {
    return get().getStudentDetentionCount(studentId) >= 3;
  },
}));
