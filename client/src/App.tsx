import { Switch, Route } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Project from "@/pages/project";
import NotFound from "@/pages/not-found";
import type { SyllabusAnalysis } from "@shared/schema";

const STORAGE_KEY = "syllabus-analysis";

function App() {
  const [analysis, setAnalysis] = useState<SyllabusAnalysis | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (analysis) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analysis));
    }
  }, [analysis]);

  const handleAnalysisComplete = useCallback((data: SyllabusAnalysis) => {
    setAnalysis(data);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/">
            <Home onAnalysisComplete={handleAnalysisComplete} />
          </Route>
          <Route path="/project/results">
            <Project analysis={analysis} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
