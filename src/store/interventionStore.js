// src/store/interventionStore.js
// Asynchronous API-driven store for Interventions (replaces localStorage).
import { create } from 'zustand';
import { api } from '../services/api';

export const useInterventionStore = create((set, get) => ({
  interventions: [],
  loading: false,
  error: null,

  fetchInterventions: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get('/admin/interventions');
      set({ interventions: data || [], loading: false });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchInterventions failed', err);
      set({ loading: false, error: 'Failed to load interventions' });
      return [];
    }
  },

  addIntervention: async (item) => {
    try {
      const created = await api.post('/admin/interventions', {
        student_id: item.student_id,
        level: item.level,
        status: item.status || 'pending',
        parent_notified: !!item.parent_notified,
        notes: item.notes || item.description || null,
      });
      set({ interventions: [created, ...get().interventions] });
      return created;
    } catch (err) {
      if (import.meta.env.DEV) console.error('addIntervention failed', err);
      return null;
    }
  },

  toggleParentNotified: async (id) => {
    const current = get().interventions.find((i) => i.id === id);
    if (!current) return;
    const newValue = !current.parent_notified;

    // Optimistic update
    set({
      interventions: get().interventions.map((i) =>
        i.id === id ? { ...i, parent_notified: newValue } : i
      ),
    });

    try {
      await api.patch(`/admin/interventions/${id}`, { parent_notified: newValue });
    } catch (err) {
      if (import.meta.env.DEV) console.error('toggleParentNotified failed', err);
      // Revert on error
      set({
        interventions: get().interventions.map((i) =>
          i.id === id ? { ...i, parent_notified: !newValue } : i
        ),
      });
    }
  },

  resolveIntervention: async (id) => {
    // Optimistic update
    set({
      interventions: get().interventions.map((i) =>
        i.id === id ? { ...i, status: 'resolved' } : i
      ),
    });

    try {
      await api.patch(`/admin/interventions/${id}`, { status: 'resolved' });
    } catch (err) {
      if (import.meta.env.DEV) console.error('resolveIntervention failed', err);
      await get().fetchInterventions();
    }
  },

  deleteIntervention: async (id) => {
    set({
      interventions: get().interventions.filter((i) => i.id !== id),
    });

    try {
      await api.delete(`/admin/interventions/${id}`);
    } catch (err) {
      if (import.meta.env.DEV) console.error('deleteIntervention failed', err);
      await get().fetchInterventions();
    }
  },
}));
