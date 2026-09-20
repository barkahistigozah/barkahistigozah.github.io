export type ArchiveProject = {
  id: string;
  archiveId: string;
  title: string;
  description: string;
  thumbnail?: string;
  date: string;
  year: number;
  role: string;
  tags: string[];
};

export type SortKey = 'id' | 'title' | 'year' | 'role';
export type SortDirection = 'asc' | 'desc';

export const makeArchiveId = (index: number, prefix = 'P') =>
  `${prefix}-${String(index + 1).padStart(4, '0')}`;

const searchableText = (project: ArchiveProject) =>
  [project.archiveId, project.title, project.year, project.role, ...project.tags]
    .join(' ')
    .toLocaleLowerCase('id-ID');

export const filterProjects = (projects: ArchiveProject[], query: string) => {
  const normalized = query.trim().toLocaleLowerCase('id-ID');
  return normalized ? projects.filter((project) => searchableText(project).includes(normalized)) : projects;
};

export const sortProjects = (projects: ArchiveProject[], key: SortKey, direction: SortDirection) => {
  const multiplier = direction === 'asc' ? 1 : -1;
  return [...projects].sort((left, right) => {
    const a = key === 'id' ? left.archiveId : left[key];
    const b = key === 'id' ? right.archiveId : right[key];
    return (typeof a === 'number'
      ? a - Number(b)
      : String(a).localeCompare(String(b), 'id-ID', { numeric: true, sensitivity: 'base' })) * multiplier;
  });
};

export const hashId = (value: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};
