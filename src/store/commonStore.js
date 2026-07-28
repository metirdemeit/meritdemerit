import { create } from 'zustand';
import { api } from '../services/api';

export const useCommonStore = create((set, get) => ({
  // === STATE ===
  classes: [],
  students: [],
  rules: [],
  rankings: [],
  selectedClass: null,
  selectedStudent: null,
  selectedRule: null,

  // === CLASSES ===
  fetchClasses: async (force = false) => {
    if (get().classes.length && !force) return get().classes;

    try {
      const data = await api.get('/classes');
      set({ classes: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchClasses failed', err);
      return null;
    }
  },

  fetchClassById: async (classId) => {
    if (!classId) return null;
    try {
      const data = await api.get(`/classes/${classId}`);
      set({ selectedClass: data || null });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchClassById failed', err);
      return null;
    }
  },

  // === STUDENTS ===
  fetchStudents: async (force = false) => {
    if (get().students.length && !force) return get().students;

    try {
      const data = await api.get('/students');
      set({ students: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchStudents failed', err);
      return null;
    }
  },

  fetchStudentById: async (studentId) => {
    if (!studentId) return null;
    try {
      const data = await api.get(`/students/${studentId}`);
      set({ selectedStudent: data || null });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchStudentById failed', err);
      return null;
    }
  },

  fetchStudentsByClass: async (classId) => {
    if (!classId) return null;
    try {
      const data = await api.get(`/classes/${classId}/students`);
      set({ students: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchStudentsByClass failed', err);
      return null;
    }
  },

  searchStudents: async (query) => {
    if (!query?.trim()) return [];
    try {
      const data = await api.get(`/students/search?q=${encodeURIComponent(query)}`);
      set({ students: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('searchStudents failed', err);
      return null;
    }
  },

  // === RULES ===
  fetchRules: async (force = false) => {
    if (get().rules.length && !force) return get().rules;

    try {
      const data = await api.get('/rules');
      set({ rules: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchRules failed', err);
      return null;
    }
  },

  fetchRuleById: async (ruleId) => {
    if (!ruleId) return null;
    try {
      const data = await api.get(`/rules/${ruleId}`);
      set({ selectedRule: data || null });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchRuleById failed', err);
      return null;
    }
  },

  // === RANKINGS ===
  fetchRankings: async () => {
    try {
      const data = await api.get('/ranking');
      set({ rankings: data || [] });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchRankings failed', err);
      return null;
    }
  },
}));
