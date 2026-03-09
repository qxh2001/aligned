import type { Project, Milestone, ProjectRole, DocEntry, ToolType, ProjectMember, ChannelEntry } from "@shared/schema";

const PROJECTS_KEY = "aligned-projects";
const AUTH_KEY = "aligned-auth";
const USER_KEY = "aligned-user";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function login(): void {
  localStorage.setItem(AUTH_KEY, "true");
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getUserName(): string {
  return localStorage.getItem(USER_KEY) || "Student";
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_KEY, name);
}

export function getProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function createProject(data: {
  name: string;
  description?: string;
}): Project {
  const project: Project = {
    id: generateId(),
    name: data.name,
    description: data.description || "",
    inviteCode: generateInviteCode(),
    members: [],
    milestones: [],
    roles: [],
    channels: [],
    documents: [],
    schedulerLink: null,
    actionItems: [],
    summary: null,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project | undefined {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  projects[idx] = { ...projects[idx], ...updates };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

export function attachAnalysis(
  projectId: string,
  milestones: Milestone[],
  summary: string,
  suggestedRoles?: { roleName: string; description?: string }[]
): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;

  const roles: ProjectRole[] = suggestedRoles
    ? suggestedRoles.map((r) => ({ roleName: r.roleName, assignedToEmail: null }))
    : project.roles;

  return updateProject(projectId, { milestones, summary, roles });
}

export function addDocument(projectId: string, doc: Omit<DocEntry, "id">): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  const documents = [...project.documents, { ...doc, id: generateId() }];
  return updateProject(projectId, { documents });
}

export function removeDocument(projectId: string, docId: string): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  const documents = project.documents.filter((d) => d.id !== docId);
  return updateProject(projectId, { documents });
}

export function addMemberViaInvite(projectId: string, name: string, email: string): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  if (project.members.some((m) => m.email === email)) return project;
  const members = [...project.members, { name, email, tags: [] }];
  return updateProject(projectId, { members });
}

export function removeMember(projectId: string, email: string): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  const members = project.members.filter((m) => m.email !== email);
  return updateProject(projectId, { members });
}

export function updateChannels(projectId: string, channels: ChannelEntry[]): Project | undefined {
  return updateProject(projectId, { channels });
}

export function updateChannelLink(projectId: string, appKey: string, link: string): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  const channels = (project.channels ?? []).map((c) =>
    c.appKey === appKey ? { ...c, link } : c
  );
  return updateProject(projectId, { channels });
}

export function updateMemberTags(projectId: string, email: string, tags: string[]): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  const members = project.members.map((m) =>
    m.email === email ? { ...m, tags } : m
  );
  return updateProject(projectId, { members });
}

export function seedMockData(): void {
  const existing = getProjects();
  if (existing.length > 0) return;

  const mockProjects: Project[] = [
    {
      id: "proj1",
      name: "CS 301 - Group Project",
      description: "A semester-long group software engineering project covering full SDLC with proposal, midterm, progress report, presentation, and final deliverable.",
      inviteCode: "ABX42K",
      members: [
        { email: "alice@university.edu", name: "Alice Chen", tags: ["Lead", "Designer"] },
        { email: "bob@university.edu", name: "Bob Martinez", tags: ["Developer"] },
      ],
      milestones: [
        { id: "m1", title: "Project Proposal", description: "Submit 2-page proposal outlining the project scope, objectives, and timeline.", date: "2026-03-15", type: "assignment", weight: "5%" },
        { id: "m2", title: "Midterm Exam", description: "Covers chapters 1-6. Closed book, 90 minutes.", date: "2026-03-25", type: "exam", weight: "20%" },
        { id: "m3", title: "Progress Report", description: "Submit progress report with current implementation and remaining tasks.", date: "2026-04-10", type: "assignment", weight: "10%" },
        { id: "m4", title: "Final Presentation", description: "15-minute group presentation demonstrating the project.", date: "2026-04-28", type: "presentation", weight: "15%" },
        { id: "m5", title: "Final Report & Code", description: "Submit final report and complete source code repository.", date: "2026-05-05", type: "project", weight: "30%" },
      ],
      roles: [
        { roleName: "Project Lead", assignedToEmail: "alice@university.edu" },
        { roleName: "Developer", assignedToEmail: "bob@university.edu" },
        { roleName: "Documentation", assignedToEmail: null },
      ],
      channels: [],
      documents: [
        { id: "d1", label: "Project Repo", url: "https://github.com/team/cs301-project", tool: "github" },
        { id: "d2", label: "Design Files", url: "https://figma.com/file/abc123", tool: "figma" },
      ],
      schedulerLink: null,
      actionItems: ["Review project guidelines", "Schedule first team meeting"],
      summary: "A semester-long group software engineering project covering full SDLC with proposal, midterm, progress report, presentation, and final deliverable.",
      archived: false,
      createdAt: "2026-02-01T10:00:00Z",
    },
    {
      id: "proj2",
      name: "COMM 210 - Presentation",
      description: "A communications course focused on persuasive public speaking with progressive deliverables leading to a final presentation.",
      inviteCode: "TRQ89L",
      members: [
        { email: "charlie@university.edu", name: "Charlie Kim", tags: ["Speaker"] },
      ],
      milestones: [
        { id: "m1", title: "Topic Selection", description: "Submit your chosen presentation topic for approval.", date: "2026-03-12", type: "assignment" },
        { id: "m2", title: "Outline Due", description: "Submit detailed outline with main points and supporting evidence.", date: "2026-03-28", type: "assignment", weight: "10%" },
        { id: "m3", title: "Final Presentation", description: "Deliver a 10-minute persuasive speech to the class.", date: "2026-04-18", type: "presentation", weight: "40%" },
      ],
      roles: [
        { roleName: "Speaker", assignedToEmail: "charlie@university.edu" },
        { roleName: "Researcher", assignedToEmail: null },
      ],
      channels: [],
      documents: [
        { id: "d1", label: "Research Notes", url: "https://notion.so/comm210-notes", tool: "notion" },
      ],
      schedulerLink: null,
      actionItems: ["Watch sample presentations"],
      summary: "A communications course focused on persuasive public speaking with progressive deliverables leading to a final presentation.",
      archived: false,
      createdAt: "2026-02-10T14:00:00Z",
    },
  ];

  saveProjects(mockProjects);
}
