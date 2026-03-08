import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
      <p className="text-sm text-muted-foreground mb-6">This page doesn't exist.</p>
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        data-testid="button-go-home"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Home
      </button>
    </div>
  );
}
