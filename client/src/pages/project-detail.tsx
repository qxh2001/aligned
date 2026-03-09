import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getProject, attachAnalysis,
  addDocument, removeDocument, removeMember, updateMemberTags
} from "@/lib/store";
import type { Project, ToolType } from "@shared/schema";
import TimelineWidget from "@/components/TimelineWidget";
import ToolIcon, { getToolMeta, getToolList } from "@/components/ToolIcon";
import {
  FileText, Calendar, Users, Upload, Loader2, AlertCircle, X, BookOpen,
  Plus, ExternalLink, Copy, Check, Trash2, Link2, MessageCircle
} from "lucide-react";
import { SiWhatsapp, SiLine, SiKakaotalk, SiWechat, SiInstagram } from "react-icons/si";

function ProgressBar({ milestones }: { milestones: Project["milestones"] }) {
  if (milestones.length === 0) return null;
  const completed = milestones.filter((m) => new Date(m.date + "T23:59:59") < new Date()).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <div className="flex items-center gap-3 flex-1 max-w-xs">
      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
    </div>
  );
}

function InviteButton({ project }: { project: Project }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/join/${project.inviteCode}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyInvite}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-white px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
      data-testid="button-copy-invite"
      title={inviteUrl}
    >
      {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Link2 className="h-3.5 w-3.5" /> Invite</>}
    </button>
  );
}

