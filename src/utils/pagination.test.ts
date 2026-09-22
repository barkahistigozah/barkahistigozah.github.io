import { describe, expect, test } from 'bun:test';
import { getPageCount, paginate } from './pagination';

describe('pagination utilities', () => {
  test('returns a bounded page and total page count', () => {
    const items = Array.from({ length: 21 }, (_, index) => index + 1);

    expect(getPageCount(items.length, 10)).toBe(3);
    expect(paginate(items, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(paginate(items, 3, 10)).toEqual([21]);
    expect(paginate(items, 4, 10)).toEqual([]);
  });
});
