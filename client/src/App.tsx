import { Route, useLocation, Redirect, Router } from "wouter";
import { useState, useCallback, useMemo } from "react";
import { isLoggedIn, seedMockData } from "@/lib/store";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import AddProjectPage from "@/pages/add-project";
import ProjectDetail from "@/pages/project-detail";
import AccountPage from "@/pages/account";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";

seedMockData();

function AppContent({ refreshKey, triggerRefresh }: { refreshKey: number; triggerRefresh: () => void }) {
  const [location] = useLocation();

  const projectMatch = location.match(/^\/app\/projects\/([^/]+)$/);
  const isNewProject = location === "/app/projects/new";
  const isAccount = location === "/app/account";
  const isDashboard = location === "/app" || location === "/app/";

  if (isNewProject) {
    return <AddProjectPage onProjectCreated={triggerRefresh} />;
  }

  if (projectMatch && projectMatch[1] !== "new") {
    return (
      <ProjectDetail
        projectId={projectMatch[1]}
        refreshKey={refreshKey}
        onProjectUpdated={triggerRefresh}
      />
    );
  }

  if (isAccount) {
    return <AccountPage />;
  }

  return <Dashboard refreshKey={refreshKey} />;
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

function App() {
  const [location] = useLocation();

  if (location === "/login") {
    if (isLoggedIn()) {
      return <Redirect to="/app" />;
    }
    return <LoginPage />;
  }

  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }

  if (location.startsWith("/app")) {
    return <AppLayout />;
  }

  return <Redirect to="/app" />;
}

export default App;
