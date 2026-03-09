# Aligned - Student Team Coordination Tool

## Overview
A multi-project workspace for student teams. Features include AI-powered syllabus analysis, team coordination widgets, communication channels, document organizer, invite links, and timeline management.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + wouter routing
- **Backend**: Express.js API server
- **AI**: Claude (Anthropic) via Replit AI Integrations
- **Storage**: localStorage + React state (no database, MVP)
- **Auth**: Fake auth via localStorage (MVP)

## Design System
- **Theme**: Lavender/purple (#C5BAE0 base, HSL 260)
- **Primary**: HSL 260 35% 58%
- **Background**: HSL 260 20% 97%
- **Cards**: Glassmorphism-lite (glass-card utility class)
- **Fonts**: Syne (display/headings), DM Sans (body)
- **Corners**: 12-16px rounded (rounded-xl/2xl)
- **Shadows**: Soft, layered drop shadows
- **Schema version**: v2 (localStorage cleared on schema change)

## Routes
- `/login` - Login/signup page (fake auth)
- `/join/:inviteCode` - Join project via invite link
- `/app` - Dashboard with upcoming deadlines + action items
- `/app/projects/new` - Create new project form
- `/app/projects/:id` - Project detail (single scrollable page)
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
- `client/src/pages/join.tsx` - Join project via invite code
- `client/src/pages/dashboard.tsx` - Upcoming deadlines (flat list with date+day) + action items
- `client/src/pages/add-project.tsx` - New project creation with syllabus upload
- `client/src/pages/project-detail.tsx` - Single page: People, Communication Channels, Documents, Timeline
- `client/src/pages/account.tsx` - User settings

## Data Model (localStorage)
Project: id, name, description, inviteCode, members[{email, name, tags[]}], milestones[], roles[], channels[{appKey, label, iconUrl?, link?}], documents[{id, label, url, tool}], actionItems[], summary, archived, createdAt

## Features
- **Dashboard**: Flat "Upcoming Deadlines" list with date + day-of-week, Action Items widget
- **Project Detail**: Single scrollable page (no tabs), invite button in header
- **Communication Channels**: Modal picker with 15 built-in apps (Slack, Discord, Teams, WhatsApp, Telegram, Email, Zoom, Google Meet, Loom, Line, Instagram, WeChat, KakaoTalk, Messenger, iMessage) + custom app support. Selected channels show as icon badges with optional link/handle attachment and "Open" button.
- **Documents**: Per-project document organizer with 10 tool icons
- **Invite Link**: Per-project shareable invite URL with compact copy button in header
- **People**: Member list with freeform pill-shaped tags
- **Timeline**: Milestone timeline with type badges

## API
- `POST /api/analyze-syllabus` - Accepts PDF upload (<=10MB) or text field
  - Returns milestones, suggestedRoles, summary via Claude analysis

## Dependencies
- `pdf-parse`, `multer`, `@anthropic-ai/sdk`, `react-icons`
- Environment: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
