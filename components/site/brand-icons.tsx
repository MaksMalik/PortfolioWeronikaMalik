"use client";

import { cn } from "@/lib/utils";

export const FILMWEB_ICON_URL =
  "https://fwcdn.pl/prt/static/images/fw/icons2/32x32.png";

export function FilmwebMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-[#ECB014]",
        className
      )}
      aria-hidden="true"
    >
      <img
        src={FILMWEB_ICON_URL}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}
