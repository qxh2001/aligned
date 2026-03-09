import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { joinProject, getInviteInfo } from "@/lib/store";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface JoinPageProps {
  inviteToken: string;
}

export default function JoinPage({ inviteToken }: JoinPageProps) {
  const [, navigate] = useLocation();
  const { user, login, register } = useAuth();
  const [projectInfo, setProjectInfo] = useState<{ id: number; name: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [invalidLink, setInvalidLink] = useState(false);
  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    getInviteInfo(inviteToken).then((info) => {
      if (info) {
        setProjectInfo(info);
      } else {
        setInvalidLink(true);
      }
      setLoadingInfo(false);
    });
  }, [inviteToken]);

  useEffect(() => {
    if (user && projectInfo && status === "idle") {
      setStatus("joining");
      joinProject(inviteToken).then((result) => {
        setStatus("success");
        setTimeout(() => navigate(`/app/projects/${result.projectId}`), 1200);
      }).catch(() => {
        setStatus("error");
        setErrorMsg("Failed to join. Please try again.");
      });
    }
  }, [user, projectInfo, status]);

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (invalidLink) {
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

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">You're in!</h1>
          <p className="text-sm text-muted-foreground">Joined <span className="font-medium text-foreground">{projectInfo?.name}</span>. Redirecting...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Failed to Join</h1>
          <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStatus("idle"); }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md"
              data-testid="button-retry-join"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/app")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-go-dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "joining") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Joining project...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!email.trim() || !password.trim()) {
      setAuthError("Please fill in all fields.");
      return;
    }

    if (isSignUp && !name.trim()) {
      setAuthError("Please enter your name.");
      return;
    }

    setAuthLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await register(name.trim(), email.trim(), password);
      } else {
        result = await login(email.trim(), password);
      }
      if (result.error) {
        setAuthError(result.error);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Join Project</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You've been invited to join <span className="font-medium text-foreground">{projectInfo?.name}</span>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-7">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">
            {isSignUp ? "Create an account to join" : "Sign in to join"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
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
            )}

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

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                data-testid="input-join-password"
              />
            </div>

            {authError && (
              <p className="text-xs text-destructive" data-testid="text-join-error">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50 transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
              data-testid="button-join"
            >
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUp ? "Sign Up & Join" : "Sign In & Join"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(""); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-toggle-join-auth"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
