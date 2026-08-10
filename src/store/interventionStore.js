import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useInterventionStore = create(
  persist(
    (set, get) => ({
      interventions: [],

      addIntervention: (item) => {
        const newItem = {
          id: `int-${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'pending',
          parent_notified: false,
          ...item,
        };
        set({ interventions: [newItem, ...get().interventions] });
      },

      toggleParentNotified: (id) => {
        set({
          interventions: get().interventions.map((item) =>
            item.id === id ? { ...item, parent_notified: !item.parent_notified } : item
          ),
        });
      },

      resolveIntervention: (id) => {
        set({
          interventions: get().interventions.map((item) =>
            item.id === id ? { ...item, status: 'resolved' } : item
          ),
        });
      },

      deleteIntervention: (id) => {
        set({
          interventions: get().interventions.filter((item) => item.id !== id),
        });
      },
    }),
    {
      name: 'meritdemerit_interventions',
    }
  )
);
