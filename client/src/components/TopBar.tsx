import { useLocation } from "wouter";
import { getUserName, logout } from "@/lib/store";
import { LogOut, User, Settings } from "lucide-react";
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
    <header className="h-13 flex items-center justify-between border-b border-border bg-background px-4 shrink-0">
      <button
        onClick={() => navigate("/app")}
        className="text-base font-bold tracking-tight text-foreground"
        data-testid="link-logo"
      >
        Aligned
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          data-testid="button-avatar"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-50 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
            <button
              onClick={() => { setMenuOpen(false); navigate("/app/account"); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground"
              data-testid="link-account"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Account Settings
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive"
              data-testid="button-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
