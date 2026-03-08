import { useLocation } from "wouter";
import { getProjects } from "@/lib/store";
import { FolderOpen, Plus, Archive, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
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

  if (collapsed) {
    return (
      <aside className="flex w-12 flex-col items-center border-r border-border bg-card py-3 gap-3 shrink-0">
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground"
          data-testid="button-sidebar-expand"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="w-6 border-t border-border" />
        {activeProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/app/projects/${p.id}`)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${
              currentProjectId === p.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
            title={p.name}
            data-testid={`link-project-mini-${p.id}`}
          >
            {p.name.charAt(0)}
          </button>
        ))}
        <button
          onClick={() => navigate("/app/projects/new")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground"
          data-testid="button-add-project-mini"
        >
          <Plus className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card shrink-0" data-testid="sidebar">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</span>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground"
          data-testid="button-sidebar-collapse"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {activeProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/app/projects/${p.id}`)}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
              currentProjectId === p.id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-foreground"
            }`}
            data-testid={`link-project-${p.id}`}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{p.name}</span>
          </button>
        ))}

        {archivedProjects.length > 0 && (
          <>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground"
              data-testid="button-toggle-archived"
            >
              <Archive className="h-3.5 w-3.5 shrink-0" />
              <span>Archived</span>
              {showArchived ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
            </button>
            {showArchived && archivedProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/app/projects/${p.id}`)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground pl-6"
                data-testid={`link-project-archived-${p.id}`}
              >
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-2">
        <button
          onClick={() => navigate("/app/projects/new")}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          data-testid="button-add-project"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Project
        </button>
      </div>
    </aside>
  );
}
