import { useLocation } from "wouter";
import { getUserName, logout } from "@/lib/store";
import { LogOut, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function TopBar() {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = getUserName();
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between border-b border-border/60 bg-white/80 backdrop-blur-md px-5 shrink-0">
      <button
        onClick={() => navigate("/app")}
        className="font-display text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
        data-testid="link-logo"
      >
        Aligned
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          data-testid="button-avatar"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-border/60 bg-white py-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => { setMenuOpen(false); navigate("/app/account"); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60 rounded-lg mx-1 first:mt-0"
              data-testid="link-account"
              style={{ width: "calc(100% - 8px)" }}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Account Settings
            </button>
            <div className="my-1.5 mx-3 border-t border-border/40" />
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/5 rounded-lg mx-1"
              data-testid="button-logout"
              style={{ width: "calc(100% - 8px)" }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
