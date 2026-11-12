import { describe, expect, it } from 'vitest';
import { isClassMatch, normalizeClassName } from '../classNames';
import { getStudentLevel } from '../studentLevels';
import { normalizeDetail } from '../apiErrors';
import { pointsSeries } from '../progress';

describe('class names', () => {
  it('keeps Cyrillic letters apart and treats look-alikes as equal', () => {
    expect(normalizeClassName('7А')).not.toBe(normalizeClassName('7Б'));
    expect(normalizeClassName('10-А')).toBe(normalizeClassName('10a'));
    expect(normalizeClassName('Class 10A')).toBe('10a');
  });
  it('matches a student to a class and never matches an empty class', () => {
    expect(isClassMatch({ class_name: '7A' }, '7a')).toBe(true);
    expect(isClassMatch({ school_class: { name: '7Б' } }, '7А')).toBe(false);
    expect(isClassMatch({ class_name: '' }, '')).toBe(false);
  });
});

describe('student levels', () => {
  it.each([
    [162, 'merit_2'], [131, 'merit_1'], [130, 'standard'], [100, 'standard'],
    [99, 'demerit_1'], [51, 'demerit_2'], [11, 'demerit_3'], [10, 'demerit_4'], [-5, 'demerit_4'],
  ])('%i points -> %s', (points, key) => {
    expect(getStudentLevel(points).key).toBe(key);
  });
});

describe('API error details', () => {
  it('turns FastAPI validation lists into one readable string', () => {
    const detail = [
      { type: 'missing', loc: ['body', 'description'], msg: 'Field required' },
      { loc: ['query', 'points'], msg: 'Input should be a valid integer' },
    ];
    expect(normalizeDetail(detail)).toBe('description: Field required; points: Input should be a valid integer');
  });
  it('leaves strings and empty values alone', () => {
    expect(normalizeDetail('Nope')).toBe('Nope');
    expect(normalizeDetail(undefined)).toBeUndefined();
    expect(normalizeDetail({ msg: 'x' })).toBe('x');
  });
});

describe('points series', () => {
  it('rebuilds the running total from history, oldest first', () => {
    const history = [
      { points_changed: -2, created_at: '2026-11-03T10:00:00Z' },
      { points_changed: 3, created_at: '2026-11-01T10:00:00Z' },
    ];
    expect(pointsSeries(101, history).map((p) => p.value)).toEqual([100, 103, 101]);
  });
  it('is a single point with no history', () => {
    expect(pointsSeries(100, [])).toEqual([{ value: 100, at: undefined }]);
  });
});
