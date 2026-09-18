import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { AuthModal } from "./components/AuthModal";
import { ToolWorkspace } from "./components/ToolWorkspace";
import { Home } from "./pages/Home";
import { Tools } from "./pages/Tools";
import { Dashboard } from "./pages/Dashboard";
import { Admin } from "./pages/Admin";
import { Pricing } from "./pages/Pricing";
import { About } from "./pages/About";
import { TOOLS } from "./data/toolsData";
import { UserProfile, ToolDefinition } from "./types";

export default function App() {
  const [currentView, setCurrentView] = useState<string>("home");
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // User Profile
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("mypdf_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("mypdf_theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("mypdf_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("mypdf_theme", "light");
    }
  }, [isDarkMode]);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (view: string, toolId?: string) => {
    if (toolId) {
      setActiveToolId(toolId);
      setCurrentView("tool");
    } else {
      setCurrentView(view);
      if (view !== "tool") {
        setActiveToolId(null);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectTool = (toolId: string) => {
    setActiveToolId(toolId);
    setCurrentView("tool");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("mypdf_user", JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("mypdf_user");
    if (currentView === "dashboard") {
      setCurrentView("home");
    }
  };

  const handleRecordOperation = (toolId: string, toolName: string, fileName: string) => {
    // Notify server telemetry endpoint
    fetch("/api/stats/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId, toolName, fileName }),
    }).catch((err) => console.warn("Could not sync telemetry:", err));

    // Update local user quota
    if (user) {
      const updated = {
        ...user,
        dailyOperationsUsed: Math.min(user.dailyOperationsLimit, user.dailyOperationsUsed + 1),
      };
      setUser(updated);
      localStorage.setItem("mypdf_user", JSON.stringify(updated));
    }
  };

  const handleResetDemoData = () => {
    alert("Demo data and telemetry queue refreshed to default sample states.");
  };

  const activeToolDef: ToolDefinition | undefined = TOOLS.find(
    (t) => t.id === activeToolId
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* HOME VIEW */}
        {currentView === "home" && (
          <Home
            onSelectTool={handleSelectTool}
            onOpenSearch={() => setSearchModalOpen(true)}
          />
        )}

        {/* ALL TOOLS DIRECTORY */}
        {currentView === "all-tools" && (
          <Tools onSelectTool={handleSelectTool} defaultCategory="all" />
        )}
        {currentView === "all-tools-organize" && (
          <Tools onSelectTool={handleSelectTool} defaultCategory="organize" />
        )}
        {currentView === "all-tools-convert" && (
          <Tools onSelectTool={handleSelectTool} defaultCategory="convert-to" />
        )}
        {currentView === "all-tools-ai" && (
          <Tools onSelectTool={handleSelectTool} defaultCategory="ai" />
        )}

        {/* TOOL WORKSPACE (Any of the 33 tools) */}
        {currentView === "tool" && activeToolDef && (
          <ToolWorkspace
            tool={activeToolDef}
            onBack={() => handleNavigate("home")}
            onRecordOperation={handleRecordOperation}
          />
        )}

        {/* PRICING VIEW */}
        {currentView === "pricing" && (
          <Pricing
            onSelectPlan={(planId) => {
              if (!user) {
                setAuthModalOpen(true);
              } else {
                alert(`Selected ${planId.toUpperCase()} plan. Your account is upgraded!`);
              }
            }}
          />
        )}

        {/* ABOUT VIEW */}
        {currentView === "about" && <About />}

        {/* USER DASHBOARD */}
        {currentView === "dashboard" && user && (
          <Dashboard user={user} onSelectTool={handleSelectTool} />
        )}

        {/* ADMIN TELEMETRY DASHBOARD */}
        {currentView === "admin" && <Admin />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectTool={handleSelectTool}
      />

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
