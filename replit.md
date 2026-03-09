# Aligned - Student Team Coordination Tool

## Overview
A multi-project workspace for student teams. Features include AI-powered syllabus analysis, team coordination widgets, role assignment, document organizer, invite links, and timeline management.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + wouter routing
- **Backend**: Express.js API server
- **AI**: Claude (Anthropic) via Replit AI Integrations
- **Storage**: localStorage + React state (no database, MVP)
- **Auth**: Fake auth via localStorage (MVP)

## Design System
- **Background**: Warm off-white (#FAFAF8)
- **Cards**: Glassmorphism-lite (glass-card utility class)
- **Fonts**: Syne (display/headings), DM Sans (body)
- **Accent**: Indigo (234 85% 55%)
- **Corners**: 12-16px rounded (rounded-xl/2xl)
- **Shadows**: Soft, layered drop shadows
- **Schema version**: v2 (localStorage cleared on schema change)

## Routes
- `/login` - Login/signup page (fake auth)
- `/app` - Dashboard with vertical timeline + action items
- `/app/projects/new` - Create new project form
- `/app/projects/:id` - Project detail with tabs (Overview, Documents, Timeline)
- `/app/account` - Account settings page

## Key Files
- `shared/schema.ts` - Zod schemas, Project type with DocEntry, ProjectMember (name+tags), ToolType
- `server/routes.ts` - POST `/api/analyze-syllabus` (multer + pdf-parse + Claude)
- `client/src/App.tsx` - Location-based routing with auth guard, schema version migration
- `client/src/lib/store.ts` - localStorage CRUD for projects, members, documents, tags
- `client/src/components/TopBar.tsx` - App header with Syne logo and avatar menu
- `client/src/components/Sidebar.tsx` - Collapsible sidebar with Dashboard link + project list
- `client/src/components/ToolIcon.tsx` - Tool icons (Google Drive, Notion, GitHub, Figma, etc.)
- `client/src/components/TimelineWidget.tsx` - Milestone timeline with vertical spine
- `client/src/pages/login.tsx` - Glass-card login form
- `client/src/pages/dashboard.tsx` - Vertical timeline + action items (no todos)
- `client/src/pages/add-project.tsx` - New project creation with syllabus upload
- `client/src/pages/project-detail.tsx` - Tabbed project view (Overview, Docs, Timeline)
- `client/src/pages/account.tsx` - User settings

## Data Model (localStorage)
Project: id, name, description, inviteCode, members[{email, name, tags[]}], milestones[], roles[], documents[{id, label, url, tool}], schedulerLink, actionItems[], summary, archived, createdAt

## Features
- **No To-Do List**: Removed; Action Items kept
- **Add Project**: Button labeled "Add Project" (not generic "Add")
- **Documents**: Per-project document organizer with 10 tool icons (GDrive, Notion, GitHub, Figma, Dropbox, Confluence, Slack, Jira, Loom, Airtable)
- **Invite Link**: Per-project shareable invite URL with copy button
- **People**: Read-only member list (join via invite), removable, with freeform pill-shaped tags
- **Vertical Timeline**: Weekly spine with day nodes, today highlighted, overflow section

## API
- `POST /api/analyze-syllabus` - Accepts PDF upload (<=10MB) or text field
  - Returns milestones, suggestedRoles, summary via Claude analysis

## Dependencies
- `pdf-parse`, `multer`, `@anthropic-ai/sdk`, `react-icons`
- Environment: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
