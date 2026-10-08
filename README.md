# Aligned

An AI-assisted coordination workspace that helps student teams turn a syllabus into a shared plan, with deadlines, action items, documents, and communication links in one place.

[Product site](https://aligned-teams.org) · [Demo video](./Demo.MOV) · [Katherine's portfolio](https://katherinexu.me)

![Aligned project workspace](./aligned-demo.png)

## Why this product

Student teams spread course requirements, decisions, and documents across several tools. Aligned starts with syllabus deadline extraction so a team gets a useful shared timeline before it has to maintain another workspace. Scheduling was deferred because it requires more setup and participation before delivering value.

This was a MIT Sloan product-management course project, built and deployed as an MVP in two weeks. It is a completed course MVP and early pilot, not a claim of sustained adoption.

## My contribution

**Katherine Xu:** interviewed MIT Sloan and Harvard graduate students, defined a seven-feature roadmap, and prioritized the first usable workflow. I owned deployment to Vercel and Supabase and built the public landing site. **A teammate built the core application.**

Getting the Replit prototype into production involved bundling the API with esbuild, resolving ESM/CommonJS compatibility, pinning a PDF parser compatible with the server runtime, and fixing login sessions behind Vercel's proxy. I also addressed syllabus-analysis timeouts and awaited email notifications before a serverless function returned.

An eight-user pilot reported **100% task completion** and a **30% reduction in coordination time**. These are reported results from a small early pilot, not a controlled effectiveness study or evidence of long-term retention.

## Workflow and stack

Create a project, upload a syllabus PDF or paste its text, and generate shared milestones. Invite teammates, manage action items, and link the documents and communication tools the team already uses.

Slack, Discord, Drive, Notion, and other resources are **links in a shared hub**, not native two-way integrations.

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, wouter |
| Backend | Express, Passport sessions |
| Database | Supabase PostgreSQL, Drizzle ORM |
| AI extraction | Claude |
| Hosting | Vercel, with a separate public landing site |

The prototype's SSE broadcaster keeps clients in process memory. On serverless deployments, cross-instance broadcasts and long-lived connections are limited; the MVP does not guarantee real-time delivery across instances. Refreshing the project retrieves saved state.

## Run locally

Use Node.js **22.12+** and a dedicated PostgreSQL development database. An Anthropic API key is required for live syllabus analysis.

```bash
git clone https://github.com/qxh2001/aligned.git
cd aligned
npm ci
```

Export `DATABASE_URL` for local PostgreSQL, or `SUPABASE_DATABASE_URL` for a development Supabase pooler. Also export a long random `SESSION_SECRET` and your own `ANTHROPIC_API_KEY`. The current scripts read the shell environment; they do not automatically load an environment file. Keep credentials out of Git.

```bash
# Review proposed schema changes and use a development database.
npm run db:push
npm run dev
```

Open `http://localhost:5000`. Passport's session store creates its session table at startup. Optional SMTP notifications require `SMTP_USER`, `SMTP_PASS`, and `NOTIFY_EMAIL` in the environment.

## Reliability work

The current MVP can estimate incomplete dates. Verify extracted milestones against the syllabus; an AI-generated date is not evidence of a confirmed deadline.

A [reliability update](https://github.com/qxh2001/aligned/pulls) is being prepared with source quotes, explicit date review before saving, persistent request quotas, bounded model calls, reproducible setup, tests, CI, and synthetic extraction evaluations. Its branch includes staging migration and rollout instructions. Those changes should not be treated as deployed until the update is merged and released.

## License

The project declares MIT in its package metadata. See [LICENSE](./LICENSE).
