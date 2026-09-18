import React, { useState } from "react";
import { Search, FileText, Sparkles, Star, ArrowRight, Filter } from "lucide-react";
import { TOOLS } from "../data/toolsData";
import { ToolCategory } from "../types";

interface Props {
  onSelectTool: (toolId: string) => void;
  defaultCategory?: string;
}

export const Tools: React.FC<Props> = ({ onSelectTool, defaultCategory = "all" }) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);

  const categories = [
    { id: "all", label: "All Tools (33)" },
    { id: "organize", label: "Organize PDF" },
    { id: "convert-to", label: "Convert to PDF" },
    { id: "convert-from", label: "Convert from PDF" },
    { id: "edit", label: "Edit & Security" },
    { id: "ai", label: "AI Document Tools", isAi: true },
  ];

  const filteredTools = TOOLS.filter((tool) => {
    // Category match
    const categoryMatch = activeCategory === "all" || tool.category === activeCategory;
    if (!categoryMatch) return false;

    // Search match
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.shortDescription.toLowerCase().includes(q) ||
      tool.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Tool Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse our complete catalog of 33 document utilities and AI features.
          </p>
        </div>

        {/* Live Filter Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tools by keyword..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === c.id
                ? c.isAi
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {c.isAi && <Sparkles className="w-3.5 h-3.5" />}
            {c.label}
          </button>
        ))}
      </div>

      {/* Directory Grid */}
      {filteredTools.length === 0 ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <p className="text-base font-semibold">No tools found matching "{search}"</p>
          <p className="text-xs mt-1">Try searching for "word", "compress", "merge", or reset filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const isAi = tool.category === "ai";
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`group p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isAi
                    ? "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/50 hover:border-purple-400"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                } hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isAi
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                          : "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    {tool.popular && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-500" /> Hot
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {tool.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  <span>{tool.categoryLabel}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
