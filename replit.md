# Syllabus Timeline Analyzer

## Overview
An AI-powered web application that analyzes course syllabi and generates visual timelines of deadlines, exams, and milestones.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + wouter routing
- **Backend**: Express.js API server
- **AI**: Claude (Anthropic) via Replit AI Integrations (no API key needed)
- **Storage**: In-memory React state only (no database)

## Key Features
- PDF upload (up to 10MB) or text paste input
- Claude-powered syllabus analysis extracting milestones
- Visual timeline with type-based filtering
- Study tips for each milestone
- Responsive design

## File Structure
- `shared/schema.ts` - Zod schemas for milestone and analysis types
- `server/routes.ts` - POST `/api/analyze-syllabus` endpoint (multer + pdf-parse + Claude)
- `client/src/pages/home.tsx` - Upload page with drag-and-drop
- `client/src/pages/project.tsx` - Results page with stats and filters
- `client/src/components/Timeline.tsx` - Timeline visualization component
- `client/src/App.tsx` - Router with analysis state management

## API
- `POST /api/analyze-syllabus` - Accepts multipart form with `file` (PDF) or `text` field
  - Returns `{ success: boolean, data?: SyllabusAnalysis, error?: string }`
  - Validates PDF type and 10MB size limit
  - Requires extracted text >= 200 chars
  - Retries Claude once on JSON parse failure
  - Validates response with Zod schema

## Dependencies
- `pdf-parse` - PDF text extraction (loaded via createRequire for CJS compat)
- `multer` - File upload handling
- `@anthropic-ai/sdk` - Claude API client (via Replit AI Integrations)
- Environment: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
