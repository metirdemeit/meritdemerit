import { create } from 'zustand';
import { api } from '../services/api';

const sortStudentsByName = (list = []) => {
  return [...list].sort((a, b) => {
    const getName = (item) => `${item?.first_name || ''} ${item?.last_name || item?.username || ''}`.trim().toLowerCase();
    return getName(a).localeCompare(getName(b));
  });
};

/**
 * Фиксированная сортировка классов строго с 6 по 12 параллель (6A, 6B, ..., 12B).
 * Порядок зафиксирован и никогда не меняется в зависимости от рейтинга или баллов.
 */
export const sortClassesFixed = (list = []) => {
  return [...list].sort((a, b) => {
    const nameA = String(a?.name || a?.class_name || a || '').trim();
    const nameB = String(b?.name || b?.class_name || b || '').trim();

    const matchA = nameA.match(/\d+/);
    const matchB = nameB.match(/\d+/);

    const gradeA = matchA ? parseInt(matchA[0], 10) : 0;
    const gradeB = matchB ? parseInt(matchB[0], 10) : 0;

    if (gradeA !== gradeB) {
      return gradeA - gradeB;
    }

    const letterA = nameA.replace(/\d+/g, '').trim().toUpperCase();
    const letterB = nameB.replace(/\d+/g, '').trim().toUpperCase();

    return letterA.localeCompare(letterB);
  });
};

export const useCommonStore = create((set, get) => ({
  // === STATE ===
  classes: [],
  students: [],
  allStudents: [],
  rules: [],
  rankings: [],
  classRankings: [],
  selectedClass: null,
  selectedStudent: null,
  selectedRule: null,

  // === CLASSES ===
  fetchClasses: async (force = false) => {
    if (get().classes.length && !force) return get().classes;

    try {
      const data = await api.get('/classes');
      const sorted = sortClassesFixed(data || []);
      set({ classes: sorted });
      return sorted;
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
  fetchAllStudents: async (force = false) => {
    if (get().allStudents?.length > 50 && !force) return get().allStudents;

    try {
      const data = await api.get('/students');
      if (Array.isArray(data) && data.length > 0) {
        set({ allStudents: data });
        if (!get().students?.length) {
          set({ students: sortStudentsByName(data) });
        }
        return data;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchAllStudents failed', err);
    }
    return get().allStudents || [];
  },

  fetchStudents: async (force = false) => {
    if (get().students.length && !force) return get().students;

    try {
      const data = await api.get('/students');
      const sorted = sortStudentsByName(data || []);
      set({ students: sorted, allStudents: data || [] });
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
      set({ students: sortStudentsByName(data || []) });
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
      set({ students: sortStudentsByName(data || []) });
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

  fetchClassRankings: async () => {
    try {
      const data = await api.get('/class_average_ranking');
      if (Array.isArray(data) && data.length > 0) {
        const sorted = [...data].sort(
          (a, b) => (Number(b.average_points) || 0) - (Number(a.average_points) || 0)
        );
        set({ classRankings: sorted });
        return sorted;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('fetchClassRankings API failed, using fallback', err);
    }

    // Fallback: Calculate class averages directly from full students roster
    let studentsList = get().students;
    if (!studentsList?.length) {
      studentsList = (await get().fetchStudents()) || [];
    }

    if (Array.isArray(studentsList) && studentsList.length > 0) {
      const stats = {};
      studentsList.forEach((s) => {
        const clsName =
          s?.school_class?.name ||
          s?.class_name ||
          (typeof s?.school_class === 'string' ? s.school_class : null);
        if (!clsName) return;
        const pts = Number(s?.points ?? s?.total_points ?? 100);
        if (!stats[clsName]) {
          stats[clsName] = { class_name: clsName, total: 0, count: 0 };
        }
        stats[clsName].total += pts;
        stats[clsName].count += 1;
      });

      const computed = Object.values(stats)
        .map((c) => ({
          class_name: c.class_name,
          average_points: c.count > 0 ? Number((c.total / c.count).toFixed(1)) : 0,
          student_count: c.count,
        }))
        .sort((a, b) => b.average_points - a.average_points);

      set({ classRankings: computed });
      return computed;
    }

    return [];
  },
}));
