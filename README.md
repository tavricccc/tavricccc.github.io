# Tavric's Blog

An Astro + Tailwind CSS personal site. Content is managed in Notion, synced by GitHub Actions, built as static Astro pages, and deployed to Cloudflare Pages with Wrangler Direct Upload.

[![GitHub Repository](https://img.shields.io/badge/GitHub-tavricccc%2Ftavricccc.github.io-111827?style=for-the-badge&logo=github&logoColor=white)](https://github.com/tavricccc/tavricccc.github.io)

> Traditional Chinese docs: [docs/README.zh-TW.md](./docs/README.zh-TW.md)
>
> Notion + Cloudflare setup: [docs/notion-cloudflare-cms.zh-TW.md](./docs/notion-cloudflare-cms.zh-TW.md)

## Current Stack

- Astro
- Tailwind CSS
- Astro Content Collections
- Notion as the writing CMS
- GitHub Actions for sync/build/deploy
- Cloudflare Pages via Wrangler Direct Upload
- Node 24

Removed legacy pieces: comments, login, RSS, SEO guide docs, and the old separated backend Worker integration.

## Content Flow

Create a Notion parent page and put one or more databases under it. Each database name becomes an automatic tag for the articles inside it.

Required or supported Notion properties:

```text
Name / 名稱              title
Status                  status or select
Published Date / 日期    date
Tags                    multi-select or select
```

Only pages with `Status = Published` are synced.

Generated files:

```text
src/content/blog/notion/*.md
public/notion/images/<post-slug>/*
```

These paths are ignored by Git because they are generated from Notion during CI.

## Commands

```bash
npm install
npm run dev
npm run sync:notion -- --dry-run
npm run sync:notion
npm run build
npm run preview
```

## Deployment

Workflow:

```text
.github/workflows/notion-to-cloudflare.yml
```

Triggers:

- push to `develop`
- push to `main`
- manual workflow dispatch
- daily schedule at UTC 02:10

Branch behavior:

- `develop` deploys a Cloudflare Pages preview
- `main` deploys production

Required GitHub Actions secrets:

```text
NOTION_TOKEN
NOTION_PARENT_PAGE_ID
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_PAGES_PROJECT_NAME
```

## Routes

```text
/
/blog/
/blog/page/<n>/
/blog/<slug>/
/tags/
/tags/<tag>/
/important/
/links/
/about/
```

The `/blog/` route is presented as Articles in the UI.

## Project Structure

```text
.
├─ .github/workflows/notion-to-cloudflare.yml
├─ docs/
├─ public/
├─ scripts/sync-notion.mjs
├─ src/
│  ├─ components/
│  ├─ content/
│  ├─ data/
│  ├─ layouts/
│  ├─ pages/
│  └─ styles/
├─ astro.config.mjs
├─ package.json
└─ tailwind.config.mjs
```
