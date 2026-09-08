"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  FileText,
  GitBranch,
  LogOut,
  Map,
  Menu,
  ScrollText,
  Settings2,
  X,
} from "lucide-react";
import clsx from "clsx";
import { WealthProvider, useWealth } from "@/context/WealthContext";
import { Modal } from "@/components/Modal";
import { ToastProvider, useToast } from "@/components/Toast";
import { LOGIN_ENTER_KEY, LOGOUT_ENTER_KEY, MOCK_AUTH_COOKIE } from "@/lib/mock-auth";
import { LogoutOverlay } from "@/components/LogoutOverlay";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Map;
  disabled?: boolean;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "ภาพรวมทรัพย์สิน",
    items: [
      { href: "/wealth-map", label: "Wealth Map", icon: Map },
      { href: "/transfer-plan", label: "Transfer Plan", icon: GitBranch },
    ],
  },
  {
    title: "เครื่องมือ",
    items: [
      { href: "/tax-estimate", label: "ประมาณการภาษี", icon: FileText },
      {
        href: "/documents",
        label: "เอกสารและพินัยกรรม",
        icon: ScrollText,
      },
    ],
  },
  {
    title: "ตั้งค่า",
    items: [
      { href: "/family-settings", label: "การตั้งค่าตระกูล", icon: Settings2 },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <WealthProvider>
      <ToastProvider>
        <AppShellInner>{children}</AppShellInner>
      </ToastProvider>
    </WealthProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { familyProfile } = useWealth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [enterAnim, setEnterAnim] = useState(false);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login/");

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAuthRoute) return;
    try {
      if (sessionStorage.getItem(LOGIN_ENTER_KEY) === "1") {
        sessionStorage.removeItem(LOGIN_ENTER_KEY);
        setEnterAnim(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [isAuthRoute]);

  useEffect(() => {
    if (!isAuthRoute || !showLogoutOverlay) return;
    const timer = window.setTimeout(() => {
      setShowLogoutOverlay(false);
      setLoggingOut(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [isAuthRoute, showLogoutOverlay]);

  if (isAuthRoute) {
    return (
      <>
        {children}
        {showLogoutOverlay ? <LogoutOverlay /> : null}
      </>
    );
  }

  function preferReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  async function handleConfirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      setLogoutOpen(false);
      setShowLogoutOverlay(true);
      document
        .querySelector(".app-shell-root")
        ?.classList.add("app-shell--leaving");

      await new Promise((resolve) =>
        setTimeout(resolve, preferReducedMotion() ? 180 : 1200),
      );

      document.cookie = `${MOCK_AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
      try {
        sessionStorage.setItem(LOGOUT_ENTER_KEY, "1");
      } catch {
        // ignore
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setShowLogoutOverlay(false);
      document
        .querySelector(".app-shell-root")
        ?.classList.remove("app-shell--leaving");
      toast({
        title: "ออกจากระบบไม่สำเร็จ",
        description: "กรุณาลองอีกครั้ง",
        tone: "error",
      });
      setLoggingOut(false);
    }
  }

  const breadcrumb = pathname.startsWith("/transfer-plan")
    ? "Transfer Plan"
    : pathname.startsWith("/tax-estimate")
      ? "ประมาณการภาษี"
      : pathname.startsWith("/documents")
        ? "เอกสารและพินัยกรรม"
        : pathname.startsWith("/family-settings")
          ? "การตั้งค่าตระกูล"
          : "Wealth Map";

  const brandName = familyProfile.name.trim() || "ตระกูล";

  return (
      <div
        className={clsx(
          "app-shell-root flex min-h-screen flex-col text-slate-800 md:flex-row",
          enterAnim && "app-shell-enter",
        )}
        onAnimationEnd={(event) => {
          if (
            enterAnim &&
            event.target === event.currentTarget &&
            event.animationName === "appShellEnter"
          ) {
            setEnterAnim(false);
          }
        }}
      >
        {/* Mobile backdrop */}
        <div
          className={clsx(
            "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] md:hidden",
            sidebarOpen ? "block" : "hidden",
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />

        {/* Sidebar */}
        <aside
          id="sidebar"
          className={clsx(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-50 px-6">
            <Link href="/wealth-map" className="flex min-w-0 items-center space-x-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-brand-light text-mint-brand">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold tracking-tight text-mint-neutral-dark">
                  {brandName}
                </div>
                <div className="text-[10px] font-medium tracking-wide text-mint-brand uppercase">
                  Wealth Transfer
                </div>
              </div>
            </Link>
            <button
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="ปิดเมนู"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-grow space-y-6 overflow-y-auto px-4 py-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <h4 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      !item.disabled && pathname.startsWith(item.href);
                    if (item.disabled) {
                      return (
                        <span
                          key={item.label}
                          className="flex cursor-not-allowed items-center space-x-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300"
                          title="เร็วๆ นี้"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </span>
                      );
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex items-center space-x-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-150",
                          active
                            ? "bg-mint-brand-light font-semibold text-mint-brand"
                            : "font-medium text-slate-500 hover:bg-slate-50/80 hover:text-slate-900",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-center space-x-3 border-t border-slate-50 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-brand text-xs font-semibold text-white">
              น
            </div>
            <div className="min-w-0 flex-grow">
              <div className="truncate text-xs font-semibold text-slate-700">
                ผู้ใช้งานตระกูล
              </div>
              <div className="truncate text-[10px] text-slate-400">
                Family Admin
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
              aria-label="ออกจากระบบ"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex min-w-0 flex-grow flex-col md:pl-64">
          <header className="sticky top-0 z-30 border-b border-slate-100 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center space-x-3 md:hidden">
                  <button
                    type="button"
                    className="-ml-2 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="เปิดเมนู"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-brand-light text-mint-brand">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span className="max-w-[140px] truncate text-sm font-bold tracking-tight text-mint-neutral-dark">
                      {brandName}
                    </span>
                  </div>
                </div>

                <div className="hidden items-center space-x-2 text-xs font-medium text-slate-400 md:flex">
                  <Link href="/wealth-map" className="hover:text-slate-600">
                    แดชบอร์ดตระกูล
                  </Link>
                  <span>/</span>
                  <span className="font-semibold text-mint-brand">{breadcrumb}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                    aria-label="การแจ้งเตือน"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                  </button>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="hidden font-semibold text-slate-600 sm:inline-block">
                      ผู้ดูแลตระกูล
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="mt-auto border-t border-slate-100 bg-white py-6">
            <div className="mx-auto max-w-7xl px-4 text-xs text-slate-400 sm:px-6 lg:px-8">
              <div>
                © 2026 {brandName} · Wealth Transfer
              </div>
            </div>
          </footer>
        </div>

        <Modal
          open={logoutOpen}
          onClose={() => {
            if (!loggingOut) setLogoutOpen(false);
          }}
          title="ยืนยันออกจากระบบ"
          description="คุณกำลังจะออกจากบัญชีผู้ดูแลตระกูล"
          tone="rose"
          size="sm"
          icon={<LogOut className="h-4 w-4 text-rose-500" />}
          footer={
            <>
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => setLogoutOpen(false)}
                disabled={loggingOut}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="ui-btn bg-rose-500 text-white hover:bg-rose-600"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "กำลังออก…" : "ออกจากระบบ"}
              </button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-slate-600">
            ต้องการออกจากระบบตอนนี้หรือไม่? คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อดูข้อมูลทรัพย์สินของตระกูล
          </p>
        </Modal>

        {showLogoutOverlay ? <LogoutOverlay /> : null}
      </div>
  );
}
