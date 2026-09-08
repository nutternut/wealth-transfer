"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, UserRound } from "lucide-react";
import { findMockUser, LOGIN_ENTER_KEY, MOCK_AUTH_COOKIE } from "@/lib/mock-auth";
import { LoginSuccessOverlay } from "@/components/LoginSuccessOverlay";

const INPUT_CLASS =
  "w-full rounded-2xl border border-slate-200/90 bg-white py-3 pr-3 pl-11 text-[13px] font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-mint-brand focus:ring-[3px] focus:ring-mint-brand/15";

function setMockSessionCookie(username: string) {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${MOCK_AUTH_COOKIE}=${encodeURIComponent(username)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function preferReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/wealth-map";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || successName) return;
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 280));

      const user = findMockUser(trimmedUsername, password);
      if (!user) {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      setMockSessionCookie(user.username);
      sessionStorage.setItem(LOGIN_ENTER_KEY, "1");
      document.querySelector(".login-page")?.classList.add("login-page--leaving");
      setSuccessName(user.displayName);

      const delay = preferReducedMotion() ? 200 : 1450;
      await new Promise((resolve) => setTimeout(resolve, delay));

      router.replace(nextPath.startsWith("/") ? nextPath : "/wealth-map");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      document.querySelector(".login-page")?.classList.remove("login-page--leaving");
      setSuccessName(null);
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || Boolean(successName);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-xs font-semibold text-slate-600"
          >
            ชื่อผู้ใช้
          </label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-300"
              aria-hidden
            />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={INPUT_CLASS}
              placeholder="user_01"
              disabled={busy}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-600"
          >
            รหัสผ่าน
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-300"
              aria-hidden
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${INPUT_CLASS} pr-11`}
              placeholder="user_01"
              disabled={busy}
              required
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              disabled={busy}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.55)] transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
        >
          {loading && !successName ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              กำลังเข้าสู่ระบบ…
            </>
          ) : successName ? (
            "เข้าสู่ระบบสำเร็จ"
          ) : (
            <>
              <ArrowRight className="h-4 w-4" aria-hidden />
              เข้าสู่ระบบ
            </>
          )}
        </button>
      </form>

      {successName ? <LoginSuccessOverlay displayName={successName} /> : null}
    </>
  );
}
