import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle, Sparkles, ArrowRight, X, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import type { SyllabusAnalysis } from "@shared/schema";

interface HomeProps {
  onAnalysisComplete: (data: SyllabusAnalysis) => void;
}

export default function Home({ onAnalysisComplete }: HomeProps) {
  const [, navigate] = useLocation();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (f: File): string | null => {
    if (f.type !== "application/pdf") return "Only PDF files are accepted.";
    if (f.size > 10 * 1024 * 1024) return "File size must be under 10MB.";
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const err = validateFile(dropped);
      if (err) {
        setError(err);
        return;
      }
      setFile(dropped);
      setPasteMode(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (selected) {
      const err = validateFile(selected);
      if (err) {
        setError(err);
        return;
      }
      setFile(selected);
      setPasteMode(false);
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();

      if (file) {
        formData.append("file", file);
      } else if (pastedText.trim()) {
        formData.append("text", pastedText.trim());
      } else {
        setError("Please upload a PDF or paste syllabus text.");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/analyze-syllabus", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      onAnalysisComplete(json.data);
      navigate("/project/results");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasInput = file || (pasteMode && pastedText.trim().length >= 200);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/3 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-8">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Syllabus Analysis
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Turn your syllabus into a
              <span className="text-primary"> visual timeline</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Upload your course syllabus and get an organized timeline of every deadline,
              exam, and milestone — with study tips included.
            </p>
          </div>

          <div className="space-y-4">
            {!pasteMode ? (
              <div
                className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : file
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card"
                } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                data-testid="drop-zone"
              >
                {file ? (
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" data-testid="text-filename">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setFile(null); setError(null); }}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors"
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-3 p-10 sm:p-14" data-testid="label-upload">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Drop your PDF syllabus here, or{" "}
                        <span className="text-primary">browse</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF only, up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileInput}
                      data-testid="input-file"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div className={`relative ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
                <textarea
                  value={pastedText}
                  onChange={(e) => { setPastedText(e.target.value); setError(null); }}
                  placeholder="Paste your full syllabus text here (minimum 200 characters)..."
                  className="w-full min-h-[220px] rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-y"
                  data-testid="input-paste-text"
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {pastedText.length} / 200 min
                </div>
              </div>
            )}

            <div className="flex items-center justify-center">
              <button
                onClick={() => { setPasteMode(!pasteMode); setError(null); setFile(null); setPastedText(""); }}
                className="text-xs font-medium text-muted-foreground transition-colors"
                data-testid="button-toggle-mode"
                disabled={isLoading}
              >
                {pasteMode ? (
                  <span className="flex items-center gap-1.5">
                    <Upload className="h-3 w-3" />
                    Switch to file upload
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />
                    Or paste syllabus text instead
                  </span>
                )}
              </button>
            </div>

            {error && (
              <div
                className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3"
                data-testid="text-error"
              >
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!hasInput || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-analyze"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing syllabus...
                </>
              ) : (
                <>
                  Analyze Syllabus
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Upload PDF", desc: "Drop your syllabus file or paste the text content", step: "1" },
              { title: "AI Analysis", desc: "Claude extracts every deadline, exam, and project", step: "2" },
              { title: "Visual Timeline", desc: "See your entire semester at a glance with study tips", step: "3" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center rounded-lg bg-card border border-border p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mb-3">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
