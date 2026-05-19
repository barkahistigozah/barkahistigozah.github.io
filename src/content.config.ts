import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    thumbnail: z.string(),
    date: z.coerce.date(),
    role: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    externalLink: z.string().url().optional(),
    repositoryLink: z.string().url().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
  }),
});

export const collections = { projects, blog };
