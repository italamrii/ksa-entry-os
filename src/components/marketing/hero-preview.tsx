import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Map,
  Building2,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getLanding } from "@/lib/i18n/content";
import { Badge } from "@/components/ui/input";

export function HeroPreview({ locale }: { locale: Locale }) {
  const p = getLanding(locale).preview;
  const isAr = locale === "ar";

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none animate-fade-in">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-teal-500/15 via-cyan-500/5 to-transparent blur-3xl" />
      <div className="relative space-y-3">
        {/* Executive summary — top card */}
        <div className="ui-preview-block border-teal-500/20 p-4 shadow-2xl ring-1 ring-teal-500/10">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15">
                <FileText className="h-4 w-4 text-teal-400" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-200">{p.report}</span>
                <span className="text-[10px] text-slate-500">
                  {isAr ? "شركة SaaS أجنبية" : "Foreign SaaS Company"}
                </span>
              </div>
            </div>
            <Badge variant="info">{isAr ? "جاهز للمراجعة" : "Board-ready"}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { v: "8", l: isAr ? "خطوات" : "Steps" },
              { v: "4", l: isAr ? "جهات" : "Authorities" },
              { v: "3", l: isAr ? "تنبيهات" : "Alerts" },
            ].map((stat) => (
              <div key={stat.l} className="rounded-lg bg-slate-900/50 py-2">
                <p className="text-lg font-bold text-teal-400">{stat.v}</p>
                <p className="text-[10px] text-slate-500">{stat.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap timeline */}
        <div className="ui-preview-block p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold text-slate-200">{p.roadmap}</span>
            </div>
            <span className="text-[10px] text-teal-400/80">72% {isAr ? "مكتمل" : "mapped"}</span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 animate-progress" />
          </div>
          <div className="space-y-2">
            {[
              { n: 1, label: isAr ? "مسار وزارة الاستثمار" : "MISA investment path", active: true },
              { n: 2, label: isAr ? "مركز الأعمال السعودي" : "Saudi Business Center", active: true },
              { n: 3, label: isAr ? "جاهزية ZATCA" : "ZATCA readiness", active: false },
            ].map((step) => (
              <div
                key={step.n}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${step.active ? "bg-teal-500/10 ring-1 ring-teal-500/20" : "bg-slate-900/40"}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${step.active ? "bg-teal-500/25 text-teal-300" : "bg-slate-800 text-slate-500"}`}>
                  {step.n}
                </span>
                <span className="flex-1 text-xs text-slate-300">{step.label}</span>
                {step.active ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Authority map */}
          <div className="ui-preview-block p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold text-slate-300">
                {isAr ? "خريطة الجهات" : "Authority map"}
              </span>
            </div>
            <div className="space-y-1.5">
              {["MISA", "SBC", "ZATCA"].map((auth) => (
                <div key={auth} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">{auth}</span>
                  <ArrowUpRight className="h-3 w-3 text-teal-500/70" />
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="ui-preview-block p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-semibold text-slate-300">{p.compliance}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">{p.risk}</span>
                <span className="font-medium text-amber-400">{p.medium}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-400/90">
                <AlertTriangle className="h-3 w-3" />
                <span>{isAr ? "مستشار مرخص موصى به" : "Licensed advisor recommended"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
