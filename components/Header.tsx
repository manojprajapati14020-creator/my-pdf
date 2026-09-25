import React, { useState } from "react";
import {
  FileText,
  Search,
  Moon,
  Sun,
  Sparkles,
  User,
  Shield,
  Menu,
  X,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { UserProfile } from "../types";

interface Props {
  currentView: string;
  onNavigate: (view: string, toolId?: string) => void;
  onOpenSearch: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onResetDemoData: () => void;
}

export const Header: React.FC<Props> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  isDarkMode,
  onToggleTheme,
  user,
  onOpenAuth,
  onLogout,
  isDemoMode,
  onToggleDemoMode,
  onResetDemoData,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-button"
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                My PDF
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline-block leading-tight">
                All-In-One Document Utility
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-home"
              onClick={() => onNavigate("home")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === "home"
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                  : "text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              Home
            </button>
            <button
              id="nav-all-tools"
              onClick={() => onNavigate("all-tools")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === "all-tools"
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                  : "text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              All Tools
            </button>
            <button
              id="nav-pdf-tools"
              onClick={() => onNavigate("all-tools-organize")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              PDF Tools
            </button>
            <button
              id="nav-convert"
              onClick={() => onNavigate("all-tools-convert")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              Convert
            </button>
            <button
              id="nav-ai-tools"
              onClick={() => onNavigate("all-tools-ai")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Tools
            </button>
            <button
              id="nav-pricing"
              onClick={() => onNavigate("pricing")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === "pricing"
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                  : "text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              Pricing
            </button>
            <button
              id="nav-about"
              onClick={() => onNavigate("about")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === "about"
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                  : "text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              About
            </button>
          </nav>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            id="global-search-trigger"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700/60"
            title="Search Tools (Cmd+K / Ctrl+K)"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline-block text-xs font-medium">Search tools...</span>
            <kbd className="hidden md:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Demo Mode Badge / Control */}
          <div className="flex items-center">
            <button
              id="demo-mode-badge"
              onClick={onToggleDemoMode}
              title="Toggle or inspect Demo Mode"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                isDemoMode
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Demo Mode</span>
            </button>
            {isDemoMode && (
              <button
                id="reset-demo-data-btn"
                onClick={onResetDemoData}
                title="Reset sample test documents & telemetry"
                className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 ml-0.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Admin Dashboard Icon */}
          <button
            id="admin-dashboard-btn"
            onClick={() => onNavigate("admin")}
            title="System & Admin Telemetry Dashboard"
            className={`hidden sm:flex items-center gap-1 p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              currentView === "admin" ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50" : ""
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* User Profile or Login */}
          {user ? (
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/70 dark:border-slate-700/70"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold max-w-[90px] truncate text-slate-800 dark:text-slate-200">
                  {user.displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {user.plan} plan
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate("dashboard");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    My Documents & Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate("admin");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    System Admin Panel
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="login-button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl lg:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2">
          <button
            onClick={() => {
              onNavigate("home");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate("all-tools");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            All Tools
          </button>
          <button
            onClick={() => {
              onNavigate("all-tools-organize");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Organize PDF Tools
          </button>
          <button
            onClick={() => {
              onNavigate("all-tools-convert");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Convert PDF Tools
          </button>
          <button
            onClick={() => {
              onNavigate("all-tools-ai");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Document Tools
          </button>
          <button
            onClick={() => {
              onNavigate("pricing");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Pricing
          </button>
          <button
            onClick={() => {
              onNavigate("about");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            About My PDF
          </button>
          <button
            onClick={() => {
              onNavigate("admin");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Admin Telemetry
          </button>
        </div>
      )}
    </header>
  );
};
