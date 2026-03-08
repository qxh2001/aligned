import { type Milestone } from "@shared/schema";
import { Calendar, BookOpen, FileText, FlaskConical, Presentation, ClipboardCheck, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const typeConfig: Record<Milestone["type"], { icon: typeof Calendar; color: string; bg: string; label: string }> = {
  exam: { icon: ClipboardCheck, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", label: "Exam" },
  project: { icon: Star, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", label: "Project" },
  assignment: { icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", label: "Assignment" },
  reading: { icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", label: "Reading" },
  lab: { icon: FlaskConical, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", label: "Lab" },
  presentation: { icon: Presentation, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/40", label: "Presentation" },
  other: { icon: Calendar, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-950/40", label: "Other" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

function getRelativeTime(dateStr: string): { label: string; isPast: boolean; isToday: boolean; isSoon: boolean } {
  const now = new Date();
  const target = new Date(dateStr + "T23:59:59");
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d ago`, isPast: true, isToday: false, isSoon: false };
  if (diffDays === 0) return { label: "Today", isPast: false, isToday: true, isSoon: true };
  if (diffDays === 1) return { label: "Tomorrow", isPast: false, isToday: false, isSoon: true };
  if (diffDays <= 7) return { label: `In ${diffDays}d`, isPast: false, isToday: false, isSoon: true };
  if (diffDays <= 30) return { label: `In ${diffDays}d`, isPast: false, isToday: false, isSoon: false };
  return { label: `In ${Math.floor(diffDays / 7)}w`, isPast: false, isToday: false, isSoon: false };
}

function MilestoneCard({ milestone, index }: { milestone: Milestone; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[milestone.type];
  const Icon = config.icon;
  const relative = getRelativeTime(milestone.date);

  return (
    <div
      className="relative flex gap-4 md:gap-6"
      data-testid={`milestone-card-${milestone.id}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-col items-center">
        <div
          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background ${config.bg} ${relative.isPast ? "opacity-50" : ""}`}
        >
          <Icon className={`h-4.5 w-4.5 ${config.color}`} />
        </div>
        <div className="w-px flex-1 bg-border" />
      </div>

      <div
        className={`mb-6 flex-1 rounded-lg border border-border bg-card p-4 transition-all duration-200 ${
          relative.isPast ? "opacity-60" : ""
        } ${relative.isToday ? "ring-2 ring-primary/30" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
              data-testid={`badge-type-${milestone.id}`}
            >
              {config.label}
            </span>
            {milestone.weight && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {milestone.weight}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span data-testid={`date-${milestone.id}`}>{formatDate(milestone.date)}</span>
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-medium ${
                relative.isToday
                  ? "bg-primary text-primary-foreground"
                  : relative.isSoon
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                  : relative.isPast
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {relative.label}
            </span>
          </div>
        </div>

        <h3
          className={`text-sm font-semibold leading-snug ${relative.isPast ? "text-muted-foreground" : "text-foreground"}`}
          data-testid={`title-${milestone.id}`}
        >
          {milestone.title}
        </h3>

        <p className={`mt-1 text-sm text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
          {milestone.description}
        </p>

        {(milestone.tips || milestone.description.length > 120) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary transition-colors"
            data-testid={`button-expand-${milestone.id}`}
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}

        {expanded && milestone.tips && (
          <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Tip: </span>
            {milestone.tips}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimelineProps {
  milestones: Milestone[];
  filterType?: Milestone["type"] | "all";
}

export default function Timeline({ milestones, filterType = "all" }: TimelineProps) {
  const filtered = filterType === "all" ? milestones : milestones.filter((m) => m.type === filterType);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-timeline">
        <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No milestones found</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {filterType !== "all" ? "Try selecting a different filter" : "Upload a syllabus to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative" data-testid="timeline-container">
      {filtered.map((milestone, i) => (
        <MilestoneCard key={milestone.id} milestone={milestone} index={i} />
      ))}
      <div className="flex items-center gap-3 pl-3.5">
        <div className="h-3 w-3 rounded-full bg-muted" />
        <span className="text-xs text-muted-foreground">End of timeline</span>
      </div>
    </div>
  );
}
