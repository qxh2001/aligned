import { useState } from "react";
import { useLocation } from "wouter";
import { createProject, attachAnalysis } from "@/lib/store";
import { Plus, X, Upload, FileText, Loader2, AlertCircle, BookOpen } from "lucide-react";

interface AddProjectProps {
  onProjectCreated: () => void;
}

export default function AddProjectPage({ onProjectCreated }: AddProjectProps) {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const addMember = () => {
    const trimmed = memberEmail.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setMemberEmail("");
    }
  };

  const removeMember = (email: string) => {
    setMembers(members.filter((m) => m !== email));
  };

  const validateFile = (f: File): string | null => {
    if (f.type !== "application/pdf") return "Only PDF files are accepted.";
    if (f.size > 10 * 1024 * 1024) return "File must be under 10MB.";
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selected = e.target.files?.[0];
    if (selected) {
      const err = validateFile(selected);
      if (err) { setError(err); return; }
      setFile(selected);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const project = createProject({
        name: name.trim(),
        members: members.map((e) => ({ email: e })),
      });

      const hasSyllabus = file || (pasteMode && pastedText.trim().length >= 200);

      if (hasSyllabus) {
        try {
          const formData = new FormData();
          if (file) {
            formData.append("file", file);
          } else {
            formData.append("text", pastedText.trim());
          }

          const res = await fetch("/api/analyze-syllabus", {
            method: "POST",
            body: formData,
          });

          const json = await res.json();

          if (json.success && json.data) {
            attachAnalysis(
              project.id,
              json.data.milestones,
              json.data.summary,
              json.data.suggestedRoles
            );
          }
        } catch {
          // Project created successfully but analysis failed — user can retry from project detail
        }
      }

      onProjectCreated();
      navigate(`/app/projects/${project.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="max-w-lg">
        <h1 className="text-lg font-semibold text-foreground mb-1" data-testid="text-page-title">New Project</h1>
        <p className="text-sm text-muted-foreground mb-6">Set up a new team project. You can upload a syllabus to auto-generate a timeline.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS 301 - Group Project"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              data-testid="input-project-name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Team Members</label>
            <div className="flex gap-2">
              <input
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
                placeholder="teammate@university.edu"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                data-testid="input-member-email"
              />
              <button
                onClick={addMember}
                className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
                data-testid="button-invite"
              >
                Invite
              </button>
            </div>

            {members.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {members.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                    {email}
                    <button onClick={() => removeMember(email)} className="text-muted-foreground" data-testid={`button-remove-member-${email}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Upload Syllabus / Instructions
              <span className="text-muted-foreground/60 font-normal ml-1">(optional)</span>
            </label>

            {!pasteMode ? (
              <div className="rounded-lg border border-dashed border-border p-4" data-testid="drop-zone">
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate" data-testid="text-filename">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button onClick={() => setFile(null)} className="text-muted-foreground" data-testid="button-remove-file">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer py-2">
                    <Upload className="h-6 w-6 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground">
                      Drop PDF here or <span className="text-primary">browse</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">PDF only, up to 10MB</span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} data-testid="input-file" />
                  </label>
                )}
              </div>
            ) : (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste syllabus text here (min 200 characters)..."
                className="w-full min-h-[140px] rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-y"
                data-testid="input-paste-text"
              />
            )}

            <button
              onClick={() => { setPasteMode(!pasteMode); setFile(null); setPastedText(""); }}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"
              data-testid="button-toggle-mode"
            >
              {pasteMode ? (
                <><Upload className="h-3 w-3" /> Switch to file upload</>
              ) : (
                <><BookOpen className="h-3 w-3" /> Or paste text instead</>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive" data-testid="text-error">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              data-testid="button-create-project"
            >
              {isCreating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                "Create Project"
              )}
            </button>
            <button
              onClick={() => navigate("/app")}
              className="text-sm text-muted-foreground"
              data-testid="button-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
