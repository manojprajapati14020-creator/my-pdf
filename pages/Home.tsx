import React, { useState } from "react";
import {
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  FileUp,
  Star,
} from "lucide-react";
import { ToolDefinition } from "../types";
import { TOOLS } from "../data/toolsData";
import { SAMPLE_DOCS, createSamplePdfFile } from "../services/sampleDocs";

interface Props {
  onSelectTool: (toolId: string) => void;
  onOpenSearch: () => void;
  initialCategory?: string;
}

export const Home: React.FC<Props> = ({ onSelectTool, onOpenSearch, initialCategory = "all" }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [loadingSample, setLoadingSample] = useState(false);

  const categories = [
    { id: "all", label: "All Tools" },
    { id: "popular", label: "Popular" },
    { id: "organize", label: "Organize PDF" },
    { id: "convert-to", label: "Convert to PDF" },
    { id: "convert-from", label: "Convert from PDF" },
    { id: "edit", label: "Edit & Security" },
    { id: "ai", label: "AI Document Tools", isAi: true },
  ];

  const filteredTools = TOOLS.filter((tool) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "popular") return tool.popular;
    return tool.category === selectedCategory;
  });

  const handleTestSample = async (sampleId: string) => {
    try {
      setLoadingSample(true);
      await createSamplePdfFile(sampleId);
      onSelectTool("merge-pdf");
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-4 pb-8 sm:pb-12 text-center">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Next-Gen Document Utility with Server-Side Gemini AI</span>
          </div>

          {/* Main Title & Tagline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.15]">
            Every PDF tool you need,{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
              in one place.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Convert, compress, organize, sign, protect, and AI-analyze your documents with zero hassle.
            100% private, client-accelerated, and enterprise-grade.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onSelectTool("merge-pdf")}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Start with Merge PDF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTool("ai-chat-pdf")}
              className="px-6 py-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-sm border border-purple-200/80 dark:border-purple-800/80 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Ask AI Chat with PDF</span>
            </button>
            <button
              onClick={onOpenSearch}
              className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search 33 Tools</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" /> 256-Bit TLS Security
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-500" /> Instant Memory Scrubbing
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> In-Browser Hardware Acceleration
            </span>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? cat.isAi
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat.isAi && <Sparkles className="w-3.5 h-3.5" />}
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:inline-block">
            Showing {filteredTools.length} tools
          </span>
        </div>

        {/* TOOLS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredTools.map((tool) => {
            const isAi = tool.category === "ai";
            return (
              <div
                key={tool.id}
                id={`tool-card-${tool.id}`}
                onClick={() => onSelectTool(tool.id)}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isAi
                    ? "bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900 border-purple-200/70 dark:border-purple-900/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/5"
                } hover:-translate-y-0.5`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isAi
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                          : "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tool.popular && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-500" /> Hot
                        </span>
                      )}
                      {tool.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tool.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <span>{tool.categoryLabel}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VALUE PROPOSITION / FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto sm:mx-0">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Blazing Fast Processing</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Native WebAssembly and in-browser streams manipulate documents directly on your device when possible, eliminating roundtrips.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto sm:mx-0">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Google Gemini AI Engine</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask deep questions, extract key financial numbers, summarize multi-page contracts, and translate between 30+ languages effortlessly.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Zero Retention & GDPR</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your files belong to you. Files are held exclusively in temporary memory buffers and erased immediately upon download completion.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
