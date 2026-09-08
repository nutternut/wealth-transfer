"use client";

import clsx from "clsx";
import type { FamilyMember } from "@/lib/types";
import { memberInitial, resolveAvatarColor } from "@/lib/avatar";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-9 w-9 rounded-xl text-[11px]",
  md: "h-11 w-11 rounded-2xl text-xs",
  lg: "h-14 w-14 rounded-2xl text-sm",
  xl: "h-20 w-20 rounded-[1.35rem] text-xl",
};

export function MemberAvatar({
  member,
  size = "sm",
  className,
}: {
  member: Pick<FamilyMember, "name" | "shortName" | "relation" | "avatarColor" | "avatarUrl">;
  size?: Size;
  className?: string;
}) {
  const color = resolveAvatarColor(member);
  const label = memberInitial(member.name || member.shortName || "?");

  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={member.name || "avatar"}
        className={clsx(
          "shrink-0 object-cover shadow-sm ring-1 ring-black/5",
          SIZE_CLASS[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center font-bold text-white shadow-sm",
        SIZE_CLASS[size],
        className,
      )}
      style={{ background: color }}
      aria-hidden
    >
      {label}
    </div>
  );
}
