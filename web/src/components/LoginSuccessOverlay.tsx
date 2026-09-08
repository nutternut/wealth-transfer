"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

type LoginSuccessOverlayProps = {
  displayName?: string;
};

export function LoginSuccessOverlay({
  displayName = "ผู้ใช้งานตระกูล",
}: LoginSuccessOverlayProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="login-success" role="status" aria-live="polite">
      <div className="login-success__wash" aria-hidden />
      <div className="login-success__burst" aria-hidden />
      <div className="login-success__card">
        <div className="login-success__icon-wrap">
          <span className="login-success__ring" aria-hidden />
          <span className="login-success__ring login-success__ring--late" aria-hidden />
          <div className="login-success__icon">
            <Check className="login-success__check h-7 w-7" strokeWidth={2.75} />
          </div>
        </div>
        <p className="login-success__eyebrow">เข้าสู่ระบบสำเร็จ</p>
        <h2 className="login-success__title">ยินดีต้อนรับ</h2>
        <p className="login-success__name">{displayName}</p>
        <div className="login-success__bar" aria-hidden>
          <span className="login-success__bar-fill" />
        </div>
        <p className="login-success__hint">กำลังพาคุณเข้าสู่ Wealth Map…</p>
      </div>
    </div>,
    document.body,
  );
}
