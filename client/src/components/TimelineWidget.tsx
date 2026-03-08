import type { Milestone } from "@shared/schema";
import { Calendar, BookOpen, FileText, FlaskConical, Presentation, ClipboardCheck, Star, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useState } from "react";

const typeConfig: Record<Milestone["type"], { color: string; bg: string; label: string }> = {
  exam: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", label: "Exam" },
  project: { color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", label: "Project" },
  assignment: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", label: "Assignment" },
  reading: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", label: "Reading" },
  lab: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", label: "Lab" },
  presentation: { color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/40", label: "Presentation" },
  other: { color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-950/40", label: "Other" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

interface TimelineWidgetProps {
  milestones: Milestone[];
  summary: string | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function TimelineWidget({ milestones, summary, onRegenerate, isRegenerating }: TimelineWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center" data-testid="empty-timeline">
        <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No timeline data yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Upload a syllabus to generate milestones</p>
      </div>
    );
  }

  const visibleMilestones = expanded ? milestones : milestones.slice(0, 5);

  return (
    <div data-testid="timeline-widget">
      {summary && (
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed" data-testid="text-summary">{summary}</p>
      )}

      <div className="space-y-2">
        {visibleMilestones.map((m) => {
          const cfg = typeConfig[m.type];
          return (
            <div key={m.id} className="flex items-start gap-3 rounded-md border border-border p-2.5" data-testid={`milestone-${m.id}`}>
              <div className="mt-0.5 shrink-0 text-xs font-medium text-muted-foreground w-12 text-right">
                {formatDate(m.date)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{m.title}</span>
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {m.weight && (
                    <span className="text-[10px] text-muted-foreground">{m.weight}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        {milestones.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-primary"
            data-testid="button-toggle-timeline"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show all {milestones.length} <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground ml-auto disabled:opacity-40"
            data-testid="button-regenerate"
          >
            <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}
