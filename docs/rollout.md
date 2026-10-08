# Rollout checklist

The documentation on `main` can ship independently. This API/UI change needs an additive database migration before deployment. Keep the code PR unmerged until the staging checks below pass.

1. Back up the existing database and use a staging database with representative projects and deadlines.
2. Apply `migrations/ai_usage.sql` using your database administration tool. It adds `ai_usage`, `deadlines.source_text`, and `deadlines.date_status`; it does not change existing deadline dates. Existing deadlines receive `date_status = 'legacy'` and no source quote.
3. Set a stable random `SESSION_SECRET`. Leave `ALLOW_PUBLIC_AI_DEMO` unset unless anonymous analysis is intentionally enabled. Set `AI_HOURLY_LIMIT` and `AI_DAILY_LIMIT` to the desired request ceilings and configure provider spending controls.
4. Deploy this branch to staging. Verify sign-in, old timelines, PDF/text analysis, blank unresolved dates, cancellation, and confirmation before replacement. Check that a failed save preserves the previous timeline and a nonmember cannot analyze or save another team's timeline.
5. Verify quota denial and a database outage without live model calls where possible. Each accepted analysis can issue up to two paid provider calls. Tests use synthetic text and a separate disposable database.
6. After staging passes, apply the same additive migration to production, merge the code PR, and deploy. Smoke-test the same authenticated workflow. Do not run test-table truncation against production.

Rollback: revert the application commit and redeploy the previous version. Keep the additive columns/table during rollback; the old app ignores them. Do not drop production data as part of rollback. An app rollback does not undo timelines that people have already reviewed and saved.

GitHub CI validates builds and quota concurrency with PostgreSQL. It cannot validate your Vercel environment, production database settings, or provider responses. No production migration is performed by this PR.
