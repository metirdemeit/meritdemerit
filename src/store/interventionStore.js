import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useInterventionStore = create(
  persist(
    (set, get) => ({
      interventions: [
        {
          id: 'int-1',
          student_id: 102,
          student_name: 'Данияр Ахметов',
          class_name: '10-B',
          points: 45,
          level: 'warning', // 'warning' (41-50) | 'homeroom' (31-40) | 'counselor' (21-30)
          title: 'Formal Written Warning Required',
          description: 'Баллы ученика опустились до 45. Требуется письменное предупреждение и объяснительная.',
          parent_notified: false,
          created_at: new Date().toISOString(),
          status: 'pending', // 'pending' | 'resolved'
        },
        {
          id: 'int-2',
          student_id: 103,
          student_name: 'Ернар Сериков',
          class_name: '11-A',
          points: 35,
          level: 'homeroom',
          title: 'Homeroom Teacher Action Required',
          description: 'Баллы ученика опустились до 35. Требуется анализ причин классрука и лог связи с родителями.',
          parent_notified: true,
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: 'int-3',
          student_id: 104,
          student_name: 'Аружан Касымова',
          class_name: '9-C',
          points: 25,
          level: 'counselor',
          title: 'Psychologist Intervention Required',
          description: 'Баллы опустились до 25. Назначена обязательная встреча с психологом и родителями.',
          parent_notified: false,
          created_at: new Date().toISOString(),
          status: 'pending',
        },
      ],

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
