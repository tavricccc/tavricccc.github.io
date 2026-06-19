# Notion CMS + Cloudflare Pages 部署指南

這個專案現在預設把 Notion 當作唯一文章來源。文章與圖片由 GitHub Action 產生，但不寫回 Git。

## Notion 結構

建立一個 Notion parent page，底下放多個 database。

每個 database 名稱會自動成為該 database 內文章的一個 tag。例如文章在 `A` database，輸出的 frontmatter 會包含 `tags: ["A", ...]`。如果 Notion 的 `Tags` 欄位也有 `A`，同步時只保留一個。

每個 database 至少需要這些欄位：

```text
Name            title
Status          status 或 select
Published Date  date
Tags            multi-select 或 select
```

發布規則：

```text
Status = Published
```

不是 `Published` 的頁面不會輸出到網站。

## 生成位置

同步腳本會產生：

```text
src/content/blog/notion/*.md
public/notion/images/<post-slug>/*
```

這兩個路徑已加入 `.gitignore`，因為它們是 Notion 的生成物。

## GitHub Secrets

到 GitHub repo 的 Settings → Secrets and variables → Actions，新增：

```text
NOTION_TOKEN
NOTION_PARENT_PAGE_ID
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_PAGES_PROJECT_NAME
```

`NOTION_PARENT_PAGE_ID` 是放 database 的那個 Notion page ID。

Cloudflare API token 需要能部署 Cloudflare Pages。

## 手動測試

安裝依賴：

```bash
npm install
```

只檢查 Notion 會抓到哪些文章，不寫入檔案：

```bash
npm run sync:notion -- --dry-run
```

實際同步：

```bash
npm run sync:notion
```

建置：

```bash
npm run build
```

## GitHub Action

Workflow 檔案：

```text
.github/workflows/notion-to-cloudflare.yml
```

它會：

1. 使用 Node 24。
2. 從 Notion 同步 Published 文章。
3. 下載 Notion 圖片到本地。
4. 執行 Astro build。
5. 用 Wrangler 直接部署 `dist` 到 Cloudflare Pages。

觸發方式：

- GitHub Actions 頁面手動 Run workflow。
- 每天 UTC 02:10 自動跑一次，也就是台北時間 10:10。

## Cloudflare Pages

這套流程使用 Wrangler Direct Upload，所以 Cloudflare Pages 不需要自己再從 GitHub build 內容。

你只需要：

1. 在 Cloudflare 建立 Pages project。
2. 記下 project name，填進 `CLOUDFLARE_PAGES_PROJECT_NAME`。
3. 把自訂 domain 綁到這個 Pages project。

之後 GitHub Action 每次成功執行，就會更新 Cloudflare Pages 上的站點。
