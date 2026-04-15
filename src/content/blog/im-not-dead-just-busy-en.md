---
title: "I'm Not Dead, Just Really Busy Lately"
description: "Haven't updated the blog in a while. Let me tell you what I've been up to and what's coming next."
pubDate: 2026-04-15
tags: ["announcement", "personal", "EN"]
lang: "en"
important: false
---

Sorry folks, I haven't updated the blog in a while.

I'm not dead, I'm just really busy lately.

## What I've Been Working On

Sorry everyone, I've been swamped. First, I was preparing for an internship - after a long process, I finally got an offer from a research institute. And before I left, someone reached out asking if I could build a platform for them. It started as a student competition project, but then they asked if I could sell it to their school department, so I've been working like crazy on it.

But this project is pretty interesting. I can share the tech stack - yesterday I set up a Linux server and deployed Gitea, created a code repository, pushed my progress, and got the services deployed and live. It was exhausting. This was actually my first time doing a proper Linux web service deployment. Since this project has confidentiality requirements, I can't open-source the code, but I can write several related blog posts based on this experience. It's a big system meant for the school to use.

| Layer          | Technology                       | Description                                                     |
| -------------- | -------------------------------- | --------------------------------------------------------------- |
| Frontend       | Vue 3                            | Composition API, single-file components                         |
| Build Tool     | Vite                             | Dev server and production build                                 |
| Styling        | Tailwind CSS                     | Main styling for website and admin pages                        |
| Router         | Vue Router                       | Routes for website, login, admin, and visualization pages       |
| Icons          | lucide-vue-next                  | Icons for admin, login, and showcase pages                      |
| Auth Service   | Node.js + Express                | `/api/auth/login`, `/api/auth/me` and other auth endpoints     |
| Auth Method    | JWT                              | Token stored in frontend after login                            |
| Database       | MySQL                            | Stores accounts for three ends, SQL in `back_end/sql/`          |
| Analysis       | Python + FastAPI                 | Hotel review scraping, data reading, sentiment analysis API       |
| Sentiment      | Transformer / local model files  | Models in `back_end/models/`, inference pipeline in progress   |
| Process Mgmt   | pm2                              | Manages `hotel-auth` and `hotel-analysis` on Linux server      |
| Web Entry      | nginx                            | Serves static frontend, proxies `/api` and `/analysis`          |
| Auto Deploy    | Gitea Webhook + systemd + bash   | Push to `main` triggers webhook, runs `scripts/deploy.sh`       |
| OS             | Ubuntu Linux                     | Target deployment on Ubuntu/Debian Linux                         |

## Why the Blog Went Quiet

I'm about to start my internship soon, and I've been busy with this other project. I really haven't had the energy to write. I actually wanted to write some tutorials about MATLAB - like how to configure MathWorks' official MATLAB MCP, how to use it to design a proper EMS for a solar parking lot. But I only got halfway through that research when this new job came along. I've been coding and testing non-stop, and honestly, I just don't have the bandwidth.

## What's Next

Once I'm back to writing, I'll definitely finish those MATLAB tutorials. I also made a modified Claude Code project that reuses local Codex CLI login state to use Claude Code with Codex - that's a fun alternative to reverse proxies for API access. A few days ago while working on the Linux server for this project, I had a random thought: could I make a modified Claude Code server运维助手 (operations assistant)? Just use natural language for server operations. But I haven't tried anything yet - I'm still busy finishing the client's endless list of requirements, working from morning to night. Once I settle into my research institute internship, I'll write about some of the more advanced tech I'm learning there, assuming there's no NDA blocking me.

---

Anyway, I'm still here. The blog will keep updating - just maybe not weekly.

If there's something you'd like me to write about, let me know in the comments.
