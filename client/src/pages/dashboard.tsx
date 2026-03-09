import { useLocation } from "wouter";
import { getProjects } from "@/lib/store";
import { Plus, Zap, FolderOpen, Calendar } from "lucide-react";
import type { Project, Milestone } from "@shared/schema";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
}

type MilestoneWithProject = Milestone & { projectName: string; projectId: string };

function UpcomingDeadlines({ projects }: { projects: Project[] }) {
  const allMilestones: MilestoneWithProject[] = projects
    .filter((p) => !p.archived)
    .flatMap((p) =>
      p.milestones.map((m) => ({ ...m, projectName: p.name, projectId: p.id }))
    )
    .filter((m) => new Date(m.date + "T23:59:59") >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const typeColors: Record<string, string> = {
    exam: "bg-red-100 text-red-700 border-red-200",
    project: "bg-violet-100 text-violet-700 border-violet-200",
    assignment: "bg-blue-100 text-blue-700 border-blue-200",
    reading: "bg-emerald-100 text-emerald-700 border-emerald-200",
    lab: "bg-amber-100 text-amber-700 border-amber-200",
    presentation: "bg-pink-100 text-pink-700 border-pink-200",
    other: "bg-gray-100 text-gray-700 border-gray-200",
  };

  if (allMilestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground/20 mb-2" />
        <p className="text-xs text-muted-foreground">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="widget-timeline">
      {allMilestones.map((m) => (
        <div
          key={`${m.projectId}-${m.id}`}
          className="flex items-center gap-3 glass-card rounded-xl p-3 transition-all hover:shadow-md"
          data-testid={`deadline-${m.id}`}
        >
          <div className="text-right shrink-0 w-14">
            <div className="text-xs font-medium text-foreground">{formatDate(m.date)}</div>
            <div className="text-[10px] text-muted-foreground">{getDayName(m.date)}</div>
          </div>
          <div className="w-0.5 h-8 rounded-full bg-primary/20 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{m.projectName}</p>
          </div>
          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium border shrink-0 ${typeColors[m.type] || typeColors.other}`}>
            {m.type}
          </span>
        </div>
      ))}
    </div>
  );
}

function ActionItems({ projects }: { projects: Project[] }) {
  const allActions = projects
    .filter((p) => !p.archived)
    .flatMap((p) => p.actionItems.map((a) => ({ text: a, projectName: p.name })))
    .slice(0, 8);

  if (allActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Zap className="h-8 w-8 text-muted-foreground/20 mb-2" />
        <p className="text-xs text-muted-foreground">No action items</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {allActions.map((a, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-white/60">
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
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FolderOpen className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2" data-testid="text-empty-state">No projects yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first project to start organizing your team's work.
          </p>
          <button
            onClick={() => navigate("/app/projects/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
            data-testid="button-add-first-project"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-xl font-bold text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
        <button
          onClick={() => navigate("/app/projects/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
          data-testid="button-add-project-header"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-card rounded-2xl p-5" data-testid="widget-deadlines">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Deadlines
          </h3>
          <UpcomingDeadlines projects={projects} />
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5" data-testid="widget-actions">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Action Items
          </h3>
          <ActionItems projects={projects} />
        </div>
      </div>
    </div>
  );
}
