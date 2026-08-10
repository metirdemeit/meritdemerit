import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDetentionStore = create(
  persist(
    (set, get) => ({
      detentions: [
        {
          id: 'det-1',
          student_id: 101,
          student_name: 'Алихан Смаилов',
          class_name: '10-A',
          current_points: 15,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'active', // 'pending' | 'active' | 'completed' | 'deferred' | 'cancelled'
          probation_end_date: null,
          probation_points_gained: 0,
          notes: 'Авто-триггер: Снижение баллов до 15 (<20).',
          created_at: new Date().toISOString(),
        },
      ],

      examWeeks: [
        {
          id: 'exam-1',
          title: 'Fall Trimester Exams',
          start_date: '2026-10-15',
          end_date: '2026-10-22',
        },
      ],

      // === ACTION METHODS ===
      addDetention: (record) => {
        const newRecord = {
          id: `det-${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'active',
          probation_end_date: null,
          probation_points_gained: 0,
          notes: '',
          ...record,
        };

        // Check if dates fall into Exam Week
        const overlap = get().checkExamOverlap(newRecord.start_date, newRecord.end_date);
        if (overlap) {
          newRecord.status = 'deferred';
          newRecord.notes += ` [Exam Week Bypass: Перенесено из-за экзаменов "${overlap.title}"]`;
        }

        set({ detentions: [newRecord, ...get().detentions] });
        return newRecord;
      },

      updateDetentionStatus: (id, updates) => {
        set({
          detentions: get().detentions.map((d) => {
            if (d.id !== id) return d;
            const updated = { ...d, ...updates };

            // Если отмечается отработанным (completed), включаем 2-Week Probation
            if (updates.status === 'completed' && d.status !== 'completed') {
              const compDate = new Date();
              const probationEnd = new Date(compDate.getTime() + 14 * 86400000);
              updated.probation_end_date = probationEnd.toISOString().split('T')[0];
            }
            return updated;
          }),
        });
      },

      deleteDetention: (id) => {
        set({ detentions: get().detentions.filter((d) => d.id !== id) });
      },

      // === EXAM WEEKS ===
      addExamWeek: (exam) => {
        const newExam = {
          id: `exam-${Date.now()}`,
          ...exam,
        };
        set({ examWeeks: [...get().examWeeks, newExam] });
      },

      deleteExamWeek: (id) => {
        set({ examWeeks: get().examWeeks.filter((e) => e.id !== id) });
      },

      checkExamOverlap: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return get().examWeeks.find((e) => {
          const eStart = new Date(e.start_date);
          const eEnd = new Date(e.end_date);
          return (start <= eEnd && end >= eStart);
        });
      },

      // Получить количество детеншнов студента
      getStudentDetentionCount: (studentId) => {
        return get().detentions.filter(
          (d) => String(d.student_id) === String(studentId) && d.status !== 'cancelled'
        ).length;
      },

      // Проверка флага 3-х детеншнов
      isReenrollmentRequired: (studentId) => {
        return get().getStudentDetentionCount(studentId) >= 3;
      },
    }),
    {
      name: 'meritdemerit_detentions',
    }
  )
);
