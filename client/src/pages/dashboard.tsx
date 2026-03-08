import { useLocation } from "wouter";
import { getProjects } from "@/lib/store";
import { Plus, Calendar, CheckSquare, Zap, FolderOpen } from "lucide-react";
import type { Project } from "@shared/schema";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

function UpcomingDeadlines({ projects }: { projects: Project[] }) {
  const allMilestones = projects
    .filter((p) => !p.archived)
    .flatMap((p) =>
      p.milestones.map((m) => ({ ...m, projectName: p.name, projectId: p.id }))
    )
    .filter((m) => new Date(m.date + "T23:59:59") >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  if (allMilestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allMilestones.map((m) => (
        <div key={`${m.projectId}-${m.id}`} className="flex items-center gap-3 rounded-md border border-border p-2.5">
          <div className="text-xs font-medium text-muted-foreground w-11 text-right shrink-0">
            {formatDate(m.date)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{m.projectName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TodoList({ projects }: { projects: Project[] }) {
  const allTodos = projects
    .filter((p) => !p.archived)
    .flatMap((p) => p.todos.map((t) => ({ text: t, projectName: p.name })))
    .slice(0, 6);

  if (allTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <CheckSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No to-do items</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {allTodos.map((t, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-md p-2">
          <div className="h-4 w-4 shrink-0 rounded border border-border" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{t.text}</p>
            <p className="text-[10px] text-muted-foreground">{t.projectName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionItems({ projects }: { projects: Project[] }) {
  const allActions = projects
    .filter((p) => !p.archived)
    .flatMap((p) => p.actionItems.map((a) => ({ text: a, projectName: p.name })))
    .slice(0, 6);

  if (allActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Zap className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No action items</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {allActions.map((a, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-md p-2">
          <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{a.text}</p>
            <p className="text-[10px] text-muted-foreground">{a.projectName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DashboardProps {
  refreshKey: number;
}

export default function Dashboard({ refreshKey }: DashboardProps) {
  const [, navigate] = useLocation();
  const projects = getProjects();
  const activeProjects = projects.filter((p) => !p.archived);

  if (activeProjects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FolderOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1" data-testid="text-empty-state">Currently Empty</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Create your first project to start organizing your team's work.
          </p>
          <button
            onClick={() => navigate("/app/projects/new")}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            data-testid="button-add-first-project"
          >
            <Plus className="h-4 w-4" />
            Add a Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
        <button
          onClick={() => navigate("/app/projects/new")}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          data-testid="button-add-project-header"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4" data-testid="widget-deadlines">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Deadlines
          </h3>
          <UpcomingDeadlines projects={projects} />
        </div>

        <div className="rounded-lg border border-border bg-card p-4" data-testid="widget-todos">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            To-Do List
          </h3>
          <TodoList projects={projects} />
        </div>

        <div className="rounded-lg border border-border bg-card p-4" data-testid="widget-actions">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Action Items
          </h3>
          <ActionItems projects={projects} />
        </div>
      </div>
    </div>
  );
}
