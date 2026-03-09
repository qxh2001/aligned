import { useState } from "react";
import { useLocation } from "wouter";
import { getProjects, addMemberViaInvite, isLoggedIn, login } from "@/lib/store";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface JoinPageProps {
  inviteCode: string;
}

export default function JoinPage({ inviteCode }: JoinPageProps) {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"form" | "joining" | "success" | "error">("form");
  const [errorMsg, setErrorMsg] = useState("");

  const project = getProjects().find((p) => p.inviteCode === inviteCode);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Invalid Invite Link</h1>
          <p className="text-sm text-muted-foreground mb-6">This invite link is not valid or has expired.</p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md"
            data-testid="button-go-login"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleJoin = () => {
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Please fill in both fields.");
      return;
    }

    setStatus("joining");
    setTimeout(() => {
      const result = addMemberViaInvite(project.id, name.trim(), email.trim());
      if (result) {
        if (!isLoggedIn()) login();
        setStatus("success");
        setTimeout(() => navigate(`/app/projects/${project.id}`), 1500);
      } else {
        setStatus("error");
        setErrorMsg("Failed to join. Please try again.");
      }
    }, 500);
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">You're in!</h1>
          <p className="text-sm text-muted-foreground">Joined <span className="font-medium text-foreground">{project.name}</span>. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Join Project</h1>
          <p className="text-sm text-muted-foreground mt-2">You've been invited to join <span className="font-medium text-foreground">{project.name}</span></p>
        </div>

        <div className="glass-card rounded-2xl p-7">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                data-testid="input-join-name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                data-testid="input-join-email"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-destructive" data-testid="text-join-error">{errorMsg}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={status === "joining"}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50 transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
              data-testid="button-join"
            >
              {status === "joining" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
