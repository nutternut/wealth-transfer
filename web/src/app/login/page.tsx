import { Suspense } from "react";
import {
  Activity,
  FileText,
  GitBranch,
  Map,
  ShieldCheck,
} from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { LoginEnterEffect } from "@/components/LoginEnterEffect";

export const metadata = {
  title: "เข้าสู่ระบบ · Wealth Transfer",
  description: "เข้าสู่ระบบเพื่อจัดการแผนโอนทรัพย์สินครอบครัว",
};

function LoginFallback() {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-11 rounded-2xl bg-slate-100" />
      <div className="h-11 rounded-2xl bg-slate-100" />
      <div className="h-12 rounded-2xl bg-slate-200" />
    </div>
  );
}

const FEATURES = [
  {
    icon: Map,
    title: "Map",
    desc: "เห็นทั้งกระดาน",
  },
  {
    icon: GitBranch,
    title: "Transfer",
    desc: "ออกแบบเส้นทางโอน",
  },
  {
    icon: FileText,
    title: "Tax",
    desc: "รู้ภาษีก่อนตัดสินใจ",
  },
] as const;

export default function LoginPage() {
  return (
    <div className="login-page grid h-dvh max-h-dvh w-full overflow-hidden lg:grid-cols-2">
      <LoginEnterEffect />
      {/* Left — brand panel */}
      <section className="login-hero relative hidden flex-col overflow-hidden px-10 py-8 text-white lg:flex xl:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 20% 0%, rgba(62,180,137,0.28), transparent 55%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(44,133,100,0.35), transparent 50%), linear-gradient(165deg, #0f2a26 0%, #0a1c1a 48%, #061210 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <header className="login-rise relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-brand/20 text-mint-brand ring-1 ring-mint-brand/30">
              <Activity className="h-[18px] w-[18px]" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">
                Wealth Transfer
              </div>
              <div className="text-[10px] font-medium tracking-wide text-white/50">
                Private Wealth OS
              </div>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/45">
            Preview
          </span>
        </header>

        <div className="login-rise login-rise-delay-1 relative z-10 mt-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-brand/25 bg-mint-brand/10 px-3 py-1 text-[11px] font-medium text-mint-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Secure · Family-only
          </span>
          <h1 className="mt-5 text-[2rem] leading-[1.2] font-bold tracking-tight xl:text-[2.35rem]">
            มรดกไม่ใช่เอกสาร
            <span className="mt-1 block text-mint-200">มันคือระบบ</span>
          </h1>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/55">
            Map สินทรัพย์ วางแผนโอน และคำนวณภาษี — ชัด เร็ว และอยู่ในการควบคุมของคุณ
          </p>
        </div>

        {/* Floating preview card */}
        <div className="login-rise login-rise-delay-2 login-preview relative z-10 mx-auto mt-8 w-full max-w-[380px] flex-1">
          <div className="rounded-2xl border border-white/60 bg-white p-4 text-slate-800 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold tracking-wide text-mint-brand uppercase">
                  Wealth Map
                </div>
                <div className="mt-1 text-sm font-bold text-slate-800">
                  ตระกูลตัวอย่าง · สินทรัพย์รวม
                </div>
              </div>
              <span className="rounded-full bg-mint-brand-light px-2 py-0.5 text-[10px] font-semibold text-mint-brand-dark">
                Active
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "อสังหา", value: "42%" },
                { label: "ลงทุน", value: "35%" },
                { label: "อื่นๆ", value: "23%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-slate-50 px-2.5 py-2.5 text-center"
                >
                  <div className="text-sm font-bold text-slate-800">
                    {item.value}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-mint-brand-light/70 px-3 py-2">
              <span className="text-[11px] font-medium text-mint-brand-dark">
                Ready to transfer
              </span>
              <span className="rounded-lg bg-mint-brand px-2 py-1 text-[10px] font-semibold text-white">
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="login-rise login-rise-delay-3 relative z-10 mt-6 grid grid-cols-3 gap-2.5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 text-mint-brand" aria-hidden />
              <div className="mt-2 text-[11px] font-semibold text-white/90">
                {title}
              </div>
              <div className="mt-0.5 text-[10px] leading-snug text-white/40">
                {desc}
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 mt-5 text-[10px] text-white/30">
          © 2026 Wealth Transfer
        </p>
      </section>

      {/* Right — auth form */}
      <section className="relative flex h-full items-center justify-center bg-[#f4f6f5] px-5 py-8 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 70% 0%, rgba(62,180,137,0.07), transparent 60%)",
          }}
        />

        <div className="login-panel relative z-10 w-full max-w-[420px]">
          {/* Mobile brand */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-brand text-white">
              <Activity className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Wealth Transfer
              </div>
              <div className="text-[10px] text-slate-400">Private Wealth OS</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white p-7 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                เข้าสู่ระบบ
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                สำหรับผู้มีสิทธิ์เข้าถึงข้อมูลตระกูลเท่านั้น
              </p>
            </div>

            <div
              className="mb-5 flex rounded-2xl bg-slate-100/90 p-1"
              role="tablist"
              aria-label="โหมดเข้าสู่ระบบ"
            >
              <button
                type="button"
                role="tab"
                aria-selected
                className="flex-1 rounded-xl bg-white py-2 text-xs font-semibold text-slate-800 shadow-sm"
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={false}
                disabled
                className="flex-1 cursor-not-allowed rounded-xl py-2 text-xs font-medium text-slate-400"
                title="เร็วๆ นี้"
              >
                สมัครสมาชิก
              </button>
            </div>

            <Suspense fallback={<LoginFallback />}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-[10px] text-slate-400">
            Mock auth · user_01 / user_01
          </p>
        </div>
      </section>
    </div>
  );
}
