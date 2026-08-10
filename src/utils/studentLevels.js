/**
 * Логика градации уровней баллов учеников
 */

export const STUDENT_LEVELS = {
  MERIT_2: {
    key: 'merit_2',
    name: 'Merit Level 2',
    min: 162,
    max: Infinity,
    color: '#00D377',
    bg: 'rgba(0, 211, 119, 0.15)',
    border: 'rgba(0, 211, 119, 0.4)',
    type: 'merit',
  },
  MERIT_1: {
    key: 'merit_1',
    name: 'Merit Level 1',
    min: 131,
    max: 161,
    color: '#4CAF50',
    bg: 'rgba(76, 175, 80, 0.15)',
    border: 'rgba(76, 175, 80, 0.4)',
    type: 'merit',
  },
  STANDARD: {
    key: 'standard',
    name: 'Standard Level',
    min: 100,
    max: 130,
    color: '#FFC107',
    bg: 'rgba(255, 193, 7, 0.15)',
    border: 'rgba(255, 193, 7, 0.4)',
    type: 'standard',
  },
  DEMERIT_1: {
    key: 'demerit_1',
    name: 'Demerit Level 1',
    min: 76,
    max: 99,
    color: '#FF8A80',
    bg: 'rgba(255, 138, 128, 0.15)',
    border: 'rgba(255, 138, 128, 0.4)',
    type: 'demerit',
  },
  DEMERIT_2: {
    key: 'demerit_2',
    name: 'Demerit Level 2',
    min: 51,
    max: 75,
    color: '#FF5252',
    bg: 'rgba(255, 82, 82, 0.15)',
    border: 'rgba(255, 82, 82, 0.4)',
    type: 'demerit',
  },
  DEMERIT_3: {
    key: 'demerit_3',
    name: 'Demerit Level 3',
    min: 11,
    max: 50,
    color: '#E53935',
    bg: 'rgba(229, 57, 53, 0.2)',
    border: 'rgba(229, 57, 53, 0.5)',
    type: 'demerit',
  },
  DEMERIT_4: {
    key: 'demerit_4',
    name: 'Demerit Level 4 (Critical)',
    min: -Infinity,
    max: 10,
    color: '#D32F2F',
    bg: 'rgba(211, 47, 47, 0.3)',
    border: 'rgba(211, 47, 47, 0.8)',
    type: 'critical',
    isCritical: true,
  },
};

/**
 * Рассчитать уровень студента по количеству баллов
 * @param {number} points 
 * @returns {object} Конфигурация уровня
 */
export function getStudentLevel(points) {
  const pts = Number(points) || 0;
  if (pts >= 162) return STUDENT_LEVELS.MERIT_2;
  if (pts >= 131) return STUDENT_LEVELS.MERIT_1;
  if (pts >= 100) return STUDENT_LEVELS.STANDARD;
  if (pts >= 76) return STUDENT_LEVELS.DEMERIT_1;
  if (pts >= 51) return STUDENT_LEVELS.DEMERIT_2;
  if (pts >= 11) return STUDENT_LEVELS.DEMERIT_3;
  return STUDENT_LEVELS.DEMERIT_4;
}
