import React from "react";
import { FileText, ShieldCheck, Lock, Trash2, Heart } from "lucide-react";

interface Props {
  onNavigate: (view: string, toolId?: string) => void;
}

export const Footer: React.FC<Props> = ({ onNavigate }) => {
  return (
    <footer id="app-footer" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      {/* Security Banner */}
      <div className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>End-to-End Security:</strong> All processing is executed via TLS 1.3 encryption.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                <strong>Zero Retention:</strong> Temporary memory buffers are scrubbed immediately upon download.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
              <span>
                <strong>ISO & GDPR Compliant:</strong> Engineered for enterprise, educational, and personal safety.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                My PDF
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Every PDF tool you need, in one place. Convert, compress, edit, merge, split, sign, protect and AI-analyze your documents with ease.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">v2.4 Production</span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Systems Operational
              </span>
            </div>
          </div>

          {/* Col 1: Organize PDF */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Organize PDF
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate("tool", "merge-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Merge PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "split-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Split PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "organize-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Organize PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "compress-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Compress PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "rotate-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Rotate PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Convert & Edit */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Convert & Edit
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate("tool", "pdf-to-word")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  PDF to Word
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "word-to-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Word to PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "sign-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Sign PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "watermark-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Watermark PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "protect-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Protect PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: AI & Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              AI Tools & Info
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate("tool", "ai-summarizer")} className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                  AI Summarizer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "ai-chat-pdf")} className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                  AI Chat with PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("tool", "ocr-pdf")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  OCR PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("pricing")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Pricing Plans
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("about")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  About & Security
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} My PDF Platform. All rights reserved. Crafted for maximum speed & privacy.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate("about")} className="hover:underline">Privacy Policy</button>
            <button onClick={() => onNavigate("about")} className="hover:underline">Terms of Service</button>
            <button onClick={() => onNavigate("about")} className="hover:underline">Help Center</button>
            <button onClick={() => onNavigate("about")} className="hover:underline">Contact Support</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
