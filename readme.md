# Aligned - Student Team Coordination Tool

## Overview
A multi-project workspace for student teams. Features include AI-powered syllabus analysis, team coordination widgets, communication channels, document organizer, invite links, timeline management, and real-time sync.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + wouter routing
- **Backend**: Express.js API server with PostgreSQL (Drizzle ORM)
- **AI**: Claude (Anthropic) via Replit AI Integrations
- **Storage**: Supabase PostgreSQL (Drizzle ORM with drizzle-kit), falls back to local DATABASE_URL
- **Auth**: Email + password (bcrypt), session-based (express-session + connect-pg-simple + Passport.js local strategy)
- **Real-time**: Server-Sent Events (SSE) for live project updates

## Design System
- **Theme**: Lavender/purple (#C5BAE0 base, HSL 260)
- **Primary**: HSL 260 35% 58%
- **Background**: HSL 260 20% 97%
- **Cards**: Glassmorphism-lite (glass-card utility class)
- **Fonts**: Syne (display/headings), DM Sans (body)
- **Corners**: 12-16px rounded (rounded-xl/2xl)
- **Shadows**: Soft, layered drop shadows

## Routes
- `/login` - Login/signup page (email + password)
- `/invite/:token` - Join project via invite link (auth required)
- `/app` - Dashboard with upcoming deadlines + action items
- `/app/projects/new` - Create new project form
- `/app/projects/:id` - Project detail (single scrollable page)
- `/app/account` - Account settings page

## Database Schema (PostgreSQL)
- `users` - id, name, email (unique), password_hash, created_at
- `projects` - id, name, description, invite_token (unique), summary, created_by (FK users), archived, created_at
- `project_members` - id, project_id (FK), user_id (FK), tags (text[]), role, joined_at; unique(project_id, user_id)
- `action_items` - id, text, project_id (FK), created_by (FK), created_at
- `documents` - id, project_id (FK), label, url, tool, created_at
- `deadlines` - id, project_id (FK), title, description, date, type, weight, tips, milestone_id, created_at
- `channels` - id, project_id (FK), app_key, label, icon_url, link
- `session` - connect-pg-simple session store

## Key Files
- `shared/schema.ts` - Drizzle table definitions + Zod schemas for AI analysis validation
- `server/db.ts` - PostgreSQL pool + Drizzle client
- `server/auth.ts` - Passport.js local strategy, session config, requireAuth middleware
- `server/realtime.ts` - SSE broadcast system for real-time project updates
- `server/routes.ts` - All API routes (auth, projects, action items, documents, channels, members, invite, syllabus analysis)
- `client/src/lib/auth.tsx` - AuthContext provider with login/register/logout
- `client/src/lib/store.ts` - Async API wrapper functions for all CRUD operations
- `client/src/App.tsx` - Location-based routing with AuthProvider wrapper
- `client/src/components/TopBar.tsx` - App header with Syne logo and avatar menu
- `client/src/components/Sidebar.tsx` - Collapsible sidebar with async project loading
- `client/src/components/ToolIcon.tsx` - Tool icons (Google Drive, Notion, GitHub, Figma, etc.)
- `client/src/components/TimelineWidget.tsx` - Milestone timeline with vertical spine
- `client/src/pages/login.tsx` - Login/register with email + password
- `client/src/pages/join.tsx` - Join project via invite token (auto-join if logged in)
- `client/src/pages/dashboard.tsx` - Upcoming deadlines + action items (from API)
- `client/src/pages/add-project.tsx` - New project creation with syllabus upload
- `client/src/pages/project-detail.tsx` - People, Communication Channels, Documents, Timeline, Action Items with SSE live updates
- `client/src/pages/account.tsx` - User settings (name, email display)

## API Endpoints
### Auth
- `POST /api/auth/register` - Create account (name, email, password)
- `POST /api/auth/login` - Login with email + password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user name
- `POST /api/auth/logout` - Logout

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project (auto-generates invite token)
- `GET /api/projects/:id` - Get project with members, channels, docs, deadlines, action items
- `POST /api/projects/:id/action-items` - Add action item
- `DELETE /api/projects/:id/action-items/:itemId` - Remove action item
- `POST /api/projects/:id/documents` - Add document
- `DELETE /api/projects/:id/documents/:docId` - Remove document
- `PUT /api/projects/:id/channels` - Replace all channels
- `PUT /api/projects/:id/channels/:appKey/link` - Update channel link
- `POST /api/projects/:id/members/:userId/tags` - Update member tags
- `DELETE /api/projects/:id/members/:userId` - Remove member
- `GET /api/projects/:id/events` - SSE stream for real-time updates
- `POST /api/projects/:id/analyze-syllabus` - Analyze syllabus and save deadlines

### Invite
- `GET /api/invite/:token` - Get project info by invite token
- `POST /api/invite/:token` - Join project via invite token

### Legacy
- `POST /api/analyze-syllabus` - Standalone syllabus analysis (returns data, doesn't save)

## Access Control
- All project routes require authentication (requireAuth middleware)
- Project-scoped routes require project membership (requireProjectMember middleware)
- Users can only see projects they are members of

## Environment Variables
- `SUPABASE_DATABASE_URL` - Supabase PostgreSQL pooler connection string (preferred)
- `DATABASE_URL` - Fallback PostgreSQL connection string (used if SUPABASE_DATABASE_URL not set)
- `SESSION_SECRET` - Express session secret
- `ANTHROPIC_API_KEY` - Direct Anthropic API key (preferred)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Fallback Anthropic key via Replit AI Integrations
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Fallback Anthropic base URL via Replit AI Integrations

## Dependencies
- `pdf-parse`, `multer`, `@anthropic-ai/sdk`, `react-icons`
- `passport`, `passport-local`, `bcrypt`, `express-session`, `connect-pg-simple`
- `drizzle-orm`, `drizzle-zod`, `drizzle-kit`
