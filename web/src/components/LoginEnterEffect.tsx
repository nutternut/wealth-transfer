"use client";

import { useEffect } from "react";
import { LOGOUT_ENTER_KEY } from "@/lib/mock-auth";

/** Soft enter animation when returning to login after logout */
export function LoginEnterEffect() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(LOGOUT_ENTER_KEY) === "1") {
        sessionStorage.removeItem(LOGOUT_ENTER_KEY);
        document.querySelector(".login-page")?.classList.add("login-page--from-logout");
      }
    } catch {
      // ignore
    }
  }, []);

  return null;
}
