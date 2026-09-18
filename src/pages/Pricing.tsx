import React, { useState } from "react";
import { Check, Sparkles, ShieldCheck, Zap } from "lucide-react";

interface Props {
  onSelectPlan?: (planId: string) => void;
}

export const Pricing: React.FC<Props> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      id: "free",
      name: "Free",
      tagline: "For casual users needing quick conversions and merges.",
      priceMonthly: 0,
      priceAnnual: 0,
      badge: null,
      highlight: false,
      features: [
        "All standard 33 PDF utilities",
        "Up to 50MB file size per document",
        "Standard client-side processing",
        "5 AI summarizer credits / day",
        "Zero retention & data scrubbing",
        "Community support",
      ],
      ctaText: "Get Started Free",
    },
    {
      id: "pro",
      name: "My PDF Pro",
      tagline: "For professionals requiring unlimited AI and large files.",
      priceMonthly: 12,
      priceAnnual: 9,
      badge: "Most Popular",
      highlight: true,
      features: [
        "Everything in Free, plus:",
        "Up to 500MB file size per document",
        "Unlimited Gemini AI Chat & Summarization",
        "Batch processing up to 50 files simultaneously",
        "Advanced OCR in 30+ languages",
        "Digital signature stamp & password encryption",
        "Priority processing server lane",
        "Email support with 4hr response SLA",
      ],
      ctaText: "Upgrade to Pro",
    },
    {
      id: "enterprise",
      name: "Business & Team",
      tagline: "For organizations needing compliance, audit logs, and seats.",
      priceMonthly: 36,
      priceAnnual: 29,
      badge: "Enterprise SLA",
      highlight: false,
      features: [
        "Everything in Pro, plus:",
        "Unlimited document sizes & batch queues",
        "Multi-user shared team workspace",
        "Custom domain and branded document stamps",
        "Centralized administrative audit telemetry",
        "Dedicated account manager",
        "Custom billing & signed BAA / GDPR DPA",
      ],
      ctaText: "Contact Enterprise Sales",
    },
  ];

  const faqs = [
    {
      q: "Are my uploaded documents stored on your servers?",
      a: "Never. My PDF is built with an ephemeral zero-retention philosophy. Files are processed exclusively in volatile memory buffers and permanently deleted immediately after generation.",
    },
    {
      q: "How does the AI Chat with PDF work?",
      a: "We pass your document context safely to Google's enterprise Gemini Flash model via encrypted server-side channels. No text or data is used to train AI models.",
    },
    {
      q: "Can I cancel my Pro subscription at any time?",
      a: "Yes, you can cancel at any time with one click from your account dashboard. You will retain access until the end of your billing cycle.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Transparent, straightforward pricing.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Start for free today. Upgrade when you need unlimited Gemini AI queries, high-speed batch processing, or larger document thresholds.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-semibold ${!isAnnual ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-indigo-600 p-1 transition-colors relative"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                isAnnual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${isAnnual ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
              Annual Billing
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Save 25%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {plans.map((plan) => {
          const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all ${
                plan.highlight
                  ? "bg-gradient-to-b from-indigo-50/70 to-white dark:from-indigo-950/30 dark:to-slate-900 border-indigo-500 dark:border-indigo-500/80 shadow-xl shadow-indigo-500/10 scale-105"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                  {plan.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                  {plan.tagline}
                </p>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                    ${price}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {price === 0 ? "/ forever" : "/ month billed annually"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Included features:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => onSelectPlan?.(plan.id)}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                    plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center">
          Frequently Asked Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
          {faqs.map((f, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{f.q}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
