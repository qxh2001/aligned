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

export const suggestedRoleSchema = z.object({
  roleName: z.string(),
  description: z.string().optional(),
});

export const syllabusAnalysisSchema = z.object({
  courseName: z.string(),
  courseCode: z.string().optional(),
  instructor: z.string().optional(),
  semester: z.string().optional(),
  milestones: z.array(milestoneSchema),
  suggestedRoles: z.array(suggestedRoleSchema).optional(),
  summary: z.string(),
});

export type Milestone = z.infer<typeof milestoneSchema>;
export type SuggestedRole = z.infer<typeof suggestedRoleSchema>;
export type SyllabusAnalysis = z.infer<typeof syllabusAnalysisSchema>;

export type ToolType = "gdrive" | "notion" | "github" | "figma" | "dropbox" | "confluence" | "slack" | "jira" | "loom" | "airtable" | "other";

export interface DocEntry {
  id: string;
  label: string;
  url: string;
  tool: ToolType;
}

export interface ProjectMember {
  email: string;
  name: string;
  tags: string[];
}

export interface ProjectRole {
  roleName: string;
  assignedToEmail: string | null;
}

export interface ChannelEntry {
  appKey: string;
  label: string;
  iconUrl?: string;
  link?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  members: ProjectMember[];
  milestones: Milestone[];
  roles: ProjectRole[];
  channels: ChannelEntry[];
  documents: DocEntry[];
  schedulerLink: string | null;
  actionItems: string[];
  summary: string | null;
  archived: boolean;
  createdAt: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: SyllabusAnalysis;
  error?: string;
}
