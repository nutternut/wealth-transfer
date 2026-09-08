import type { FamilyMember, FamilyRelation } from "@/lib/types";

export const AVATAR_COLOR_PRESETS = [
  "#3eb489",
  "#0ea5e9",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
  "#64748b",
  "#14b8a6",
  "#e11d48",
] as const;

const RELATION_FALLBACK: Record<FamilyRelation, string> = {
  parent: "#0ea5e9",
  spouse: "#f43f5e",
  child: "#3eb489",
  sibling: "#f59e0b",
  other: "#64748b",
};

export function memberInitial(name: string) {
  const compact = name.trim().replace(/\s+/g, "");
  if (!compact) return "?";

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segments = new Intl.Segmenter("th", { granularity: "grapheme" });
    return [...segments.segment(compact)]
      .slice(0, 2)
      .map((s) => s.segment)
      .join("");
  }

  return [...compact].slice(0, 2).join("");
}

export function resolveAvatarColor(member: Pick<FamilyMember, "avatarColor" | "relation">) {
  if (member.avatarColor) return member.avatarColor;
  return RELATION_FALLBACK[member.relation ?? "other"];
}

/** อ่านไฟล์รูปแล้วย่อเป็น data URL (JPEG) เพื่อเก็บใน state */
export function readImageAsDataUrl(
  file: File,
  maxSize = 256,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("กรุณาเลือกไฟล์รูปภาพ"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      reject(new Error("ไฟล์ใหญ่เกินไป (สูงสุด 4MB)"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("เปิดรูปไม่สำเร็จ"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("ไม่สามารถประมวลผลรูปได้"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
