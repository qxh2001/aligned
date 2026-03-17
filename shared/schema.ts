import { pgTable, serial, text, boolean, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  inviteToken: text("invite_token").notNull().unique(),
  summary: text("summary"),
  createdBy: integer("created_by").references(() => users.id),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, inviteToken: true, createdBy: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type SelectProject = typeof projects.$inferSelect;

export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tags: text("tags").array().default([]).notNull(),
  role: text("role"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (t) => [unique().on(t.projectId, t.userId)]);

export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({ id: true, joinedAt: true });
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type SelectProjectMember = typeof projectMembers.$inferSelect;

export const actionItems = pgTable("action_items", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({ id: true, createdAt: true });
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type SelectActionItem = typeof actionItems.$inferSelect;

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  tool: text("tool").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type SelectDocument = typeof documents.$inferSelect;

export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  date: text("date").notNull(),
  type: text("type").notNull(),
  weight: text("weight"),
  tips: text("tips"),
  milestoneId: text("milestone_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDeadlineSchema = createInsertSchema(deadlines).omit({ id: true, createdAt: true });
export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;
export type SelectDeadline = typeof deadlines.$inferSelect;

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  appKey: text("app_key").notNull(),
  label: text("label").notNull(),
  iconUrl: text("icon_url"),
  link: text("link"),
});

export const insertChannelSchema = createInsertSchema(channels).omit({ id: true });
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type SelectChannel = typeof channels.$inferSelect;

export const eoiRequests = pgTable("eoi_requests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  school: text("school").default("").notNull(),
  roles: text("roles").array().default([]).notNull(),
  painPoint: text("pain_point").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EoiRequest = typeof eoiRequests.$inferSelect;

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

export interface ChannelEntry {
  appKey: string;
  label: string;
  iconUrl?: string;
  link?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: SyllabusAnalysis;
  error?: string;
}
