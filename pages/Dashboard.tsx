import React, { useState } from "react";
import {
  User,
  FileText,
  Clock,
  Download,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  CheckCircle,
} from "lucide-react";
import { UserProfile } from "../types";

interface Props {
  user: UserProfile;
  onSelectTool: (toolId: string) => void;
}

interface RecentHistoryItem {
  id: string;
  toolName: string;
  fileName: string;
  timestamp: string;
  size: string;
}

export const Dashboard: React.FC<Props> = ({ user, onSelectTool }) => {
  const [history, setHistory] = useState<RecentHistoryItem[]>([
    {
      id: "h-1",
      toolName: "Merge PDF",
      fileName: "Q3_Consolidated_Financials.pdf",
      timestamp: "10 mins ago",
      size: "2.4 MB",
    },
    {
      id: "h-2",
      toolName: "AI Summarizer",
      fileName: "Vendor_Enterprise_Agreement.pdf",
      timestamp: "1 hour ago",
      size: "890 KB",
    },
    {
      id: "h-3",
      toolName: "Sign PDF",
      fileName: "Consulting_Statement_of_Work.pdf",
      timestamp: "Yesterday",
      size: "1.1 MB",
    },
    {
      id: "h-4",
      toolName: "Compress PDF",
      fileName: "Product_Catalog_2026.pdf",
      timestamp: "2 days ago",
      size: "4.8 MB (Saved 45%)",
    },
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in">
      {/* Profile Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {user.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {user.plan} Account
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Quota & Limit Pill */}
        <div className="w-full md:w-64 space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">Daily Operations</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              {user.dailyOperationsUsed} / {user.dailyOperationsLimit}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{
                width: `${(user.dailyOperationsUsed / user.dailyOperationsLimit) * 100}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Resets daily at 00:00 UTC</p>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onSelectTool("merge-pdf")}
          className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/50 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Merge PDF</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Combine documents</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => onSelectTool("ai-chat-pdf")}
          className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/50 hover:border-purple-400 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Chat with PDF</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ask questions & extract</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => onSelectTool("compress-pdf")}
          className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 hover:border-emerald-400 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Compress PDF</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reduce file size</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Processing History
            </h3>
          </div>
          <button
            onClick={() => setHistory([])}
            className="text-xs font-semibold text-slate-400 hover:text-rose-500"
          >
            Clear History
          </button>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No recent activity logged. Start an operation to see items recorded here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tool: <strong className="text-indigo-600 dark:text-indigo-400">{item.toolName}</strong> • {item.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <span>{item.timestamp}</span>
                  <button
                    onClick={() => setHistory((prev) => prev.filter((h) => h.id !== item.id))}
                    className="hover:text-rose-500 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
