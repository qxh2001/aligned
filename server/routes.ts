import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import bcrypt from "bcrypt";
import crypto from "crypto";
import passport from "passport";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import {
  users, projects, projectMembers, actionItems, documents, deadlines, channels,
  syllabusAnalysisSchema,
} from "@shared/schema";
import { setupAuth, requireAuth } from "./auth";
import { addClient, broadcast } from "./realtime";
import Anthropic from "@anthropic-ai/sdk";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return result.text;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function createAnthropicClient() {
  if (process.env.ANTHROPIC_API_KEY) {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    ...(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL
      ? { baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL }
      : {}),
  });
}

const anthropic = createAnthropicClient();

const SYSTEM_PROMPT = `You are a syllabus analyzer. Given the text content of a course syllabus, extract all important dates, deadlines, exams, projects, and milestones into a structured timeline.

You MUST respond with valid JSON only. No markdown, no explanation, no code fences. Just raw JSON.

The JSON must match this exact schema:
{
  "courseName": "string - full course name",
  "courseCode": "string - course code like CS101 (optional, use empty string if not found)",
  "instructor": "string - instructor name (optional, use empty string if not found)",
  "semester": "string - semester/term info (optional, use empty string if not found)",
  "milestones": [
    {
      "id": "string - unique id like m1, m2, etc",
      "title": "string - short title of the milestone",
      "description": "string - detailed description",
      "date": "string - date in YYYY-MM-DD format. If only a week number or relative date is given, estimate based on semester info. Use America/New_York timezone.",
      "type": "string - one of: assignment, exam, project, reading, lab, presentation, other",
      "weight": "string - grade weight percentage if mentioned, e.g. '10%' (optional)",
      "tips": "string - brief study/preparation tip for this milestone (optional)"
    }
  ],
  "suggestedRoles": [
    {
      "roleName": "string - a team role name relevant to this course project, e.g. Project Lead, Developer, Researcher, Designer, Editor, etc.",
      "description": "string - brief description of what this role does (optional)"
    }
  ],
  "summary": "string - 2-3 sentence summary of the course and its workload"
}

Sort milestones by date ascending. Include ALL deadlines, exams, quizzes, project due dates, presentation dates, and any other graded items mentioned. Suggest 3-5 relevant team roles based on the project type.`;

const STRICT_RETRY_PROMPT = `Your previous response was not valid JSON. You MUST respond with ONLY valid JSON. No markdown code fences, no explanations, no text before or after the JSON. Start your response with { and end with }. Follow the exact schema provided.`;

async function callClaude(syllabusText: string, isRetry: boolean = false): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: isRetry
        ? `${STRICT_RETRY_PROMPT}\n\nSyllabus text:\n${syllabusText}`
        : `Analyze this syllabus and extract the timeline:\n\n${syllabusText}`,
    },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
  });

  const content = response.content[0];
  if (content.type === "text") {
    return content.text;
  }
  throw new Error("Unexpected response type from Claude");
}

