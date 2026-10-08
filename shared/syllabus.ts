import { z } from "zod";

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const calendarDate = z.string().refine(isCalendarDate, "Use a real date in YYYY-MM-DD format");
export const reviewedMilestoneSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  description: z.string().max(3000),
  date: calendarDate,
  type: z.enum(["assignment", "exam", "project", "reading", "lab", "presentation", "other"]),
  weight: z.string().max(100).optional(),
  tips: z.string().max(1000).optional(),
  sourceText: z.string().max(3000).optional(),
});
export const analysisMilestoneSchema = reviewedMilestoneSchema.extend({
  date: z.string().max(10),
  dateStatus: z.enum(["explicit", "unresolved"]),
  sourceText: z.string().max(3000),
});
export const analysisSchema = z.object({
  courseName: z.string().max(300),
  courseCode: z.string().max(100).optional(),
  instructor: z.string().max(300).optional(),
  semester: z.string().max(100).optional(),
  milestones: z.array(analysisMilestoneSchema).max(100),
  suggestedRoles: z.array(z.object({ roleName: z.string(), description: z.string().optional() })).max(10).optional(),
  summary: z.string().max(5000),
});
export type AnalysisDraft = z.infer<typeof analysisSchema>;
export const reviewedTimelineSchema = z.object({
  confirmed: z.literal(true),
  summary: z.string().max(5000),
  milestones: z.array(reviewedMilestoneSchema).max(100),
}).refine(({ milestones }) => new Set(milestones.map(m => m.id)).size === milestones.length, "Milestone IDs must be unique");

// A source quote is evidence to review, not proof the model converted the date correctly.
export function groundAnalysis(raw: unknown, syllabusText: string): AnalysisDraft {
  const draft = analysisSchema.parse(raw);
  const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
  const source = normalize(syllabusText);
  draft.milestones = draft.milestones.map((m): AnalysisDraft["milestones"][number] => {
    const quote = normalize(m.sourceText);
    const grounded = quote.length > 0 && source.includes(quote);
    return {
      ...m,
      sourceText: grounded ? m.sourceText : "",
      date: grounded && m.dateStatus === "explicit" && isCalendarDate(m.date) ? m.date : "",
      dateStatus: grounded && m.dateStatus === "explicit" && isCalendarDate(m.date) ? "explicit" : "unresolved",
    };
  }).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return draft;
}
