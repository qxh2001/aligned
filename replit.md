# Aligned - Student Team Coordination Tool

## Overview
A multi-project workspace for student teams. Features include AI-powered syllabus analysis, team coordination widgets, role assignment, and timeline management.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + wouter routing
- **Backend**: Express.js API server
- **AI**: Claude (Anthropic) via Replit AI Integrations
- **Storage**: localStorage + React state (no database, MVP)
- **Auth**: Fake auth via localStorage (MVP)

## Routes
- `/login` - Login/signup page (fake auth)
- `/app` - Dashboard with upcoming deadlines, todos, action items
- `/app/projects/new` - Create new project form
- `/app/projects/:id` - Project detail with widgets (timeline, docs, scheduler, roles)
- `/app/account` - Account settings page

## Key Files
- `shared/schema.ts` - Zod schemas for milestone, analysis, and project types
- `server/routes.ts` - POST `/api/analyze-syllabus` (multer + pdf-parse + Claude)
- `client/src/App.tsx` - Location-based routing with auth guard
- `client/src/lib/store.ts` - localStorage CRUD operations for projects, auth, user
- `client/src/components/TopBar.tsx` - App header with logo and avatar menu
- `client/src/components/Sidebar.tsx` - Collapsible project navigation
- `client/src/components/TimelineWidget.tsx` - Milestone timeline display
- `client/src/pages/login.tsx` - Login form
- `client/src/pages/dashboard.tsx` - Dashboard with aggregated widgets
- `client/src/pages/add-project.tsx` - New project creation with syllabus upload
- `client/src/pages/project-detail.tsx` - Project view with doc/scheduler/roles/timeline widgets
- `client/src/pages/account.tsx` - User settings

## Data Model (localStorage)
Project: id, name, members[], milestones[], roles[], docsLink, schedulerLink, todos[], actionItems[], summary, archived, createdAt

## API
- `POST /api/analyze-syllabus` - Accepts PDF upload (<=10MB) or text field
  - Returns milestones, suggestedRoles, summary via Claude analysis
  - Zod validation, JSON retry logic, 200-char minimum text requirement

## Dependencies
- `pdf-parse` (CJS via createRequire), `multer`, `@anthropic-ai/sdk`
- Environment: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`

## Mock Data
Two projects seeded on first load: "CS 301 - Group Project" and "COMM 210 - Presentation"