function generateInviteToken(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

async function requireProjectMember(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });

  const [membership] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user!.id)));

  if (!membership) return res.status(403).json({ message: "Not a member of this project" });
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existingUsers = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (existingUsers.length > 0) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(users).values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      }).returning();

      req.login({ id: newUser.id, name: newUser.name, email: newUser.email }, (err) => {
        if (err) return res.status(500).json({ message: "Registration succeeded but login failed" });
        return res.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email } });
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({ user: { id: user.id, name: user.name, email: user.email } });
      });
    })(req, res, next);
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    return res.json({ user: { id: req.user!.id, name: req.user!.name, email: req.user!.email } });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        return res.json({ message: "Logged out" });
      });
    });
  });

  app.put("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
      await db.update(users).set({ name: name.trim() }).where(eq(users.id, req.user!.id));
      return res.json({ user: { id: req.user!.id, name: name.trim(), email: req.user!.email } });
    } catch {
      return res.status(500).json({ message: "Update failed" });
    }
  });

  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const memberRows = await db.select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, req.user!.id));

      if (memberRows.length === 0) return res.json([]);

      const projectIds = memberRows.map(r => r.projectId);
      const projectRows = await db.select().from(projects)
        .where(inArray(projects.id, projectIds));

      return res.json(projectRows);
    } catch (err) {
      console.error("Get projects error:", err);
      return res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name?.trim()) return res.status(400).json({ message: "Project name is required" });

      const [project] = await db.insert(projects).values({
        name: name.trim(),
        description: description?.trim() || "",
        inviteToken: generateInviteToken(),
        createdBy: req.user!.id,
        archived: false,
      }).returning();

      await db.insert(projectMembers).values({
        projectId: project.id,
        userId: req.user!.id,
        tags: [],
      });

      return res.json(project);
    } catch (err) {
      console.error("Create project error:", err);
      return res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) return res.status(404).json({ message: "Project not found" });

      const members = await db.select({
        id: projectMembers.id,
        userId: projectMembers.userId,
        tags: projectMembers.tags,
        role: projectMembers.role,
        userName: users.name,
        userEmail: users.email,
      }).from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId));

      const projectChannels = await db.select().from(channels).where(eq(channels.projectId, projectId));
      const projectDocs = await db.select().from(documents).where(eq(documents.projectId, projectId));
      const projectDeadlines = await db.select().from(deadlines).where(eq(deadlines.projectId, projectId));
      const projectActions = await db.select().from(actionItems).where(eq(actionItems.projectId, projectId));

      return res.json({
        ...project,
        members: members.map(m => ({
          userId: m.userId,
          name: m.userName,
          email: m.userEmail,
          tags: m.tags,
          role: m.role,
        })),
        channels: projectChannels.map(c => ({
          appKey: c.appKey,
          label: c.label,
          iconUrl: c.iconUrl,
          link: c.link,
        })),
        documents: projectDocs,
        deadlines: projectDeadlines,
        actionItems: projectActions,
      });
    } catch (err) {
      console.error("Get project error:", err);
      return res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects/:id/action-items", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { text: itemText } = req.body;
      if (!itemText?.trim()) return res.status(400).json({ message: "Text is required" });

      const [item] = await db.insert(actionItems).values({
        text: itemText.trim(),
        projectId,
        createdBy: req.user!.id,
      }).returning();

      broadcast(projectId, "action_item_added", item);
      return res.json(item);
    } catch (err) {
      return res.status(500).json({ message: "Failed to add action item" });
    }
  });

  app.delete("/api/projects/:id/action-items/:itemId", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const projectId = parseInt(req.params.id);
      await db.delete(actionItems).where(and(eq(actionItems.id, itemId), eq(actionItems.projectId, projectId)));
      broadcast(projectId, "action_item_removed", { id: itemId });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove action item" });
    }
  });

  app.post("/api/projects/:id/documents", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { label, url, tool } = req.body;
      if (!url?.trim()) return res.status(400).json({ message: "URL is required" });

      const [doc] = await db.insert(documents).values({
        projectId,
        label: label?.trim() || url.trim(),
        url: url.trim(),
        tool: tool || "other",
      }).returning();

      broadcast(projectId, "document_added", doc);
      return res.json(doc);
    } catch (err) {
      return res.status(500).json({ message: "Failed to add document" });
    }
  });

  app.delete("/api/projects/:id/documents/:docId", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const docId = parseInt(req.params.docId);
      const projectId = parseInt(req.params.id);
      await db.delete(documents).where(and(eq(documents.id, docId), eq(documents.projectId, projectId)));
      broadcast(projectId, "document_removed", { id: docId });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove document" });
    }
  });

  app.put("/api/projects/:id/channels", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const newChannels: { appKey: string; label: string; iconUrl?: string; link?: string }[] = req.body.channels || [];

      await db.delete(channels).where(eq(channels.projectId, projectId));

      if (newChannels.length > 0) {
        await db.insert(channels).values(
          newChannels.map(c => ({
            projectId,
            appKey: c.appKey,
            label: c.label,
            iconUrl: c.iconUrl || null,
            link: c.link || null,
          }))
        );
      }

      const updated = await db.select().from(channels).where(eq(channels.projectId, projectId));
      broadcast(projectId, "channels_updated", updated);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update channels" });
    }
  });

  app.put("/api/projects/:id/channels/:appKey/link", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { link } = req.body;
      await db.update(channels).set({ link: link || null })
        .where(and(eq(channels.projectId, projectId), eq(channels.appKey, req.params.appKey)));
      broadcast(projectId, "channels_updated", {});
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Failed to update channel link" });
    }
  });

  app.post("/api/projects/:id/members/:userId/tags", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const { tags } = req.body;
      await db.update(projectMembers).set({ tags: tags || [] })
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
      broadcast(projectId, "tags_updated", { userId, tags });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Failed to update tags" });
    }
  });

  app.delete("/api/projects/:id/members/:userId", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const [project] = await db.select({ createdBy: projects.createdBy }).from(projects).where(eq(projects.id, projectId));
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (userId === project.createdBy) {
        return res.status(403).json({ message: "Cannot remove the project creator" });
      }

      if (req.user!.id !== project.createdBy && req.user!.id !== userId) {
        return res.status(403).json({ message: "Only the project creator can remove other members" });
      }

      await db.delete(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
      broadcast(projectId, "member_removed", { userId });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove member" });
    }
  });

  app.get("/api/invite/:token", async (req, res) => {
    try {
      const [project] = await db.select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(eq(projects.inviteToken, req.params.token));
      if (!project) return res.status(404).json({ message: "Invalid invite link" });
      return res.json(project);
    } catch (err) {
      return res.status(500).json({ message: "Failed to look up invite" });
    }
  });

  app.post("/api/invite/:token", requireAuth, async (req, res) => {
    try {
      const [project] = await db.select().from(projects)
        .where(eq(projects.inviteToken, req.params.token));
      if (!project) return res.status(404).json({ message: "Invalid invite link" });

      const [existing] = await db.select().from(projectMembers)
        .where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, req.user!.id)));

      if (!existing) {
        await db.insert(projectMembers).values({
          projectId: project.id,
          userId: req.user!.id,
          tags: [],
        });
        broadcast(project.id, "member_joined", { userId: req.user!.id, name: req.user!.name, email: req.user!.email });
      }

      return res.json({ projectId: project.id, name: project.name });
    } catch (err) {
      return res.status(500).json({ message: "Failed to join project" });
    }
  });

  app.get("/api/projects/:id/events", requireAuth, requireProjectMember, (req, res) => {
    const projectId = parseInt(req.params.id);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.write("event: connected\ndata: {}\n\n");
    addClient(projectId, res);
  });

  app.post("/api/projects/:id/analyze-syllabus", requireAuth, requireProjectMember, (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ success: false, error: "File size exceeds 10MB limit" });
          }
          return res.status(400).json({ success: false, error: err.message });
        }
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      let syllabusText = "";

      if (req.file) {
        syllabusText = await extractPdfText(req.file.buffer);
      } else if (req.body.text) {
        syllabusText = req.body.text;
      } else {
        return res.status(400).json({ success: false, error: "Please upload a PDF file or paste syllabus text" });
      }

      if (syllabusText.trim().length < 200) {
        return res.status(422).json({
          success: false,
          error: "The extracted text is too short. The PDF may be image-based or corrupted. Please paste the syllabus text directly instead.",
        });
      }

      let rawOutput = "";
      let parsed: unknown;

      try {
        rawOutput = await callClaude(syllabusText);
        const cleaned = rawOutput.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        try {
          rawOutput = await callClaude(syllabusText, true);
          const cleaned = rawOutput.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch {
          return res.status(500).json({ success: false, error: "Failed to parse AI response. Please try again." });
        }
      }

      const validated = syllabusAnalysisSchema.safeParse(parsed);
      if (!validated.success) {
        return res.status(500).json({ success: false, error: "AI response did not match expected format. Please try again." });
      }

      await db.delete(deadlines).where(eq(deadlines.projectId, projectId));

      if (validated.data.milestones.length > 0) {
        await db.insert(deadlines).values(
          validated.data.milestones.map(m => ({
            projectId,
            title: m.title,
            description: m.description || "",
            date: m.date,
            type: m.type,
            weight: m.weight || null,
            tips: m.tips || null,
            milestoneId: m.id,
          }))
        );
      }

      await db.update(projects).set({ summary: validated.data.summary }).where(eq(projects.id, projectId));

      broadcast(projectId, "deadlines_updated", {});
      return res.json({ success: true, data: validated.data });
    } catch (error: any) {
      console.error("Analysis error:", error);
      return res.status(500).json({ success: false, error: "An unexpected error occurred. Please try again." });
    }
  });

  app.post("/api/analyze-syllabus", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ success: false, error: "File size exceeds 10MB limit" });
          }
          return res.status(400).json({ success: false, error: err.message });
        }
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      let syllabusText = "";
      if (req.file) {
        syllabusText = await extractPdfText(req.file.buffer);
      } else if (req.body.text) {
        syllabusText = req.body.text;
      } else {
        return res.status(400).json({ success: false, error: "Please upload a PDF file or paste syllabus text" });
      }

      if (syllabusText.trim().length < 200) {
        return res.status(422).json({
          success: false,
          error: "The extracted text is too short. Please paste the syllabus text directly instead.",
        });
      }

      let rawOutput = "";
      let parsed: unknown;
      try {
        rawOutput = await callClaude(syllabusText);
        const cleaned = rawOutput.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        try {
          rawOutput = await callClaude(syllabusText, true);
          const cleaned = rawOutput.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch {
          return res.status(500).json({ success: false, error: "Failed to parse AI response. Please try again." });
        }
      }

      const validated = syllabusAnalysisSchema.safeParse(parsed);
      if (!validated.success) {
        return res.status(500).json({ success: false, error: "AI response did not match expected format. Please try again." });
      }
      return res.json({ success: true, data: validated.data });
    } catch (error: any) {
      console.error("Analysis error:", error);
      return res.status(500).json({ success: false, error: "An unexpected error occurred. Please try again." });
    }
  });

  return httpServer;
}
