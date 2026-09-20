import { useEffect, useMemo, useRef, useState } from 'react';
import { filterProjects, sortProjects, type ArchiveProject, type SortDirection, type SortKey } from '../utils/archive';
import type { ArtifactController } from './projectArtifact';

type Props = {
  projects: ArchiveProject[];
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

export default function ProjectFilter({ projects, baseUrl }: Props) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ArtifactController | null>(null);
  const controllerPromiseRef = useRef<Promise<ArtifactController> | null>(null);
  const disposedRef = useRef(false);
  const visibleProjects = useMemo(() => sortProjects(filterProjects(projects, query), sortKey, direction), [projects, query, sortKey, direction]);
  const activeProject = projects.find((project) => project.id === activeId) ?? null;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => () => {
    disposedRef.current = true;
    controllerRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (!activeId || !canvasRef.current || previewError) return;
    const draw = async () => {
      try {
        if (!controllerRef.current) {
          controllerPromiseRef.current ??= import('./projectArtifact')
            .then(({ createProjectArtifact }) => createProjectArtifact(canvasRef.current!))
            .then((controller) => {
              if (disposedRef.current) controller.dispose();
              else controllerRef.current = controller;
              return controller;
            });
          await controllerPromiseRef.current;
        }
        if (disposedRef.current) return;
        controllerRef.current.draw(activeId, !reducedMotion);
        if (innerWidth >= 860 && dialogRef.current && !dialogRef.current.open) dialogRef.current.show();
      } catch {
        setPreviewError(true);
      }
    };
    void draw();
  }, [activeId, previewError, reducedMotion]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setDirection((value) => value === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setDirection('asc');
    }
  };

  const preview = (id: string) => {
    setActiveId(id);
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialog.open) dialog.close();
    dialog.showModal();
  };

  const sortButton = (key: SortKey, label: string) => (
    <button className="min-h-11 w-full text-left text-[10px] font-bold uppercase tracking-[.12em]" type="button" onClick={() => toggleSort(key)}>
      {label} {sortKey === key ? direction === 'asc' ? '↑' : '↓' : '·'}
    </button>
  );

  return (
    <div className="archive-grid border-b border-black">
      <div className="min-w-0">
        <div className="grid border-y border-black sm:grid-cols-[1fr_auto]">
          <label className="grid min-h-12 grid-cols-[72px_1fr] items-center px-3 text-xs font-bold uppercase">
            Filter
            <input className="min-h-11 border-l border-black px-3 font-normal normal-case outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, role, year, id..." type="search" />
          </label>
          <p className="border-t border-black px-3 py-4 text-xs uppercase sm:border-l sm:border-t-0" aria-live="polite">Showing {visibleProjects.length} / {projects.length}</p>
        </div>

        <div role="table" aria-label="Project archive">
          <div className="archive-row border-b border-black bg-black text-white" role="row">
            <div role="columnheader" aria-sort={sortKey === 'id' ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('id', 'ID')}</div>
            <div role="columnheader" aria-sort={sortKey === 'title' ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('title', 'Title')}</div>
            <div role="columnheader" aria-sort={sortKey === 'year' ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('year', 'Year')}</div>
            <div className="archive-role" role="columnheader" aria-sort={sortKey === 'role' ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('role', 'Role')}</div>
            <div className="archive-stack text-[10px] font-bold uppercase tracking-[.12em]" role="columnheader">Stack</div>
          </div>

          {visibleProjects.map((project) => (
          <article className="archive-row invert-hover border-b border-black" key={project.id} role="row" onPointerEnter={() => setActiveId(project.id)} onFocusCapture={() => setActiveId(project.id)}>
            <span className="text-xs" role="cell">{project.archiveId}</span>
            <div role="cell">
              <a className="font-[family-name:var(--font-display)] text-base font-bold tracking-[-.03em]" href={withBase(baseUrl, `/portfolio/${project.id}/`)}>{project.title}</a>
              <p className="mt-1 text-xs sm:hidden">{project.role}</p>
            </div>
            <div className="flex flex-col gap-2 text-xs" role="cell">
              <span>{project.year}</span>
              <button className="min-h-11 border border-current px-2 text-[10px] font-bold uppercase min-[860px]:hidden" type="button" onClick={() => preview(project.id)}>Preview</button>
            </div>
            <span className="archive-role text-xs uppercase" role="cell">{project.role}</span>
            <span className="archive-stack text-xs uppercase" role="cell">{project.tags.slice(0, 3).join(' · ')}</span>
          </article>
          ))}

          {!visibleProjects.length && (
            <div className="border-b border-black p-6">
              <p className="display text-3xl">No matching work</p>
              <button className="invert-hover mt-4 min-h-11 border border-black px-4 text-xs font-bold uppercase" type="button" onClick={() => setQuery('')}>Reset filter</button>
            </div>
          )}
        </div>
      </div>

      <dialog className="archive-preview" ref={dialogRef} aria-label="Project preview">
        <div className="grid h-full grid-rows-[auto_1fr_auto]">
          <div className="flex items-center justify-between border-b border-black p-3 text-xs font-bold uppercase">
            <span>Artifact / Preview</span>
            <button className="min-h-11 border border-black px-3 min-[860px]:hidden" type="button" onClick={() => dialogRef.current?.close()}>Close</button>
          </div>
          <div className="relative aspect-square min-h-0 bg-white">
            <canvas className="h-full w-full" ref={canvasRef} aria-hidden="true" />
            {!activeProject && <p className="absolute inset-0 grid place-items-center text-xs font-bold uppercase">No selection</p>}
            {previewError && <p className="absolute inset-0 grid place-items-center bg-white p-4 text-center text-xs font-bold uppercase">Preview visual unavailable</p>}
          </div>
          {activeProject && (
            <div className="border-t border-black p-4">
              <p className="display text-2xl">{activeProject.title}</p>
              <p className="mt-2 text-xs uppercase">{activeProject.archiveId} · {activeProject.year} · {activeProject.role}</p>
              <p className="mt-3 text-sm leading-6">{activeProject.description}</p>
              <a className="mt-4 inline-flex min-h-11 items-center border border-black px-3 text-xs font-bold uppercase invert-hover" href={withBase(baseUrl, `/portfolio/${activeProject.id}/`)}>Open case study →</a>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
