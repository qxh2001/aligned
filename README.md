# Aligned

**Aligned** is a collaborative workspace for student project teams. It brings together AI-powered syllabus analysis, deadline tracking, team coordination, and communication tools — all in one place.

---

## Features

- **AI Syllabus Analysis** — Upload a syllabus PDF and automatically extract deadlines, milestones, and tips
- **Project Dashboard** — View upcoming deadlines and action items across all your projects at a glance
- **Team Management** — Invite members via shareable links, assign roles and tags
- **Communication Channels** — Connect Slack, Discord, or any tool your team already uses
- **Document Organizer** — Link Google Drive, Notion, Figma, GitHub, and more
- **Timeline Widget** — Visualize project milestones on a vertical timeline
- **Action Items** — Shared to-do list with real-time sync across all team members
- **Real-time Updates** — Live project state via Server-Sent Events (SSE)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Routing | wouter |
| Backend | Express.js |
| Database | PostgreSQL via Supabase (Drizzle ORM) |
| Auth | Passport.js (email + password, session-based) |
| AI | Claude (Anthropic API) |
| Real-time | Server-Sent Events (SSE) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)

### Installation

```bash
git clone https://github.com/qxh2001/aligned.git
cd aligned
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_DATABASE_URL=your_supabase_pooler_connection_string
SESSION_SECRET=your_session_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Run

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

---

## Screenshots

> Coming soon

---

## License

MIT
