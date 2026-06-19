# Tavric's Blog

Tavric's Blog 是一個以 Astro + Tailwind CSS 建置的靜態個人網站。文章內容由 Notion 管理，GitHub Actions 會同步 Notion 文章與圖片，建置後部署到 Cloudflare Pages。

[![GitHub Repository](https://img.shields.io/badge/GitHub-tavricccc%2Ftavricccc.github.io-111827?style=for-the-badge&logo=github&logoColor=white)](https://github.com/tavricccc/tavricccc.github.io)

## 目前架構

- 前端框架：Astro
- 樣式：Tailwind CSS
- 內容來源：Notion database
- 文章輸出：Astro Content Collections
- 部署：GitHub Actions + Wrangler Direct Upload 到 Cloudflare Pages
- Node 版本：24

這個版本已移除舊的留言、登入、RSS、獨立後端 Worker 與 SEO guide 文件。

## 內容流程

Notion parent page 底下可以放多個 database。每個 database 代表一組文章來源，database 名稱會自動成為該 database 內文章的一個 tag。

例如文章在 `SRP` database 裡，輸出的文章 frontmatter 會包含 `SRP` tag。如果 Notion `Tags` 欄位裡也有 `SRP`，同步時只保留一個。

每個 Notion database 建議包含：

```text
Name 或 名稱        title
Status              status 或 select
Published Date 或 日期 date
Tags                multi-select 或 select
```

只有 `Status = Published` 的頁面會被同步。

同步腳本會產生：

```text
src/content/blog/notion/*.md
public/notion/images/<post-slug>/*
```

這些都是生成物，已加入 `.gitignore`，不需要提交到 Git。

## 常用指令

安裝依賴：

```bash
npm install
```

開發：

```bash
npm run dev
```

檢查 Notion 會抓到哪些文章：

```bash
npm run sync:notion -- --dry-run
```

同步 Notion：

```bash
npm run sync:notion
```

建置：

```bash
npm run build
```

預覽建置結果：

```bash
npm run preview
```

## GitHub Secrets

到 GitHub repo 的 Settings -> Secrets and variables -> Actions，新增：

```text
NOTION_TOKEN
NOTION_PARENT_PAGE_ID
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_PAGES_PROJECT_NAME
```

`NOTION_PARENT_PAGE_ID` 是放置多個文章 database 的 Notion parent page ID。

Cloudflare API token 需要 Cloudflare Pages 的 Read/Edit 權限。

## 部署

Workflow 檔案：

```text
.github/workflows/notion-to-cloudflare.yml
```

觸發方式：

- push 到 `develop`
- push 到 `main`
- 手動執行 workflow
- 每天 UTC 02:10 自動執行一次

部署分支策略：

- `develop` -> Cloudflare Pages Preview
- `main` -> Cloudflare Pages Production

Workflow 會：

1. 使用 Node 24。
2. 安裝依賴。
3. 從 Notion 同步 Published 文章。
4. 下載 Notion 圖片到 `public/notion/images/`。
5. 執行 Astro build。
6. 用 Wrangler 將 `dist` 部署到 Cloudflare Pages。

## 主要路由

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

導覽上 `blog` 路徑目前以 Articles 呈現。

## 專案結構

```text
.
├─ .github/workflows/
│  └─ notion-to-cloudflare.yml
├─ docs/
│  ├─ README.zh-TW.md
│  └─ notion-cloudflare-cms.zh-TW.md
├─ public/
│  ├─ image/
│  └─ notion/                  # Notion 圖片生成物，不提交
├─ scripts/
│  └─ sync-notion.mjs
├─ src/
│  ├─ components/
│  ├─ content/blog/notion/      # Notion 文章生成物，不提交
│  ├─ data/
│  ├─ layouts/
│  ├─ pages/
│  ├─ styles/
│  └─ content.config.ts
├─ astro.config.mjs
├─ package.json
└─ tailwind.config.mjs
```

## 文章格式

如果手動新增 Markdown 文章，frontmatter 需符合 `src/content.config.ts`：

```yaml
---
title: "文章標題"
description: "文章摘要"
pubDate: 2026-06-20
updatedDate: 2026-06-20
tags: ["tag-a", "tag-b"]
draft: false
important: false
importantOrder: 0
---
```

實際日常使用建議直接從 Notion 撰寫，讓 `npm run sync:notion` 產生文章檔案。
