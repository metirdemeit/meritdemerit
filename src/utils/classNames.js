// Cyrillic letters that look like Latin ones: "10А" (Cyrillic) and "10A" (Latin) are the same class.
const LOOKALIKES = { а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', х: 'x' };

/** "10-А", "10a", "Class 10A" -> "10a". Keeps Cyrillic so 7А and 7Б stay different. */
export const normalizeClassName = (value) =>
  `${value || ''}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .replace(/^(class|класс)/, '')
    .replace(/[авекмнорстх]/g, (ch) => LOOKALIKES[ch]);

export const studentClassName = (s) => s?.class_name || s?.school_class?.name || s?.class || '';

export const isClassMatch = (student, targetClass) => {
  const target = normalizeClassName(targetClass);
  return Boolean(target) && normalizeClassName(studentClassName(student)) === target;
};
