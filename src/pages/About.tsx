import React from "react";
import { ShieldCheck, Lock, Sparkles, FileText, Server, Cpu, Heart } from "lucide-react";

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 animate-in fade-in">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          <span>About My PDF</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Every PDF tool you need, in one place.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          My PDF was created to solve everyday document frustration without compromising privacy, speed, or design aesthetics.
        </p>
      </div>

      {/* Mission & Philosophy */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Our Architectural Philosophy
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Traditional online PDF converters often force users through clunky interfaces, intrusive ads, and opaque data practices. My PDF takes a fundamentally different engineering approach:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
              <Lock className="w-4 h-4 text-emerald-500" /> Ephemeral Zero Retention
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              We do not persist your files in disk storage. Transformations occur inside temporary memory buffers and are scrubbed instantly upon job fulfillment.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
              <Cpu className="w-4 h-4 text-indigo-500" /> In-Browser Hardware Acceleration
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Whenever possible, document re-ordering, splitting, and merging take place right inside your browser with WebAssembly, ensuring maximum velocity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" /> Server-Side Gemini AI
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              AI requests proxy through a secure server layer using Google's official @google/genai SDK. API keys and sensitive tokens remain 100% hidden.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Enterprise-Grade Security
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              All communications are enforced over TLS 1.3. Fully compliant with modern data governance guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Supported Formats */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Supported Document & Media Formats
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          My PDF seamlessly handles cross-conversion and document manipulation across standard formats:
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {["PDF (.pdf)", "Microsoft Word (.docx, .doc)", "Microsoft Excel (.xlsx, .xls, .csv)", "PowerPoint (.pptx, .ppt)", "JPEG / JPG (.jpg)", "PNG (.png)", "Web HTML (.html)", "Markdown (.md)", "Text (.txt)"].map((fmt) => (
            <span
              key={fmt}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
