import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Calendar,
  GraduationCap,
  User,
  BookOpen,
  Filter,
  BarChart3,
} from "lucide-react";
import type { SyllabusAnalysis, Milestone } from "@shared/schema";
import Timeline from "@/components/Timeline";

const allTypes: Array<{ value: Milestone["type"] | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "exam", label: "Exams" },
  { value: "project", label: "Projects" },
  { value: "assignment", label: "Assignments" },
  { value: "reading", label: "Readings" },
  { value: "lab", label: "Labs" },
  { value: "presentation", label: "Presentations" },
  { value: "other", label: "Other" },
];

function StatCard({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

interface ProjectProps {
  analysis: SyllabusAnalysis | null;
}

export default function Project({ analysis }: ProjectProps) {
  const [, navigate] = useLocation();
  const [filterType, setFilterType] = useState<Milestone["type"] | "all">("all");

  const stats = useMemo(() => {
    if (!analysis) return null;
    const { milestones } = analysis;
    const exams = milestones.filter((m) => m.type === "exam").length;
    const projects = milestones.filter((m) => m.type === "project").length;
    const assignments = milestones.filter((m) => m.type === "assignment").length;
    const upcoming = milestones.filter((m) => new Date(m.date + "T23:59:59") >= new Date()).length;
    return { total: milestones.length, exams, projects, assignments, upcoming };
  }, [analysis]);

  const availableFilters = useMemo(() => {
    if (!analysis) return allTypes;
    const typesPresent = new Set(analysis.milestones.map((m) => m.type));
    return allTypes.filter((t) => t.value === "all" || typesPresent.has(t.value as Milestone["type"]));
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No analysis found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Upload a syllabus first to see your timeline.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            data-testid="button-go-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Upload Syllabus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="project-page">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 sm:px-6 py-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-foreground truncate" data-testid="text-course-name">
              {analysis.courseName}
            </h1>
            {analysis.courseCode && (
              <p className="text-xs text-muted-foreground">{analysis.courseCode}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
            {analysis.instructor && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {analysis.instructor}
              </span>
            )}
            {analysis.semester && (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                {analysis.semester}
              </span>
            )}
            {stats && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {stats.total} milestones
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 mb-6" data-testid="text-summary">
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
          </div>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" data-testid="stats-grid">
              <StatCard icon={BarChart3} label="Total" value={String(stats.total)} />
              <StatCard icon={Calendar} label="Upcoming" value={String(stats.upcoming)} />
              <StatCard
                icon={GraduationCap}
                label="Exams"
                value={String(stats.exams)}
              />
              <StatCard
                icon={BookOpen}
                label="Projects"
                value={String(stats.projects + stats.assignments)}
              />
            </div>
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Timeline
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              <span className="hidden sm:inline">Filter:</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6" data-testid="filter-buttons">
            {availableFilters.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                  filterType === type.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`button-filter-${type.value}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <Timeline milestones={analysis.milestones} filterType={filterType} />
      </main>
    </div>
  );
}
