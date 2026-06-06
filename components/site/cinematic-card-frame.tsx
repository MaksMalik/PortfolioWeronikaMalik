import { cn } from "@/lib/utils";

export function CinematicCardFrame({ className }: { className?: string }) {
  return (
    <svg
      className={cn("cinematic-card-frame", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 100 V10 C0 4.5 4.5 0 10 0 H90 C95.5 0 100 4.5 100 10 V100" pathLength="1" />
    </svg>
  );
}
