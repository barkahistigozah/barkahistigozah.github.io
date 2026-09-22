import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("portfolio content matches the latest CV and project sources", () => {
  test("uses the latest professional profile", async () => {
    const { profile } = await import("./profile");

    expect(profile.role).toBe("Junior Full-Stack Web Developer");
    expect(profile.location).toBe("Sumedang, Jawa Barat, Indonesia");
    expect(profile.email).toBe("barkahistigozah28@gmail.com");
    expect(profile.languages).toContain("FastAPI");
    expect(profile.languages).toContain("HTMX");
    expect(profile.tools).toContain("Docker Compose");
    expect(profile.databases).toEqual(["PostgreSQL", "MySQL", "SQLite", "Neon Database"]);
  });

  test("includes the current project stack and the new typo-correction project", () => {
    const autoCorrect = read("src/content/projects/auto-correct-typo-bahasa-indonesia.mdx");
    const leps = read("src/content/projects/licencing-engine-for-php-script.mdx");
    const portfolio = read("src/content/projects/portfolio-pribadi.mdx");

    expect(autoCorrect).toContain('thumbnail: "/images/acory.webp"');
    expect(autoCorrect).toContain("FastAPI");
    expect(autoCorrect).toContain("DOCX");
    expect(leps).toContain("SvelteKit");
    expect(leps).toContain("Elysia");
    expect(leps).not.toContain('tags: ["Next.js"');
    expect(portfolio).toContain("Astro 6");
    expect(portfolio).toContain("React 19");
    expect(portfolio).toContain("React 19 hanya untuk filter project interaktif");
  });

  test("keeps home and archive page sizes bounded", () => {
    const home = read("src/pages/index.astro");
    const projectFilter = read("src/components/ProjectFilter.tsx");
    const blog = read("src/pages/blog/index.astro");

    expect(home).toContain(".slice(0, 5)");
    expect(home).not.toContain("filter((article) => article.data.featured)");
    expect(projectFilter).toContain("const PAGE_SIZE = 5;");
    expect(blog).toContain("const PAGE_SIZE = 10;");
  });

  test("uses CSS instead of GSAP for the archive hero entrance", () => {
    const hero = read("src/components/ArchiveHero.astro");
    const styles = read("src/styles/global.css");

    expect(hero).not.toContain("import('gsap')");
    expect(hero).toContain("archive-hero-enter");
    expect(styles).toContain("@keyframes archive-hero-enter");
  });

  test("uses the browser canvas instead of 3D libraries for the project preview", () => {
    const artifact = read("src/components/projectArtifact.ts");

    expect(artifact).not.toContain("from 'gsap'");
    expect(artifact).not.toContain("from 'three'");
  });

  test("includes the three 2026 blog articles with relevant tag lists", () => {
    const go = read("src/content/blog/kelebihan-concurrency-golang.mdx");
    const vibeCoding = read("src/content/blog/hal-yang-terlewat-saat-vibe-coding.mdx");
    const laravel = read("src/content/blog/kenapa-laravel-masih-banyak-dipilih.mdx");

    expect(go).toContain('date: "2026-02-12"');
    expect(go).toContain('tags: ["Go", "Concurrency", "Backend"]');
    expect(vibeCoding).toContain('date: "2026-06-07"');
    expect(vibeCoding).toContain('tags: ["AI", "Vibe Coding", "Software Engineering"]');
    expect(laravel).toContain('date: "2026-08-14"');
    expect(laravel).toContain('tags: ["Laravel", "PHP", "Web Development"]');
  });
});
