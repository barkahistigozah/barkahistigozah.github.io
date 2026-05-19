import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isUserPage = repositoryName?.endsWith('.github.io');
const base = process.env.SITE_BASE ?? (process.env.GITHUB_ACTIONS && repositoryName && !isUserPage ? `/${repositoryName}` : '/');

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://barkahistigozah.site',
  base,
  integrations: [mdx(), react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
