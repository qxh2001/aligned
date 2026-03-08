import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import Anthropic from "@anthropic-ai/sdk";
import { syllabusAnalysisSchema } from "@shared/schema";

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

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
        const pdfData = await pdfParse(req.file.buffer);
        syllabusText = pdfData.text;
      } else if (req.body.text) {
        syllabusText = req.body.text;
      } else {
        return res.status(400).json({ success: false, error: "Please upload a PDF file or paste syllabus text" });
      }

      if (syllabusText.trim().length < 200) {
        return res.status(422).json({
          success: false,
          error: "The extracted text is too short (less than 200 characters). The PDF may be image-based or corrupted. Please paste the syllabus text directly instead.",
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
          console.error("Claude returned invalid JSON after retry:", rawOutput);
          return res.status(500).json({
            success: false,
            error: "Failed to parse AI response. Please try again.",
            _debug: rawOutput,
          });
        }
      }

      const validated = syllabusAnalysisSchema.safeParse(parsed);
      if (!validated.success) {
        console.error("Zod validation failed:", validated.error.format());
        return res.status(500).json({
          success: false,
          error: "AI response did not match expected format. Please try again.",
        });
      }

      return res.json({ success: true, data: validated.data });
    } catch (error: any) {
      console.error("Analysis error:", error);
      return res.status(500).json({ success: false, error: "An unexpected error occurred. Please try again." });
    }
  });

  return httpServer;
}
