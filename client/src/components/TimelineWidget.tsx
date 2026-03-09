import type { Milestone } from "@shared/schema";
import { Calendar, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useState } from "react";

const typeConfig: Record<Milestone["type"], { color: string; bg: string; border: string; label: string }> = {
  exam: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Exam" },
  project: { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", label: "Project" },
  assignment: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", label: "Assignment" },
  reading: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Reading" },
  lab: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Lab" },
  presentation: { color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200", label: "Presentation" },
  other: { color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200", label: "Other" },
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
      <div className="flex flex-col items-center justify-center py-10 text-center" data-testid="empty-timeline">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">No timeline data yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Upload a syllabus to generate milestones</p>
      </div>
    );
  }

  const visibleMilestones = expanded ? milestones : milestones.slice(0, 5);

  return (
    <div data-testid="timeline-widget">
      {summary && (
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed" data-testid="text-summary">{summary}</p>
      )}

      <div className="relative">
        <div className="absolute left-[55px] top-0 bottom-0 w-0.5 bg-border/40 rounded-full" />

        <div className="space-y-3">
          {visibleMilestones.map((m) => {
            const cfg = typeConfig[m.type];
            const isPast = new Date(m.date + "T23:59:59") < new Date();
            return (
              <div key={m.id} className="flex items-start gap-4 relative" data-testid={`milestone-${m.id}`}>
                <div className="text-xs font-medium text-muted-foreground w-12 text-right shrink-0 pt-3">
                  {formatDate(m.date)}
                </div>
                <div className={`w-3 h-3 rounded-full shrink-0 mt-3.5 z-10 border-2 ${isPast ? "bg-primary border-primary" : "bg-white border-border"}`} />
                <div className={`flex-1 rounded-xl border border-border/30 p-3.5 transition-all hover:shadow-sm ${isPast ? "bg-white/40" : "bg-white/80"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${isPast ? "text-muted-foreground line-through" : "text-foreground"}`}>{m.title}</span>
                    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    {m.weight && (
                      <span className="text-[10px] text-muted-foreground">{m.weight}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
        {milestones.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
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
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary ml-auto disabled:opacity-40 transition-colors"
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
