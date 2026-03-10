import { useState } from "react";
import { useLocation } from "wouter";
import { createProject } from "@/lib/store";
import { Plus, X, Upload, FileText, Loader2, AlertCircle, BookOpen } from "lucide-react";

interface AddProjectProps {
  onProjectCreated: () => void;
}

export default function AddProjectPage({ onProjectCreated }: AddProjectProps) {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [creatingPhase, setCreatingPhase] = useState<"creating" | "analyzing">("creating");
  const [error, setError] = useState("");

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
    setCreatingPhase("creating");

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim(),
      });

      const hasSyllabus = file || (pasteMode && pastedText.trim().length >= 200);

      if (hasSyllabus) {
        setCreatingPhase("analyzing");
        try {
          const formData = new FormData();
          if (file) {
            formData.append("file", file);
          } else {
            formData.append("text", pastedText.trim());
          }

          const res = await fetch(`/api/projects/${project.id}/analyze-syllabus`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          const json = await res.json().catch(() => ({ success: false }));
          if (!json.success) {
            // Analysis failed but project was created — navigate anyway so user can retry
            console.warn("Syllabus analysis failed:", json.error);
          }
        } catch {
          // Network error (e.g. timeout) — project was still created, navigate anyway
        }
      }

      onProjectCreated();
      navigate(`/app/projects/${project.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
      setCreatingPhase("creating");
    }
  };

  return (
    <div className="flex-1 overflow-auto p-5 sm:p-8">
      <div className="max-w-lg">
        <h1 className="font-display text-xl font-bold text-foreground mb-1" data-testid="text-page-title">New Project</h1>
        <p className="text-sm text-muted-foreground mb-8">Set up a new team project. Upload a syllabus to auto-generate a timeline.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS 301 - Group Project"
              className="w-full rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              data-testid="input-project-name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Description <span className="text-muted-foreground/50 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              rows={3}
              className="w-full rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y"
              data-testid="input-project-description"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Upload Syllabus / Instructions
              <span className="text-muted-foreground/50 font-normal ml-1">(optional)</span>
            </label>

            {!pasteMode ? (
              <div className="glass-card rounded-2xl p-5" data-testid="drop-zone">
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate" data-testid="text-filename">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid="button-remove-file">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2.5 cursor-pointer py-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Drop PDF here or <span className="text-primary font-medium">browse</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">PDF only, up to 10MB</span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} data-testid="input-file" />
                  </label>
                )}
              </div>
            ) : (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste syllabus text here (min 200 characters)..."
                className="w-full min-h-[140px] rounded-xl border border-border/60 bg-white p-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y"
                data-testid="input-paste-text"
              />
            )}

            <button
              onClick={() => { setPasteMode(!pasteMode); setFile(null); setPastedText(""); }}
              className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
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
            <div className="flex items-start gap-2.5 rounded-xl bg-destructive/5 border border-destructive/15 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive" data-testid="text-error">{error}</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                disabled={isCreating || !name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-40 transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                data-testid="button-create-project"
              >
                {isCreating ? (
                  creatingPhase === "analyzing"
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating timeline...</>
                    : <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  "Create Project"
                )}
              </button>
              {!isCreating && (
                <button
                  onClick={() => navigate("/app")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-cancel"
                >
                  Cancel
                </button>
              )}
            </div>
            {isCreating && creatingPhase === "analyzing" && (
              <p className="text-xs text-muted-foreground">
                AI is reading your syllabus — this usually takes 20–40 seconds.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
