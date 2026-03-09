import { useLocation } from "wouter";
import { getProjects } from "@/lib/store";
import { FolderOpen, Plus, Archive, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, LayoutDashboard } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  refreshKey?: number;
}

export default function Sidebar({ collapsed, onToggle, refreshKey }: SidebarProps) {
  const [location, navigate] = useLocation();
  const [showArchived, setShowArchived] = useState(false);
  const projects = getProjects();
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

  const currentProjectId = location.match(/\/app\/projects\/([^/]+)/)?.[1];
  const isDashboard = location === "/app" || location === "/app/";

  if (collapsed) {
    return (
      <aside className="flex w-14 flex-col items-center border-r border-border/60 bg-sidebar py-4 gap-2 shrink-0">
        <button
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
          data-testid="button-sidebar-expand"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="w-7 border-t border-border/40 my-1" />
        <button
          onClick={() => navigate("/app")}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            isDashboard ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white"
          }`}
          title="Dashboard"
          data-testid="link-dashboard-mini"
        >
          <LayoutDashboard className="h-4 w-4" />
        </button>
        {activeProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/app/projects/${p.id}`)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
              currentProjectId === p.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white"
            }`}
            title={p.name}
            data-testid={`link-project-mini-${p.id}`}
          >
            {p.name.charAt(0)}
          </button>
        ))}
        <button
          onClick={() => navigate("/app/projects/new")}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          data-testid="button-add-project-mini"
        >
          <Plus className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-60 flex-col border-r border-border/60 bg-sidebar shrink-0" data-testid="sidebar">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">Projects</span>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
          data-testid="button-sidebar-collapse"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        <button
          onClick={() => navigate("/app")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
            isDashboard
              ? "bg-white text-foreground font-medium shadow-sm"
              : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
          }`}
          data-testid="link-dashboard"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        <div className="pt-2 pb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Active</span>
        </div>

        {activeProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/app/projects/${p.id}`)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
              currentProjectId === p.id
                ? "bg-white text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
            }`}
            data-testid={`link-project-${p.id}`}
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">{p.name}</span>
          </button>
        ))}

        {archivedProjects.length > 0 && (
          <>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              data-testid="button-toggle-archived"
            >
              <Archive className="h-4 w-4 shrink-0" />
              <span>Archived</span>
              {showArchived ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
            </button>
            {showArchived && archivedProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/app/projects/${p.id}`)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground pl-8 hover:bg-white/60 transition-colors"
                data-testid={`link-project-archived-${p.id}`}
              >
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border/40 p-3">
        <button
          onClick={() => navigate("/app/projects/new")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
          data-testid="button-add-project"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>
    </aside>
  );
}
