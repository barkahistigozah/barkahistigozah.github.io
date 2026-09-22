# Brutalist Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah portfolio Astro yang ada menjadi index portfolio brutalist monokrom dengan archive table interaktif, preview Three.js berbasis canvas, motion GSAP singkat, serta responsive behavior yang tetap ringan.

**Architecture:** Astro tetap merender seluruh konten bermakna dan route secara statis. React island yang sudah tersedia menangani filter, sort, active preview, dan native dialog; Three.js serta GSAP di-load dinamis hanya ketika preview pertama kali dipakai. Seluruh halaman berbagi satu sistem visual dari `global.css`, tanpa framework, font, icon, atau animation plugin tambahan.

**Tech Stack:** Astro 6, Tailwind CSS 4, React 19, Bun test, Three.js, GSAP, native `<details>`, native `<dialog>`, CSS media queries.

**Spec:** `docs/superpowers/specs/2026-09-20-brutalist-portfolio-redesign-design.md`

## Global Constraints

- Gunakan hanya putih `#ffffff`, hitam `#000000`, muted ink `#5f5f5f`, dan quiet surface `#f2f2f2`.
- Terapkan `border-radius: 0` dan `box-shadow: none` pada seluruh UI portfolio.
- Gunakan system Helvetica/Arial untuk display dan system monospace untuk body/data; jangan menambahkan webfont.
- Konten Indonesia, content collections, route, metadata SEO, dan project detail tetap menjadi source of truth.
- Three.js harus event-driven: tidak ada permanent `requestAnimationFrame` loop.
- GSAP hanya menganimasikan `transform`/`opacity`, tanpa ScrollTrigger, parallax, pinning, atau custom cursor.
- Semua konten dan link utama tetap tersedia jika JavaScript gagal atau dimatikan.
- Hormati `prefers-reduced-motion` secara reaktif, termasuk perubahan preference saat halaman sudah terbuka.
- Layout wajib bebas horizontal scroll pada 375, 768, 1024, dan 1440 CSS pixels.
- File existing yang tidak tercatat Git—`src/pages/brosur.astro`, `public/brosur-jasa-web-development.html`, dan `public/images/brosur-jasa-web-development.png`—tidak boleh diubah atau dimasukkan commit.
- Tidak membuat PR, deploy, publish, atau push remote.
- Logika archive memakai TDD. Perubahan CSS/markup visual diverifikasi dengan build dan browser nyata; unit test yang hanya memeriksa class string sengaja tidak dibuat karena tidak menguji perilaku pengguna.

## Review Focus

- Query kosong atau hanya whitespace harus mengembalikan semua project dan counter yang benar; dipatok oleh test Task 1.
- Filter harus case-insensitive dan menemukan title, role, year, ID, serta tags; dipatok oleh test Task 1.
- Sort harus tidak memutasi array input dan harus benar untuk title, year, role, serta ID; dipatok oleh test Task 1.
- WebGL/GSAP yang gagal harus meninggalkan metadata dan navigasi project tetap berfungsi; dipatok oleh fallback check Task 4 dan browser check Task 5.
- Judul, role, tag, dan URL panjang tidak boleh menghasilkan horizontal overflow pada 375px; dipatok oleh browser check Task 5.

---

### Task 1: Pure archive behavior dengan TDD

