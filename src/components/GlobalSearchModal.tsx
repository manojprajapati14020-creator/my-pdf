import React, { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, Sparkles, FileText } from "lucide-react";
import { TOOLS } from "../data/toolsData";
import { ToolDefinition } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

export const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose, onSelectTool }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredTools = TOOLS.filter((tool) => {
    if (!query.trim()) return tool.popular;
    const q = query.toLowerCase().trim();
    const nameMatch = tool.name.toLowerCase().includes(q);
    const descMatch = tool.shortDescription.toLowerCase().includes(q);
    const categoryMatch = tool.categoryLabel.toLowerCase().includes(q);
    const tagMatch = tool.tags.some((tag) => tag.toLowerCase().includes(q));
    return nameMatch || descMatch || categoryMatch || tagMatch;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
    } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
      e.preventDefault();
      onSelectTool(filteredTools[selectedIndex].id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="search-modal-content"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all PDF tools... (e.g. 'combine files', 'reduce size', 'word to pdf')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {query.trim() ? `Found ${filteredTools.length} tools` : "Popular Tools"}
          </div>

          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm font-medium">No tools found matching "{query}"</p>
              <p className="text-xs mt-1 text-slate-400">Try searching for "merge", "compress", "word", or "ai"</p>
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  id={`search-item-${tool.id}`}
                  onClick={() => {
                    onSelectTool(tool.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        tool.category === "ai"
                          ? "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                          : "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                      }`}
                    >
                      {tool.category === "ai" ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{tool.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                          {tool.categoryLabel}
                        </span>
                        {tool.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {tool.shortDescription}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isSelected ? "translate-x-1 text-indigo-600 dark:text-indigo-400" : ""
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="font-mono bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">↑</kbd>
              <kbd className="font-mono bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 ml-1">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">↵</kbd> to select
            </span>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">My PDF Platform</span>
        </div>
      </div>
    </div>
  );
};
