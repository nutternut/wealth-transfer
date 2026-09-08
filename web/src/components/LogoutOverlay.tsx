"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

export function LogoutOverlay() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="logout-overlay" role="status" aria-live="polite">
      <div className="logout-overlay__wash" aria-hidden />
      <div className="logout-overlay__burst" aria-hidden />
      <div className="logout-overlay__card">
        <div className="logout-overlay__icon-wrap">
          <span className="logout-overlay__ring" aria-hidden />
          <span className="logout-overlay__ring logout-overlay__ring--late" aria-hidden />
          <div className="logout-overlay__icon">
            <LogOut className="logout-overlay__glyph h-6 w-6" strokeWidth={2.5} />
          </div>
        </div>
        <p className="logout-overlay__eyebrow">Session closed</p>
        <h2 className="logout-overlay__title">ออกจากระบบแล้ว</h2>
        <p className="logout-overlay__name">เซสชันของคุณถูกปิดเรียบร้อย</p>
        <div className="logout-overlay__bar" aria-hidden>
          <span className="logout-overlay__bar-fill" />
        </div>
        <p className="logout-overlay__hint">กำลังพากลับหน้าเข้าสู่ระบบ…</p>
      </div>
    </div>,
    document.body,
  );
}