**Files:**
- Create: `src/utils/archive.ts`
- Create: `src/utils/archive.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: project metadata hasil serialisasi Astro.
- Produces: `ArchiveProject`, `SortKey`, `SortDirection`, `makeArchiveId()`, `filterProjects()`, `sortProjects()`, dan `hashId()` untuk React island serta renderer Three.js.

- [ ] **Step 1: Tambahkan script test tanpa dependency baru**

Tambahkan script berikut ke `package.json`:

```json
"test": "bun test"
```

- [ ] **Step 2: Tulis failing tests**

Buat `src/utils/archive.test.ts`:

```ts
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
```

- [ ] **Step 3: Jalankan test dan buktikan RED**

Run: `bun test src/utils/archive.test.ts`

Expected: FAIL karena `./archive` belum ada.

- [ ] **Step 4: Implementasikan utility minimum**

Buat `src/utils/archive.ts`:

```ts
export type ArchiveProject = {
  id: string;
  archiveId: string;
  title: string;
  description: string;
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
```

- [ ] **Step 5: Jalankan test dan buktikan GREEN**

Run: `bun test src/utils/archive.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 6: Commit task**

```powershell
git add package.json src/utils/archive.ts src/utils/archive.test.ts
git commit -m "test: define portfolio archive behavior"
```

---

### Task 2: Brutalist global shell dan shared navigation

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/SiteLayout.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Consumes: `profile`, `withBase()`, `SiteLayout` props, dan current route Astro.
- Produces: global design tokens/classes, `#main-content`, skip link, native mobile navigation, dan footer yang dipakai semua route.

- [ ] **Step 1: Ganti visual foundation di `global.css`**

Hapus seluruh selector aurora, orbit, gradient, rounded card, shadow, dan keyframe lama. Ganti file dengan fondasi berikut:

```css
@import "tailwindcss";

:root {
  color-scheme: light;
  --paper: #fff;
  --ink: #000;
  --muted: #5f5f5f;
  --wash: #f2f2f2;
  --line: #000;
  --font-display: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", "Courier New", monospace;
  --snap: 80ms;
}

*, *::before, *::after {
  box-sizing: border-box;
  border-radius: 0 !important;
  box-shadow: none !important;
}

html { background: var(--paper); scroll-behavior: smooth; }
body {
  min-width: 320px;
  margin: 0;
  overflow-x: hidden;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 16px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

::selection { background: var(--ink); color: var(--paper); }
a { color: inherit; text-decoration: none; }
button, input, textarea { border: 0; border-radius: 0; font: inherit; color: inherit; }
button, summary { cursor: pointer; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }

.page-shell { width: min(100%, 1440px); margin-inline: auto; }
.display { font-family: var(--font-display); font-weight: 800; letter-spacing: -0.05em; line-height: .88; text-transform: uppercase; }
.hairline { border-top: 1px solid var(--line); }
.invert-hover { transition: color var(--snap), background-color var(--snap); }
.invert-hover:hover, .invert-hover:focus-within { background: var(--ink); color: var(--paper); }
.skip-link { position: fixed; top: 0; left: 0; z-index: 100; transform: translateY(-110%); background: var(--ink); color: var(--paper); padding: .75rem 1rem; }
.skip-link:focus { transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```

Tambahkan rules konten dan form berikut tepat setelah foundation agar detail page dan contact page tidak bergantung pada class lama:

```css
.content-body { max-width: 72ch; font-size: 1rem; line-height: 1.75; }
.content-body > * + * { margin-top: 1rem; }
.content-body h2, .content-body h3 { font-family: var(--font-display); font-weight: 800; letter-spacing: -.035em; line-height: 1; text-transform: uppercase; }
.content-body h2 { margin-top: 2.5rem; font-size: clamp(1.75rem, 4vw, 3rem); }
.content-body h3 { margin-top: 2rem; font-size: 1.5rem; }
.content-body ul, .content-body ol { padding-left: 1.25rem; }
.content-body a { font-weight: 700; text-decoration: underline; text-underline-offset: .2em; }
.content-body pre { overflow-x: auto; border: 1px solid var(--line); background: var(--ink); color: var(--paper); padding: 1rem; }
.content-body code { font-size: .92em; }
input, textarea { width: 100%; background: var(--paper); }
input:focus, textarea:focus { outline: 3px solid var(--ink); outline-offset: 2px; }
dialog::backdrop { background: rgb(0 0 0 / .72); }
img, canvas { display: block; max-width: 100%; }
```

Tambahkan responsive primitives berikut ke file yang sama:

```css
.archive-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 34vw); }
.archive-row { display: grid; grid-template-columns: 84px minmax(180px, 1fr) 72px minmax(130px, .55fr) minmax(150px, .7fr); }
.archive-row > * { min-width: 0; padding: .75rem; border-right: 1px solid var(--line); overflow-wrap: anywhere; }
.archive-row > *:last-child { border-right: 0; }
.archive-preview { position: sticky; top: 57px; width: 100%; max-height: calc(100dvh - 57px); margin: 0; border: 0; border-left: 1px solid var(--line); background: var(--paper); color: var(--ink); }

@media (max-width: 859px) {
  .archive-grid { display: block; }
  .archive-preview:not(:modal) { display: none; }
  .archive-preview:modal { inset: auto 0 0; max-width: none; max-height: min(82dvh, 680px); border: 1px solid var(--line); }
}

@media (max-width: 719px) {
  .archive-row { grid-template-columns: 74px minmax(0, 1fr) 64px; }
  .archive-role, .archive-stack { display: none; }
}
```

- [ ] **Step 2: Sederhanakan `SiteLayout.astro`**

Hapus `.animated-bg` dan IntersectionObserver reveal script. Pertahankan seluruh metadata yang ada, lalu ubah body shell menjadi:

```astro
<body>
  <a class="skip-link" href="#main-content">Lewati ke konten</a>
  <Header />
  <main id="main-content" tabindex="-1">
    <slot />
  </main>
  <Footer />
</body>
```

- [ ] **Step 3: Ubah `Header.astro` menjadi masthead berbasis native disclosure**

Gunakan struktur tunggal berikut; `details` hanya menjadi disclosure di mobile melalui CSS:

```astro
<header class="site-header sticky top-0 z-50 border-b border-black bg-white">
  <nav class="page-shell flex min-h-14 items-stretch justify-between" aria-label="Navigasi utama">
    <a href={withBase('/')} class="display flex items-center border-r border-black px-4 text-lg" aria-label={`${profile.name} beranda`}>
      BARKAH / INDEX
    </a>
    <details class="site-nav">
      <summary class="flex min-h-14 items-center px-4 font-bold uppercase md:hidden">Menu</summary>
      <div class="nav-links flex bg-white">
        {navItems.map((item) => {
          const itemHref = withBase(item.href);
          const isActive = item.href === '/' ? currentPath === itemHref : currentPath.startsWith(itemHref);
          return <a href={itemHref} aria-current={isActive ? 'page' : undefined} class="flex min-h-14 items-center border-l border-black px-4 text-xs font-bold uppercase invert-hover">
            {item.label}
          </a>;
        })}
      </div>
    </details>
  </nav>
</header>
```

Tambahkan CSS berikut untuk disclosure tanpa JavaScript:

```css
.site-nav summary { list-style: none; }
.site-nav summary::-webkit-details-marker { display: none; }
.site-nav[open] .nav-links { display: flex; }
@media (max-width: 767px) {
  .nav-links { position: absolute; top: 100%; right: 0; left: 0; display: none; flex-direction: column; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .nav-links a { border-top: 1px solid var(--line); border-left: 0; }
}
@media (min-width: 768px) {
  .site-nav > summary { display: none; }
  .site-nav, .nav-links { display: flex; }
}
```

- [ ] **Step 4: Ubah `Footer.astro` menjadi black colophon**

Gunakan struktur ini:

```astro
<footer class="mt-20 bg-black text-white">
  <div class="page-shell border-b border-white px-4 py-8">
    <p class="display text-[clamp(3.5rem,15vw,13rem)]">AVAILABLE / FOR WORK</p>
  </div>
  <div class="page-shell grid gap-8 px-4 py-8 text-xs uppercase md:grid-cols-3">
    <div><p>Developer</p><p class="mt-2">{profile.name}</p><p>{profile.location}</p></div>
    <div><p>Contact</p><a class="underline" href={`mailto:${profile.email}`}>Email</a><br /><a class="underline" href={profile.github}>GitHub</a><br /><a class="underline" href={profile.linkedin}>LinkedIn</a></div>
    <div><p>Colophon</p><p class="mt-2">Astro · Tailwind · Three.js · GSAP</p><a class="mt-4 inline-block underline" href="#top">Kembali ke atas</a></div>
  </div>
</footer>
```

Tambahkan `id="top"` pada `<html>` atau body target yang valid.

- [ ] **Step 5: Build shell**

Run: `$env:ASTRO_TELEMETRY_DISABLED='1'; bun run build`

Expected: exit 0; seluruh route tetap dihasilkan.

- [ ] **Step 6: Commit task**

```powershell
git add src/styles/global.css src/layouts/SiteLayout.astro src/components/Header.astro src/components/Footer.astro
git commit -m "feat: add brutalist portfolio shell"
```

---

### Task 3: Shared editorial components dan static pages

**Files:**
- Modify: `src/components/SectionHeading.astro`
- Modify: `src/components/TagList.astro`
- Modify: `src/components/ArticleList.astro`
- Modify: `src/components/ContactLinks.astro`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/[id].astro`
- Modify: `src/pages/portfolio/[id].astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/contact.astro`

**Interfaces:**
- Consumes: existing component props dan Astro content entries tanpa schema change.
- Produces: shared brutalist headings, tags, article rows, dossier, contact sheet, dan case-study layout.

- [ ] **Step 1: Ubah heading dan tags menjadi typographic primitives**

`SectionHeading.astro` menggunakan border atas/bawah, label monospace uppercase, dan display heading tanpa pill:

```astro
<header class="grid gap-4 border-y border-black px-4 py-6 md:grid-cols-[180px_1fr_auto] md:items-end">
  <p class="text-xs font-bold uppercase">{eyebrow}</p>
  <div>
    <h2 class="display text-[clamp(2.25rem,5vw,5.5rem)]">{title}</h2>
    {description && <p class="mt-4 max-w-3xl text-base leading-7 text-[color:var(--muted)]">{description}</p>}
  </div>
  {href && linkLabel && <a class="min-h-11 border border-black px-4 py-3 text-xs font-bold uppercase invert-hover" href={withBase(href)}>{linkLabel} →</a>}
</header>
```

`TagList.astro` menjadi comma-separated metadata tanpa chips:

```astro
<ul class="tag-list flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold uppercase" aria-label="Tags">
  {tags.map((tag) => <li>{tag}</li>)}
</ul>
```

- [ ] **Step 2: Ubah `ArticleList.astro` menjadi FIELD NOTES table**

Gunakan header dan row dengan grid `96px minmax(0,1fr) auto`, border 1px, title link normal, serta tag metadata. Setiap row menggunakan `.invert-hover`; tombol/link tetap minimal 44px pada mobile.

```astro
<div class="border-b border-black">
  <div class="grid grid-cols-[96px_minmax(0,1fr)_auto] border-t border-black text-[10px] font-bold uppercase tracking-[.12em]" aria-hidden="true">
    <span class="p-3">Date</span><span class="border-l border-black p-3">Title</span><span class="border-l border-black p-3">Open</span>
  </div>
  {articles.map((article) => (
    <article class="invert-hover grid grid-cols-[96px_minmax(0,1fr)_auto] border-t border-black">
      <time class="p-3 text-xs" datetime={article.data.date.toISOString()}>{formatDate(article.data.date)}</time>
      <div class="min-w-0 border-l border-black p-3">
        <h3 class="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-.03em]"><a href={withBase(`/blog/${article.id}/`)}>{article.data.title}</a></h3>
        <p class="mt-2 max-w-3xl text-sm leading-6">{article.data.excerpt}</p>
      </div>
      <a class="flex min-h-11 items-center border-l border-black p-3 text-xs font-bold uppercase" href={withBase(`/blog/${article.id}/`)}>Read →</a>
    </article>
  ))}
</div>
```

- [ ] **Step 3: Implementasikan contact dan detail layouts**

`ContactLinks.astro` menggunakan ruled CTA berikut:

```astro
<section id="contact" class="page-shell mt-20 border-y border-black">
  <div class="grid md:grid-cols-2">
    <h2 class="display p-4 text-[clamp(2.5rem,6vw,6rem)]">LET'S / BUILD</h2>
    <div class="border-t border-black p-4 md:border-l md:border-t-0">
      <p class="max-w-2xl leading-7">Terbuka untuk project website, automation, landing page, dan eksperimen produk digital berbasis AI-assisted workflow.</p>
      <div class="mt-6 flex flex-wrap gap-2">
        <a class="inline-flex min-h-11 items-center border border-black px-4 py-3 text-xs font-bold uppercase invert-hover" href={`mailto:${profile.email}`}>Email</a>
        <a class="inline-flex min-h-11 items-center border border-black px-4 py-3 text-xs font-bold uppercase invert-hover" href={profile.github}>GitHub</a>
        <a class="inline-flex min-h-11 items-center border border-black px-4 py-3 text-xs font-bold uppercase invert-hover" href={profile.linkedin}>LinkedIn</a>
      </div>
    </div>
  </div>
</section>
```

`ContentLayout.astro` memakai header berikut sebelum `.content-body`:

```astro
<article class="page-shell py-10">
  <a href={withBase(backHref)} class="inline-flex min-h-11 items-center px-4 text-xs font-bold uppercase underline">← {backLabel}</a>
  <header class="border-y border-black px-4 py-8">
    <p class="text-xs font-bold uppercase">{eyebrow}</p>
    <h1 class="display mt-4 max-w-6xl text-[clamp(3rem,8vw,8rem)]">{title}</h1>
    <p class="mt-6 max-w-3xl text-lg leading-8">{description}</p>
    <div class="mt-8 grid gap-4 border-t border-black pt-4 sm:grid-cols-[180px_1fr]">
      <time datetime={date.toISOString()}>{formattedDate}</time><TagList tags={tags} />
    </div>
  </header>
  <div class="content-body px-4 py-10"><slot /></div>
</article>
```

`portfolio/[id].astro` mempertahankan thumbnail asli dengan `class="mb-8 aspect-video w-full border border-black object-cover"`; external/repository links menggunakan rectangular invert buttons.

Gunakan action link class konsisten:

```html
class="inline-flex min-h-11 items-center border border-black px-4 py-3 text-xs font-bold uppercase invert-hover"
```

- [ ] **Step 4: Restyle About, Contact, dan Blog index**

- About: gunakan `grid md:grid-cols-[minmax(260px,.7fr)_1.3fr]`; portrait memakai existing `profile.image`, `border border-black`, dan `aspect-[4/5] object-cover`; skill/language/tool lists masing-masing dibungkus `<section class="border-t border-black py-6">`.
- Contact: gunakan heading display `CONTACT / INQUIRY`; form `grid max-w-4xl border-b border-black px-4`, labels visible, `autocomplete="name"` dan `autocomplete="email"`, input minimum 44px.
- Blog index: set heading `FIELD / NOTES`, deskripsi tetap dari page saat ini, lalu render `ArticleList` yang sama.

Struktur contact field wajib seperti berikut:

```astro
<label class="grid gap-2 border-t border-black py-4 text-xs font-bold uppercase">
  Email
  <input class="min-h-11 border border-black bg-white px-3 text-base font-normal" name="email" type="email" autocomplete="email" required />
</label>
```

- [ ] **Step 5: Build static pages**

Run: `$env:ASTRO_TELEMETRY_DISABLED='1'; bun run build`

Expected: exit 0 dan tidak ada content/schema error.

- [ ] **Step 6: Commit task**

```powershell
git add src/components/SectionHeading.astro src/components/TagList.astro src/components/ArticleList.astro src/components/ContactLinks.astro src/layouts/ContentLayout.astro src/pages/blog src/pages/portfolio/[id].astro src/pages/about.astro src/pages/contact.astro
git commit -m "feat: restyle portfolio content pages"
```

---

### Task 4: Interactive project archive, Three.js canvas, dan GSAP motion

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Create: `src/components/ArchiveHero.astro`
- Create: `src/components/projectArtifact.ts`
- Modify: `src/components/ProjectFilter.tsx`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/portfolio/index.astro`

**Interfaces:**
- Consumes: `ArchiveProject`, `filterProjects()`, `sortProjects()`, `hashId()`, `siteBase`, content collection entries, dan `profile`.
- Produces: SSR archive table, lazy canvas preview controller, GSAP page/preview motion, filter, sorting, desktop sticky preview, dan mobile native dialog.

- [ ] **Step 1: Tambahkan dependency yang diminta**

Run: `bun add three gsap`

Expected: hanya `three`, `gsap`, dan lockfile resolution terkait yang ditambahkan; package manager tetap Bun.

- [ ] **Step 2: Buat `ArchiveHero.astro`**

Komponen menerima `projectCount` dan `noteCount`, menampilkan masthead, profile summary, live Jakarta time, serta CTA berbentuk text link. Clock harus berhenti ketika document hidden.

```astro
---
import { profile } from '../data/profile';
interface Props { projectCount: number; noteCount: number }
const { projectCount, noteCount } = Astro.props;
---

<section class="page-shell border-b border-black" data-archive-hero>
  <div class="grid md:grid-cols-[1fr_260px]">
    <h1 class="display px-4 py-6 text-[clamp(3.5rem,11vw,10rem)]">BARKAH <span class="font-light">/</span> PORTFOLIO</h1>
    <div class="border-t border-black p-4 text-xs uppercase md:border-l md:border-t-0">
      <p class="font-bold" data-clock>00:00:00 <sup>UTC+07</sup></p>
      <p class="mt-3" data-dateline></p>
      <p class="mt-3">Projects {projectCount} · Notes {noteCount}</p>
    </div>
  </div>
  <div class="grid border-t border-black p-4 md:grid-cols-[1fr_auto] md:items-end">
    <div><p class="text-xs font-bold uppercase">{profile.role} · {profile.location}</p><p class="mt-3 max-w-3xl text-base leading-7">{profile.summary}</p></div>
    <a class="mt-4 underline md:mt-0" href={`mailto:${profile.email}`}>Start a project →</a>
  </div>
</section>
```

Gunakan `Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ... })`, satu interval 1000ms hanya ketika `document.visibilityState === 'visible'`, dan cleanup saat `astro:before-swap`.

- [ ] **Step 3: Buat lazy renderer `projectArtifact.ts`**

Expose interface berikut:

```ts
import { hashId } from '../utils/archive';

export type ArtifactController = {
  draw: (id: string, animate: boolean) => void;
  dispose: () => void;
};

export const createProjectArtifact = async (canvas: HTMLCanvasElement): Promise<ArtifactController> => {
  const [THREE, { gsap }] = await Promise.all([import('three'), import('gsap')]);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  const group = new THREE.Group();
  camera.position.z = 2;
  scene.background = new THREE.Color(0xffffff);
  scene.add(group);

  let tween: ReturnType<typeof gsap.to> | undefined;
  let resizeFrame = 0;
  const render = () => renderer.render(scene, camera);
  const resize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 860 ? 1 : 1.5));
      renderer.setSize(width, height, false);
      camera.left = -width / height;
      camera.right = width / height;
      camera.updateProjectionMatrix();
      render();
    });
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const clear = () => {
    for (const child of [...group.children]) {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
      group.remove(child);
    }
  };

  const draw = (id: string, animate: boolean) => {
    tween?.kill();
    clear();
    let seed = hashId(id) || 1;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const count = 3 + Math.floor(random() * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = .12 + random() * .18;
      const geometry = index % 2
        ? new THREE.RingGeometry(radius, radius + .08 + random() * .2, 4 + Math.floor(random() * 5))
        : new THREE.PlaneGeometry(.25 + random() * .65, .08 + random() * .5);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: index % 3 ? 0x000000 : 0xffffff }));
      mesh.position.set((random() - .5) * 1.35, (random() - .5) * 1.35, index * .01);
      mesh.rotation.z = random() * Math.PI;
      group.add(mesh);
    }
    group.rotation.z = 0;
    if (animate) {
      tween = gsap.fromTo(group.rotation, { z: -.08 }, { z: 0, duration: .24, ease: 'power1.out', onUpdate: render });
    } else {
      render();
    }
  };

  resize();
  return {
    draw,
    dispose: () => {
      tween?.kill();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      clear();
      renderer.dispose();
    },
  };
};
```

Implementasi wajib:

- `WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' })` dengan clear color putih.
- `OrthographicCamera(-1, 1, 1, -1, 0.1, 10)` dan `camera.position.z = 2`.
- Satu `Group` berisi 3–5 `PlaneGeometry`, `RingGeometry`, atau `EdgesGeometry` hitam/putih yang dipilih dari xorshift PRNG ber-seed `hashId(id)`.
- `draw()` membuang geometry/material lama sebelum membuat composition baru.
- Jika `animate` true dan reduced motion false, gunakan `gsap.fromTo(group.rotation, { z: -0.08 }, { z: 0, duration: 0.24, ease: 'power1.out', onUpdate: render })`; selain itu render satu kali.
- Cap pixel ratio `1` di bawah 860px dan `1.5` di atasnya.
- Resize dari `canvas.clientWidth/clientHeight`, bukan `window.innerWidth`.
- `dispose()` disconnect observer, kill tween, dispose seluruh geometry/material, dan `renderer.dispose()`.
- Tidak ada permanent animation loop.

- [ ] **Step 4: Ganti `ProjectFilter.tsx` dengan archive table**

Gunakan state minimum berikut:

```tsx
const [query, setQuery] = useState('');
const [sortKey, setSortKey] = useState<SortKey>('year');
const [direction, setDirection] = useState<SortDirection>('desc');
const [activeId, setActiveId] = useState<string | null>(null);
const visibleProjects = useMemo(
  () => sortProjects(filterProjects(projects, query), sortKey, direction),
  [projects, query, sortKey, direction],
);
```

Table requirements:

- Search input visible label `Filter` dan placeholder `Title, role, year, id...`.
- Counter `Showing {visibleProjects.length} / {projects.length}` dalam `aria-live="polite"`.
- Header buttons mengubah asc/desc dan parent header mempunyai `aria-sort`.
- Row memanggil `setActiveId(project.id)` pada pointer enter dan focus capture.
- Title merupakan normal link; mobile menambah button `Preview` minimum 44px.
- Empty state menampilkan `No matching work` dan reset button.
- Satu `<dialog className="archive-preview">` menampung satu canvas dan metadata active project.
- Desktop effect menjalankan `dialog.show()`; mobile Preview menutup non-modal state lalu menjalankan `dialog.showModal()`.
- Saat active ID pertama tersedia, dynamic import `createProjectArtifact`; error ditangkap sekali dan menampilkan `Preview visual unavailable` tanpa menghilangkan metadata/link.
- MatchMedia listener mengubah boolean reduced-motion dan diteruskan sebagai `animate` flag saat `draw()`.

- [ ] **Step 5: Wire Home dan Portfolio pages**

Kedua page membuat records dengan stable archive IDs setelah date-desc sort:

```ts
const serializableProjects = projects.map((project, index) => ({
  id: project.id,
  archiveId: makeArchiveId(index),
  title: project.data.title,
  description: project.data.description,
  date: project.data.date.toISOString(),
  year: project.data.date.getFullYear(),
  role: project.data.role,
  tags: project.data.tags,
}));
```

Home renders `ArchiveHero`, selected-work `ProjectFilter client:idle`, `FIELD NOTES`, dan contact. Portfolio index renders heading plus complete `ProjectFilter client:idle`. Hapus penggunaan card grid dan portrait hero dari home; jangan hapus source image atau content files.

- [ ] **Step 6: Tambahkan page entrance GSAP tanpa ScrollTrigger**

Di `ArchiveHero.astro`, dynamic import GSAP setelah first paint hanya ketika reduced motion false:

```js
requestAnimationFrame(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { gsap } = await import('gsap');
  gsap.from('[data-archive-hero] > *', { opacity: 0, y: 12, duration: 0.3, stagger: 0.04, ease: 'power1.out', clearProps: 'all' });
});
```

- [ ] **Step 7: Jalankan unit test dan production build**

Run: `bun test`

Expected: seluruh archive tests PASS.

Run: `$env:ASTRO_TELEMETRY_DISABLED='1'; bun run build`

Expected: exit 0; Three.js/GSAP muncul sebagai split chunks, bukan inline pada initial HTML.

- [ ] **Step 8: Commit task**

```powershell
git add package.json bun.lock src/components/ArchiveHero.astro src/components/projectArtifact.ts src/components/ProjectFilter.tsx src/pages/index.astro src/pages/portfolio/index.astro
git commit -m "feat: add interactive brutalist work index"
```

---

### Task 5: Local browser verification dan minimal root-cause fixes

**Files:**
- Modify only files from Tasks 1–4 if a verified defect requires a fix.
- Do not create screenshot artifacts in Git.

**Interfaces:**
- Consumes: production build and localhost preview.
- Produces: evidence for responsive, accessibility, interaction, motion, and runtime behavior; localhost preview remains available to the user at handoff.

- [ ] **Step 1: Jalankan fresh localhost preview**

Run: `$env:ASTRO_TELEMETRY_DISABLED='1'; bun run dev --host 127.0.0.1`

Expected: server binds only to `127.0.0.1` and prints the local URL.

- [ ] **Step 2: Verifikasi route dan viewport nyata**

Dengan browser automation yang tersedia, buka Home, Portfolio, Blog, About, Contact, dan satu project detail. Uji 375x812, 768x1024, 1024x768, dan 1440x900.

Di setiap viewport, evaluasi:

```js
({
  viewport: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
})
```

Expected: `hasOverflow === false` pada seluruh route dan viewport.

- [ ] **Step 3: Verifikasi keyboard dan interaction flow**

- Tab dari skip link menuju main content.
- Buka/tutup native mobile navigation dengan keyboard.
- Isi filter dengan `Astro`, lihat counter berubah, lalu reset.
- Sort Year dua kali dan pastikan glyph serta `aria-sort` berubah.
- Focus project row dan pastikan metadata preview berubah.
- Mobile: buka Preview, tutup dengan close button dan Escape, lalu pastikan focus kembali.
- Klik project title dan pastikan route detail benar.

- [ ] **Step 4: Verifikasi fallback dan motion**

- Emulate `prefers-reduced-motion: reduce`; hero langsung final dan canvas change tidak tween.
- Disable JavaScript lalu reload Home/Portfolio; table dan project links tetap ada.
- Pastikan console tidak berisi uncaught error.
- Setelah preview transition selesai, pastikan tidak ada perubahan canvas berulang saat halaman idle.
- Bila WebGL initialization gagal, metadata/link tetap terlihat dan fallback copy muncul.

- [ ] **Step 5: Perbaiki hanya defect yang terbukti**

Untuk setiap defect: tulis reproduksi browser atau failing utility test, perbaiki shared root cause minimum, lalu ulangi check yang sama. Jangan melakukan refactor kosmetik di luar failure yang diamati.

- [ ] **Step 6: Final verification**

Run: `bun test`

Run: `$env:ASTRO_TELEMETRY_DISABLED='1'; bun run build`

Run: `git diff --check`

Expected: test PASS, build PASS, diff check bersih. Browser checks dilaporkan sebagai `PASS`, `FAIL`, atau `NOT RUN` dengan route/viewport yang tepat.

- [ ] **Step 7: Commit verified fixes bila ada**

```powershell
git add package.json bun.lock src
git commit -m "fix: polish brutalist responsive behavior"
```

Jangan membuat commit kosong bila tidak ada fix.

## Local Handoff

Setelah semua check selesai, biarkan development server localhost aktif agar user dapat melihat hasilnya. Jangan membuat PR, push, deploy, atau publish.
