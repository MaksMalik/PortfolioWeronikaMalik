"use client";

import { cn } from "@/lib/utils";

export const FILMWEB_ICON_URL =
  "https://fwcdn.pl/prt/static/images/fw/icons2/32x32.png";

export function FilmwebMark({ className }: { className?: string }) {
  return (
    <svg
      className={cn(
        "h-4 w-4 transition-all duration-300 fill-ink/65 hover:fill-[#F3C910] group-hover:fill-[#F3C910] shrink-0",
        className
      )}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        <mask id="filmweb-mask-global">
          {/* Full white background - makes bubble visible */}
          <rect width="24" height="24" fill="white" />
          {/* Black eyes - cuts holes in the bubble */}
          <circle cx="8.5" cy="11.5" r="1.5" fill="black" />
          <circle cx="15.5" cy="11.5" r="1.5" fill="black" />
          {/* Black mouth curve - cuts hole in the bubble */}
          <path
            d="M7.5 14.8c1.5 2.8 7.5 2.8 9 0"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* White sprocket indicators over the mouth curve - leaves them filled with bubble color */}
          <rect x="9.1" y="15.2" width="1.1" height="1.1" fill="white" transform="rotate(-15 9.6 15.7)" />
          <rect x="11.4" y="15.9" width="1.1" height="1.1" fill="white" />
          <rect x="13.7" y="15.2" width="1.1" height="1.1" fill="white" transform="rotate(15 14.2 15.7)" />
        </mask>
      </defs>
      <path
        d="M12 2C6.48 2 2 6.48 2 12c0 2.24.74 4.3 1.98 5.97L2.05 21.93a0.5 0.5 0 0 0 0.65 0.65l3.96-1.93C8.3 21.49 10.1 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
        mask="url(#filmweb-mask-global)"
      />
    </svg>
  );
}
