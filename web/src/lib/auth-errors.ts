const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "Email not confirmed": "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
  "User not found": "ไม่พบบัญชีผู้ใช้นี้",
  "Too many requests": "พยายามเข้าสู่ระบบบ่อยเกินไป ลองใหม่อีกครั้งในภายหลัง",
  "Invalid email or password": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
};

export function mapAuthError(message: string): string {
  if (AUTH_ERROR_MAP[message]) return AUTH_ERROR_MAP[message];

  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
  if (lower.includes("email not confirmed")) {
    return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "พยายามเข้าสู่ระบบบ่อยเกินไป ลองใหม่อีกครั้งในภายหลัง";
  }

  return "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง";
}
