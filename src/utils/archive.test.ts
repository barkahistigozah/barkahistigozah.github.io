import { describe, expect, test } from 'bun:test';
import { filterProjects, hashId, makeArchiveId, sortProjects, type ArchiveProject } from './archive';

const projects: ArchiveProject[] = [
  {
    id: 'portfolio-pribadi',
    archiveId: 'P-0002',
    title: 'Portfolio Pribadi',
    description: 'Website portfolio pribadi.',
    date: '2026-05-18T00:00:00.000Z',
    year: 2026,
    role: 'Frontend Developer',
    tags: ['Astro', 'Tailwind'],
  },
  {
    id: 'berkah-coding',
    archiveId: 'P-0001',
    title: 'Berkah Coding Learning Blog',
    description: 'Blog komunitas.',
    date: '2024-05-01T00:00:00.000Z',
    year: 2024,
    role: 'Web Developer',
    tags: ['JavaScript', 'Blogger'],
  },
];

describe('archive utilities', () => {
  test('builds stable display IDs', () => {
    expect(makeArchiveId(0)).toBe('P-0001');
    expect(makeArchiveId(11, 'N')).toBe('N-0012');
  });

  test('returns all rows for a blank query and matches every searchable field', () => {
    expect(filterProjects(projects, '   ')).toEqual(projects);
    expect(filterProjects(projects, 'TAILWIND').map((item) => item.id)).toEqual(['portfolio-pribadi']);
    expect(filterProjects(projects, '2024').map((item) => item.id)).toEqual(['berkah-coding']);
    expect(filterProjects(projects, 'P-0002').map((item) => item.id)).toEqual(['portfolio-pribadi']);
  });

  test('sorts copies without mutating the source', () => {
    const source = [...projects];
    expect(sortProjects(projects, 'title', 'asc').map((item) => item.id)).toEqual(['berkah-coding', 'portfolio-pribadi']);
    expect(sortProjects(projects, 'year', 'desc').map((item) => item.year)).toEqual([2026, 2024]);
    expect(projects).toEqual(source);
  });

  test('keeps the FNV-1a artifact seed deterministic', () => {
    expect(hashId('portfolio-pribadi')).toBe(2337898889);
  });
});