function PeopleSection({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [addingTag, setAddingTag] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const handleRemoveMember = (email: string) => {
    removeMember(project.id, email);
    onUpdate();
  };

  const handleAddTag = (email: string) => {
    if (!newTag.trim()) return;
    const member = project.members.find((m) => m.email === email);
    if (!member) return;
    updateMemberTags(project.id, email, [...member.tags, newTag.trim()]);
    setNewTag("");
    setAddingTag(null);
    onUpdate();
  };

  const handleRemoveTag = (email: string, tag: string) => {
    const member = project.members.find((m) => m.email === email);
    if (!member) return;
    updateMemberTags(project.id, email, member.tags.filter((t) => t !== tag));
    onUpdate();
  };

  return (
    <div className="glass-card rounded-2xl p-5" data-testid="widget-people">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        People
      </h3>
      {project.members.length === 0 ? (
        <p className="text-xs text-muted-foreground">No members yet. Share the invite link to add people.</p>
      ) : (
        <div className="space-y-3">
          {project.members.map((m) => (
            <div key={m.email} className="flex items-start gap-3 group" data-testid={`member-${m.email}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary shrink-0 mt-0.5">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                  <button
                    onClick={() => handleRemoveMember(m.email)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all ml-auto"
                    data-testid={`button-remove-member-${m.email}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {m.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-medium group/tag"
                      data-testid={`tag-${m.email}-${tag}`}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(m.email, tag)}
                        className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {addingTag === m.email ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(m.email); if (e.key === "Escape") setAddingTag(null); }}
                        placeholder="Tag..."
                        className="w-20 rounded-full border border-border/60 bg-white px-2.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                        data-testid={`input-tag-${m.email}`}
                        autoFocus
                      />
                      <button onClick={() => handleAddTag(m.email)} className="text-primary"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setAddingTag(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTag(m.email); setNewTag(""); }}
                      className="rounded-full border border-dashed border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                      data-testid={`button-add-tag-${m.email}`}
                    >
                      + tag
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsWidget({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [selectedTool, setSelectedTool] = useState<ToolType>("other");

  const handleAdd = () => {
    if (!url.trim()) return;
    addDocument(project.id, {
      label: label.trim() || url.trim(),
      url: url.trim(),
      tool: selectedTool,
    });
    setLabel("");
    setUrl("");
    setSelectedTool("other");
    setAdding(false);
    onUpdate();
  };

  const handleRemove = (docId: string) => {
    removeDocument(project.id, docId);
    onUpdate();
  };

  const toolList = getToolList();

  return (
    <div className="glass-card rounded-2xl p-5" data-testid="widget-docs">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        Documents
      </h3>

      {project.documents.length > 0 && (
        <div className="space-y-2 mb-3">
          {project.documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl bg-white/60 border border-border/30 p-3 group transition-all hover:shadow-sm" data-testid={`doc-${doc.id}`}>
              <ToolIcon tool={doc.tool} size={18} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">{doc.label}</span>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors" data-testid={`link-doc-${doc.id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => handleRemove(doc.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                data-testid={`button-remove-doc-${doc.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-3 rounded-xl border border-border/40 bg-white/60 p-4">
          <div className="flex flex-wrap gap-1.5">
            {toolList.map((tool) => {
              const meta = getToolMeta(tool);
              return (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all border ${
                    selectedTool === tool
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-transparent bg-white text-muted-foreground hover:bg-muted/40"
                  }`}
                  data-testid={`button-tool-${tool}`}
                  title={meta.label}
                >
                  <ToolIcon tool={tool} size={14} />
                  <span className="hidden sm:inline">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Project Repo)"
            className="w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="input-doc-label"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="https://..."
            className="w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="input-doc-url"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:shadow-sm" data-testid="button-save-doc">Add</button>
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          data-testid="button-add-doc"
        >
          <Plus className="h-3.5 w-3.5" /> Add document link
        </button>
      )}
    </div>
  );
}

const channelApps = [
  { key: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "#25D366" },
  { key: "imessage", label: "iMessage", icon: MessageCircle, color: "#34C759" },
  { key: "line", label: "Line", icon: SiLine, color: "#06C755" },
  { key: "kakaotalk", label: "KakaoTalk", icon: SiKakaotalk, color: "#FFE812" },
  { key: "wechat", label: "WeChat", icon: SiWechat, color: "#07C160" },
  { key: "instagram", label: "Instagram", icon: SiInstagram, color: "#E4405F" },
];

function CommunicationChannels() {
  return (
    <div className="glass-card rounded-2xl p-5" data-testid="widget-channels">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        Communication Channels
      </h3>
      <div className="flex flex-wrap gap-3">
        {channelApps.map((app) => {
          const Icon = app.icon;
          return (
            <div
              key={app.key}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-white/60 border border-border/30 p-3 w-[72px] transition-all hover:shadow-sm"
              data-testid={`channel-${app.key}`}
            >
              <Icon className="h-6 w-6" style={{ color: app.color }} />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{app.label}</span>
            </div>
          );
        })}
      </div>
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
      <div className="border-b border-border/40 bg-white/60 backdrop-blur-sm px-5 sm:px-8 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground truncate" data-testid="text-project-name">{project.name}</h1>
            <ProgressBar milestones={project.milestones} />
          </div>
          <div className="flex items-center gap-2">
            <InviteButton project={project} />
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-white px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              data-testid="button-upload-syllabus"
            >
              <Upload className="h-3.5 w-3.5" />
              {project.milestones.length > 0 ? "Re-upload Syllabus" : "Upload Syllabus"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-5">
        {showUpload && (
          <div className="glass-card rounded-2xl p-5" data-testid="upload-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-foreground">Upload Syllabus</h3>
              <button onClick={() => { setShowUpload(false); setError(""); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-close-upload">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!pasteMode ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-white/60 p-5 mb-3">
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate">{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer py-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Drop PDF or <span className="text-primary font-medium">browse</span></span>
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
                className="w-full min-h-[100px] rounded-xl border border-border/60 bg-white p-4 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                data-testid="input-paste-detail"
              />
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setPasteMode(!pasteMode); setFile(null); setPastedText(""); }}
                className="text-xs text-muted-foreground flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                {pasteMode ? <><Upload className="h-3 w-3" /> File upload</> : <><BookOpen className="h-3 w-3" /> Paste text</>}
              </button>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || (!file && (!pasteMode || pastedText.trim().length < 200))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-40 transition-all hover:shadow-md active:scale-[0.98]"
                data-testid="button-analyze"
              >
                {analyzing ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing...</> : "Analyze"}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 mt-3 rounded-xl bg-destructive/5 border border-destructive/15 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PeopleSection project={project} onUpdate={refresh} />
          <CommunicationChannels />
        </div>

        <DocumentsWidget project={project} onUpdate={refresh} />

        <div className="glass-card rounded-2xl p-5" data-testid="widget-timeline">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
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
  );
}
