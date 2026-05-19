import { useMemo, useState } from 'react';

type Project = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  role: string;
  tags: string[];
};

type Props = {
  projects: Project[];
  baseUrl: string;
};

const withBase = (baseUrl: string, path: string) => {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(normalizedPath, `https://example.com${normalizedBase}`).pathname;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(value));

export default function ProjectFilter({ projects, baseUrl }: Props) {
  const tags = useMemo(() => ['All', ...Array.from(new Set(projects.flatMap((project) => project.tags))).sort()], [projects]);
  const [activeTag, setActiveTag] = useState('All');
  const visibleProjects = activeTag === 'All' ? projects : projects.filter((project) => project.tags.includes(activeTag));

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" aria-label="Filter projects by tag">
        {tags.map((tag) => {
          const isActive = tag === activeTag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={[
                'motion-chip rounded-full border px-4 py-2 text-sm font-bold transition',
                isActive
                  ? 'border-[color:var(--ink)] bg-[color:var(--ink)] text-panel'
                  : 'border-[color:var(--line)] bg-[color:var(--panel)] text-[color:var(--muted)] hover:border-[color:var(--ink)] hover:text-[color:var(--ink)]',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {visibleProjects.map((project) => (
          <article key={project.id} className="motion-card reveal overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-[color:var(--panel)]">
            <a href={withBase(baseUrl, `/portfolio/${project.id}/`)} className="block overflow-hidden">
              <img
                src={withBase(baseUrl, project.thumbnail)}
                alt={`Thumbnail ${project.title}`}
                className="aspect-[16/10] w-full object-cover transition duration-500 hover:scale-[1.035]"
                loading="lazy"
                width="1280"
                height="800"
              />
            </a>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[color:var(--muted)]">
                <time dateTime={project.date}>{formatDate(project.date)}</time>
                <span aria-hidden="true">/</span>
                <span>{project.role}</span>
              </div>
              <h2 className="mt-3 text-2xl font-black leading-tight">
                <a className="motion-link hover:text-[color:var(--accent-strong)]" href={withBase(baseUrl, `/portfolio/${project.id}/`)}>
                  {project.title}
                </a>
              </h2>
              <p className="mt-3 text-base leading-7 text-[color:var(--muted)]">{project.description}</p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${project.title} tags`}>
                {project.tags.slice(0, 5).map((tag) => (
                  <li key={tag} className="motion-chip rounded-full border border-[color:var(--line)] px-3 py-1 text-sm font-semibold text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
