import { useLocation } from "wouter";
import { getProjects } from "@/lib/store";
import { Plus, Zap, FolderOpen } from "lucide-react";
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

function toEasternDateStr(d: Date): string {
  const parts = d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return parts;
}

function getWeekDays(): { date: string; dayName: string; dayNum: number; isToday: boolean }[] {
  const now = new Date();
  const todayStr = toEasternDateStr(now);
  const todayParts = todayStr.split("-").map(Number);
  const today = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    days.push({
      date: dateStr,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

type MilestoneWithProject = Milestone & { projectName: string; projectId: string };

function VerticalTimeline({ projects }: { projects: Project[] }) {
  const allMilestones: MilestoneWithProject[] = projects
    .filter((p) => !p.archived)
    .flatMap((p) =>
      p.milestones.map((m) => ({ ...m, projectName: p.name, projectId: p.id }))
    )
    .filter((m) => new Date(m.date + "T23:59:59") >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date));

  const weekDays = getWeekDays();
  const lastWeekDay = weekDays[weekDays.length - 1].date;

  const weekMilestonesByDate: Record<string, MilestoneWithProject[]> = {};
  const overflowMilestones: MilestoneWithProject[] = [];

  allMilestones.forEach((m) => {
    if (m.date <= lastWeekDay && m.date >= weekDays[0].date) {
      if (!weekMilestonesByDate[m.date]) weekMilestonesByDate[m.date] = [];
      weekMilestonesByDate[m.date].push(m);
    } else if (m.date > lastWeekDay) {
      overflowMilestones.push(m);
    }
  });

  const typeColors: Record<string, string> = {
    exam: "bg-red-100 text-red-700 border-red-200",
    project: "bg-violet-100 text-violet-700 border-violet-200",
    assignment: "bg-blue-100 text-blue-700 border-blue-200",
    reading: "bg-emerald-100 text-emerald-700 border-emerald-200",
    lab: "bg-amber-100 text-amber-700 border-amber-200",
    presentation: "bg-pink-100 text-pink-700 border-pink-200",
    other: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="relative" data-testid="widget-timeline">
      <div className="relative">
        {weekDays.map((day, i) => {
          const items = weekMilestonesByDate[day.date] || [];
          return (
            <div key={day.date} className="flex gap-4 min-h-[48px]" data-testid={`timeline-day-${day.date}`}>
              <div className="flex flex-col items-center w-12 shrink-0">
                <div
                  className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl text-center transition-all ${
                    day.isToday
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-white text-muted-foreground border border-border/60"
                  }`}
                >
                  <span className="text-[10px] font-semibold leading-none">{day.dayName}</span>
                  <span className={`text-sm font-bold leading-none mt-0.5 ${day.isToday ? "" : "text-foreground"}`}>{day.dayNum}</span>
                </div>
                {i < weekDays.length - 1 && (
                  <div className={`w-0.5 flex-1 my-1 rounded-full ${day.isToday ? "bg-primary/30" : "bg-border/60"}`} />
                )}
              </div>

              <div className="flex-1 pb-3 pt-1">
                {items.length === 0 ? (
                  <div className="h-8" />
                ) : (
                  <div className="space-y-2">
                    {items.map((m) => (
                      <div
                        key={`${m.projectId}-${m.id}`}
                        className="glass-card rounded-xl p-3 transition-all hover:shadow-md cursor-default"
                        data-testid={`timeline-item-${m.id}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{m.title}</span>
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium border ${typeColors[m.type] || typeColors.other}`}>
                            {m.type}
                          </span>
                          {m.weight && <span className="text-[10px] text-muted-foreground">{m.weight}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{m.projectName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {overflowMilestones.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">Upcoming</p>
          <div className="space-y-2">
            {overflowMilestones.slice(0, 5).map((m) => (
              <div
                key={`${m.projectId}-${m.id}`}
                className="flex items-center gap-3 glass-card rounded-xl p-3"
                data-testid={`timeline-overflow-${m.id}`}
              >
                <div className="text-xs font-medium text-muted-foreground w-12 text-right shrink-0">
                  {formatDate(m.date)}
                </div>
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
        </div>
      )}
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
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">This Week</h3>
          <VerticalTimeline projects={projects} />
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
