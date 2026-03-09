import { Route, useLocation, Redirect, Router } from "wouter";
import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "@/pages/login";
import JoinPage from "@/pages/join";
import Dashboard from "@/pages/dashboard";
import AddProjectPage from "@/pages/add-project";
import ProjectDetail from "@/pages/project-detail";
import AccountPage from "@/pages/account";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

function AppContent({ refreshKey, triggerRefresh }: { refreshKey: number; triggerRefresh: () => void }) {
  const [location] = useLocation();

  const projectMatch = location.match(/^\/app\/projects\/([^/]+)$/);
  const isNewProject = location === "/app/projects/new";
  const isAccount = location === "/app/account";

  if (isNewProject) {
    return <AddProjectPage onProjectCreated={triggerRefresh} />;
  }

  if (projectMatch && projectMatch[1] !== "new") {
    return (
      <ProjectDetail
        projectId={parseInt(projectMatch[1])}
        refreshKey={refreshKey}
        onProjectUpdated={triggerRefresh}
      />
    );
  }

  if (isAccount) {
    return <AccountPage />;
  }

  return <Dashboard refreshKey={refreshKey} onProjectUpdated={triggerRefresh} />;
}

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          refreshKey={refreshKey}
        />
        <AppContent refreshKey={refreshKey} triggerRefresh={triggerRefresh} />
      </div>
    </div>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (location === "/login") {
    if (user) return <Redirect to="/app" />;
    return <LoginPage />;
  }

  const joinMatch = location.match(/^\/invite\/([A-Za-z0-9]+)$/);
  if (joinMatch) {
    return <JoinPage inviteToken={joinMatch[1]} />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (location.startsWith("/app")) {
    return <AppLayout />;
  }

  return <Redirect to="/app" />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
