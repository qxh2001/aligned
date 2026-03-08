import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getProject, updateProject, attachAnalysis } from "@/lib/store";
import type { Project, ProjectRole } from "@shared/schema";
import TimelineWidget from "@/components/TimelineWidget";
import {
  FileText, Calendar, Users, Link2,
  Upload, Loader2, AlertCircle, X, BookOpen,
  Plus, ExternalLink
} from "lucide-react";

function ProgressBar({ milestones }: { milestones: Project["milestones"] }) {
  if (milestones.length === 0) return null;
  const completed = milestones.filter((m) => new Date(m.date + "T23:59:59") < new Date()).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <div className="flex items-center gap-3 flex-1 max-w-xs">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
    </div>
  );
}

function DocOrgWidget({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState(project.docsLink || "");

  const save = () => {
    updateProject(project.id, { docsLink: link.trim() || null });
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid="widget-docs">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        Document Org
      </h3>
      {editing ? (
        <div className="space-y-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-docs-link"
          />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground" data-testid="button-save-docs">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Cancel</button>
          </div>
        </div>
      ) : project.docsLink ? (
        <a href={project.docsLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary" data-testid="link-docs">
          <ExternalLink className="h-3.5 w-3.5" /> Google Docs
        </a>
      ) : (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="button-add-docs">
          <Plus className="h-3 w-3" /> Add document link
        </button>
      )}
    </div>
  );
}

function SchedulerWidget({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState(project.schedulerLink || "");

  const save = () => {
    updateProject(project.id, { schedulerLink: link.trim() || null });
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid="widget-scheduler">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        Scheduler
      </h3>
      {editing ? (
        <div className="space-y-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://when2meet.com/..."
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-scheduler-link"
          />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground" data-testid="button-save-scheduler">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Cancel</button>
          </div>
        </div>
      ) : project.schedulerLink ? (
        <a href={project.schedulerLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary" data-testid="link-scheduler">
          <ExternalLink className="h-3.5 w-3.5" /> When2Meet
        </a>
      ) : (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="button-add-scheduler">
          <Plus className="h-3 w-3" /> Add scheduler link
        </button>
      )}
    </div>
  );
}

function RolesWidget({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [addingRole, setAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const assignRole = (roleName: string, email: string | null) => {
    const roles = project.roles.map((r) =>
      r.roleName === roleName ? { ...r, assignedToEmail: email } : r
    );
    updateProject(project.id, { roles });
    onUpdate();
  };

  const addRole = () => {
    if (!newRoleName.trim()) return;
    const roles = [...project.roles, { roleName: newRoleName.trim(), assignedToEmail: null }];
    updateProject(project.id, { roles });
    setNewRoleName("");
    setAddingRole(false);
    onUpdate();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid="widget-roles">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        Roles Assigned
      </h3>
      {project.roles.length === 0 && !addingRole ? (
        <p className="text-xs text-muted-foreground mb-2">No roles yet. Upload a syllabus to get suggestions.</p>
      ) : (
        <div className="space-y-2">
          {project.roles.map((role) => (
            <div key={role.roleName} className="flex items-center justify-between gap-2" data-testid={`role-${role.roleName}`}>
              <span className="text-sm text-foreground">{role.roleName}</span>
              <select
                value={role.assignedToEmail || ""}
                onChange={(e) => assignRole(role.roleName, e.target.value || null)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none max-w-[160px]"
                data-testid={`select-role-${role.roleName}`}
              >
                <option value="">Unassigned</option>
                {project.members.map((m) => (
                  <option key={m.email} value={m.email}>{m.email}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {addingRole ? (
        <div className="flex gap-2 mt-2">
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addRole(); }}
            placeholder="Role name"
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-role-name"
            autoFocus
          />
          <button onClick={addRole} className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground" data-testid="button-save-role">Add</button>
          <button onClick={() => setAddingRole(false)} className="text-xs text-muted-foreground">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAddingRole(true)} className="flex items-center gap-1 mt-2 text-xs text-muted-foreground" data-testid="button-add-role">
          <Plus className="h-3 w-3" /> Add role
        </button>
      )}
    </div>
  );
}

interface ProjectDetailProps {
  projectId: string;
  refreshKey: number;
  onProjectUpdated: () => void;
}

export default function ProjectDetail({ projectId, refreshKey, onProjectUpdated }: ProjectDetailProps) {
  const [, navigate] = useLocation();
  const [project, setProject] = useState<Project | undefined>(getProject(projectId));
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setProject(getProject(projectId));
  }, [projectId, refreshKey]);

  const refresh = () => {
    setProject(getProject(projectId));
    onProjectUpdated();
  };

  const handleAnalyze = async () => {
    setError("");
    setAnalyzing(true);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (pastedText.trim()) {
        formData.append("text", pastedText.trim());
      } else {
        setError("Upload a PDF or paste text.");
        setAnalyzing(false);
        return;
      }

      const res = await fetch("/api/analyze-syllabus", { method: "POST", body: formData });
      const json = await res.json();

      if (json.success && json.data) {
        attachAnalysis(projectId, json.data.milestones, json.data.summary, json.data.suggestedRoles);
        setShowUpload(false);
        setFile(null);
        setPastedText("");
        refresh();
      } else {
        setError(json.error || "Analysis failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" data-testid="project-detail">
      <div className="border-b border-border px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate" data-testid="text-project-name">{project.name}</h1>
            <ProgressBar milestones={project.milestones} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground"
              data-testid="button-add-widget"
            >
              <Plus className="h-3.5 w-3.5" />
              Widget
            </button>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground"
              data-testid="button-upload-syllabus"
            >
              <Upload className="h-3.5 w-3.5" />
              {project.milestones.length > 0 ? "Re-upload Syllabus" : "Upload Syllabus"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {showUpload && (
          <div className="rounded-lg border border-border bg-card p-4" data-testid="upload-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Upload Syllabus</h3>
              <button onClick={() => { setShowUpload(false); setError(""); }} className="text-muted-foreground" data-testid="button-close-upload">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!pasteMode ? (
              <div className="rounded-lg border border-dashed border-border p-4 mb-3">
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate">{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer py-2">
                    <Upload className="h-5 w-5 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground">Drop PDF or <span className="text-primary">browse</span></span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.type !== "application/pdf") { setError("PDF only"); return; }
                        if (f.size > 10 * 1024 * 1024) { setError("Max 10MB"); return; }
                        setFile(f); setError("");
                      }
                    }} data-testid="input-file-detail" />
                  </label>
                )}
              </div>
            ) : (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste syllabus text (min 200 chars)..."
                className="w-full min-h-[100px] rounded-md border border-border bg-background p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                data-testid="input-paste-detail"
              />
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setPasteMode(!pasteMode); setFile(null); setPastedText(""); }}
                className="text-xs text-muted-foreground flex items-center gap-1"
              >
                {pasteMode ? <><Upload className="h-3 w-3" /> File upload</> : <><BookOpen className="h-3 w-3" /> Paste text</>}
              </button>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || (!file && (!pasteMode || pastedText.trim().length < 200))}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                data-testid="button-analyze"
              >
                {analyzing ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing...</> : "Analyze"}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 mt-3 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocOrgWidget project={project} onUpdate={refresh} />
          <SchedulerWidget project={project} onUpdate={refresh} />
          <RolesWidget project={project} onUpdate={refresh} />

          <div className="rounded-lg border border-border bg-card p-4 md:col-span-2" data-testid="widget-timeline">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Timeline
            </h3>
            <TimelineWidget
              milestones={project.milestones}
              summary={project.summary}
              onRegenerate={() => setShowUpload(true)}
              isRegenerating={analyzing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
