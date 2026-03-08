import { z } from "zod";

export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  type: z.enum(["assignment", "exam", "project", "reading", "lab", "presentation", "other"]),
  weight: z.string().optional(),
  tips: z.string().optional(),
});

export const syllabusAnalysisSchema = z.object({
  courseName: z.string(),
  courseCode: z.string().optional(),
  instructor: z.string().optional(),
  semester: z.string().optional(),
  milestones: z.array(milestoneSchema),
  summary: z.string(),
});

export type Milestone = z.infer<typeof milestoneSchema>;
export type SyllabusAnalysis = z.infer<typeof syllabusAnalysisSchema>;

export interface AnalysisResponse {
  success: boolean;
  data?: SyllabusAnalysis;
  error?: string;
}
